import { useState, useEffect, useRef } from 'react';
import Editor, { DiffEditor, useMonaco } from '@monaco-editor/react';
import { GitTreeItem, fetchFileContent, commitFile, fetchFileBlob } from '../lib/github';
import { useAppStore } from '../store/useAppStore';
import { encode } from 'js-base64';
import { 
  X, Download, Copy, ExternalLink, Code2, AlertCircle, Maximize, Minimize,
  TerminalSquare, MoreVertical, Edit2, Save
} from 'lucide-react';
import { motion } from 'motion/react';
import { smartCopy } from '../lib/clipboard';

interface FileViewerProps {
  file: GitTreeItem;
  owner: string;
  repo: string;
  branch: string;
  onClose: () => void;
}

const getLanguage = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    java: 'java',
    kt: 'kotlin',
    go: 'go',
    rs: 'rust',
    cpp: 'cpp', c: 'c', h: 'cpp', hpp: 'cpp',
    cs: 'csharp',
    html: 'html',
    css: 'css', scss: 'scss', sass: 'scss', less: 'less',
    json: 'json',
    md: 'markdown',
    yml: 'yaml', yaml: 'yaml',
    xml: 'xml',
    sql: 'sql',
    sh: 'shell', bash: 'shell'
  };
  return map[ext || ''] || 'plaintext';
};


function MobileMenu({ onCopyPath, onCopyContent, onDownload, rawUrl }: any) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-xl py-1 z-50">
            <button onClick={() => { setIsOpen(false); onCopyPath(); }} className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Copy className="w-4 h-4" /> Copy Path
            </button>
            <button onClick={() => { setIsOpen(false); onCopyContent(); }} className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Code2 className="w-4 h-4" /> Copy Content
            </button>
            <button onClick={() => { setIsOpen(false); onDownload(); }} className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Download className="w-4 h-4" /> Download
            </button>
            <a href={rawUrl} target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)} className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ExternalLink className="w-4 h-4" /> Open Raw
            </a>
          </div>
        </>
      )}
    </>
  );
}

