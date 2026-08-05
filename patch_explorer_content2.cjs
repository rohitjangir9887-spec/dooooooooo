const fs = require('fs');
let code = fs.readFileSync('src/pages/Explorer.tsx', 'utf8');
code = code.replace(
  'className="h-full overflow-y-auto"\n              >\n                <RepoInfoView',
  'className="h-full flex flex-col"\n              >\n                <RepoInfoView'
);
fs.writeFileSync('src/pages/Explorer.tsx', code);
