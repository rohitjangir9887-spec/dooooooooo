const fs = require('fs');
let code = fs.readFileSync('src/pages/Explorer.tsx', 'utf8');

code = code.replace(
  'className="h-screen pt-16 flex flex-col overflow-hidden bg-white dark:bg-neutral-950"',
  'className="h-screen pt-16 pb-16 md:pb-0 flex flex-col overflow-hidden bg-white dark:bg-neutral-950"'
);

fs.writeFileSync('src/pages/Explorer.tsx', code);
