const fs = require('fs');
let code = fs.readFileSync('src/pages/Explorer.tsx', 'utf8');

// 1. Sidebar sizing for mobile
code = code.replace(
  'className="w-80 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 flex flex-col z-10"',
  'className="w-full md:w-80 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 flex flex-col z-10 absolute md:relative h-full"'
);

// 2. Hide content area on mobile if sidebar is open and no file is selected, or let sidebar cover it.
// If it's absolute w-full on mobile, it covers the content. So that's perfect.

// But we need to ensure the sidebar hides when a file is selected on mobile.
// Wait, we can use an effect to close sidebar on small screens when a file is selected.
// However, it's easier to just handle it with CSS: the sidebar covers everything on mobile if open.

fs.writeFileSync('src/pages/Explorer.tsx', code);
