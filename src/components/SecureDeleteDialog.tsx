import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useSecureDeleteStore } from '../store/useSecureDeleteStore';

export default function SecureDeleteDialog() {
  const { isDialogOpen, pendingItemName, confirmDelete, cancelDelete } = useSecureDeleteStore();
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isDialogOpen) {
      const n1 = Math.floor(Math.random() * 10) + 1;
      const n2 = Math.floor(Math.random() * 10) + 1;
      setNum1(n1);
      setNum2(n2);
      setAnswer('');
      setError(false);
      console.log(`[SecureDeleteService] CAPTCHA Generated: ${n1} + ${n2}`);
    }
  }, [isDialogOpen]);

  if (!isDialogOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(answer) === num1 + num2) {
      confirmDelete();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3 text-rose-500">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Secure Delete</h2>
          </div>
          <button onClick={cancelDelete} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          Are you sure you want to delete <strong className="text-neutral-900 dark:text-white">{pendingItemName}</strong>? This action will move the item to the Trash for 5 minutes before permanent deletion.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider">
              Math CAPTCHA Verification
            </label>
            <div className="flex items-center gap-3">
              <span className="text-lg font-mono font-bold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                {num1} + {num2} =
              </span>
              <input
                type="number"
                value={answer}
                onChange={(e) => { setAnswer(e.target.value); setError(false); }}
                className={`flex-1 bg-white dark:bg-neutral-900 border ${error ? 'border-rose-500' : 'border-neutral-200 dark:border-neutral-800'} rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono`}
                placeholder="?"
                autoFocus
                required
              />
            </div>
            {error && <p className="text-rose-500 text-xs mt-2">Incorrect answer. Please try again.</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={cancelDelete}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!answer}
              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Move to Trash
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
