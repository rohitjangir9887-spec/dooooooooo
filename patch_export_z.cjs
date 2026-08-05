const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

code = code.replace(
  /z-50/g,
  "z-[60]"
);

fs.writeFileSync('src/components/ExportModal.tsx', code);
