const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'import { BackgroundTasksWidget } from "./components/BackgroundTasksWidget";',
  'import { BackgroundTasksWidget } from "./components/BackgroundTasksWidget";\nimport { ToastContainer } from "./components/ToastContainer";'
);

code = code.replace(
  '        <BackgroundTasksWidget />',
  '        <BackgroundTasksWidget />\n        <ToastContainer />'
);

fs.writeFileSync(path, code);
