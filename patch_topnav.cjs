const fs = require('fs');
let code = fs.readFileSync('src/components/TopNavigation.tsx', 'utf8');

code = code.replace(
  'className="text-sm font-medium text-neutral-600',
  'className="hidden md:block text-sm font-medium text-neutral-600'
);

fs.writeFileSync('src/components/TopNavigation.tsx', code);
