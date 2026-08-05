const fs = require('fs');
const path = 'src/components/FileViewer.tsx';
let code = fs.readFileSync(path, 'utf8');

const formatNumber = (num) => {
  if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num > 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

code = code.replace(
  '<button onClick={handleCopy} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors" title="Copy Content">',
  '{content && <span className="text-xs text-neutral-400 font-medium">{content.length > 1000000 ? (content.length/1000000).toFixed(1) + "M" : content.length > 1000 ? (content.length/1000).toFixed(1) + "K" : content.length} chars</span>}\n          <button onClick={handleCopy} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors flex items-center gap-1" title="Copy Content">'
);

fs.writeFileSync(path, code);
