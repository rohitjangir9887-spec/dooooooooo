const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("import Settings")) {
  code = code.replace(
    'import Explorer from "./pages/Explorer";',
    'import Explorer from "./pages/Explorer";\nimport Settings from "./pages/Settings";'
  );
}

if (!code.includes("import Plans")) {
  code = code.replace(
    'import Settings from "./pages/Settings";',
    'import Settings from "./pages/Settings";\nimport Plans from "./pages/Plans";'
  );
}

fs.writeFileSync(path, code);
