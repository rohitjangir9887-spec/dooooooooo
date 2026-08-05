const fs = require('fs');
let code = fs.readFileSync('src/pages/Explorer.tsx', 'utf8');

code = code.replace(
  /<button\s+onClick=\{\(\) => navigate\('\/'\)\}\s+className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"\s+>\s+<ArrowLeft className="w-5 h-5" \/>\s+<\/button>/,
  ""
);

fs.writeFileSync('src/pages/Explorer.tsx', code);
