const fs = require('fs');
let code = fs.readFileSync('src/components/TopNavigation.tsx', 'utf8');

code = code.replace(
  '<header className="fixed top-0 left-0 w-full h-16 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4">',
  '<header className="fixed top-0 left-0 w-full h-16 z-50 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-between px-4 lg:px-8 transition-all duration-300 shadow-sm">'
);

fs.writeFileSync('src/components/TopNavigation.tsx', code);
