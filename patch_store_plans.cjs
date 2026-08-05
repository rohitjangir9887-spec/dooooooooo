const fs = require('fs');
const path = 'src/store/useAppStore.ts';
let code = fs.readFileSync(path, 'utf8');

const interfacesToAdd = `
import { PlanId, PLANS } from '../config/plans';

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
`;

code = code.replace("export interface Settings {", interfacesToAdd + "\nexport interface Settings {");

const appStateAdditions = `
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  incrementUsage: (type: 'repos' | 'exports' | 'backgroundJobs') => boolean; // Returns false if over limit
`;

code = code.replace(
  "setFallbackData: (data: any | null) => void;\n}",
  "setFallbackData: (data: any | null) => void;\n" + appStateAdditions + "\n}"
);

const initialStateAdditions = `
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
          
          if (!allowed) return state; // Don't change state if not allowed
          return { userProfile: { ...state.userProfile, usage: newUsage } };
        });
        return allowed;
      },
`;

code = code.replace(
  "setFallbackData: (data) => set({ fallbackData: data }),\n    }),",
  "setFallbackData: (data) => set({ fallbackData: data }),\n" + initialStateAdditions + "    }),"
);

code = code.replace(
  "history: persistedState?.history || currentState.history,\n      }),",
  "history: persistedState?.history || currentState.history,\n        userProfile: persistedState?.userProfile || currentState.userProfile,\n      }),"
);

fs.writeFileSync(path, code);
