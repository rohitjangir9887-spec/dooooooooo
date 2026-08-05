const fs = require('fs');
const path = 'src/pages/Explorer.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '<Settings className="w-8 h-8" />',
  '<AlertCircle className="w-8 h-8" />'
);

fs.writeFileSync(path, code);
