import { useEffect, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Loader2, Pause, Play, X, AlertCircle, HardDrive, Clock, FileArchive, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ActiveJobModal() {
  const activeJobId = useTaskStore(state => state.activeJobModal);
  const closeJobModal = useTaskStore(state => state.closeJobModal);
  const task = useTaskStore(state => state.tasks.find(t => t.id === activeJobId));

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!task || !task.startTime || task.status === 'success' || task.status === 'error' || task.status === 'canceled') return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - task.startTime!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [task?.status, task?.startTime]);

  // Initial set of elapsed time
  useEffect(() => {
    if (task?.startTime) {
      setElapsed(Math.floor((Date.now() - task.startTime) / 1000));
    }
  }, [task?.startTime]);

  if (!task || !activeJobId) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const isRunningOrPaused = task.status === 'running' || task.status === 'paused';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={closeJobModal}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col"
      >
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2">
            {task.status === 'running' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
            {task.status === 'paused' && <Pause className="w-5 h-5 text-yellow-500" />}
            {task.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {task.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            <h2 className="font-semibold text-lg">{task.name}</h2>
          </div>
          <button onClick={closeJobModal} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <div className="font-medium">{task.repo}</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{task.details}</div>
              </div>
              <div className="text-2xl font-bold text-blue-500">{task.progress}%</div>
            </div>
            
            {isRunningOrPaused && (
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${task.status === 'running' ? 'bg-blue-500' : 'bg-yellow-500'}`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            )}
            
            {task.status === 'error' && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-900/50 mb-2">
                {task.errorMsg}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
              <FileArchive className="w-5 h-5 text-neutral-400 mb-2" />
              <div className="text-xs text-neutral-500 mb-1">Files Processed</div>
              <div className="font-semibold">{task.processedFiles || 0} / {task.totalFiles || 0}</div>
            </div>
            
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
              <HardDrive className="w-5 h-5 text-neutral-400 mb-2" />
              <div className="text-xs text-neutral-500 mb-1">Data Processed</div>
              <div className="font-semibold">
                {task.bytesProcessed ? (task.bytesProcessed / 1024 / 1024).toFixed(2) : 0} MB / {task.totalBytes ? (task.totalBytes / 1024 / 1024).toFixed(2) : 0} MB
              </div>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800 col-span-2 flex items-center justify-between">
              <div>
                <Clock className="w-5 h-5 text-neutral-400 mb-2" />
                <div className="text-xs text-neutral-500 mb-1">Elapsed Time</div>
                <div className="font-semibold">{formatTime(elapsed)}</div>
              </div>
              
              <div className="flex gap-2">
                {task.status === 'running' && task.onPause && (
                  <button onClick={task.onPause} className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 rounded-lg font-medium border border-yellow-200 dark:border-yellow-900/50 hover:bg-yellow-100 transition-colors flex items-center gap-2">
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                )}
                {task.status === 'paused' && task.onResume && (
                  <button onClick={task.onResume} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 rounded-lg font-medium border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 transition-colors flex items-center gap-2">
                    <Play className="w-4 h-4" /> Resume
                  </button>
                )}
                {task.status === 'error' && task.onRetry && (
                  <button onClick={task.onRetry} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 rounded-lg font-medium border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 transition-colors flex items-center gap-2">
                    <Play className="w-4 h-4" /> Retry
                  </button>
                )}
                {isRunningOrPaused && task.onCancel && (
                  <button onClick={() => { task.onCancel!(); closeJobModal(); }} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium border border-red-200 dark:border-red-900/50 hover:bg-red-100 transition-colors flex items-center gap-2">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
