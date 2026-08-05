const fs = require('fs');
let code = fs.readFileSync('src/components/TopNavigation.tsx', 'utf8');

code = code.replace(
  /<div className="fixed top-0 left-0 w-full z-40 h-16 px-4 bg-transparent pointer-events-none flex justify-between items-center">\s*<div className="relative pointer-events-auto">/g,
  `<header className="fixed top-0 left-0 w-full h-16 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4">
    <div className="flex items-center gap-4">
      <div className="relative">`
);

fs.writeFileSync('src/components/TopNavigation.tsx', code);
