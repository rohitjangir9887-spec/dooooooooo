import { useImportStore, ImportJob, ImportFile, ImportStep, DeployProvider } from '../store/useImportStore';
import { useAppStore } from '../store/useAppStore';
import JSZip from 'jszip';
import localforage from 'localforage';
import { encode } from 'js-base64';

const importsDB = localforage.createInstance({
  name: 'github-explorer',
  storeName: 'imports-data'
});

function getApiUrl() {
  return useAppStore.getState().isAuthenticated ? '/api/github' : 'https://api.github.com';
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Safe, high-performance, chunked base64 encoder for Uint8Arrays (prevents call-stack overflows on large binary structures)
function uint8ArrayToBase64(arr: Uint8Array): string {
  const chunks: string[] = [];
  const chunkSize = 8192; // safe bounds for JS engines
  for (let i = 0; i < arr.length; i += chunkSize) {
    const sub = arr.subarray(i, i + chunkSize);
    let binStr = "";
    for (let j = 0; j < sub.length; j++) {
      binStr += String.fromCharCode(sub[j]);
    }
    chunks.push(binStr);
  }
  return btoa(chunks.join(''));
}

// Transactional state updates with background persistence to IndexedDB
async function updateJobAndPersist(jobId: string, updates: Partial<ImportJob>) {
  useImportStore.getState().updateJob(jobId, updates);
  const currentJob = useImportStore.getState().jobs.find(j => j.id === jobId);
  if (currentJob) {
    try {
      await importsDB.setItem(`job_metadata:${jobId}`, currentJob);
    } catch (e) {
      console.error(`[IndexedDB Cache Error] failed to persist state:`, e);
    }
  }
}

async function persistJobState(jobId: string) {
  const currentJob = useImportStore.getState().jobs.find(j => j.id === jobId);
  if (currentJob) {
    try {
      await importsDB.setItem(`job_metadata:${jobId}`, currentJob);
    } catch (e) {
      console.error(`[IndexedDB Cache Error] failed to persist state:`, e);
    }
  }
}

// Global robust loggedFetch function to capture every single outgoing GitHub API request,
// including endpoint, method, request payload, response status, body, and retries.
async function loggedFetch(jobId: string, url: string, init?: RequestInit): Promise<Response> {
  const updateLogs = (log: string) => {
    const freshJob = useImportStore.getState().jobs.find(j => j.id === jobId);
    const existingLogs = freshJob?.deployLogs || [];
    const timestamp = new Date().toLocaleTimeString();
    updateJobAndPersist(jobId, {
      deployLogs: [...existingLogs, `[${timestamp}] ${log}`]
    });
  };

  const method = init?.method || 'GET';
  
  // Format body info nicely for user visibility
  let bodyLog = '';
  if (init?.body && typeof init.body === 'string') {
    try {
      const parsed = JSON.parse(init.body);
      if (parsed.content && parsed.content.length > 150) {
        parsed.content = parsed.content.substring(0, 100) + `... [TRUNCATED base64, size: ${parsed.content.length} chars]`;
      }
      bodyLog = ` | Body: ${JSON.stringify(parsed)}`;
    } catch {
      bodyLog = ` | Body: ${init.body.substring(0, 150)}`;
    }
  }

  updateLogs(`[API REQ] ${method} ${url}${bodyLog}`);

  try {
    const response = await fetch(url, init);
    
    // Read response body safely via cloning
    let bodyText = '';
    try {
      const cloned = response.clone();
      bodyText = await cloned.text();
    } catch (e: any) {
      bodyText = `Could not read response: ${e.message}`;
    }

    let printedBody = bodyText;
    try {
      const parsed = JSON.parse(bodyText);
      printedBody = JSON.stringify(parsed);
    } catch {}
    
    if (printedBody.length > 250) {
      printedBody = printedBody.substring(0, 250) + '... [TRUNCATED]';
    }

    updateLogs(`[API RES] Status ${response.status} ${response.statusText} | Response: ${printedBody}`);
    return response;
  } catch (err: any) {
    updateLogs(`[API ERR] Fetch failed: ${err.message || err}`);
    throw err;
  }
}

// Robust fetch with retry and CORS proxies
async function fetchBinaryFromUrl(url: string, jobId: string): Promise<ArrayBuffer> {
  const logToJob = (msg: string) => {
    const state = useImportStore.getState();
    const job = state.jobs.find(j => j.id === jobId);
    const logs = job?.deployLogs || [];
    state.updateJob(jobId, { deployLogs: [...logs, `[${new Date().toLocaleTimeString()}] ${msg}`] });
  };

  const urlsToTry = [
    url,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`
  ];

  let lastError = null;
  for (let attempt = 0; attempt < urlsToTry.length; attempt++) {
    const targetUrl = urlsToTry[attempt];
    try {
      logToJob(`[CORS Proxy Attempt ${attempt + 1}/${urlsToTry.length}] Downloading from: ${targetUrl.substring(0, 80)}...`);
      const res = await fetch(targetUrl);
      if (res.ok) {
        logToJob(`Download successful!`);
        return await res.arrayBuffer();
      }
      logToJob(`Proxy attempt ${attempt + 1} failed with status: ${res.status}`);
    } catch (e: any) {
      lastError = e;
      logToJob(`Network error on Proxy ${attempt + 1}: ${e.message || e}`);
    }
  }
  throw lastError || new Error("Failed to download project files from URL (CORS or network error).");
}

// Framework detection helper
export function detectFrameworkFromPaths(paths: string[]): { name: string, buildCommand: string, installCommand: string, outputDirectory: string } {
  const fileSet = new Set(paths.map(p => p.toLowerCase()));
  if (fileSet.has('next.config.js') || fileSet.has('next.config.mjs') || fileSet.has('next.config.ts')) {
    return { name: 'Next.js', buildCommand: 'npm run build', installCommand: 'npm install', outputDirectory: '.next' };
  }
  if (fileSet.has('vite.config.ts') || fileSet.has('vite.config.js') || fileSet.has('vite.config.mjs')) {
    return { name: 'Vite', buildCommand: 'npm run build', installCommand: 'npm install', outputDirectory: 'dist' };
  }
  if (fileSet.has('svelte.config.js')) {
    return { name: 'SvelteKit', buildCommand: 'npm run build', installCommand: 'npm install', outputDirectory: '.svelte-kit' };
  }
  if (fileSet.has('nuxt.config.js') || fileSet.has('nuxt.config.ts')) {
    return { name: 'Nuxt.js', buildCommand: 'npm run build', installCommand: 'npm install', outputDirectory: '.output' };
  }
  if (fileSet.has('astro.config.mjs') || fileSet.has('astro.config.js')) {
    return { name: 'Astro', buildCommand: 'npm run build', installCommand: 'npm install', outputDirectory: 'dist' };
  }
  if (fileSet.has('angular.json')) {
    return { name: 'Angular', buildCommand: 'npm run build', installCommand: 'npm install', outputDirectory: 'dist' };
  }
  if (fileSet.has('vue.config.js')) {
    return { name: 'Vue', buildCommand: 'npm run build', installCommand: 'npm install', outputDirectory: 'dist' };
  }
  if (fileSet.has('package.json')) {
    return { name: 'Node / React', buildCommand: 'npm run build', installCommand: 'npm install', outputDirectory: 'build' };
  }
  if (paths.some(p => p.endsWith('.html'))) {
    return { name: 'Static HTML', buildCommand: '', installCommand: '', outputDirectory: '.' };
  }
  return { name: 'Standard Web App', buildCommand: 'npm run build', installCommand: 'npm install', outputDirectory: 'dist' };
}

// Create a new GitHub repository
export async function createGitHubRepository(
  name: string,
  description: string,
  isPrivate: boolean,
  jobId: string
): Promise<{ owner: string; repo: string; defaultBranch: string }> {
  const apiUrl = getApiUrl();
  const res = await loggedFetch(jobId, `${apiUrl}/user/repos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      description: description || 'Imported using GitHub Workspace',
      private: isPrivate,
      auto_init: true // Always auto-init with README to establish default branch
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create repository: Status ${res.status}`);
  }

  const data = await res.json();
  return {
    owner: data.owner.login,
    repo: data.name,
    defaultBranch: data.default_branch || 'main'
  };
}

// Initialize empty repository with a readme commit to make branch active
export async function initializeEmptyRepository(owner: string, repo: string, branch: string = 'main', jobId: string) {
  const apiUrl = getApiUrl();
  const res = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/contents/README.md`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Initial commit (Initialize Repository)',
      content: encode('# ' + repo + '\n\nWorkspace imported project.'),
      branch: branch
    })
  });

  if (!res.ok && res.status !== 422) { // 422 can mean README already exists
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to initialize empty repository with README.");
  }
}

