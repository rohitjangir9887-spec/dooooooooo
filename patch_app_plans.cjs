const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("import Plans from './pages/Plans';")) {
  code = code.replace(
    "import Settings from './pages/Settings';",
    "import Settings from './pages/Settings';\nimport Plans from './pages/Plans';"
  );
}

if (!code.includes('<Route path="/plans" element={<Plans />} />')) {
  code = code.replace(
    '<Route path="/settings" element={<Settings />} />',
    '<Route path="/settings" element={<Settings />} />\n          <Route path="/plans" element={<Plans />} />'
  );
}

fs.writeFileSync(path, code);
