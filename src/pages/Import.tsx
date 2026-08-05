import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { Upload, Download, Github, FolderDown, FileArchive, Search, FileDiff, CheckCircle2, AlertCircle } from 'lucide-react';
import { ImportManager } from '../components/ImportManager';
import { AuthGuard } from '../components/AuthGuard';

export default function Import() {
  return (
    <AuthGuard>
      <div className="flex-1 min-h-screen pt-20 pb-28 flex flex-col items-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white dark:bg-neutral-900 border border-neutral-200/40 dark:border-neutral-800/40 rounded-2xl shadow-sm flex items-center justify-center shrink-0">
              <Upload className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Workspace Imports</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Import ZIP files or clone repositories directly into your GitHub repos.</p>
            </div>
          </div>

          <ImportManager />
        </motion.div>
      </div>
    </AuthGuard>
  );
}
