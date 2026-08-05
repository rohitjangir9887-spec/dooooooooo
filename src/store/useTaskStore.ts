import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../lib/storage';
import { GitTreeItem } from '../lib/github';

export interface BackgroundTask {
  id: string;
  name: string;
  repo: string;
  status: 'running' | 'paused' | 'success' | 'error' | 'canceled';
  progress: number;
  details: string; 
  errorMsg?: string;
  
  owner?: string;
  repoName?: string;
  branch?: string;
  files?: GitTreeItem[];

  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onOpen?: () => void;
  startTime?: number;
  totalFiles?: number;
  processedFiles?: number;
  bytesProcessed?: number;
  totalBytes?: number;
}

interface TaskStore {
  tasks: BackgroundTask[];
  addTask: (task: BackgroundTask) => void;
  updateTask: (id: string, updates: Partial<BackgroundTask>) => void;
  removeTask: (id: string) => void;
  activeExportModal: string | null;
  openExportModal: (id: string) => void;
  closeExportModal: () => void;
  activeJobModal: string | null;
  openJobModal: (id: string) => void;
  closeJobModal: () => void;
  isJobsListOpen: boolean;
  setJobsListOpen: (open: boolean) => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (task) => set((state) => {
        if (state.tasks.some(t => t.id === task.id)) return state;
        return { tasks: [task, ...state.tasks] };
      }),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
      })),
      removeTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id)
      })),
      activeExportModal: null,
      openExportModal: (id) => set({ activeExportModal: id }),
      closeExportModal: () => set({ activeExportModal: null }),
      activeJobModal: null,
      openJobModal: (id) => set({ activeJobModal: id }),
      closeJobModal: () => set({ activeJobModal: null }),
      isJobsListOpen: false,
      setJobsListOpen: (open) => set({ isJobsListOpen: open }),
    }),
    {
      name: 'github-explorer-tasks-storage-v1',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ tasks: state.tasks.map(t => ({ ...t, files: [], onPause: undefined, onResume: undefined, onCancel: undefined, onRetry: undefined, onOpen: undefined })) })
    }
  )
);