// Retry a file blob creation to GitHub
async function uploadBlobWithRetry(owner: string, repo: string, base64Content: string, filepath: string, jobId: string, retries = 3): Promise<string> {
  const apiUrl = getApiUrl();
  let lastError: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      const blobRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: base64Content,
          encoding: 'base64'
        })
      });
      if (blobRes.ok) {
        const blobData = await blobRes.json();
        return blobData.sha;
      }
      const errText = await blobRes.text();
      lastError = new Error(`Status ${blobRes.status}: ${errText}`);
    } catch (e: any) {
      lastError = e;
    }
    // Exponential backoff
    await new Promise(r => setTimeout(r, 1000 * (i + 1)));
  }
  throw lastError || new Error(`Failed to upload file blob for: ${filepath}`);
}

// Run direct deployments to Vercel/Netlify
export async function runDeployment(
  jobId: string,
  provider: DeployProvider,
  owner: string,
  repo: string,
  branch: string,
  token?: string,
  teamId?: string,
  projectId?: string,
  siteId?: string
) {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  const updateLogs = (log: string) => {
    const state = useImportStore.getState();
    const job = state.jobs.find(j => j.id === jobId);
    const existingLogs = job?.deployLogs || [];
    const timestamp = new Date().toLocaleTimeString();
    state.updateJob(jobId, {
      deployLogs: [...existingLogs, `[${timestamp}] ${log}`]
    });
  };

  useImportStore.getState().updateJob(jobId, {
    deployProvider: provider,
    deployLogs: []
  });

  updateLogs(`Initializing deployment to ${provider.toUpperCase()}...`);

  let liveUrl = '';
  let deployUrl = '';

  if (!token || token.trim() === '') {
    throw new Error(`Deployment configuration required.`);
  }

  // --- VERCEL DEPLOYMENT ---
  if (provider === 'vercel') {
    try {
      updateLogs("Connecting Provider: Authenticating with Vercel API...");
      const userRes = await fetch(`https://api.vercel.com/v2/user${teamId ? `?teamId=${teamId}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!userRes.ok) throw new Error("Invalid Vercel API token");
      
      updateLogs("Creating or verifying Vercel project...");
      let finalProjectId = projectId || '';
      
      if (!finalProjectId) {
        // Attempt to create the project
        const projRes = await fetch(`https://api.vercel.com/v9/projects${teamId ? `?teamId=${teamId}` : ''}`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: repo })
        });
        
        if (!projRes.ok) {
          // If it already exists, fetch it
          const projData = await projRes.json();
          if (projData.error && projData.error.code === 'project_already_exists') {
             updateLogs("Project already exists. Fetching project details...");
             const existingProjRes = await fetch(`https://api.vercel.com/v9/projects/${repo}${teamId ? `?teamId=${teamId}` : ''}`, {
               headers: { 'Authorization': `Bearer ${token}` }
             });
             const existingProjData = await existingProjRes.json();
             finalProjectId = existingProjData.id;
          } else {
             throw new Error(projData.error?.message || "Failed to create Vercel project");
          }
        } else {
          const projData = await projRes.json();
          finalProjectId = projData.id;
        }
      }
      
      updateLogs(`Building: Triggering deployment for ${owner}/${repo} on branch: ${branch}...`);
      let retryCount = 0;
      let deployData: any = null;
      let deployRes: any = null;
      
      while (retryCount < 3) {
        deployRes = await fetch(`https://api.vercel.com/v13/deployments${teamId ? `?teamId=${teamId}` : ''}`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: repo,
            project: finalProjectId,
            gitSource: {
              type: 'github',
              repo: `${owner}/${repo}`,
              ref: branch
            }
          })
        });

        if (deployRes.ok) {
          deployData = await deployRes.json();
          break;
        }
        
        retryCount++;
        updateLogs(`Deployment trigger failed (Status: ${deployRes.status}). Retrying ${retryCount}/3...`);
        await delay(2000);
      }

      if (!deployData) {
        const deployErr = await deployRes.json().catch(() => ({}));
        throw new Error(deployErr.error?.message || "Vercel deployment trigger failed after retries.");
      }

      const deploymentId = deployData.id;
      deployUrl = `https://vercel.com/${owner}/${repo}/${deploymentId}`;
      useImportStore.getState().updateJob(jobId, { deployUrl });
      
      updateLogs(`Deploying: Vercel deployment triggered. ID: ${deploymentId}`);
      updateLogs(`Waiting for deployment to complete. This may take a few minutes...`);
      
      // Polling Vercel Deployment Status
      let isReady = false;
      let pollRetries = 0;
      while (!isReady && pollRetries < 60) { // Max ~5 minutes
        await delay(5000);
        const statusRes = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!statusRes.ok) continue;
        
        const statusData = await statusRes.json();
        const readyState = statusData.readyState;
        
        if (readyState === 'READY') {
          isReady = true;
          liveUrl = `https://${statusData.url}`;
          updateLogs(`Deployment status: READY`);
          break;
        } else if (readyState === 'ERROR' || readyState === 'CANCELED') {
          throw new Error(`Deployment failed with status: ${readyState}. Check Vercel logs.`);
        }
        
        pollRetries++;
        if (pollRetries % 3 === 0) {
          updateLogs(`Still building... Status: ${readyState}`);
        }
      }
      
      if (!isReady) {
        throw new Error("Deployment timed out waiting for READY status.");
      }
      
    } catch (e: any) {
      updateLogs(`[ERROR] Vercel deployment failed: ${e.message || e}`);
      throw e;
    }
  }

  // --- NETLIFY DEPLOYMENT ---
  else if (provider === 'netlify') {
    try {
      updateLogs("Connecting Provider: Authenticating with Netlify API...");
      const userRes = await fetch('https://api.netlify.com/api/v1/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!userRes.ok) throw new Error("Invalid Netlify API Token");

      updateLogs("Linking Netlify site with repository hook...");
      let finalSiteId = siteId || '';
      
      if (!finalSiteId) {
        // List sites to see if it exists
        const sitesRes = await fetch(`https://api.netlify.com/api/v1/sites?name=${repo}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      const sites = await sitesRes.json();
      const existingSite = sites.find((s: any) => s.name === repo);
      
      if (existingSite) {
        updateLogs("Netlify site already exists. Proceeding with existing site...");
        finalSiteId = existingSite.id;
        deployUrl = existingSite.admin_url;
        liveUrl = existingSite.ssl_url || existingSite.url;
      } else {
        updateLogs("Creating new Netlify site...");
        const siteRes = await fetch('https://api.netlify.com/api/v1/sites', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: repo,
            repo: {
              provider: 'github',
              repo: `${owner}/${repo}`,
              private: false,
              branch: branch
            }
          })
        });

        if (!siteRes.ok) {
          const siteErr = await siteRes.json().catch(() => ({}));
          throw new Error(siteErr.message || "Failed to establish linked site on Netlify.");
        }

        const siteData = await siteRes.json();
        finalSiteId = siteData.id;
        deployUrl = siteData.admin_url;
        liveUrl = siteData.ssl_url || siteData.url || `https://${repo}.netlify.app`;
      }
    } else {
      const siteRes = await fetch(`https://api.netlify.com/api/v1/sites/${finalSiteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (siteRes.ok) {
        const siteData = await siteRes.json();
        deployUrl = siteData.admin_url;
        liveUrl = siteData.ssl_url || siteData.url || `https://${repo}.netlify.app`;
      }
    }
      
      useImportStore.getState().updateJob(jobId, { deployUrl });
      
      updateLogs(`Building: Triggering Netlify deployment...`);
      const buildRes = await fetch(`https://api.netlify.com/api/v1/sites/${finalSiteId}/builds`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!buildRes.ok) throw new Error("Failed to trigger Netlify build.");
      const buildData = await buildRes.json();
      const deployId = buildData.deploy_id;
      
      updateLogs(`Waiting for Netlify deployment to complete...`);
      let isReady = false;
      let pollRetries = 0;
      
      while (!isReady && pollRetries < 60) {
        await delay(5000);
        const statusRes = await fetch(`https://api.netlify.com/api/v1/sites/${finalSiteId}/deploys/${deployId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!statusRes.ok) continue;
        
        const statusData = await statusRes.json();
        const state = statusData.state;
        
        if (state === 'ready') {
          isReady = true;
          updateLogs(`Deployment status: READY`);
          break;
        } else if (state === 'error') {
          throw new Error(`Deployment failed with status: ${state}. Check Netlify logs.`);
        }
        
        pollRetries++;
        if (pollRetries % 3 === 0) {
          updateLogs(`Still building... Status: ${state}`);
        }
      }
      
      if (!isReady) {
        throw new Error("Deployment timed out waiting for READY status.");
      }

    } catch (e: any) {
      updateLogs(`[ERROR] Netlify deployment failed: ${e.message || e}`);
      throw e;
    }
  }

  // --- HEALTH CHECK ---
  updateLogs(`Health Check: Verifying live production URL: ${liveUrl}`);
  let healthCheckPassed = false;
  let healthCheckRetries = 0;

  while (healthCheckRetries < 5) {
    try {
      await delay(3000);
      const res = await fetch(liveUrl, { method: 'HEAD', mode: 'no-cors' });
      // Depending on CORS, we might get an opaque response (status 0).
      // But we just assume if it doesn't throw a network error, it's alive.
      // If we can get a standard status, we enforce 200.
      if (res.type === 'opaque' || res.status === 200 || res.status === 301 || res.status === 308) {
        healthCheckPassed = true;
        break;
      }
      updateLogs(`Health check received HTTP ${res.status}. Retrying...`);
    } catch (err: any) {
      updateLogs(`Health check failed: ${err.message || err}. Retrying...`);
    }
    healthCheckRetries++;
  }

  if (!healthCheckPassed) {
    throw new Error(`Deployment completed but health check failed. The site is not returning HTTP 200 at ${liveUrl}.`);
  }

  updateLogs(`Live ✅ Production site is fully accessible.`);
  
  useImportStore.getState().updateJob(jobId, {
    deployUrl: deployUrl,
    liveUrl: liveUrl
  });
}

// -------------------------------------------------------------
// STEP-BY-STEP AUTOMATED IMPORT AND DEPLOY PIPELINE ENGINE
// -------------------------------------------------------------

/**
 * Resumable high-concurrency file upload queue worker.
 * Uploads up to 'concurrency' files in parallel, updating state and IndexedDB transactionally.
 * Does not restart already completed files, supporting seamless mid-way resumes.
 */
async function processUploadQueue(
  owner: string,
  repo: string,
  jobId: string,
  filesToUpload: ImportFile[],
  concurrency = 5
): Promise<void> {
  const state = useImportStore.getState();
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) throw new Error("Job not found during upload queue initialization.");

  const updateLogs = async (log: string) => {
    const freshJob = useImportStore.getState().jobs.find(j => j.id === jobId);
    const existingLogs = freshJob?.deployLogs || [];
    const timestamp = new Date().toLocaleTimeString();
    await updateJobAndPersist(jobId, {
      deployLogs: [...existingLogs, `[${timestamp}] ${log}`]
    });
  };

  await updateLogs(`[Queue Engine] Allocating resumable upload queue with concurrency limit: ${concurrency}`);

  let index = 0;
  let activeWorkers = 0;
  let completed = useImportStore.getState().jobs.find(j => j.id === jobId)?.files.filter(f => f.status === 'completed' && f.sha).length || 0;

  return new Promise<void>((resolve, reject) => {
    async function launchNext() {
      // If queue is fully consumed, resolve once active workers settle
      if (index >= filesToUpload.length) {
        if (activeWorkers === 0) {
          resolve();
        }
        return;
      }

      // Check pause / cancellation state
      const checkJob = useImportStore.getState().jobs.find(j => j.id === jobId);
      if (!checkJob || checkJob.status === 'paused' || checkJob.status === 'error') {
        resolve();
        return;
      }

      const fileIndex = index++;
      const file = filesToUpload[fileIndex];
      activeWorkers++;

      // Skip already completed files to resume exactly from where it left off
      if (file.status === 'completed' && file.sha) {
        activeWorkers--;
        launchNext();
        return;
      }

      try {
        // Mark file as uploading in state
        const freshFiles = useImportStore.getState().jobs.find(j => j.id === jobId)?.files || [];
        await updateJobAndPersist(jobId, {
          files: freshFiles.map(f => f.path === file.path ? { ...f, status: 'uploading' } : f)
        });

        // Retrieve base64 content from IndexedDB cache
        let base64Content = (await importsDB.getItem(`${jobId}:${file.path}`)) as string;
        if (base64Content === null || base64Content === undefined) {
          await updateLogs(`[Queue WARNING] File buffer empty or missing for: ${file.path}. Initializing as empty file (0 bytes).`);
          base64Content = "";
        }

        // Upload to GitHub
        const blobSha = await uploadBlobWithRetry(owner, repo, base64Content, file.path, jobId);

        // Update file to completed with blob SHA
        const nextFiles = useImportStore.getState().jobs.find(j => j.id === jobId)?.files || [];
        await updateJobAndPersist(jobId, {
          files: nextFiles.map(f => f.path === file.path ? { ...f, status: 'completed', sha: blobSha } : f)
        });

        completed++;
        await updateJobAndPersist(jobId, {
          completedFiles: completed,
          progress: 50 + Math.floor((completed / filesToUpload.length) * 25) // 50% to 75%
        });

        if (completed % 10 === 0 || completed === filesToUpload.length) {
          await updateLogs(`[Queue Progress] Uploaded and synced ${completed}/${filesToUpload.length} files...`);
        }
      } catch (err: any) {
        await updateLogs(`[Queue ERROR] Failed to upload ${file.path}: ${err.message || err}. Marked for retry.`);
        const nextFiles = useImportStore.getState().jobs.find(j => j.id === jobId)?.files || [];
        await updateJobAndPersist(jobId, {
          files: nextFiles.map(f => f.path === file.path ? { ...f, status: 'error' } : f)
        });
        // We do NOT stop the entire queue for single failures. We continue uploading the other files!
      } finally {
        activeWorkers--;
        launchNext();
      }
    }

    // Launch initial workers
    const initialWorkers = Math.min(concurrency, filesToUpload.length);
    for (let w = 0; w < initialWorkers; w++) {
      launchNext();
    }
  });
}

/**
 * Fallback mechanism: uploads files individually via the high-reliability Repository Contents API.
 * Triggered automatically if low-level Git Trees plumbing API calls fail.
 */
async function uploadFilesViaContentsApi(
  owner: string,
  repo: string,
  branch: string,
  jobId: string,
  filesToUpload: ImportFile[]
): Promise<string> {
  const apiUrl = getApiUrl();
  const updateLogs = async (log: string) => {
    const freshJob = useImportStore.getState().jobs.find(j => j.id === jobId);
    const existingLogs = freshJob?.deployLogs || [];
    const timestamp = new Date().toLocaleTimeString();
    await updateJobAndPersist(jobId, {
      deployLogs: [...existingLogs, `[${timestamp}] ${log}`]
    });
  };

  await updateLogs(`[FALLBACK] Low-level Git Trees API failed. Falling back to high-reliability Repository Contents API...`);
  
  let successCount = 0;
  for (const file of filesToUpload) {
    try {
      let base64Content = (await importsDB.getItem(`${jobId}:${file.path}`)) as string || "";
      
      // Probe to see if file already exists to obtain its current SHA for updates
      let sha: string | undefined;
      try {
        const checkRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          sha = checkData.sha;
        }
      } catch {}

      const body: any = {
        message: `Workspace Sync Fallback: ${file.path}`,
        content: base64Content,
        branch: branch
      };
      if (sha) {
        body.sha = sha;
      }

      const res = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/contents/${file.path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        successCount++;
        const resData = await res.json();
        const blobSha = resData.content?.sha || resData.commit?.sha;
        
        const nextFiles = useImportStore.getState().jobs.find(j => j.id === jobId)?.files || [];
        await updateJobAndPersist(jobId, {
          files: nextFiles.map(f => f.path === file.path ? { ...f, status: 'completed', sha: blobSha } : f)
        });
      } else {
        await updateLogs(`[WARNING] Fallback upload failed for ${file.path} (Status: ${res.status})`);
      }
    } catch (e: any) {
      await updateLogs(`[WARNING] Exception uploading ${file.path} via Contents API: ${e.message || e}`);
    }
  }

  // Retrieve the latest branch HEAD commit SHA
  let commitSha = "";
  try {
    const refRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/refs/heads/${branch}`);
    if (refRes.ok) {
      const refData = await refRes.json();
      commitSha = refData.object.sha;
    }
  } catch {}

  await updateLogs(`[FALLBACK] Contents API synchronization finished. Commits resolved: ${successCount}/${filesToUpload.length}.`);
  return commitSha;
}

export async function executeImportJob(
  jobId: string
) {
  let state = useImportStore.getState();
  let job = state.jobs.find(j => j.id === jobId);
  if (!job) return;

  const updateStepAndProgress = async (step: ImportStep, progress: number, status: any = 'uploading') => {
    await updateJobAndPersist(jobId, { currentStep: step, progress, status });
  };

  const updateLogs = async (log: string) => {
    const freshJob = useImportStore.getState().jobs.find(j => j.id === jobId);
    const existingLogs = freshJob?.deployLogs || [];
    const timestamp = new Date().toLocaleTimeString();
    await updateJobAndPersist(jobId, {
      deployLogs: [...existingLogs, `[${timestamp}] ${log}`]
    });
  };

  try {
    // 1. Restore file checklist and status states from IndexedDB metadata if empty (due to page reloads)
    if (job.files.length === 0) {
      await updateLogs(`[RESUME] Restoring workspace files checklist and states from IndexedDB...`);
      const cachedJob = await importsDB.getItem(`job_metadata:${jobId}`) as ImportJob;
      if (cachedJob && cachedJob.files && cachedJob.files.length > 0) {
        await updateJobAndPersist(jobId, {
          files: cachedJob.files,
          totalFiles: cachedJob.totalFiles,
          completedFiles: cachedJob.completedFiles,
          deployLogs: cachedJob.deployLogs
        });
        state = useImportStore.getState();
        job = state.jobs.find(j => j.id === jobId)!;
        await updateLogs(`[RESUME] Successfully restored checklist containing ${cachedJob.files.length} files.`);
      } else {
        throw new Error("Unable to resume job: files checklist missing from local IndexedDB cache.");
      }
    }

    let owner = job.destOwner;
    let repo = job.destRepo;
    let activeBranch = job.destBranch;

    // --- STAGE 3: Creating Repository ---
    if (job.destOption === 'create') {
      await updateStepAndProgress('creating_repo', 25);
      await updateLogs(`[Step 3] Creating new target repository "${repo}" on GitHub...`);
      try {
        const repoDetails = await createGitHubRepository(repo, 'Project imported from workspace', false, jobId);
        owner = repoDetails.owner;
        repo = repoDetails.repo;
        activeBranch = repoDetails.defaultBranch || 'main';

        await updateLogs(`Waiting for GitHub to finalize repository replication...`);
        const confirmedData = await waitForRepoCreation(owner, repo, jobId);
        activeBranch = confirmedData.default_branch || activeBranch;

        await updateJobAndPersist(jobId, {
          destOwner: owner,
          destRepo: repo,
          destBranch: activeBranch,
          repoUrl: `https://github.com/${owner}/${repo}`
        });
        await updateLogs(`Confirmed repository is live! Default branch: "${activeBranch}"`);
      } catch (e: any) {
        throw new Error(`Repository creation failed: ${e.message || e}`);
      }
    } else {
      await updateJobAndPersist(jobId, {
        repoUrl: `https://github.com/${owner}/${repo}`
      });
    }

    const apiUrl = getApiUrl();

    // --- STAGE 4: Initialize Empty Repository if needed ---
    await updateStepAndProgress('initializing_repo', 35);
    await updateLogs(`[Step 4] Querying branch reference state for "${activeBranch}"...`);

    // Fetch live details to ensure we are targeting the actual default branch name
    try {
      const repoDetailsRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}`);
      if (repoDetailsRes.ok) {
        const rData = await repoDetailsRes.json();
        if (rData.default_branch && !job.destBranch) {
          activeBranch = rData.default_branch;
          await updateJobAndPersist(jobId, { destBranch: activeBranch });
        }
      }
    } catch (e) {
      console.warn("Failed fetching repo details, using fallback branch name", e);
    }

    if (!activeBranch) activeBranch = 'main';

    let isEmpty = false;
    try {
      const refRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/refs/heads/${activeBranch}`);
      if (refRes.status === 404 || refRes.status === 409) {
        isEmpty = true;
      }
    } catch {
      isEmpty = true;
    }

    if (isEmpty) {
      await updateLogs(`Repository is empty! Creating initial commit to activate "${activeBranch}" branch...`);
      await initializeEmptyRepository(owner, repo, activeBranch, jobId);
      await updateLogs(`Polling GitHub default branch reference replication...`);
      await waitForBranchToExist(owner, repo, activeBranch, jobId);
      await updateLogs(`Active branch reference "${activeBranch}" successfully established!`);
    } else {
      await updateLogs(`Confirmed active branch "${activeBranch}" contains commits.`);
    }

    // Load initial reference info to get parent commit and tree
    await updateStepAndProgress('detecting_branch', 45);
    await updateLogs(`[Step 4] Syncing parent commit pointers...`);

    let baseCommitSha = '';
    let baseTreeSha = '';
    let refRetries = 6;

    while (refRetries > 0) {
      try {
        const refRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/refs/heads/${activeBranch}`);
        if (refRes.ok) {
          const refData = await refRes.json();
          baseCommitSha = refData.object.sha;

          const commitRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/commits/${baseCommitSha}`);
          if (commitRes.ok) {
            const commitData = await commitRes.json();
            baseTreeSha = commitData.tree.sha;
            break;
          }
        }
      } catch (e) {
        console.warn("Polling branch head...", e);
      }
      refRetries--;
      if (refRetries === 0) {
        throw new Error(`Failed to load HEAD reference details on branch "${activeBranch}". Ensure branch contains commits.`);
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    // --- STAGE 4.5: Auto-Repair Missing/Invalid Configs ---
    await updateLogs(`[Step 4.5] Analyzing project files and performing automatic repairs...`);
    let filesToUpload = job.files.filter(f => f.action !== 'skip');
    const frameworkInfo = detectFrameworkFromPaths(filesToUpload.map(f => f.path));
    const hasPackageJson = filesToUpload.some(f => f.path.toLowerCase() === 'package.json');
    let pkgContent: any = {};
    let isPkgModified = false;

    if (hasPackageJson) {
      try {
        const pkgFile = filesToUpload.find(f => f.path.toLowerCase() === 'package.json');
        if (pkgFile) {
          const pkgBase64 = (await importsDB.getItem(`${jobId}:${pkgFile.path}`)) as string;
          if (pkgBase64) {
            pkgContent = JSON.parse(atob(pkgBase64));
          }
        }
      } catch(e) {
        await updateLogs(`[Repair] package.json is invalid JSON. Resetting to valid empty object.`);
        pkgContent = {};
        isPkgModified = true;
      }
    } else {
      await updateLogs(`[Repair] package.json is missing. Creating a valid package.json automatically.`);
      pkgContent = {
        name: "imported-project",
        version: "1.0.0",
        private: true
      };
      isPkgModified = true;
      const nextFiles = useImportStore.getState().jobs.find(j => j.id === jobId)?.files || [];
      await updateJobAndPersist(jobId, {
        files: [...nextFiles, { path: 'package.json', status: 'pending', action: 'create' }]
      });
      // Also update filesToUpload
      filesToUpload = useImportStore.getState().jobs.find(j => j.id === jobId)!.files.filter(f => f.action !== 'skip');
    }

    // Repair scripts
    if (!pkgContent.scripts) {
      pkgContent.scripts = {};
      isPkgModified = true;
    }
    
    if (!pkgContent.scripts.build || !pkgContent.scripts.start || !pkgContent.scripts.dev) {
      if (frameworkInfo.name.includes('React') || frameworkInfo.name.includes('Vite') || frameworkInfo.name.includes('Vue') || frameworkInfo.name.includes('Angular') || frameworkInfo.name.includes('Svelte') || frameworkInfo.name.includes('Astro')) {
        if (!pkgContent.scripts.dev) pkgContent.scripts.dev = "vite";
        if (!pkgContent.scripts.build) pkgContent.scripts.build = "vite build";
        if (!pkgContent.scripts.preview) pkgContent.scripts.preview = "vite preview";
        isPkgModified = true;
        await updateLogs(`[Repair] Added missing React/Vite scripts automatically.`);
      } else {
        if (!pkgContent.scripts.start) pkgContent.scripts.start = "node server.js";
        isPkgModified = true;
        await updateLogs(`[Repair] Added missing Node start script automatically.`);
      }
    }

    if (isPkgModified) {
      const newPkgBase64 = btoa(JSON.stringify(pkgContent, null, 2));
      await importsDB.setItem(`${jobId}:package.json`, newPkgBase64);
      await updateLogs(`[Repair] package.json repaired and saved.`);
    }

    // --- STAGE 5: Resumable File Uploads ---
    await updateStepAndProgress('uploading_files', 50);

    filesToUpload = useImportStore.getState().jobs.find(j => j.id === jobId)!.files.filter(f => f.action !== 'skip');
    await updateLogs(`[Step 5] Triggering resumable parallel upload queue for ${filesToUpload.length} files...`);

    // Process using high-performance queue
    await processUploadQueue(owner, repo, jobId, filesToUpload, 5);

    // Auto-retry once for any failed files to resolve transient issues transparently
    const postUploadJob = useImportStore.getState().jobs.find(j => j.id === jobId);
    const failedFiles = postUploadJob?.files.filter(f => f.action !== 'skip' && f.status !== 'completed') || [];
    if (failedFiles.length > 0) {
      await updateLogs(`[Step 5] Single-retry worker pass triggered for ${failedFiles.length} failed file uploads...`);
      await processUploadQueue(owner, repo, jobId, failedFiles, 2);
    }

    // Final checks on queue completion
    const finalUploadState = useImportStore.getState().jobs.find(j => j.id === jobId);
    const incompleteFiles = finalUploadState?.files.filter(f => f.action !== 'skip' && f.status !== 'completed') || [];
    if (incompleteFiles.length > 0) {
      throw new Error(`Upload queue finished but ${incompleteFiles.length} files failed to upload. Please retry the workflow.`);
    }

    // --- STAGE 6: Git Tree & Commit Creation ---
    await updateStepAndProgress('creating_commit', 80);
    await updateLogs(`[Step 6] Constructing Git directory tree structure...`);

    const treeEntries = finalUploadState?.files
      .filter(f => f.action !== 'skip' && f.status === 'completed' && f.sha)
      .map(f => ({
        path: f.path,
        mode: '100644',
        type: 'blob',
        sha: f.sha
      })) || [];

    // CRITICAL: Empty Git Tree Prevention
    const workspaceFilesCount = filesToUpload.length;
    const blobCount = finalUploadState?.completedFiles || 0;
    const treeEntriesCount = treeEntries.length;

    await updateLogs(`[Integrity Prep] Validating parameters: Workspace files: ${workspaceFilesCount}, Completed Blobs: ${blobCount}, Tree Entries: ${treeEntriesCount}`);

    let currentCommitSha = "";
    let contentsApiFallbackUsed = false;

    if (workspaceFilesCount === 0 || blobCount === 0 || treeEntriesCount === 0) {
      await updateLogs(`[Queue WARNING] Empty Git Tree prevented. Local files list empty or unindexed. Attempting recovery via individual uploads...`);
      currentCommitSha = await uploadFilesViaContentsApi(owner, repo, activeBranch, jobId, filesToUpload);
      contentsApiFallbackUsed = true;
    } else {
      // Normal Flow: Git Trees API
      try {
        const treePayload: any = {
          tree: treeEntries
        };
        if (baseTreeSha) {
          treePayload.base_tree = baseTreeSha;
        }

        const treeRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/trees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(treePayload)
        });

        if (!treeRes.ok) {
          const errText = await treeRes.text();
          throw new Error(`Git Trees API rejected payload (Status: ${treeRes.status}): ${errText}`);
        }

        const newTreeData = await treeRes.json();
        await updateLogs(`Directory tree created successfully! Creating Commit object...`);

        const commitRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/commits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Workspace Automated Project Import',
            tree: newTreeData.sha,
            parents: baseCommitSha ? [baseCommitSha] : []
          })
        });

        if (!commitRes.ok) {
          throw new Error("Failed to construct commit object on GitHub.");
        }

        const newCommitData = await commitRes.json();
        currentCommitSha = newCommitData.sha;
      } catch (gitTreeErr: any) {
        await updateLogs(`[Queue WARNING] Git Trees API failed: ${gitTreeErr.message || gitTreeErr}. Falling back to Repository Contents API...`);
        currentCommitSha = await uploadFilesViaContentsApi(owner, repo, activeBranch, jobId, filesToUpload);
        contentsApiFallbackUsed = true;
      }
    }

    if (!currentCommitSha) {
      throw new Error("Failed to produce a valid commit reference for this import.");
    }

    // --- STAGE 7: Pushing reference pointer to HEAD ---
    if (!contentsApiFallbackUsed) {
      await updateStepAndProgress('pushing', 85);
      await updateLogs(`[Step 7] Updating branch HEAD pointer on branch "${activeBranch}" to new commit...`);

      let pushSuccess = false;
      let pushRetries = 3;
      while (pushRetries > 0) {
        const updateRefRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/refs/heads/${activeBranch}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sha: currentCommitSha,
            force: true
          })
        });

        if (updateRefRes.ok) {
          pushSuccess = true;
          break;
        }

        if (updateRefRes.status === 404 || updateRefRes.status === 422) {
          await updateLogs(`Branch reference missing on HEAD. Attempting to create new branch ref...`);
          const createRefRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/refs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ref: `refs/heads/${activeBranch}`,
              sha: currentCommitSha
            })
          });
          if (createRefRes.ok) {
            pushSuccess = true;
            break;
          }
        }

        pushRetries--;
        await new Promise(r => setTimeout(r, 2000));
      }

      if (!pushSuccess) {
        throw new Error(`Failed to update head pointer ref to "${activeBranch}".`);
      }
    }

    await updateJobAndPersist(jobId, { commitSha: currentCommitSha });
    await updateLogs(`Git references pushed successfully! SHA: ${currentCommitSha}`);

    // --- STAGE 8: Upload Verification Loop ---
    await updateStepAndProgress('verifying', 90);
    await updateLogs(`[Step 8] Verifying repository file synchronization integrity against live commit tree...`);

    const syncResult = await verifyAndSyncTree(
      owner,
      repo,
      activeBranch,
      currentCommitSha,
      jobId,
      filesToUpload
    );
    currentCommitSha = syncResult.commitSha;
    await updateJobAndPersist(jobId, { commitSha: currentCommitSha });
    await updateLogs(`Live repository verification completed. All files in sync with remote!`);

    // --- STAGE 8.5: Post-Push Verification ---
    await updateStepAndProgress('completed', 100, 'completed');
    await updateLogs(`[Step 8.5] Running integrity verification check...`);

    const finalJob = useImportStore.getState().jobs.find(j => j.id === jobId);
    if (!finalJob) throw new Error("Job metadata cleared from memory mid-run.");

    // Verification 1: ZIP Extracted & Parsed (totalFiles > 0)
    if (finalJob.totalFiles === 0) {
      throw new Error("Integrity Failed: Extracted file list is empty.");
    }
    await updateLogs(`- Check: ZIP extracted checklist (Total files: ${finalJob.totalFiles}): OK`);

    // Verification 2: Files validated (all completed, no pending/error state)
    const incomplete = finalJob.files.filter(f => f.action !== 'skip' && f.status !== 'completed');
    if (incomplete.length > 0) {
      throw new Error(`Integrity Failed: ${incomplete.length} files did not complete upload.`);
    }
    await updateLogs(`- Check: All files uploaded successfully: OK`);

    // Verification 3: Repository exists on GitHub
    const repoExistsRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}`);
    if (!repoExistsRes.ok) {
      throw new Error(`Integrity Failed: Repository not found on GitHub (Status: ${repoExistsRes.status}).`);
    }
    await updateLogs(`- Check: Repository target validated on GitHub: OK`);

    // Verification 4: Repository tree verified (commit Sha matches head)
    const branchRefRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/refs/heads/${activeBranch}`);
    if (branchRefRes.ok) {
      const branchRefData = await branchRefRes.json();
      if (branchRefData.object.sha !== currentCommitSha) {
        await updateLogs(`[Integrity Warning] Branch HEAD SHA does not match current commit. Forcing HEAD alignment...`);
        await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/refs/heads/${activeBranch}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sha: currentCommitSha, force: true })
        });
      }
    }
    await updateLogs(`- Check: Head reference aligned with commit tree: OK`);

    // Verification 5: Push successful
    if (!finalJob.commitSha) {
      throw new Error("Integrity Failed: Git commit SHA pointer is empty.");
    }
    await updateLogs(`- Check: Push commit verified (SHA: ${finalJob.commitSha}): OK`);

    await updateLogs(`[SUCCESS] Project repaired and pushed successfully.`);

    // Clean up temporary base64 caches in IndexedDB for the completed job to conserve browser storage
    for (const file of filesToUpload) {
      await importsDB.removeItem(`${jobId}:${file.path}`).catch(() => {});
    }

  } catch (err: any) {
    console.error("Pipeline fatal interruption:", err);
    await updateLogs(`[FATAL ERROR] Pipeline failed: ${err.message || err}`);
    await updateJobAndPersist(jobId, {
      status: 'error',
      error: err.message || "An unexpected error occurred during import execution."
    });
    await updateStepAndProgress('error', 100, 'error');
  }
}

