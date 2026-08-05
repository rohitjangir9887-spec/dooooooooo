import { useEffect, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useAppStore } from '../store/useAppStore';
import { useSecureDeleteStore } from '../store/useSecureDeleteStore';
import { Activity, Database, DownloadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import { PLANS } from '../config/plans';
import { motion } from 'motion/react';
import localforage from 'localforage';
import { useNavigate } from 'react-router-dom';

export function LiveDashboard() {
  const tasks = useTaskStore(state => state.tasks);
  const openExportModal = useTaskStore(state => state.openExportModal);
  const openJobModal = useTaskStore(state => state.setJobsListOpen);
  const addToast = useAppStore(state => state.addToast);
  const { requestDelete, moveToTrash } = useSecureDeleteStore();
  const navigate = useNavigate();
  
  const userProfile = useAppStore(state => state.userProfile);
  const activeTasks = tasks.filter(t => t.status === 'running' || t.status === 'paused');
  const completedTasks = tasks.filter(t => t.status === 'success').slice(-5);
  
  const [cacheSize, setCacheSize] = useState<string>('Calculating...');
  
  useEffect(() => {
    async function estimateCache() {
      try {
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          setCacheSize(estimate.usage ? (estimate.usage / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown');
        } else {
          setCacheSize('N/A');
        }
      } catch {
        setCacheSize('Error');
      }
    }
    estimateCache();
    const interval = setInterval(estimateCache, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-blue-500" />
        <h2 className="text-xl font-semibold">Live System Dashboard</h2>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Active Background Jobs</h3>
          {activeTasks.length === 0 ? (
            <p className="text-sm text-neutral-400">No active jobs running.</p>
          ) : (
            <div className="space-y-3">
              {activeTasks.map(task => (
                <div key={task.id} onClick={() => openJobModal(true)} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      {task.name}
                    </span>
                    <span className="text-xs text-neutral-500">{task.repo}</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 mb-1 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${task.progress}%` }} />
                  </div>
                  <div className="text-xs text-neutral-500">{task.details}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Recent Exports</h3>
          {completedTasks.length === 0 ? (
            <p className="text-sm text-neutral-400">No completed exports yet.</p>
          ) : (
            <div className="space-y-3">
              {completedTasks.map(task => (
                <div key={task.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      {task.repo}
                    </div>
                    <div className="text-xs text-neutral-500">Export Complete</div>
                  </div>
                  <button onClick={() => openExportModal(task.id)} className="text-xs bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 px-3 py-1.5 rounded shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors">
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">System Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <Database className="w-4 h-4 text-blue-500 mb-2" />
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Local Cache Usage</div>
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">{cacheSize}</div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-900/30">
              <DownloadCloud className="w-4 h-4 text-purple-500 mb-2" />
              <div className="text-xs text-purple-600 dark:text-purple-400 mb-0.5">Total Exports</div>
              <div className="text-lg font-semibold text-purple-700 dark:text-purple-300">{tasks.filter(t => t.name === 'Repository Export').length}</div>
            </div>
          </div>
          <button 
            onClick={() => {
              requestDelete('Dashboard Cache', 'system', 'clear_dashboard_cache');
            }} 
            className="w-full text-xs text-center text-neutral-500 hover:text-red-500 transition-colors pt-2"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
}
