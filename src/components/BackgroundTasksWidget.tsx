import { useState, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Layers, Activity, Loader2, CheckCircle2, AlertCircle, Pause, Play, X, Clock, FileArchive, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function TaskItem({ task }: { task: any }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!task || !task.startTime || task.status === 'success' || task.status === 'error' || task.status === 'canceled') return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - task.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [task?.status, task?.startTime]);

  useEffect(() => {
    if (task?.startTime) {
      setElapsed(Math.floor((Date.now() - task.startTime) / 1000));
    }
  }, [task?.startTime]);

  const isRunningOrPaused = task.status === 'running' || task.status === 'paused';

  return (
    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          {task.status === 'running' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
          {task.status === 'paused' && <Pause className="w-5 h-5 text-yellow-500" />}
          {task.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          {task.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{task.name}</h3>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{task.repo}</div>
          </div>
        </div>
        {task.status === 'success' && task.onOpen && (
          <button onClick={task.onOpen} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
            Open Result
          </button>
        )}
      </div>

      {(isRunningOrPaused) && (
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">{task.details}</span>
            <span className="text-sm font-bold text-blue-500">{task.progress}%</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mb-3 overflow-hidden shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${task.status === 'running' ? 'bg-blue-500' : 'bg-yellow-500'}`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {task.status === 'error' && (
        <div className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs border border-red-200 dark:border-red-900/50">
          {task.errorMsg}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800">
          <FileArchive className="w-3.5 h-3.5" />
          <span className="truncate">{task.processedFiles || 0} / {task.totalFiles || 0} files</span>
        </div>
        <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800">
          <HardDrive className="w-3.5 h-3.5" />
          <span className="truncate">{task.bytesProcessed ? (task.bytesProcessed / 1024 / 1024).toFixed(1) : 0} MB</span>
        </div>
        <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800">
          <Clock className="w-3.5 h-3.5" />
          <span className="truncate">{formatTime(elapsed)} elapsed</span>
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-1">
        {task.status === 'running' && task.onPause && (
          <button onClick={task.onPause} className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded-lg text-xs font-medium border border-yellow-200 dark:border-yellow-900/50 hover:bg-yellow-100 transition-colors flex items-center gap-1.5">
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
        )}
        {task.status === 'paused' && task.onResume && (
          <button onClick={task.onResume} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-500 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 transition-colors flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5" /> Resume
          </button>
        )}
        {task.status === 'error' && task.onRetry && (
          <button onClick={task.onRetry} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-500 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 transition-colors flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5" /> Retry
          </button>
        )}
        {isRunningOrPaused && task.onCancel && (
          <button onClick={() => { task.onCancel!() }} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-xs font-medium border border-red-200 dark:border-red-900/50 hover:bg-red-100 transition-colors flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export function BackgroundTasksWidget() {
  const isOpen = useTaskStore(state => state.isJobsListOpen);
  const setIsOpen = useTaskStore(state => state.setJobsListOpen);
  const tasks = useTaskStore(state => state.tasks);

  if (tasks.length === 0) return null;

  const activeCount = tasks.filter(t => t.status === 'running' || t.status === 'paused').length;
  
  return (
    <>
      {/* The Widget Button */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[45]">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-full px-4 py-3 hover:scale-105 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
        >
          <div className="relative">
            <Layers className={`w-5 h-5 text-blue-500 ${activeCount > 0 ? 'animate-pulse' : ''}`} />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
            )}
          </div>
          <span className="text-sm font-semibold">{activeCount} Jobs</span>
        </button>
      </div>

      {/* The Full Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setIsOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col"
            >
              <div className="p-4 md:px-6 md:py-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-neutral-900 dark:text-white leading-tight">Background Jobs</h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">Manage your active and completed tasks</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-white dark:bg-neutral-900">
                {tasks.length === 0 ? (
                  <div className="text-center text-neutral-500 py-12">
                    No background jobs.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map(task => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
