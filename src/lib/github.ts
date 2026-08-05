import { useAppStore } from "../store/useAppStore";

export interface RepoInfo {
  name: string;
  owner: { login: string; avatar_url: string };
  description: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  subscribers_count: number;
  language: string;
  updated_at: string;
  size: number;
  default_branch: string;
  license: { name: string; spdx_id: string } | null;
  private: boolean;
}

export interface GitTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

const PUBLIC_API_URL = "https://api.github.com";
const PROXY_API_URL = "/api/github";

function getApiUrl() {
  return useAppStore.getState().isAuthenticated ? PROXY_API_URL : PUBLIC_API_URL;
}

export async function fetchRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
  const isAuthenticated = useAppStore.getState().isAuthenticated;
  try {
    const res = await fetch(`${getApiUrl()}/repos/${owner}/${repo}`);
    if (!res.ok) {
      if (res.status === 404) {
        if (!isAuthenticated) {
          throw new Error("Please log in to access private repositories.");
        }
        throw new Error("Repository not found (404).");
      }
      if (res.status === 403) throw new Error("GitHub API rate limit hit! Please try again later.");
      if (res.status === 401) {
        if (!isAuthenticated) {
          throw new Error("Please log in to access private repositories.");
        }
        throw new Error("Access denied (401).");
      }
      throw new Error(`Failed to fetch repository information (Status: ${res.status}).`);
    }
    return await res.json();
  } catch (error: any) {
    if (error.name === 'TypeError') {
      throw new Error("Network error: Could not connect to GitHub API.");
    }
    throw error;
  }
}

export async function detectDefaultBranch(owner: string, repo: string): Promise<string> {
  const isAuthenticated = useAppStore.getState().isAuthenticated;

  // 1. Try to get default branch from repo info: GET /repos/{owner}/{repo}
  try {
    const info = await fetchRepoInfo(owner, repo);
    if (info && info.default_branch) {
      return info.default_branch;
    }
  } catch (e: any) {
    console.warn("Failed to fetch repo info for default branch, trying fallback branches", e);
    if (e.message?.includes("Please log in")) {
      throw e;
    }
  }

  // 2. Fetch the branch list: GET /repos/{owner}/{repo}/branches
  try {
    const branches = await fetchBranches(owner, repo);
    if (branches && branches.length > 0) {
      // check standard branch names first to prefer them
      const standards = ['main', 'master', 'dev', 'develop'];
      for (const std of standards) {
        if (branches.some(b => b.name === std)) {
          return std;
        }
      }
      // Or automatically use the first available branch
      return branches[0].name;
    }
  } catch (e) {
    console.warn("Failed to fetch branches list, attempting manual fallback check", e);
  }

  // 3. Absolute fallbacks: Probing common branches
  const standards = ['main', 'master', 'dev', 'develop'];
  for (const std of standards) {
    try {
      const res = await fetch(`${getApiUrl()}/repos/${owner}/${repo}/git/trees/${std}?recursive=1`);
      if (res.ok) {
        return std;
      }
    } catch (e) {
      // Ignore
    }
  }

  return 'main';
}

