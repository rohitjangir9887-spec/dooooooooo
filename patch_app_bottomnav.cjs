const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('BottomNavigation')) {
  code = code.replace(
    'import { TopNavigation } from "./components/TopNavigation";',
    'import { TopNavigation } from "./components/TopNavigation";\nimport { BottomNavigation } from "./components/BottomNavigation";'
  );

  code = code.replace(
    '<GlobalCopyModal />\n      </div>',
    '<GlobalCopyModal />\n        <BottomNavigation />\n      </div>'
  );

  code = code.replace(
    'className="min-h-screen bg-neutral-50',
    'className="min-h-screen pb-16 md:pb-0 bg-neutral-50'
  );

  fs.writeFileSync('src/App.tsx', code);
}