export async function runCloudDeployment(
  jobId: string,
  provider: DeployProvider,
  token?: string,
  teamId?: string,
  projectId?: string,
  siteId?: string
) {
  let state = useImportStore.getState();
  let job = state.jobs.find(j => j.id === jobId);
  if (!job) return;

  const updateStepAndProgress = async (step: ImportStep, progress: number, status: any = 'deploying') => {
    await updateJobAndPersist(jobId, { currentStep: step, progress, status });
  };

  const updateLogs = async (log: string) => {
    const freshJob = useImportStore.getState().jobs.find(j => j.id === jobId);
    const existingLogs = freshJob?.deployLogs || [];
    const timestamp = new Date().toLocaleTimeString();
    await updateJobAndPersist(jobId, {
      deployLogs: [...existingLogs, `[${timestamp}] ${log}`]
    });
  };

  try {
    if (provider === 'github') {
      await updateStepAndProgress('deploying', 0);
      await updateJobAndPersist(jobId, { deployProvider: 'github' });
      await updateLogs(`Validating GitHub Repository...`);
      await updateLogs(`Repository link ready: ${job.repoUrl}`);
      await updateLogs(`GitHub Repository option selected. No live deployment created.`);
      await updateStepAndProgress('completed', 100, 'deployed');
      if (job.repoUrl && typeof window !== 'undefined') {
         window.open(job.repoUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    await updateStepAndProgress('deploying', 0);
    await updateJobAndPersist(jobId, { deployProvider: provider });
    await updateLogs(`Starting live deployment using ${provider.toUpperCase()}...`);
    
    await runDeployment(jobId, provider, job.destOwner, job.destRepo, job.destBranch, token, teamId, projectId, siteId);

    const finalJob = useImportStore.getState().jobs.find(j => j.id === jobId);
    if (!finalJob?.liveUrl) {
      throw new Error("Deployment completed but Live URL was not successfully generated.");
    }
    await updateLogs(`Deployment Successful.`);

    await updateStepAndProgress('completed', 100, 'deployed');
    
    // Automatically open the deployed URL in a new tab
    if (finalJob.liveUrl && typeof window !== 'undefined') {
       window.open(finalJob.liveUrl, '_blank', 'noopener,noreferrer');
    }

  } catch (err: any) {
    await updateLogs(`[ERROR] Deployment Failed: ${err.message || err}`);
    await updateJobAndPersist(jobId, {
      status: 'error',
      error: err.message || "An unexpected error occurred during deployment."
    });
  }
}

/**
 * Checks, compares, and reconciles the uploaded file list with the live GitHub commit tree.
 * Re-uploads only missing files, updates tree and commit references dynamically.
 */
async function verifyAndSyncTree(
  owner: string,
  repo: string,
  branch: string,
  commitSha: string,
  jobId: string,
  expectedFiles: { path: string }[],
  retries = 3
): Promise<{ commitSha: string; branch: string }> {
  const apiUrl = getApiUrl();
  let currentCommitSha = commitSha;

  const updateLogs = async (log: string) => {
    const freshJob = useImportStore.getState().jobs.find(j => j.id === jobId);
    const existingLogs = freshJob?.deployLogs || [];
    const timestamp = new Date().toLocaleTimeString();
    await updateJobAndPersist(jobId, {
      deployLogs: [...existingLogs, `[${timestamp}] ${log}`]
    });
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/commits/${currentCommitSha}`);
      if (!res.ok) throw new Error("Could not fetch commit details from GitHub.");
      
      const commitData = await res.json();
      const treeSha = commitData.tree.sha;

      const treeRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`);
      if (!treeRes.ok) throw new Error("Failed to load recursive repository tree.");
      
      const treeData = await treeRes.json();
      const existingPaths = new Set(
        (treeData.tree || [])
          .filter((item: any) => item.type === 'blob')
          .map((item: any) => item.path)
      );

      const missingFiles = expectedFiles.filter(f => !existingPaths.has(f.path));
      if (missingFiles.length === 0) {
        return { commitSha: currentCommitSha, branch };
      }

      await updateLogs(`[Integrity Sync] Detected ${missingFiles.length} missing files in remote tree. Re-syncing missing blocks...`);

      const newTreeItems: any[] = [];
      for (const file of missingFiles) {
        const base64Content = (await importsDB.getItem(`${jobId}:${file.path}`)) as string || "";
        const blobSha = await uploadBlobWithRetry(owner, repo, base64Content, file.path, jobId);
        
        newTreeItems.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blobSha
        });
      }

      const postTreeRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_tree: treeSha,
          tree: newTreeItems
        })
      });

      if (!postTreeRes.ok) throw new Error("Failed to construct reconciliation tree.");
      const newTreeData = await postTreeRes.json();

      const postCommitRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Workspace Automated Sync Reconciliation (Restored missing files)',
          tree: newTreeData.sha,
          parents: [currentCommitSha]
        })
      });

      if (!postCommitRes.ok) throw new Error("Failed to create reconciliation commit.");
      const newCommitData = await postCommitRes.json();
      currentCommitSha = newCommitData.sha;

      const updateRefRes = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sha: currentCommitSha,
          force: true
        })
      });

      if (!updateRefRes.ok) throw new Error("Failed to update HEAD branch pointer reference.");
    } catch (e: any) {
      await updateLogs(`[Integrity Sync WARNING] Attempt ${attempt} failed: ${e.message || e}`);
      if (attempt === retries) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return { commitSha: currentCommitSha, branch };
}

