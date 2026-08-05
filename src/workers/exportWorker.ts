import localforage from 'localforage';
import JSZip from 'jszip';

let isPaused = false;
let isCanceled = false;

// We use localforage to store file contents
localforage.config({ name: 'github-explorer', storeName: 'exports' });

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'mp4', 'mov', 'pdf',
  'zip', 'gz', 'tar', 'woff', 'woff2', 'ttf', 'eot', 'wasm', 'bin', 'exe', 'dll', 'so', 'dylib', 'class', 'jar'
]);

function isBinary(path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  return ext && BINARY_EXTENSIONS.has(ext);
}

// Semaphore for concurrency
class Semaphore {
  private tasks: (() => void)[] = [];
  private active = 0;
  constructor(private max: number) {}
  async acquire() {
    if (this.active < this.max) {
      this.active++;
      return;
    }
    return new Promise<void>(resolve => {
      this.tasks.push(resolve);
    });
  }
  release() {
    this.active--;
    if (this.tasks.length > 0) {
      this.active++;
      const resolve = this.tasks.shift();
      if (resolve) resolve();
    }
  }
}

async function fetchWithRetry(url: string, isAuthenticated = false, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const headers: Record<string, string> = isAuthenticated ? { 'Accept': 'application/vnd.github.v3.raw' } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) {
        if (res.status === 403 || res.status === 429) {
          // Rate limit, wait a bit
          await new Promise(r => setTimeout(r, 2000 * (i + 1)));
          continue;
        }
        throw new Error(`Status ${res.status}`);
      }
      return await res.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("Failed after retries");
}

self.onmessage = async (e) => {
  const { type, payload } = e.data;
  
  if (type === 'START' || type === 'RESUME') {
    isPaused = false;
    isCanceled = false;
    
    const { owner, repo, branch, files, isAuthenticated } = payload;
    // files is array of { path, size }
    let processed = 0;
    let bytesProcessed = 0;
    let totalBytes = files.reduce((acc: number, f: any) => acc + (f.size || 0), 0);
    
    const semaphore = new Semaphore(10); // 10 concurrent fetches
    
    const processFile = async (file: any) => {
      if (isCanceled) return;
      
      const key = `export:${owner}/${repo}:${file.path}`;
      let content = await localforage.getItem<string>(key);
      
      if (content === null) {
        if (!isBinary(file.path)) {
          await semaphore.acquire();
          try {
            if (isCanceled) {
              semaphore.release();
              return;
            }
            const url = isAuthenticated 
              ? `/api/github/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`
              : `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`;
            content = await fetchWithRetry(url, isAuthenticated);
            await localforage.setItem(key, content);
          } catch (err) {
            console.error('Error fetching', file.path, err);
          } finally {
            semaphore.release();
          }
        }
      }
      
      processed++;
      bytesProcessed += file.size || 0;
      
      if (processed % 10 === 0 || processed === files.length) {
        self.postMessage({ type: 'PROGRESS', payload: { processed, total: files.length, bytesProcessed, totalBytes } });
      }
    };

    // We need to wait for all files to be processed or paused
    const promises: Promise<void>[] = [];
    for (const file of files) {
      if (isCanceled) break;
      if (isPaused) break;
      promises.push(processFile(file));
      
      // small delay to prevent event loop blocking if 10k files
      if (promises.length % 100 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }
    
    await Promise.all(promises);
    
    if (isCanceled) {
      self.postMessage({ type: 'CANCELED' });
    } else if (isPaused) {
      self.postMessage({ type: 'PAUSED' });
    } else {
      self.postMessage({ type: 'DONE' });
    }
  } else if (type === 'PAUSE') {
    isPaused = true;
  } else if (type === 'CANCEL') {
    isCanceled = true;
  } else if (type === 'DOWNLOAD_TXT_CHUNKED' || type === 'DOWNLOAD_MD_CHUNKED') {
    const { owner, repo, files, port } = payload;
    const isMd = type === 'DOWNLOAD_MD_CHUNKED';
    
    (async () => {
      if (isMd) {
        port.postMessage(new TextEncoder().encode(`# Repository Export: ${owner}/${repo}\n\n`));
      }
      for (const file of files) {
        if (isBinary(file.path)) continue;
        const content = await localforage.getItem(`export:${owner}/${repo}:${file.path}`);
        if (content !== null) {
          let chunk = '';
          if (isMd) {
             const ext = file.path.split('.').pop() || '';
             chunk = `## \`${file.path}\`\n\n\`\`\`${ext}\n${content}\n\`\`\`\n\n`;
          } else {
             chunk = `==================================================\nFILE: ${file.path}\n\n${content}\n\n`;
          }
          port.postMessage(new TextEncoder().encode(chunk));
        }
      }
      port.postMessage('DONE');
    })();
  } else if (type === 'DOWNLOAD_TXT' || type === 'DOWNLOAD_MD') {
    const { owner, repo, files } = payload;
    const isMd = type === 'DOWNLOAD_MD';
    
    const stream = new ReadableStream({
      async start(controller) {
        if (isMd) {
          controller.enqueue(new TextEncoder().encode(`# Repository Export: ${owner}/${repo}\n\n`));
        }
        for (const file of files) {
          if (isBinary(file.path)) continue;
          const content = await localforage.getItem<string>(`export:${owner}/${repo}:${file.path}`);
          if (content !== null) {
            let chunk = '';
            if (isMd) {
               const ext = file.path.split('.').pop() || '';
               chunk = `## \`${file.path}\`\n\n\`\`\`${ext}\n${content}\n\`\`\`\n\n`;
            } else {
               chunk = `==================================================\nFILE: ${file.path}\n\n${content}\n\n`;
            }
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        }
        controller.close();
      }
    });
    
    self.postMessage({ type: 'DOWNLOAD_STREAM', payload: { stream } }, [stream] as any);
  } else if (type === 'DOWNLOAD_ZIP') {
    const { owner, repo, files, port } = payload;
    const zip = new JSZip();
    
    for (const file of files) {
      if (isBinary(file.path)) continue;
      const content = await localforage.getItem<string>(`export:${owner}/${repo}:${file.path}`);
      if (content !== null) {
        zip.file(file.path, content);
      }
    }
    
    const stream = zip.generateInternalStream({ type: 'uint8array', streamFiles: true });
    stream.on('data', (data) => {
      port.postMessage(data);
    }).on('end', () => {
      port.postMessage('DONE');
    }).resume();
  } else if (type === 'PREPARE_COPY') {
    const { owner, repo, files } = payload;
    let fullText = '';
    for (const file of files) {
      if (isBinary(file.path)) continue;
      const content = await localforage.getItem<string>(`export:${owner}/${repo}:${file.path}`);
      if (content !== null) {
        fullText += `==================================================\nFILE: ${file.path}\n\n${content}\n\n`;
      }
    }
    self.postMessage({ type: 'COPY_READY', payload: { text: fullText } });
  }
};
