const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the imports
code = code.replace(
  'import Home from "./pages/Home";\nimport Explorer from "./pages/Explorer";\nimport Settings from "./pages/Settings";\nimport Plans from "./pages/Plans";',
  'import { AnimatedRoutes } from "./AnimatedRoutes";'
);

// Replace the Routes block
const routesRegex = /<Routes>[\s\S]*?<\/Routes>/;
code = code.replace(routesRegex, '<AnimatedRoutes />');

fs.writeFileSync('src/App.tsx', code);
