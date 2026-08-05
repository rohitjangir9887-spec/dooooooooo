import { useState, useEffect, useRef, useMemo } from 'react';
import { GitTreeItem } from '../lib/github';
import { X, Copy, Download, FileArchive, Search, Settings2, FileText, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import streamSaver from 'streamsaver';
import localforage from 'localforage';
import { smartCopy } from '../lib/clipboard';
import { useAppStore } from '../store/useAppStore';

localforage.config({ name: 'github-explorer', storeName: 'exports' });

interface ExportModalProps {
  taskId: string;
  owner: string;
  repo: string;
  branch: string;
  files: GitTreeItem[];
  onClose: () => void;
}

export function ExportModal({ taskId, owner, repo, branch, files, onClose }: ExportModalProps) {
  const { settings, updateSettings } = useAppStore();
  const exportMode = settings.exportMode || 'full';
  
  const [copied, setCopied] = useState(false);
  const [chunks, setChunks] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'export'>('export');
  
  const [tokenCount, setTokenCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const exportFiles = useMemo(() => {
    if (exportMode === 'ui-only') {
      return files.filter(f => {
        const lowerPath = f.path.toLowerCase();
        
        // 1. Exclude backend, test, database, and lock files
        const isExcluded = 
          /(^|\/)(api|backend|server|tests|__tests__|database|db|auth|scripts|node_modules|\.git|\.github)(\/|$)/.test(lowerPath) ||
          /(^|\/)(dockerfile|docker-compose.*|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?)$/.test(lowerPath) ||
          /\.(test|spec)\.[a-z]+$/.test(lowerPath) ||
          /(^|\/)server\.(js|ts|mjs|cjs)x?$/.test(lowerPath);

        if (isExcluded) return false;

        // 2. Include known UI extensions
        if (/\.(html|css|scss|sass|less|tsx|jsx|vue|svelte|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$/.test(lowerPath)) {
          return true;
        }

        // 3. Include UI configuration files
        if (
          /(^|\/)(tailwind\.config|postcss\.config|vite\.config|next\.config|nuxt\.config|svelte\.config|webpack\.config)\.(js|cjs|mjs|ts)$/.test(lowerPath) ||
          /(^|\/)(package\.json|tsconfig\.json|jsconfig\.json|\.eslintrc.*|\.prettierrc.*)$/.test(lowerPath)
        ) {
          return true;
        }

        // 4. Include common UI directories
        if (/(^|\/)(src|app|pages|components|layouts|themes|styles|public|assets|ui|views|hooks|context|utils|lib)(\/|$)/.test(lowerPath)) {
          return true;
        }

        // 5. If it's a JS/TS file at root, or not caught by exclusions, include it as potential UI logic
        if (lowerPath.endsWith('.js') || lowerPath.endsWith('.ts') || lowerPath.endsWith('.mjs') || lowerPath.endsWith('.cjs')) {
          return true; 
        }

        return false;
      });
    }
    return files;
  }, [files, exportMode]);
  
  // We calculate stats here when modal opens
  useEffect(() => {
    let chars = 0;
    const compute = async () => {
      let isStructureOnly = exportMode === 'structure';
      let fullText = '';
      if (isStructureOnly) {
        fullText = exportFiles.map(f => f.path).join('\n');
        chars = fullText.length;
      } else {
        for (const f of exportFiles) {
          const content = await localforage.getItem<string>(`export:${owner}/${repo}:${f.path}`);
          if (content) {
            chars += content.length;
          }
        }
      }
      setCharCount(chars);
      setTokenCount(Math.round(chars / 4)); // rough estimation
    };
    compute();
  }, [exportMode, exportFiles, owner, repo]);

  // If chunked mode, we need to prepare chunks when requested
  const prepareChunks = async () => {
    const chunkLimit = 40000; // ~10k tokens
    const result: string[] = [];
    let currentChunk = '';
    
    for (const file of exportFiles) {
      const content = await localforage.getItem<string>(`export:${owner}/${repo}:${file.path}`);
      if (!content) continue;
      
      const fileText = `\n\n--- FILE: ${file.path} ---\n\n${content}`;
      if (currentChunk.length + fileText.length > chunkLimit && currentChunk.length > 0) {
        result.push(currentChunk);
        currentChunk = fileText;
      } else {
        currentChunk += fileText;
      }
    }
    if (currentChunk) result.push(currentChunk);
    setChunks(result);
  };

  useEffect(() => {
    if (exportMode === 'chunked') {
      prepareChunks();
    }
  }, [exportMode]);

  const handleCopy = async (textToCopy?: string) => {
    let final = textToCopy || '';
    let minified = '';
    let structure = exportFiles.map(f => f.path).join('\n');
    
    if (!textToCopy) {
      if (exportMode === 'structure') {
        final = structure;
      } else {
        for (const file of exportFiles) {
          const content = await localforage.getItem<string>(`export:${owner}/${repo}:${file.path}`);
          if (content) {
            let processed = content;
            let mini = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('#')).join('\n');
            if (exportMode === 'minified') {
              processed = mini;
            }
            final += `\n--- ${file.path} ---\n${processed}`;
            minified += `\n--- ${file.path} ---\n${mini}`;
          }
        }
      }
    }
    
    await smartCopy(final, {
      filenameFallback: `${owner}-${repo}-export.txt`,
      minified: minified || undefined,
      structure: structure
    });
  };

  const handleDownloadFile = async (format: 'txt' | 'md') => {
    const filename = `${owner}-${repo}-export.${format}`;
    const fileStream = streamSaver.createWriteStream(filename);
    const writer = fileStream.getWriter();
    
    try {
      if (exportMode === 'structure') {
        await writer.write(new TextEncoder().encode(exportFiles.map(f => f.path).join('\n')));
      } else {
        for (const file of exportFiles) {
          const content = await localforage.getItem<string>(`export:${owner}/${repo}:${file.path}`);
          if (content) {
            let processed = content;
            if (exportMode === 'minified') {
              processed = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('#')).join('\n');
            }
            let chunk = '';
            if (format === 'md') {
              const ext = file.path.split('.').pop() || '';
              chunk = `\n## \`${file.path}\`\n\n\`\`\`${ext}\n${processed}\n\`\`\`\n\n`;
            } else {
              chunk = `\n==================================================\nFILE: ${file.path}\n==================================================\n\n${processed}\n\n`;
            }
            await writer.write(new TextEncoder().encode(chunk));
          }
        }
      }
    } finally {
      writer.close();
    }
  };

  const requestDownloadZip = async () => {
    const worker = new Worker(new URL('../workers/exportWorker.ts', import.meta.url), { type: 'module' });
    const filename = `${owner}-${repo}-source.zip`;
    const fileStream = streamSaver.createWriteStream(filename);
    const writer = fileStream.getWriter();
    const channel = new MessageChannel();
    
    channel.port1.onmessage = async (e) => {
      if (e.data === 'DONE') {
        writer.close();
        channel.port1.close();
        worker.terminate();
      } else {
        await writer.write(e.data);
      }
    };
    worker.postMessage({ type: 'DOWNLOAD_ZIP', payload: { owner, repo, files: exportFiles, port: channel.port2 } }, [channel.port2]);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50 dark:bg-neutral-900/50">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Smart Export</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {owner} / {repo}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-neutral-200 dark:bg-neutral-800 rounded-lg p-1">
              <button onClick={() => setActiveTab('export')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'export' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>Export</button>
              <button onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'preview' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>Preview</button>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col relative">
          {activeTab === 'export' ? (
            <div className="p-8 flex-1 overflow-auto">
              <div className="max-w-3xl mx-auto space-y-8">
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-start gap-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Export Size Estimate</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                      ~{charCount.toLocaleString()} characters ({tokenCount.toLocaleString()} tokens)
                    </p>
                    {charCount > 500_000 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                        ⚠️ <span>This is a large export. Direct copy will be attempted, but may fall back to download or chunking if it exceeds clipboard limits.</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-4">Select Export Mode</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ModeCard 
                      id="full" title="Full Copy" desc="Complete, unmodified source code" 
                      active={exportMode === 'full'} onClick={() => updateSettings({ exportMode: 'full' })} 
                    />
                    <ModeCard 
                      id="minified" title="Minified Copy" desc="Strips comments and empty lines to save tokens" 
                      active={exportMode === 'minified'} onClick={() => updateSettings({ exportMode: 'minified' })} 
                    />
                    <ModeCard 
                      id="chunked" title="Chunked Copy" desc="Splits into smaller parts to fit AI context windows" 
                      active={exportMode === 'chunked'} onClick={() => updateSettings({ exportMode: 'chunked' })} 
                    />
                    <ModeCard 
                      id="structure" title="Structure Only" desc="Exports only the file tree path structure" 
                      active={exportMode === 'structure'} onClick={() => updateSettings({ exportMode: 'structure' })} 
                    />
                    <ModeCard 
                      id="ui-only" title="🎨 UI Only" desc="Exports only the complete frontend/UI code required to recreate the website design and user interface." 
                      active={exportMode === 'ui-only'} onClick={() => updateSettings({ exportMode: 'ui-only' })} 
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
                  <h3 className="font-semibold text-lg mb-4">Actions</h3>
                  
                  {exportMode === 'chunked' ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {chunks.map((chunk, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                          <span className="text-sm font-medium">Part {i + 1} of {chunks.length}</span>
                          <span className="text-xs text-neutral-500 mx-2">{Math.round(chunk.length / 4).toLocaleString()} tokens</span>
                          <button onClick={() => handleCopy(chunk)} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md font-medium transition-colors">
                            Copy Part {i + 1}
                          </button>
                        </div>
                      ))}
                      {chunks.length === 0 && <p className="text-sm text-neutral-500">Preparing chunks...</p>}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleCopy()} className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-sm">
                          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          {copied ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                        <span className="text-sm text-neutral-500 font-medium">{charCount > 1000000 ? (charCount / 1000000).toFixed(1) + 'M' : charCount > 1000 ? (charCount / 1000).toFixed(1) + 'K' : charCount} chars</span>
                      </div>
                      
                      <button onClick={() => handleDownloadFile('txt')} className="flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-sm">
                        <Download className="w-5 h-5" /> Download .txt
                      </button>

                      <button onClick={() => handleDownloadFile('md')} className="flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-sm">
                        <FileText className="w-5 h-5" /> Download .md
                      </button>
                      
                      <button onClick={requestDownloadZip} className="flex items-center gap-2 px-6 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium transition-all hover:scale-105 active:scale-95">
                        <FileArchive className="w-5 h-5" /> Download .zip
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 bg-[#fffffe] dark:bg-[#1e1e1e] p-4 text-sm font-mono whitespace-pre-wrap text-neutral-800 dark:text-neutral-300 selection:bg-blue-500/30 overflow-hidden">
               <ExportPreview files={exportFiles} owner={owner} repo={repo} />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ModeCard({ id, title, desc, active, onClick, disabled }: { id: string, title: string, desc: string, active: boolean, onClick: () => void, disabled?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
        active 
          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10' 
          : 'border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className={`font-medium ${active ? 'text-blue-700 dark:text-blue-400' : ''}`}>{title}</h4>
        {active && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />}
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{desc}</p>
    </div>
  );
}

function ExportPreview({ files, owner, repo }: { files: GitTreeItem[], owner: string, repo: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    const lowerQ = searchQuery.toLowerCase();
    return files.filter(f => f.path.toLowerCase().includes(lowerQ));
  }, [files, searchQuery]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredFiles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, 
    overscan: 5,
  });

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search files in preview..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>
      
      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <FilePreviewBlock 
                file={filteredFiles[virtualRow.index]} 
                owner={owner} 
                repo={repo} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilePreviewBlock({ file, owner, repo }: { file: GitTreeItem, owner: string, repo: string }) {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    localforage.getItem<string>(`export:${owner}/${repo}:${file.path}`).then(text => {
      if (!isMounted) return;
      if (text === null) {
        setContent('Binary or skipped file.');
      } else {
        if (text.length > 50000) {
          setContent(text.substring(0, 50000) + '\n\n... [File truncated for preview. Download to see full content.]');
        } else {
          setContent(text);
        }
      }
    });
    return () => { isMounted = false; };
  }, [file.path, owner, repo]);

  return (
    <div className="mb-6 p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-900/30">
      <div className="font-bold mb-4 text-blue-600 dark:text-blue-400">FILE: {file.path}</div>
      {content === null ? (
         <div className="space-y-2 opacity-50">
            <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="w-5/6 h-3 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="w-4/6 h-3 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
         </div>
      ) : (
         <div className="whitespace-pre-wrap font-mono text-xs overflow-hidden" style={{ maxHeight: '500px', overflowY: 'auto' }}>
           {content}
         </div>
      )}
    </div>
  );
}
