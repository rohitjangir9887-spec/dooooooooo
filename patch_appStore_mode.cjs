const fs = require('fs');
const path = 'src/store/useAppStore.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "autoExpandTree: boolean;",
  "autoExpandTree: boolean;\n  exportMode: 'full' | 'minified' | 'chunked' | 'structure';"
);

code = code.replace(
  "autoExpandTree: false,",
  "autoExpandTree: false,\n        exportMode: 'full',"
);

fs.writeFileSync(path, code);
