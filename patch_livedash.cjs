const fs = require('fs');
const path = 'src/components/LiveDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "import { Activity, HardDrive, FileArchive, CheckCircle2, Loader2, Play } from 'lucide-react';",
  "import { Activity, HardDrive, FileArchive, CheckCircle2, Loader2, Play, User, Zap } from 'lucide-react';\nimport { PLANS } from '../config/plans';"
);

code = code.replace(
  "const activeTasks = tasks.filter(t => t.status === 'running' || t.status === 'paused');",
  "const userProfile = useAppStore(state => state.userProfile);\n  const activeTasks = tasks.filter(t => t.status === 'running' || t.status === 'paused');"
);

const newPanel = `
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-1 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-3">
            <User className="w-8 h-8" />
          </div>
          <h3 className="font-semibold">{userProfile.name}</h3>
          <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full mt-1 font-medium">{PLANS[userProfile.planId].name} Plan</span>
          <button onClick={() => navigate('/settings')} className="mt-4 text-xs font-medium text-blue-500 hover:text-blue-600">Upgrade Plan</button>
        </div>
        
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-neutral-500">Repos Explored</span>
              <span className="text-xs font-semibold">{userProfile.usage.reposExploredToday} / {PLANS[userProfile.planId].limits.reposPerDay === Infinity ? '∞' : PLANS[userProfile.planId].limits.reposPerDay}</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: \`\${Math.min(100, (userProfile.usage.reposExploredToday / (PLANS[userProfile.planId].limits.reposPerDay === Infinity ? Math.max(1, userProfile.usage.reposExploredToday) : PLANS[userProfile.planId].limits.reposPerDay)) * 100)}%\` }} />
            </div>
          </div>
          <div className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-neutral-500">Exports Today</span>
              <span className="text-xs font-semibold">{userProfile.usage.exportsToday} / {PLANS[userProfile.planId].limits.exportsPerDay === Infinity ? '∞' : PLANS[userProfile.planId].limits.exportsPerDay}</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: \`\${Math.min(100, (userProfile.usage.exportsToday / (PLANS[userProfile.planId].limits.exportsPerDay === Infinity ? Math.max(1, userProfile.usage.exportsToday) : PLANS[userProfile.planId].limits.exportsPerDay)) * 100)}%\` }} />
            </div>
          </div>
          <div className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-neutral-500">Background Jobs</span>
              <span className="text-xs font-semibold">{userProfile.usage.backgroundJobsToday} / {PLANS[userProfile.planId].limits.backgroundJobsPerDay === Infinity ? '∞' : PLANS[userProfile.planId].limits.backgroundJobsPerDay}</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
              <div className="bg-green-500 h-full rounded-full" style={{ width: \`\${Math.min(100, (userProfile.usage.backgroundJobsToday / (PLANS[userProfile.planId].limits.backgroundJobsPerDay === Infinity ? Math.max(1, userProfile.usage.backgroundJobsToday) : PLANS[userProfile.planId].limits.backgroundJobsPerDay)) * 100)}%\` }} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
`;

code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-6">',
  newPanel
);

fs.writeFileSync(path, code);
