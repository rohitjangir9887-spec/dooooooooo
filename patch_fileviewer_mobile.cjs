const fs = require('fs');
let code = fs.readFileSync('src/components/FileViewer.tsx', 'utf8');

// We'll replace the entire toolbar div.
// Find the toolbar starting from "<div className="flex items-center gap-1 shrink-0">"
// and ending at its matching "</div>"

const searchStart = '<div className="flex items-center gap-1 shrink-0">';
const searchEndStr = '</div>\n      </div>';
const startIndex = code.indexOf(searchStart);
const endIndex = code.indexOf(searchEndStr, startIndex);
if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `
        <div className="flex items-center gap-1 shrink-0">
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
            <a href={\`https://raw.githubusercontent.com/\${owner}/\${repo}/\${branch}/\${file.path}\`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors" title="Open Raw Source">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <div className="md:hidden flex items-center gap-1 relative">
            <MobileMenu 
              onCopyPath={() => smartCopy(file.path, { filenameFallback: 'path.txt' })}
              onCopyContent={handleCopy}
              onDownload={handleDownload}
              rawUrl={\`https://raw.githubusercontent.com/\${owner}/\${repo}/\${branch}/\${file.path}\`}
            />
          </div>

          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 text-neutral-500 transition-colors ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
`;
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
}

// Add MobileMenu component at the top
const importsMatch = code.match(/import \{ [^}]* \} from 'lucide-react';/);
if (importsMatch) {
  let newImports = importsMatch[0].replace('}', ', MoreVertical, Menu }');
  code = code.replace(importsMatch[0], newImports);
}

const componentDef = `
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
`;

code = code.replace('export function FileViewer', componentDef + '\nexport function FileViewer');

fs.writeFileSync('src/components/FileViewer.tsx', code);
