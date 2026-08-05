import { motion, AnimatePresence } from 'motion/react';
import { Trash2, RotateCcw, X, Clock } from 'lucide-react';
import { useSecureDeleteStore } from '../store/useSecureDeleteStore';
import { useState, useEffect } from 'react';

export default function TrashWidget() {
  const { trashItems, restoreItem, permanentlyDelete } = useSecureDeleteStore();
  const [isOpen, setIsOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (trashItems.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                <Trash2 className="w-4 h-4 text-rose-500" />
                Trash ({trashItems.length})
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
              {trashItems.map(item => {
                const elapsed = now - item.deletedAt;
                const remaining = Math.max(0, 5 * 60 * 1000 - elapsed);
                const mins = Math.floor(remaining / 60000);
                const secs = Math.floor((remaining % 60000) / 1000);
                
                return (
                  <div key={item.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl mb-2 last:mb-0 border border-neutral-100 dark:border-neutral-800">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate pr-2" title={item.name}>
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono text-rose-500 bg-rose-100 dark:bg-rose-900/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mins}:{secs.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => restoreItem(item.id)} className="flex-1 py-1.5 px-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[10px] font-bold text-neutral-600 dark:text-neutral-300 hover:text-blue-500 hover:border-blue-500 transition-colors flex items-center justify-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Restore
                      </button>
                      <button onClick={() => permanentlyDelete(item.id)} className="flex-1 py-1.5 px-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900 rounded-lg text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors">
                        Delete Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center relative"
      >
        <Trash2 className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900">
          {trashItems.length}
        </span>
      </button>
    </div>
  );
}
