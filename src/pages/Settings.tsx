import { useAppStore } from '../store/useAppStore';
import { useTaskStore } from '../store/useTaskStore';
import { useSecureDeleteStore } from '../store/useSecureDeleteStore';
import { HardDrive, Settings2, Trash2, History, Activity, ChevronDown, ShieldCheck, ArrowLeft, Download, Upload, RefreshCw } from 'lucide-react';
import localforage from 'localforage';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { getStorageMetrics, exportAllLocalData, importLocalData } from '../lib/storage';

function AccordionSection({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200/30 dark:border-neutral-800/40 shadow-sm overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-white/40 dark:hover:bg-neutral-900/40 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-100">{title}</h2>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="p-5 sm:p-6 border-t border-neutral-200/20 dark:border-neutral-800/20 bg-white/20 dark:bg-neutral-950/20">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Settings() {
  const { history, clearHistory, addToast, isAuthenticated } = useAppStore();
  const tasks = useTaskStore(state => state.tasks);
  const removeTask = useTaskStore(state => state.removeTask);
  const { requestDelete, moveToTrash } = useSecureDeleteStore();
  
  const [metrics, setMetrics] = useState({ idbSize: 'Calculating...', cacheSize: 'Calculating...', lastSync: 'Just now' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const loadMetrics = async () => {
    const m = await getStorageMetrics();
    setMetrics(m);
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleClearCache = async () => {
    requestDelete('Application Cache', 'system', 'clear_app_cache');
  };

  const handleExport = async () => {
    const success = await exportAllLocalData();
    if (success) {
      addToast("Local data exported successfully", "success");
    } else {
      addToast("Failed to export local data", "error");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await importLocalData(file);
      if (success) {
        addToast("Data imported successfully. Reloading...", "success");
      } else {
        addToast("Failed to import data", "error");
      }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-28 md:pb-12 bg-transparent text-neutral-900 dark:text-neutral-100 px-4 sm:px-8 relative overflow-hidden flex flex-col items-center justify-start">
      
      {/* iOS style sticky-styled prominent Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-200/40 dark:border-neutral-800/40 text-blue-500 dark:text-blue-400 text-xs font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer focus:outline-none"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
          <span>Home</span>
        </motion.button>
      </div>

      {/* iOS Aurora Backgrounds */}
      <div className="absolute top-[-10%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-pink-300/10 to-indigo-400/20 dark:from-pink-900/5 dark:to-indigo-900/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-blue-300/20 to-teal-400/10 dark:from-blue-900/10 dark:to-teal-900/5 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="max-w-4xl w-full z-10 space-y-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <Settings2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Configuration</span>
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-800 dark:text-white">Settings & Storage</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/settings/trash')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-semibold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Trash Manager
            </motion.button>
            <button 
              onClick={() => navigate('/deployment-diagnostics')}
              className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Deployment Diagnostics"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deployments</span>
            </button>
            <button 
              onClick={() => navigate('/verification')}
              className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Verification Report"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Verification Report</span>
            </button>
            <button 
              onClick={loadMetrics}
              className="p-2 rounded-xl bg-neutral-200/50 dark:bg-neutral-800/50 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5 text-xs font-bold"
              title="Refresh metrics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
        
        {/* Data & Storage */}
        <AccordionSection title="Storage & Persistence" icon={HardDrive} defaultOpen={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-white/40 dark:bg-neutral-900/40 border border-neutral-200/30 dark:border-neutral-800/40">
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold uppercase">IndexedDB Size</span>
              <div className="text-lg font-black text-neutral-800 dark:text-neutral-100 mt-1">{metrics.idbSize}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/40 dark:bg-neutral-900/40 border border-neutral-200/30 dark:border-neutral-800/40">
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold uppercase">Cache Entries</span>
              <div className="text-lg font-black text-neutral-800 dark:text-neutral-100 mt-1">{metrics.cacheSize}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/40 dark:bg-neutral-900/40 border border-neutral-200/30 dark:border-neutral-800/40">
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold uppercase">Session Status</span>
              <div className="text-lg font-black mt-1 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isAuthenticated ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-neutral-800 dark:text-neutral-100">{isAuthenticated ? 'Authenticated' : 'Guest'}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/40 dark:bg-neutral-900/40 border border-neutral-200/30 dark:border-neutral-800/40">
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold uppercase">Last Sync</span>
              <div className="text-sm font-bold text-neutral-800 dark:text-neutral-100 mt-1.5 truncate">{metrics.lastSync}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Local Data
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-200/70 dark:bg-neutral-800/70 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Import Local Data
            </motion.button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClearCache} 
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold transition-all ml-auto"
            >
              <Trash2 className="w-4 h-4" /> Clear Cache
            </motion.button>
          </div>
        </AccordionSection>

        {/* Background Jobs */}
        <AccordionSection title="Background Jobs History" icon={Activity}>
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 dark:text-neutral-500 flex flex-col items-center">
              <Activity className="w-8 h-8 mb-2 stroke-[1.5]" />
              <p className="text-xs font-semibold">No active or historic background jobs</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200/20 dark:divide-neutral-800/35 max-h-96 overflow-y-auto pr-2 space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0">
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                      {task.name}
                      {task.status === 'success' && <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Success</span>}
                      {task.status === 'error' && <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase tracking-wide">Error</span>}
                      {task.status === 'canceled' && <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-neutral-300/10 text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Canceled</span>}
                      {(task.status === 'running' || task.status === 'paused') && <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-wide animate-pulse">{task.status}</span>}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Repo: {task.repo}</div>
                    {task.errorMsg && <div className="text-[11px] text-red-500 font-medium mt-1">{task.errorMsg}</div>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {task.status === 'success' && task.onOpen && (
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={task.onOpen} 
                        className="text-xs font-bold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        Open Result
                      </motion.button>
                    )}
                    <button 
                      onClick={() => {
                        requestDelete(`Background Task: ${task.name}`, 'system', 'remove_task', { taskId: task.id });
                      }} 
                      className="text-xs text-neutral-400 hover:text-red-500 transition-colors font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AccordionSection>

        {/* History */}
        <AccordionSection title="Activity History" icon={History}>
          <div className="flex justify-end mb-4">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                requestDelete('Activity History', 'system', 'clear_history');
              }} 
              className="text-xs text-red-500 hover:text-red-600 font-bold px-3 py-1.5 rounded-xl bg-red-500/10"
            >
              Clear History
            </motion.button>
          </div>
          {history.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 dark:text-neutral-500 flex flex-col items-center">
              <History className="w-8 h-8 mb-2 stroke-[1.5]" />
              <p className="text-xs font-semibold">No recent exploratory activities</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200/20 dark:divide-neutral-800/35 max-h-96 overflow-y-auto pr-2 space-y-2">
              {history.map((item, idx) => (
                <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0">
                  <div className="truncate">
                    <div className="font-bold text-sm text-neutral-800 dark:text-neutral-200 break-all">{item.owner}/{item.repo}</div>
                    <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                      {item.type === 'repo' ? 'Viewed repository' : `Viewed file: ${item.path}`} • {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/${item.owner}/${item.repo}`)} 
                    className="text-xs font-bold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 self-start sm:self-center bg-blue-500/10 px-3.5 py-1.5 rounded-xl shrink-0"
                  >
                    Open
                  </motion.button>
                </div>
              ))}
            </div>
          )}
        </AccordionSection>

        {/* Security & System Info Info Badge */}
        <div className="flex items-center gap-2 justify-center pt-6 text-neutral-400 dark:text-neutral-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-[11px] font-semibold">End-to-end Local IndexedDB Persistence Active</span>
        </div>
      </motion.div>
    </div>
  );
}
