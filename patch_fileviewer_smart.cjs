const fs = require('fs');
const path = 'src/components/FileViewer.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "smartCopy(content, { filenameFallback: file.path });",
  "const mini = content.split('\\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('#')).join('\\n');\n      smartCopy(content, { filenameFallback: file.path, minified: mini, structure: file.path });"
);

fs.writeFileSync(path, code);
