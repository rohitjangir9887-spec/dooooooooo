const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'import { ToastContainer } from "./components/ToastContainer";',
  'import { ToastContainer } from "./components/ToastContainer";\nimport { GlobalCopyModal } from "./components/GlobalCopyModal";'
);

code = code.replace(
  '        <ToastContainer />',
  '        <ToastContainer />\n        <GlobalCopyModal />'
);

fs.writeFileSync(path, code);
