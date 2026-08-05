const fs = require('fs');
let code = fs.readFileSync('src/pages/Explorer.tsx', 'utf8');

// Inside useEffect for pathParam:
const target = 'if (pathParam) {';
const replacement = 'if (pathParam) {\n        if (window.innerWidth < 768) setIsSidebarOpen(false);';
code = code.replace(target, replacement);

fs.writeFileSync('src/pages/Explorer.tsx', code);
