const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'import { ActiveJobModal } from "./components/ActiveJobModal";',
  ''
);

code = code.replace(
  '<ActiveJobModal />',
  ''
);

fs.writeFileSync('src/App.tsx', code);