export function FileViewer({ file, owner, repo, branch, onClose }: FileViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  
  const settings = useAppStore((state) => state.settings);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const addToast = useAppStore((state) => state.addToast);
  
  const language = getLanguage(file.path);
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'].includes(file.path.split('.').pop()?.toLowerCase() || '');
  
  useEffect(() => {
    let isMounted = true;
    
    if (isImage) {
      if (isAuthenticated) {
        setIsLoading(true);
        fetchFileBlob(owner, repo, file.path, branch).then(blob => {
          if (isMounted) {
            setContent(blob);
            setIsLoading(false);
          }
        }).catch(err => {
          if (isMounted) {
            // fallback
            setContent(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`);
            setIsLoading(false);
          }
        });
      } else {
        setContent(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`);
        setIsLoading(false);
      }
      return;
    }

    const loadContent = async () => {
      setIsLoading(true);
      setError("");
      try {
        const text = await fetchFileContent(owner, repo, file.path, branch);
        if (isMounted) {
          setContent(text);
          setEditContent(text);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    loadContent();
    return () => { isMounted = false; };
  }, [file, owner, repo, branch, isImage]);

  const handleSave = async () => {
    if (!isAuthenticated) {
       addToast("You must be logged in to save changes.", "error");
       return;
    }
    
    const message = prompt("Commit message:", `Update ${file.path}`);
    if (message === null) return;
    
    setIsSaving(true);
    try {
      await commitFile(owner, repo, file.path, branch, encode(editContent), message, file.sha);
      addToast("File saved successfully to GitHub!", "success");
      setContent(editContent);
      setIsEditing(false);
    } catch (err: any) {
      addToast(err.message || "Failed to save file", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (content && !isImage) {
      const mini = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('#')).join('\n');
      smartCopy(content, { filenameFallback: file.path, minified: mini, structure: file.path });
    }
  };

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const githubUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${file.path}`;

  return (
    <div className={`flex flex-col bg-white dark:bg-neutral-950 ${isFullscreen ? 'fixed inset-0 z-[60]' : 'h-full'}`}>
      {/* File Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 shrink-0">
        <div className="flex items-center gap-2 truncate pr-4">
          <TerminalSquare className="w-4 h-4 text-neutral-400 shrink-0" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
            {file.path}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 shrink-0 hidden md:inline-block">
            {isImage ? 'image' : language}
          </span>
          {file.size !== undefined && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0 hidden md:inline-block">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          )}
          {content && !isImage && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0 hidden md:inline-block">
              {content.split('\n').length} lines
            </span>
          )}
        </div>
        
        
        <div className="flex items-center gap-1 shrink-0">
          {isAuthenticated && !isImage && (
            isEditing ? (
              <>
                <button 
                  onClick={() => setShowDiff(!showDiff)} 
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition-colors mr-1" 
                  title="Toggle Diff"
                >
                  {showDiff ? 'Hide Diff' : 'Show Diff'}
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving || content === editContent}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs transition-colors disabled:opacity-50 mr-2" 
                  title="Save Changes"
                >
                  {isSaving ? <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition-colors mr-2" 
                title="Edit File"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )
          )}
          
          <div className="hidden md:flex items-center gap-1">
            <button onClick={() => smartCopy(file.path, { filenameFallback: 'path.txt' })} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors" title="Copy File Path">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={handleCopy} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors flex items-center gap-1" title="Copy Content">
              <Code2 className="w-4 h-4" />
            </button>
            <button onClick={handleDownload} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors" title="Download File">
              <Download className="w-4 h-4" />
            </button>
            <a href={`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors" title="Open Raw Source">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <div className="md:hidden flex items-center gap-1 relative">
            <MobileMenu 
              onCopyPath={() => smartCopy(file.path, { filenameFallback: 'path.txt' })}
              onCopyContent={handleCopy}
              onDownload={handleDownload}
              rawUrl={`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`}
            />
          </div>

          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 text-neutral-500 transition-colors ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative bg-[#fffffe] dark:bg-[#1e1e1e]">
        {isLoading && (
           <div className="absolute inset-0 p-8 space-y-6 z-10 bg-[#fffffe] dark:bg-[#1e1e1e]">
              {[...Array(15)].map((_, i) => (
                 <div key={i} className="flex items-center gap-6">
                    <div className="w-8 h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    <div className={`h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse ${
                       i % 3 === 0 ? 'w-2/3' : i % 2 === 0 ? 'w-1/2' : 'w-3/4'
                    }`} />
                 </div>
              ))}
           </div>
        )}

        {error && (
           <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-red-500 bg-white dark:bg-neutral-950">
             <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
             <p>{error}</p>
           </div>
        )}

        {!isLoading && !error && content !== null && (
          isImage ? (
            <div className="w-full h-full flex items-center justify-center p-8 overflow-auto bg-neutral-100 dark:bg-neutral-900 pattern-checkerboard">
              <img src={content} alt={file.path} className="max-w-full max-h-full object-contain shadow-lg border border-neutral-200 dark:border-neutral-800" />
            </div>
          ) : showDiff && isEditing ? (
              <DiffEditor
                height="100%"
                language={language}
                theme={settings.darkMode ? "vs-dark" : "light"}
                original={content || ''}
                modified={editContent}
                options={{
                  readOnly: true,
                  minimap: { enabled: true },
                  fontSize: settings.editorFontSize,
                  wordWrap: settings.wrapLines ? "on" : "off",
                  lineNumbers: settings.showLineNumbers ? "on" : "off",
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  padding: { top: 16, bottom: 16 },
                  renderWhitespace: "selection",
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                }}
                loading={<div />}
              />
            ) : (
              <Editor
              height="100%"
              language={language}
              theme={settings.darkMode ? "vs-dark" : "light"}
              value={isEditing ? editContent : content}
              onChange={(value) => {
                if (isEditing && value !== undefined) {
                  setEditContent(value);
                }
              }}
              options={{
                readOnly: !isEditing,
                minimap: { enabled: true },
                fontSize: settings.editorFontSize,
                wordWrap: settings.wrapLines ? "on" : "off",
                lineNumbers: settings.showLineNumbers ? "on" : "off",
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                padding: { top: 16, bottom: 16 },
                renderWhitespace: "selection",
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              }}
              loading={<div />}
            />
          )
        )}
      </div>
    </div>
  );
}
