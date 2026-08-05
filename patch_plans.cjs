const fs = require('fs');
let code = fs.readFileSync('src/pages/Plans.tsx', 'utf8');

code = code.replace(
  'className="min-h-screen pt-24 bg-neutral-50 dark:bg-neutral-950 py-12 px-6"',
  'className="min-h-screen pt-20 pb-24 md:pt-24 bg-neutral-50 dark:bg-neutral-950 px-4 md:px-6 overflow-x-hidden"'
);
fs.writeFileSync('src/pages/Plans.tsx', code);
