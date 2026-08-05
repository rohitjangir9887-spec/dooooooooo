const fs = require('fs');
let code = fs.readFileSync('src/pages/Explorer.tsx', 'utf8');

const target2 = 'setSelectedFile(null);\n      }';
const replacement2 = 'setSelectedFile(null);\n        if (window.innerWidth < 768) setIsSidebarOpen(true);\n      }';
code = code.replace(target2, replacement2);

fs.writeFileSync('src/pages/Explorer.tsx', code);
