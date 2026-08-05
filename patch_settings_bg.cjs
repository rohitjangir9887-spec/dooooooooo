const fs = require('fs');
const path = 'src/pages/Settings.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "import { useAppStore } from '../store/useAppStore';",
  "import { useAppStore } from '../store/useAppStore';\nimport { useTaskStore } from '../store/useTaskStore';"
);

code = code.replace(
  "import { HardDrive, Settings2, Trash2, CheckCircle2, AlertCircle, History, User } from 'lucide-react';",
  "import { HardDrive, Settings2, Trash2, CheckCircle2, AlertCircle, History, User, Activity } from 'lucide-react';"
);

code = code.replace(
  "const { userProfile, updateUserProfile, history, clearHistory, addToast } = useAppStore();",
  "const { userProfile, updateUserProfile, history, clearHistory, addToast } = useAppStore();\n  const tasks = useTaskStore(state => state.tasks);\n  const removeTask = useTaskStore(state => state.removeTask);"
);

const bgJobsSection = `
        {/* Background Jobs */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2"><Activity className="w-6 h-6 text-neutral-500" /> Background Jobs History</h2>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">No background jobs</div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-96 overflow-y-auto">
                {tasks.map((task) => (
                  <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {task.name}
                        {task.status === 'success' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase">Success</span>}
                        {task.status === 'error' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 uppercase">Error</span>}
                        {task.status === 'canceled' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-400 uppercase">Canceled</span>}
                        {(task.status === 'running' || task.status === 'paused') && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase">{task.status}</span>}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Repo: {task.repo}
                      </div>
                      {task.errorMsg && <div className="text-xs text-red-500 mt-1">{task.errorMsg}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === 'success' && task.onOpen && (
                        <button onClick={task.onOpen} className="text-sm font-medium text-blue-500 hover:text-blue-600">Open Result</button>
                      )}
                      <button onClick={() => removeTask(task.id)} className="text-sm text-neutral-400 hover:text-red-500">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
`;

code = code.replace(
  "{/* Data & Storage */}",
  bgJobsSection + "\n        {/* Data & Storage */}"
);

fs.writeFileSync(path, code);
