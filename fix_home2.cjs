const fs = require('fs');

// We will fetch the previous clean Home.tsx content or reconstruct it based on the git structure
// Wait, I can just replace the broken part.
let homeCode = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const badArea = homeCode.match(/<motion\.div[\s\S]*?<form onSubmit=\{handleSubmit\}/);

if (badArea) {
  const correctReplacement = `<motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl z-10 flex flex-col items-center"
      >
        <div className="w-full mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-3">
                <User className="w-8 h-8" />
              </div>
              <h3 className="font-semibold">{userProfile.name}</h3>
              <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full mt-1 font-medium">{PLANS[userProfile.planId].name} Plan</span>
              <button onClick={() => navigate('/plans')} className="mt-4 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">Upgrade Plan</button>
            </div>
            
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-neutral-500">Repos Explored</span>
                  <span className="text-xs font-semibold">{userProfile.usage.reposExploredToday} / {PLANS[userProfile.planId].limits.reposPerDay === Infinity ? '∞' : PLANS[userProfile.planId].limits.reposPerDay}</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: \`\${Math.min(100, (userProfile.usage.reposExploredToday / (PLANS[userProfile.planId].limits.reposPerDay === Infinity ? Math.max(1, userProfile.usage.reposExploredToday) : PLANS[userProfile.planId].limits.reposPerDay)) * 100)}%\` }} />
                </div>
              </div>
              <div className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-neutral-500">Exports Today</span>
                  <span className="text-xs font-semibold">{userProfile.usage.exportsToday} / {PLANS[userProfile.planId].limits.exportsPerDay === Infinity ? '∞' : PLANS[userProfile.planId].limits.exportsPerDay}</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: \`\${Math.min(100, (userProfile.usage.exportsToday / (PLANS[userProfile.planId].limits.exportsPerDay === Infinity ? Math.max(1, userProfile.usage.exportsToday) : PLANS[userProfile.planId].limits.exportsPerDay)) * 100)}%\` }} />
                </div>
              </div>
              <div className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm">
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
        </div>

        <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl flex items-center justify-center mb-8 border border-neutral-200 dark:border-neutral-700/50">
          <Github className="w-8 h-8 text-neutral-800 dark:text-neutral-100" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center text-neutral-900 dark:text-white mb-4">
          Explore Open Source
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 text-center mb-10 max-w-lg">
          Paste a GitHub repository URL to browse its source code with a premium editor experience.
        </p>
        <form onSubmit={handleSubmit}`;
  homeCode = homeCode.replace(badArea[0], correctReplacement);
  fs.writeFileSync('src/pages/Home.tsx', homeCode);
} else {
  console.log("Could not find bad area");
}
