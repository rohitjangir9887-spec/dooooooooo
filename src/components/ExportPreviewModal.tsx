import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { PLANS } from '../config/plans';
import { Download, FileArchive, X, Clock, HardDrive, Play, FastForward } from 'lucide-react';
import { GitTreeItem } from '../lib/github';

interface Props {
  owner: string;
  repo: string;
  files: GitTreeItem[];
  onClose: () => void;
  onConfirm: (background: boolean) => void;
}

export function ExportPreviewModal({ owner, repo, files, onClose, onConfirm }: Props) {
  const userProfile = useAppStore(state => state.userProfile);
  const plan = PLANS[userProfile.planId];
  const usage = userProfile.usage;

  const estimatedSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const sizeMB = (estimatedSize / 1024 / 1024).toFixed(2);
  const estSeconds = Math.ceil(files.length / 5);

  const isOversized = (estimatedSize / 1024 / 1024) > plan.limits.maxRepoSizeMB;

  const canRunBackground = plan.limits.backgroundJobsPerDay === Infinity || usage.backgroundJobsToday < plan.limits.backgroundJobsPerDay;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2"><FileArchive className="w-5 h-5 text-blue-500" /> Export Preview</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800 p-4 mb-6">
            <h3 className="font-semibold text-lg mb-4 text-center">{owner}/{repo}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center p-3 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700">
                <FileArchive className="w-5 h-5 text-blue-500 mb-1" />
                <span className="text-xl font-bold">{files.length}</span>
                <span className="text-xs text-neutral-500 uppercase">Files</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700">
                <HardDrive className="w-5 h-5 text-purple-500 mb-1" />
                <span className="text-xl font-bold">{sizeMB} MB</span>
                <span className="text-xs text-neutral-500 uppercase">Est. Size</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700">
                <Clock className="w-5 h-5 text-green-500 mb-1" />
                <span className="text-xl font-bold">~{estSeconds}s</span>
                <span className="text-xs text-neutral-500 uppercase">Est. Time</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700">
                <FastForward className="w-5 h-5 text-yellow-500 mb-1" />
                <span className="text-xl font-bold">{plan.limits.exportsPerDay === Infinity ? '∞' : plan.limits.exportsPerDay - usage.exportsToday}</span>
                <span className="text-xs text-neutral-500 uppercase">Exports Left</span>
              </div>
            </div>
          </div>
          
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
                className={`w-full flex flex-col items-center justify-center py-3 rounded-xl font-semibold transition-transform border ${canRunBackground ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:scale-[1.02] active:scale-[0.98]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed opacity-70'}`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Run in Background
                </div>
                {!canRunBackground && <span className="text-xs font-normal mt-1">Background jobs limit reached or not available on {plan.name} plan</span>}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
