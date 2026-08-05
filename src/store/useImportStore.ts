import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../lib/storage';

export type ImportJobStatus = 'idle' | 'analyzing' | 'confirming' | 'uploading' | 'paused' | 'completed' | 'deploying' | 'deployed' | 'error';

export type DeployProvider = 'github' | 'vercel' | 'netlify';

export type ImportStep = 
  | 'analyzing'
  | 'downloading'
  | 'extracting'
  | 'reading_files'
  | 'creating_repo'
  | 'initializing_repo'
  | 'detecting_branch'
  | 'uploading_files'
  | 'creating_commit'
  | 'pushing'
  | 'verifying'
  | 'deploying'
  | 'completed'
  | 'error';

export interface ImportFile {
  path: string;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'skipped';
  action: 'create' | 'update' | 'delete' | 'skip';
  content?: string;
  sha?: string;
}

export interface ImportJob {
  id: string;
  type: 'zip' | 'repo' | 'url';
  sourceName: string;
  sourceUrl?: string;
  destOption: 'create' | 'existing';
  destOwner: string;
  destRepo: string;
  destBranch: string;
  status: ImportJobStatus;
  currentStep?: ImportStep;
  progress: number;
  totalFiles: number;
  completedFiles: number;
  files: ImportFile[];
  error?: string;
  createdAt: string;
  
  repoUrl?: string;
  commitSha?: string;
  deployProvider?: DeployProvider;
  deployUrl?: string;
  liveUrl?: string;
  deployLogs?: string[];
}

interface ImportState {
  jobs: ImportJob[];
  addJob: (job: ImportJob) => void;
  updateJob: (id: string, updates: Partial<ImportJob>) => void;
  removeJob: (id: string) => void;
  clearCompletedJobs: () => void;
}

export const useImportStore = create<ImportState>()(
  persist(
    (set) => ({
      jobs: [],
      addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
      updateJob: (id, updates) => set((state) => ({
        jobs: state.jobs.map((job) => job.id === id ? { ...job, ...updates } : job)
      })),
      removeJob: (id) => set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== id)
      })),
      clearCompletedJobs: () => set((state) => ({
        jobs: state.jobs.filter((job) => job.status !== 'completed')
      })),
    }),
    {
      name: 'github-explorer-imports-storage-v1',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ jobs: state.jobs.map(j => ({ ...j, files: [] })) })
    }
  )
);
