const fs = require('fs');
let code = fs.readFileSync('src/components/FileViewer.tsx', 'utf8');

code = code.replace(
  /'fixed inset-0 z-50' : 'h-full'/g,
  "'fixed inset-0 z-[60]' : 'h-full'"
);

fs.writeFileSync('src/components/FileViewer.tsx', code);
