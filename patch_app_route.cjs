const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("import Settings from './pages/Settings';")) {
  code = code.replace(
    "import Explorer from './pages/Explorer';",
    "import Explorer from './pages/Explorer';\nimport Settings from './pages/Settings';"
  );
}

if (!code.includes("<Route path=\"/settings\" element={<Settings />} />")) {
  code = code.replace(
    '<Route path="/" element={<Home />} />',
    '<Route path="/" element={<Home />} />\n          <Route path="/settings" element={<Settings />} />'
  );
}

fs.writeFileSync(path, code);
