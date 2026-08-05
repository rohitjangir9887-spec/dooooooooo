import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../lib/storage';
import { PlanId, PLANS } from '../config/plans';

let isCheckingAuth = false;
let hasCheckedAuth = false;
let lastCheckedAuthTime = 0;

export interface UserUsage {
  reposExploredToday: number;
  exportsToday: number;
  backgroundJobsToday: number;
  lastResetDate: string;
}

export interface UserProfile {
  name: string;
  avatar: string | null;
  planId: PlanId;
  usage: UserUsage;
}

export interface GithubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string | null;
  public_repos: number;
  total_private_repos?: number;
}

export interface Settings {
  darkMode: boolean;
  themeColor: string;
  editorFontSize: number;
  wrapLines: boolean;
  showLineNumbers: boolean;
  autoExpandTree: boolean;
  exportMode: 'full' | 'minified' | 'chunked' | 'structure' | 'ui-only';
}

export interface FavoriteRepo {
  owner: string;
  repo: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface HistoryItem {
  type: 'repo' | 'file';
  owner: string;
  repo: string;
  path?: string;
  timestamp: number;
}

interface AppState {
  cacheVersion: string;
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  favorites: FavoriteRepo[];
  toggleFavorite: (owner: string, repo: string) => void;
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, 'timestamp'>) => void;
  clearHistory: () => void;
  
  searchHistory: string[];
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;

  lastOpenedRepo: { owner: string; repo: string } | null;
  setLastOpenedRepo: (repo: { owner: string; repo: string } | null) => void;

  lastOpenedFile: { owner: string; repo: string; path: string } | null;
  setLastOpenedFile: (file: { owner: string; repo: string; path: string } | null) => void;

  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  fallbackData: any | null;
  setFallbackData: (data: any | null) => void;

  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  incrementUsage: (type: 'repos' | 'exports' | 'backgroundJobs') => boolean;

  isAuthenticated: boolean;
  githubUser: GithubUser | null;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  
  loginWarningOpen: boolean;
  setLoginWarningOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      cacheVersion: 'v1.2.0',
      settings: {
        darkMode: true,
        themeColor: 'blue',
        editorFontSize: 14,
        wrapLines: true,
        showLineNumbers: true,
        autoExpandTree: false,
        exportMode: 'full',
      },
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      
      favorites: [],
      toggleFavorite: (owner, repo) =>
        set((state) => {
          const exists = state.favorites.some((f) => f.owner === owner && f.repo === repo);
          if (exists) {
            return { favorites: state.favorites.filter((f) => !(f.owner === owner && f.repo === repo)) };
          }
          return { favorites: [...state.favorites, { owner, repo }] };
        }),

      history: [],
      addToHistory: (item) =>
        set((state) => {
          const newHistory = [
            { ...item, timestamp: Date.now() },
            ...state.history.filter(
              (h) =>
                !(h.type === item.type && h.owner === item.owner && h.repo === item.repo && h.path === item.path)
            ),
          ].slice(0, 50);
          return { history: newHistory };
        }),
      clearHistory: () => set({ history: [] }),

      searchHistory: [],
      addSearchHistory: (query) => set((state) => {
        if (!query || !query.trim()) return state;
        const q = query.trim();
        const filtered = [q, ...state.searchHistory.filter(item => item !== q)].slice(0, 20);
        return { searchHistory: filtered };
      }),
      clearSearchHistory: () => set({ searchHistory: [] }),

      lastOpenedRepo: null,
      setLastOpenedRepo: (repo) => set({ lastOpenedRepo: repo }),

      lastOpenedFile: null,
      setLastOpenedFile: (file) => set({ lastOpenedFile: file }),

      toasts: [],
      addToast: (message, type = 'info') => set(state => { 
        const id = Math.random().toString(36).substring(2); 
        setTimeout(() => state.removeToast(id), 3000); 
        return { toasts: [...state.toasts, { id, message, type }] }; 
      }),
      removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
      
      fallbackData: null,
      setFallbackData: (data) => set({ fallbackData: data }),

      userProfile: {
        name: 'Guest User',
        avatar: null,
        planId: 'free',
        usage: {
          reposExploredToday: 0,
          exportsToday: 0,
          backgroundJobsToday: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
        }
      },
      updateUserProfile: (profile) => set((state) => ({ userProfile: { ...state.userProfile, ...profile } })),
      incrementUsage: (type) => {
        let allowed = true;
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          let currentUsage = state.userProfile.usage;
          
          if (currentUsage.lastResetDate !== today) {
            currentUsage = { reposExploredToday: 0, exportsToday: 0, backgroundJobsToday: 0, lastResetDate: today };
          }
          
          const plan = PLANS[state.userProfile.planId];
          const newUsage = { ...currentUsage };
          
          if (type === 'repos') {
            if (currentUsage.reposExploredToday >= plan.limits.reposPerDay) allowed = false;
            else newUsage.reposExploredToday++;
          } else if (type === 'exports') {
            if (currentUsage.exportsToday >= plan.limits.exportsPerDay) allowed = false;
            else newUsage.exportsToday++;
          } else if (type === 'backgroundJobs') {
            if (currentUsage.backgroundJobsToday >= plan.limits.backgroundJobsPerDay) allowed = false;
            else newUsage.backgroundJobsToday++;
          }
          
          if (!allowed) return state;
          return { userProfile: { ...state.userProfile, usage: newUsage } };
        });
        return allowed;
      },

      isAuthenticated: false,
      githubUser: null,
      loginWarningOpen: false,
      setLoginWarningOpen: (open) => set({ loginWarningOpen: open }),

      checkAuth: async () => {
        const now = Date.now();
        if (hasCheckedAuth || isCheckingAuth || (now - lastCheckedAuthTime < 5000)) return;
        isCheckingAuth = true;
        try {
          const res = await fetch('/api/auth/github/me');
          if (res.ok) {
            const data = await res.json();
            set({ isAuthenticated: data.authenticated, githubUser: data.user || null });
          } else {
            set({ isAuthenticated: false, githubUser: null });
          }
          hasCheckedAuth = true;
        } catch {
          set({ isAuthenticated: false, githubUser: null });
        } finally {
          lastCheckedAuthTime = Date.now();
          isCheckingAuth = false;
        }
      },

      logout: async () => {
        hasCheckedAuth = false;
        try {
          await fetch('/api/auth/github/logout', { method: 'POST' });
        } finally {
          set({ isAuthenticated: false, githubUser: null });
        }
      },
    }),
    {
      name: 'github-explorer-app-storage-v1',
      storage: createJSONStorage(() => idbStorage),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        settings: { ...currentState.settings, ...(persistedState?.settings || {}) },
        favorites: persistedState?.favorites || currentState.favorites,
        history: persistedState?.history || currentState.history,
        searchHistory: persistedState?.searchHistory || currentState.searchHistory,
        lastOpenedRepo: persistedState?.lastOpenedRepo || currentState.lastOpenedRepo,
        lastOpenedFile: persistedState?.lastOpenedFile || currentState.lastOpenedFile,
        userProfile: persistedState?.userProfile || currentState.userProfile,
      }),
    }
  )
);
