const fs = require('fs');
const path = 'src/components/ExportPreviewModal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const estSeconds = Math.ceil(files.length / 5);",
  "const estSeconds = Math.ceil(files.length / 5);\n\n  const isOversized = (estimatedSize / 1024 / 1024) > plan.limits.maxRepoSizeMB;"
);

const oldButtons = `
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => onConfirm(false)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-5 h-5" />
              Run in Foreground
            </button>
            <button 
              onClick={() => onConfirm(true)}
              disabled={!canRunBackground}
              className={\`w-full flex flex-col items-center justify-center py-3 rounded-xl font-semibold transition-transform border \${canRunBackground ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:scale-[1.02] active:scale-[0.98]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed opacity-70'}\`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Run in Background
              </div>
              {!canRunBackground && <span className="text-xs font-normal mt-1">Background jobs limit reached or not available on {plan.name} plan</span>}
            </button>
          </div>
`;

const newButtons = `
          {isOversized ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-center">
              <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Repository too large for {plan.name} Plan</p>
              <p className="text-sm text-red-500/80 mb-4">Max allowed size is {plan.limits.maxRepoSizeMB} MB.</p>
              <button onClick={() => { onClose(); window.location.hash = '#/plans'; window.location.reload(); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                Upgrade Plan
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => onConfirm(false)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-5 h-5" />
                Run in Foreground
              </button>
              <button 
                onClick={() => onConfirm(true)}
                disabled={!canRunBackground}
                className={\`w-full flex flex-col items-center justify-center py-3 rounded-xl font-semibold transition-transform border \${canRunBackground ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:scale-[1.02] active:scale-[0.98]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed opacity-70'}\`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Run in Background
                </div>
                {!canRunBackground && <span className="text-xs font-normal mt-1">Background jobs limit reached or not available on {plan.name} plan</span>}
              </button>
            </div>
          )}
`;

code = code.replace(oldButtons, newButtons);

fs.writeFileSync(path, code);