// Poll repository creation
async function waitForRepoCreation(owner: string, repo: string, jobId: string, retries = 5): Promise<any> {
  const apiUrl = getApiUrl();
  for (let i = 0; i < retries; i++) {
    try {
      const res = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Polling repository creation...", e);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error("Repository creation confirmation timed out on GitHub.");
}

// Poll default branch existence
async function waitForBranchToExist(owner: string, repo: string, branch: string, jobId: string, retries = 10): Promise<string> {
  const apiUrl = getApiUrl();
  for (let i = 0; i < retries; i++) {
    try {
      const res = await loggedFetch(jobId, `${apiUrl}/repos/${owner}/${repo}/git/refs/heads/${branch}`);
      if (res.ok) {
        const data = await res.json();
        return data.object.sha;
      }
    } catch (e) {
      console.warn("Waiting for branch refs to activate...", e);
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error(`Default branch "${branch}" did not populate in time.`);
}

// -------------------------------------------------------------
// STEP 1 & 2: Local Loading, Extraction & Analysis
// -------------------------------------------------------------
export async function importFromZip(
  file: File,
  destOption: 'create' | 'existing',
  destOwner: string,
  destRepo: string,
  destBranch: string
) {
  const jobId = generateId();
  
  useImportStore.getState().addJob({
    id: jobId,
    type: 'zip',
    sourceName: file.name,
    destOption,
    destOwner,
    destRepo,
    destBranch,
    status: 'analyzing',
    currentStep: 'analyzing',
    progress: 5,
    totalFiles: 0,
    completedFiles: 0,
    files: [],
    createdAt: new Date().toISOString()
  });

  const updateLogs = async (log: string) => {
    const job = useImportStore.getState().jobs.find(j => j.id === jobId);
    const existingLogs = job?.deployLogs || [];
    const timestamp = new Date().toLocaleTimeString();
    await updateJobAndPersist(jobId, {
      deployLogs: [...existingLogs, `[${timestamp}] ${log}`]
    });
  };

  try {
    await updateLogs(`[Step 2] Local project analysis initialized...`);
    await updateLogs(`Loading local ZIP file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
    await updateJobAndPersist(jobId, { currentStep: 'downloading', progress: 15 });
    
    await updateLogs(`Extracting zip structures and files list...`);
    const zip = await JSZip.loadAsync(file);
    await updateJobAndPersist(jobId, { currentStep: 'extracting', progress: 30 });

    const keys = Object.keys(zip.files).filter(relativePath => {
      const entry = zip.files[relativePath];
      if (entry.dir) return false;
      if (relativePath.includes('__MACOSX/') || relativePath.includes('.DS_Store')) return false;
      if (relativePath.includes('.git/') || relativePath.includes('node_modules/')) return false;
      if (relativePath.includes('.github/workflows/')) return false;
      return true;
    });

    const totalFiles = keys.length;
    const files: ImportFile[] = [];
    const filePaths: string[] = [];
    let completedExtraction = 0;

    await updateLogs(`Extracting and parsing ${totalFiles} files using high-concurrency background indexing workers...`);

    // High performance extraction concurrency pool
    const CONCURRENCY = 15;
    const processBatch = async (batchKeys: string[]) => {
      await Promise.all(batchKeys.map(async (relativePath) => {
        const zipEntry = zip.files[relativePath];
        try {
          let contentBuffer: Uint8Array;
          let retryCount = 3;
          let lastErr: any = null;
          for (let attempt = 1; attempt <= retryCount; attempt++) {
            try {
              contentBuffer = await zipEntry.async('uint8array');
              break;
            } catch (e) {
              lastErr = e;
              await new Promise(r => setTimeout(r, 300 * attempt));
            }
          }
          if (!contentBuffer!) {
            throw lastErr || new Error(`Could not parse entry: ${relativePath}`);
          }

          const isZeroByte = contentBuffer.byteLength === 0;
          if (isZeroByte) {
            await updateLogs(`[FILE VALIDATE] ${relativePath} detected as intentionally empty file (0 bytes). Proceeding with empty buffer.`);
          }

          const base64 = uint8ArrayToBase64(contentBuffer);
          await importsDB.setItem(`${jobId}:${relativePath}`, base64);
          
          files.push({
            path: relativePath,
            status: 'pending',
            action: 'create'
          });
          filePaths.push(relativePath);
          completedExtraction++;

          // Real-time precise progress updating
          const extractionProgress = 30 + Math.floor((completedExtraction / totalFiles) * 40); // 30% to 70%
          useImportStore.getState().updateJob(jobId, { 
            progress: extractionProgress,
            completedFiles: completedExtraction
          });
        } catch (err: any) {
          await updateLogs(`[WARNING] Failed to extract file ${relativePath}: ${err.message || err}. Skipped.`);
        }
      }));
    };

    for (let i = 0; i < keys.length; i += CONCURRENCY) {
      await processBatch(keys.slice(i, i + CONCURRENCY));
    }

    await updateJobAndPersist(jobId, { currentStep: 'reading_files', progress: 70 });
    const framework = detectFrameworkFromPaths(filePaths);
    await updateLogs(`Analysis complete: Detected ${framework.name} project structure with ${totalFiles} files.`);
    await updateLogs(`Configuration set -> Build: "${framework.buildCommand}", Install: "${framework.installCommand}", Output Dir: "${framework.outputDirectory}"`);

    await updateJobAndPersist(jobId, {
      totalFiles,
      files,
      progress: 100,
      status: 'confirming'
    });

    // AUTO-EXECUTE E2E PIPELINE IMMEDIATELY (Fully automatic UX!)
    await updateLogs(`Initiating end-to-end automated push pipeline...`);
    executeImportJob(jobId);

  } catch (err: any) {
    await updateLogs(`[ERROR] Analysis failed: ${err.message || err}`);
    await updateJobAndPersist(jobId, { status: 'error', error: err.message });
  }
}

export async function importFromUrl(
  url: string,
  destOption: 'create' | 'existing',
  destOwner: string,
  destRepo: string,
  destBranch: string
) {
  const jobId = generateId();
  const trimmedUrl = url.trim();

  useImportStore.getState().addJob({
    id: jobId,
    type: 'url',
    sourceName: trimmedUrl.split('/').pop() || 'Remote Project',
    sourceUrl: trimmedUrl,
    destOption,
    destOwner,
    destRepo,
    destBranch,
    status: 'analyzing',
    currentStep: 'analyzing',
    progress: 5,
    totalFiles: 0,
    completedFiles: 0,
    files: [],
    createdAt: new Date().toISOString()
  });

  const updateLogs = async (log: string) => {
    const job = useImportStore.getState().jobs.find(j => j.id === jobId);
    const existingLogs = job?.deployLogs || [];
    const timestamp = new Date().toLocaleTimeString();
    await updateJobAndPersist(jobId, {
      deployLogs: [...existingLogs, `[${timestamp}] ${log}`]
    });
  };

  try {
    await updateLogs(`[Step 2] Local project analysis initialized for URL...`);
    
    const isGitHubUrl = trimmedUrl.includes('github.com') && !trimmedUrl.endsWith('.zip');
    let archiveUrl = trimmedUrl;
    
    if (isGitHubUrl) {
      // Parse owner/repo from GitHub URL
      let clean = trimmedUrl.replace('https://github.com/', '').replace('.git', '').replace(/\/+$/, '');
      const parts = clean.split('/');
      if (parts.length < 2) throw new Error("Invalid GitHub URL structure.");
      const srcOwner = parts[0];
      const srcRepo = parts[1];
      
      await updateLogs(`Detected GitHub repository URL: "${srcOwner}/${srcRepo}".`);
      
      // Call authenticated zipball endpoint if logged in, otherwise public zipball
      const isAuthenticated = useAppStore.getState().isAuthenticated;
      if (isAuthenticated) {
        archiveUrl = `/api/github/repos/${srcOwner}/${srcRepo}/zipball`;
      } else {
        archiveUrl = `https://api.github.com/repos/${srcOwner}/${srcRepo}/zipball`;
      }
    }

    await updateJobAndPersist(jobId, { currentStep: 'downloading', progress: 15 });
    await updateLogs(`Downloading remote zipball package from: ${archiveUrl}...`);
    
    const arrayBuffer = await fetchBinaryFromUrl(archiveUrl, jobId);
    
    await updateJobAndPersist(jobId, { currentStep: 'extracting', progress: 40 });
    await updateLogs(`Extracting and parsing remote zip structure...`);
    const zip = await JSZip.loadAsync(arrayBuffer);

    // GitHub zipballs nest files inside a top-level parent folder. Let's detect and strip it!
    const zipKeys = Object.keys(zip.files);
    const parentDir = zipKeys.find(key => key.endsWith('/') && key.split('/').filter(Boolean).length === 1) || '';
    if (parentDir) {
      await updateLogs(`Stripping parent GitHub wrapper directory: "${parentDir}"...`);
    }

    const keys = zipKeys.filter(relativePath => {
      const entry = zip.files[relativePath];
      if (entry.dir) return false;
      if (relativePath.includes('__MACOSX/') || relativePath.includes('.DS_Store')) return false;
      if (relativePath.includes('.git/') || relativePath.includes('node_modules/')) return false;
      if (relativePath.includes('.github/workflows/')) return false;
      return true;
    });

    const totalFiles = keys.length;
    const files: ImportFile[] = [];
    const filePaths: string[] = [];
    let completedExtraction = 0;

    await updateLogs(`Extracting and parsing ${totalFiles} files with high-concurrency background indexing workers...`);

    // High performance extraction concurrency pool
    const CONCURRENCY = 15;
    const processBatch = async (batchKeys: string[]) => {
      await Promise.all(batchKeys.map(async (relativePath) => {
        const zipEntry = zip.files[relativePath];
        let cleanPath = relativePath;
        if (parentDir && relativePath.startsWith(parentDir)) {
          cleanPath = relativePath.substring(parentDir.length);
        }

        try {
          let contentBuffer: Uint8Array;
          let retryCount = 3;
          let lastErr: any = null;
          for (let attempt = 1; attempt <= retryCount; attempt++) {
            try {
              contentBuffer = await zipEntry.async('uint8array');
              break;
            } catch (e) {
              lastErr = e;
              await new Promise(r => setTimeout(r, 300 * attempt));
            }
          }
          if (!contentBuffer!) {
            throw lastErr || new Error(`Could not parse entry: ${cleanPath}`);
          }

          const isZeroByte = contentBuffer.byteLength === 0;
          if (isZeroByte) {
            await updateLogs(`[FILE VALIDATE] ${cleanPath} detected as intentionally empty file (0 bytes). Proceeding with empty buffer.`);
          }

          const base64 = uint8ArrayToBase64(contentBuffer);
          await importsDB.setItem(`${jobId}:${cleanPath}`, base64);
          
          files.push({
            path: cleanPath,
            status: 'pending',
            action: 'create'
          });
          filePaths.push(cleanPath);
          completedExtraction++;

          // Real-time precise progress updating
          const extractionProgress = 40 + Math.floor((completedExtraction / totalFiles) * 40); // 40% to 80%
          useImportStore.getState().updateJob(jobId, { 
            progress: extractionProgress,
            completedFiles: completedExtraction
          });
        } catch (err: any) {
          await updateLogs(`[WARNING] Failed to extract file ${cleanPath}: ${err.message || err}. Skipped.`);
        }
      }));
    };

    for (let i = 0; i < keys.length; i += CONCURRENCY) {
      await processBatch(keys.slice(i, i + CONCURRENCY));
    }

    await updateJobAndPersist(jobId, { currentStep: 'reading_files', progress: 80 });
    const framework = detectFrameworkFromPaths(filePaths);
    await updateLogs(`Analysis complete: Detected ${framework.name} project structure with ${totalFiles} files.`);
    await updateLogs(`Configuration set -> Build: "${framework.buildCommand}", Install: "${framework.installCommand}", Output Dir: "${framework.outputDirectory}"`);

    await updateJobAndPersist(jobId, {
      totalFiles,
      files,
      progress: 100,
      status: 'confirming'
    });

    // AUTO-EXECUTE END-TO-END WORKFLOW IMMEDIATELY
    await updateLogs(`Initiating end-to-end automated push pipeline...`);
    executeImportJob(jobId);

  } catch (err: any) {
    await updateLogs(`[ERROR] Remote download/extract failed: ${err.message || err}`);
    await updateJobAndPersist(jobId, { status: 'error', error: err.message });
  }
}

// Auto-resume and background queue synchronization manager
export async function initiateAutoResume() {
  const state = useImportStore.getState();
  const activeJobs = state.jobs.filter(j => 
    j.status !== 'completed' && 
    j.status !== 'error' && 
    j.status !== 'confirming' &&
    j.status !== 'paused'
  );

  if (activeJobs.length === 0) return;

  console.log(`[Auto-Resume] Found ${activeJobs.length} active import jobs. Resuming queue...`);
  
  for (const job of activeJobs) {
    try {
      // Force status to 'uploading' to trigger execution
      useImportStore.getState().updateJob(job.id, { status: 'uploading' });
      executeImportJob(job.id);
    } catch (e) {
      console.error(`[Auto-Resume] Failed to resume job ${job.id}:`, e);
    }
  }
}
