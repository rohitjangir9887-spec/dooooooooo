import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../lib/storage';
import { useTaskStore } from './useTaskStore';
import { useAppStore } from './useAppStore';
import { useImportStore } from './useImportStore';

export type TrashItemType = 'file' | 'folder' | 'image' | 'video' | 'zip' | 'repository' | 'workspace' | 'system';

export interface TrashItem {
  id: string;
  name: string;
  originalPath: string;
  repository: string;
  type: TrashItemType;
  actionId: string;
  metadata?: any;
  deletedAt: number;
}

interface SecureDeleteStore {
  isDialogOpen: boolean;
  pendingItemName: string;
  pendingItemType: TrashItemType;
  pendingActionId: string | null;
  pendingMetadata: any;
  trashItems: TrashItem[];
  
  requestDelete: (itemName: string, type: TrashItemType, actionId: string, metadata?: any) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
  
  moveToTrash: (name: string, type: TrashItemType, actionId: string, metadata?: any) => void;
  restoreItem: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  clearExpired: () => void;
}

export const useSecureDeleteStore = create<SecureDeleteStore>()(
  persist(
    (set, get) => ({
      isDialogOpen: false,
      pendingItemName: '',
      pendingItemType: 'system',
      pendingActionId: null,
      pendingMetadata: null,
      trashItems: [],
      
      requestDelete: (itemName, type, actionId, metadata) => {
        console.log(`[SecureDeleteService] Secure Delete Started for: ${itemName}`);
        set({ isDialogOpen: true, pendingItemName: itemName, pendingItemType: type, pendingActionId: actionId, pendingMetadata: metadata });
      },
      
      confirmDelete: () => {
        const { pendingItemName, pendingItemType, pendingActionId, pendingMetadata } = get();
        if (pendingActionId) {
          console.log(`[SecureDeleteService] CAPTCHA Passed`);
          get().moveToTrash(pendingItemName, pendingItemType, pendingActionId, pendingMetadata);
        }
        set({ isDialogOpen: false, pendingItemName: '', pendingActionId: null, pendingMetadata: null });
      },
      
      cancelDelete: () => {
        set({ isDialogOpen: false, pendingItemName: '', pendingActionId: null, pendingMetadata: null });
      },
      
      moveToTrash: (name, type, actionId, metadata) => {
        console.log(`[SecureDeleteService] Moved To Trash: ${name}`);
        const id = Math.random().toString(36).substring(7);
        const newItem: TrashItem = {
          id,
          name,
          originalPath: `Settings > ${name}`,
          repository: 'System',
          type,
          actionId,
          metadata,
          deletedAt: Date.now()
        };
        
        set(state => ({ trashItems: [...state.trashItems, newItem] }));
      },
      
      restoreItem: (id) => {
        const item = get().trashItems.find(i => i.id === id);
        if (item) {
          console.log(`[SecureDeleteService] Restore Clicked for: ${item.name}`);
          
          if (item.actionId === 'toggle_favorite' && item.metadata) {
             useAppStore.getState().toggleFavorite(item.metadata.owner, item.metadata.repo);
          }
          // We can add other restores here if needed
          
          set(state => ({ trashItems: state.trashItems.filter(i => i.id !== id) }));
        }
      },
      
      permanentlyDelete: (id) => {
        const item = get().trashItems.find(i => i.id === id);
        if (item) {
          console.log(`[SecureDeleteService] Permanent Delete Executed for: ${item.name}`);
          
          if (item.actionId === 'clear_app_cache') {
             import('localforage').then(lf => lf.default.clear());
          } else if (item.actionId === 'remove_task' && item.metadata) {
             useTaskStore.getState().removeTask(item.metadata.taskId);
          } else if (item.actionId === 'clear_history') {
             useAppStore.getState().clearHistory();
          } else if (item.actionId === 'clear_dashboard_cache') {
             import('localforage').then(lf => lf.default.clear());
          } else if (item.actionId === 'clear_completed_jobs') {
             useImportStore.getState().clearCompletedJobs();
          } else if (item.actionId === 'remove_job' && item.metadata) {
             useImportStore.getState().removeJob(item.metadata.jobId);
          } else if (item.actionId === 'clear_stats') {
             useAppStore.getState().updateUserProfile({
               usage: {
                 reposExploredToday: 0,
                 exportsToday: 0,
                 backgroundJobsToday: 0,
                 lastResetDate: new Date().toISOString().split('T')[0]
               }
             });
          }
          
          set(state => ({ trashItems: state.trashItems.filter(i => i.id !== id) }));
        }
      },

      clearExpired: () => {
         const now = Date.now();
         const expired = get().trashItems.filter(item => now - item.deletedAt >= 5 * 60 * 1000);
         expired.forEach(item => get().permanentlyDelete(item.id));
      }
    }),
    {
      name: 'github-explorer-trash-v1',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ trashItems: state.trashItems })
    }
  )
);

// Setup background reaper
if (typeof window !== 'undefined') {
  setInterval(() => {
    useSecureDeleteStore.getState().clearExpired();
  }, 10000);
}
