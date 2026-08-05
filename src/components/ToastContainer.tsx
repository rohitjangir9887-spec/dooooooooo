import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border bg-white dark:bg-neutral-800 ${
              toast.type === 'success' ? 'border-green-200 dark:border-green-900/30' :
              toast.type === 'error' ? 'border-red-200 dark:border-red-900/30' :
              'border-blue-200 dark:border-blue-900/30'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {toast.message}
            </p>
            <button onClick={() => removeToast(toast.id)} className="ml-2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors text-neutral-400">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