export async function fetchRepoTree(owner: string, repo: string, branch?: string): Promise<GitTreeItem[]> {
  let activeBranch = branch;
  if (!activeBranch) {
    try {
      activeBranch = await detectDefaultBranch(owner, repo);
    } catch (e: any) {
      if (e.message?.includes("Please log in")) {
        throw e;
      }
      console.warn("Default branch detection failed, trying fallback probes", e);
    }
  }

  if (!activeBranch) {
    activeBranch = 'main';
  }

  // For the Trees API use: GET /repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1
  try {
    const res = await fetch(`${getApiUrl()}/repos/${owner}/${repo}/git/trees/${activeBranch}?recursive=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.tree && data.tree.length > 0) {
        return data.tree;
      } else {
        throw new Error("This repository has no files.");
      }
    } else {
      if (res.status === 409) {
        throw new Error("This repository has no files.");
      }
      if (res.status === 404) {
        // Let's see if we can detect the default branch dynamically to be absolutely sure
        try {
          const detected = await detectDefaultBranch(owner, repo);
          if (detected && detected !== activeBranch) {
            const retryRes = await fetch(`${getApiUrl()}/repos/${owner}/${repo}/git/trees/${detected}?recursive=1`);
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              if (retryData.tree && retryData.tree.length > 0) {
                return retryData.tree;
              } else {
                throw new Error("This repository has no files.");
              }
            } else if (retryRes.status === 409) {
              throw new Error("This repository has no files.");
            }
          }
        } catch (detErr: any) {
          if (detErr.message?.includes("Please log in") || detErr.message === "This repository has no files.") {
            throw detErr;
          }
        }
        throw new Error(`Repository branch or tree not found (404) on branch "${activeBranch}".`);
      }
      if (res.status === 403) {
        throw new Error("GitHub API rate limit hit!");
      }
    }
  } catch (err: any) {
    if (err.message === "This repository has no files." || err.message?.includes("Please log in")) {
      throw err;
    }
    console.warn(`Failed fetching tree for branch ${activeBranch}, trying fallback...`, err);
  }

  // Try automatic detection if we got a failure or empty tree
  try {
    const detected = await detectDefaultBranch(owner, repo);
    if (detected && detected !== activeBranch) {
      activeBranch = detected;
      const res = await fetch(`${getApiUrl()}/repos/${owner}/${repo}/git/trees/${detected}?recursive=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.tree && data.tree.length > 0) return data.tree;
        throw new Error("This repository has no files.");
      } else if (res.status === 409) {
        throw new Error("This repository has no files.");
      }
    }
  } catch (e: any) {
    if (e.message === "This repository has no files." || e.message?.includes("Please log in")) {
      throw e;
    }
    console.error("Failed fallback branch tree fetch", e);
  }

  // Direct retry or original fallbacks to report clean error to the caller
  const res = await fetch(`${getApiUrl()}/repos/${owner}/${repo}/git/trees/${activeBranch}?recursive=1`);
  if (!res.ok) {
    if (res.status === 409) throw new Error("This repository has no files.");
    if (res.status === 404) throw new Error(`Repository branch or tree not found (404) on branch "${activeBranch}".`);
    if (res.status === 403) throw new Error("GitHub API rate limit hit!");
    throw new Error("Failed to fetch repository tree.");
  }
  const data = await res.json();
  if (!data.tree || data.tree.length === 0) throw new Error("This repository has no files.");
  if (data.truncated) {
    console.warn("Repository tree is truncated.");
  }
  return data.tree;
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export async function fetchBranches(owner: string, repo: string): Promise<Branch[]> {
  const res = await fetch(`${getApiUrl()}/repos/${owner}/${repo}/branches`);
  if (!res.ok) {
    throw new Error("Failed to fetch branches.");
  }
  return res.json();
}

export async function fetchFileContent(owner: string, repo: string, path: string, branch: string): Promise<string> {
  const res = await fetch(`${getApiUrl()}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: {
      'Accept': 'application/vnd.github.v3.raw'
    }
  });
  if (!res.ok) throw new Error("Failed to fetch file content. Network or missing file.");
  return res.text();
}

export async function fetchFileBlob(owner: string, repo: string, path: string, branch: string): Promise<string> {
  const res = await fetch(`${getApiUrl()}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!res.ok) throw new Error("Failed to fetch file content.");
  const data = await res.json();
  if (data.encoding === 'base64') {
    return `data:image/${path.split('.').pop()?.toLowerCase()};base64,${data.content.replace(/\n/g, '')}`;
  }
  return data.content;
}

export async function fetchReadme(owner: string, repo: string, branch: string): Promise<string | null> {
  try {
     const res = await fetch(`${getApiUrl()}/repos/${owner}/${repo}/readme?ref=${branch}`, {
        headers: {
           'Accept': 'application/vnd.github.v3.raw'
        }
     });
     if (res.ok) return res.text();
     return null;
  } catch (e) {
    return null;
  }
}

export async function commitFile(
  owner: string, 
  repo: string, 
  path: string, 
  branch: string, 
  contentBase64: string, 
  message: string, 
  sha: string
): Promise<any> {
  const res = await fetch(`${getApiUrl()}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
      sha,
      branch
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to commit file.');
  }
  return res.json();
}
