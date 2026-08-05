const fs = require('fs');
const path = 'src/pages/Home.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'Github Explorer',
  'Ram Repo'
);

code = code.replace(
  'GitHub Explorer',
  'Ram Repo'
);

code = code.replace(
  'GitHub repository explorer',
  'GitHub Open Source Repository Explorer'
);

fs.writeFileSync(path, code);
