import { useState, useEffect } from 'react';
import { X, Download, FileText, Check, Settings2, FileArchive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerDownloadFallback, smartCopy } from '../lib/clipboard';
import { useAppStore } from '../store/useAppStore';

export interface FallbackData {
  text: string;
  filename: string;
  minified?: string;
  structure?: string;
}

interface Props {
  data: FallbackData | null;
  onClose: () => void;
}

export function CopyFallbackModal({ data, onClose }: Props) {
  const [chunks, setChunks] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  useEffect(() => {
    if (data) {
      const chunkLimit = 40000;
      const result: string[] = [];
      let current = 0;
      while (current < data.text.length) {
        result.push(data.text.substring(current, current + chunkLimit));
        current += chunkLimit;
      }
      setChunks(result);
    }
  }, [data]);

  if (!data) return null;

  const handleCopyChunk = async (chunk: string, i: number) => {
    try {
      await navigator.clipboard.writeText(chunk);
      setCopiedIndex(i);
      useAppStore.getState().addToast(`Copied Part ${i + 1} ✓`, 'success');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (e) {
      // Very unlikely to fail if chunk is small
      triggerDownloadFallback(chunk, data.filename.replace('.txt', `-part${i+1}.txt`));
    }
  };

  const handleDownload = () => {
    triggerDownloadFallback(data.text, data.filename);
  };

  const handleCopySpecial = async (type: 'minified' | 'structure') => {
    const txt = type === 'minified' ? data.minified : data.structure;
    if (txt) {
      await smartCopy(txt, { filenameFallback: data.filename.replace('.txt', `-${type}.txt`) });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg text-yellow-600 dark:text-yellow-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Clipboard Limit Exceeded</h2>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Content is too large to copy directly ({data.text.length.toLocaleString()} chars). Choose a fallback option.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-6 overflow-auto max-h-[60vh]">
          
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-neutral-500">Quick Alternatives</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-sm font-medium hover:scale-105 transition-all shadow-sm">
                <Download className="w-4 h-4" /> Download Full File
              </button>
              {data.minified && (
                <button onClick={() => handleCopySpecial('minified')} className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                   Copy Minified
                </button>
              )}
              {data.structure && (
                <button onClick={() => handleCopySpecial('structure')} className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                   Copy Structure Only
                </button>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-neutral-500">Chunked Copy ({chunks.length} Parts)</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {chunks.map((chunk, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <span className="text-sm font-medium">Part {i + 1} of {chunks.length}</span>
                  <span className="text-xs text-neutral-500 mx-2">{Math.round(chunk.length / 4).toLocaleString()} tokens</span>
                  <button onClick={() => handleCopyChunk(chunk, i)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md font-medium transition-colors">
                    {copiedIndex === i ? <Check className="w-4 h-4" /> : null}
                    {copiedIndex === i ? 'Copied' : `Copy Part ${i + 1}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
