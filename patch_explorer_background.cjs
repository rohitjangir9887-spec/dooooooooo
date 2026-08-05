const fs = require('fs');
const path = 'src/pages/Explorer.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "exportManager.startExport(owner!, repo!, repoInfo.default_branch, tree, () => {});",
  "exportManager.startExport(owner!, repo!, repoInfo.default_branch, tree, () => {});\n            if (!background) {\n              // In foreground, we could open the widget automatically. Since we don't have direct control of widget open state from here, we can add a toast telling them it's running.\n              addToast('Export started. Watch progress in the background widget.', 'info');\n            } else {\n              addToast('Export started in background.', 'info');\n            }"
);

fs.writeFileSync(path, code);
