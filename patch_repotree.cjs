const fs = require('fs');
let code = fs.readFileSync('src/components/RepoTree.tsx', 'utf8');

// The hover class for tree items is typically 'hover:bg-neutral-200 dark:hover:bg-neutral-800'
code = code.replace(
  /hover:bg-neutral-200/g,
  'hover:bg-neutral-200/60'
);
code = code.replace(
  /dark:hover:bg-neutral-800/g,
  'dark:hover:bg-neutral-800/60'
);
// Make the selected state prettier
code = code.replace(
  /bg-blue-100 dark:bg-blue-900\/30 text-blue-600 dark:text-blue-400/g,
  'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
);

fs.writeFileSync('src/components/RepoTree.tsx', code);
