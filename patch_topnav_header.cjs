const fs = require('fs');
let code = fs.readFileSync('src/components/TopNavigation.tsx', 'utf8');

code = code.replace(
  /<div className="fixed top-0 left-0 w-full z-40 p-4 pointer-events-none flex justify-between items-start">[\s\S]*?<div className="relative pointer-events-auto">/g,
  `<header className="fixed top-0 left-0 w-full h-16 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4">
    <div className="flex items-center gap-4">
      <div className="relative">`
);

code = code.replace(
  '        </div>\n      </div>\n\n      <AnimatePresence>',
  `        </div>
      </div>
      
      {location.pathname !== '/' && (
        <button onClick={() => navigate('/')} className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
          Home
        </button>
      )}
    </header>

    <AnimatePresence>`
);

// We need to fix the import of Settings because we used `import { Settings } from 'lucide-react'` which conflicts with the route if we used it, but here it's just the icon.

fs.writeFileSync('src/components/TopNavigation.tsx', code);
