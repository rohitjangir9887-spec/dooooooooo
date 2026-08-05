const fs = require('fs');
const path = 'src/components/ExportModal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "import localforage from 'localforage';",
  "import localforage from 'localforage';\nimport { smartCopy } from '../lib/clipboard';"
);

const handleCopyOld = `  const handleCopy = async (textToCopy?: string) => {
    let final = textToCopy || '';
    if (!textToCopy) {
      if (exportMode === 'structure') {
        final = files.map(f => f.path).join('\\n');
      } else {
        if (charCount > 2000000) {
          alert("Content too large. Please use 'Download File' or 'Chunked Copy'.");
          return;
        }
        for (const file of files) {
          const content = await localforage.getItem<string>(\`export:\${owner}/\${repo}:\${file.path}\`);
          if (content) {
            let processed = content;
            if (exportMode === 'minified') {
              processed = content.split('\\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('#')).join('\\n');
            }
            final += \`\\n--- \${file.path} ---\\n\${processed}\`;
          }
        }
      }
    }
    
    try {
      await navigator.clipboard.writeText(final);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert("Failed to copy. It might be too large.");
    }
  };`;

const handleCopyNew = `  const handleCopy = async (textToCopy?: string) => {
    let final = textToCopy || '';
    let minified = '';
    let structure = files.map(f => f.path).join('\\n');
    
    if (!textToCopy) {
      if (exportMode === 'structure') {
        final = structure;
      } else {
        for (const file of files) {
          const content = await localforage.getItem<string>(\`export:\${owner}/\${repo}:\${file.path}\`);
          if (content) {
            let processed = content;
            let mini = content.split('\\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('#')).join('\\n');
            if (exportMode === 'minified') {
              processed = mini;
            }
            final += \`\\n--- \${file.path} ---\\n\${processed}\`;
            minified += \`\\n--- \${file.path} ---\\n\${mini}\`;
          }
        }
      }
    }
    
    await smartCopy(final, {
      filenameFallback: \`\${owner}-\${repo}-export.txt\`,
      minified: minified || undefined,
      structure: structure
    });
  };`;

code = code.replace(handleCopyOld, handleCopyNew);

const warningOld = `{charCount > 1_000_000 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        ⚠️ This is a large export. Direct copy may fail or freeze the browser. Recommended to use <strong>Chunked Copy</strong> or <strong>Download File</strong>.
                      </p>
                    )}`;
const warningNew = `{charCount > 500_000 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                        ⚠️ <span>This is a large export. Direct copy will be attempted, but may fall back to download or chunking if it exceeds clipboard limits.</span>
                      </p>
                    )}`;

code = code.replace(warningOld, warningNew);

fs.writeFileSync(path, code);
