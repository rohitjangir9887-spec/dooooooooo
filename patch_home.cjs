const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

code = code.replace(
  'className="min-h-screen pt-16 flex flex-col',
  'className="flex-1 min-h-[calc(100vh-4rem)] pt-16 pb-20 md:pb-6 flex flex-col'
);

fs.writeFileSync('src/pages/Home.tsx', code);
