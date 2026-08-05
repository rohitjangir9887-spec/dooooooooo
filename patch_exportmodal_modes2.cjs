const fs = require('fs');
const path = 'src/components/ExportModal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const { settings, updateSettings, userProfile } = useAppStore();",
  "const { settings, updateSettings, userProfile, addToast } = useAppStore();"
);

code = code.replace(
  "alert('Minified copy requires Pro plan')",
  "addToast('Minified copy requires Pro plan or higher', 'error')"
);
code = code.replace(
  "alert('Chunked copy requires Pro plan')",
  "addToast('Chunked copy requires Pro plan or higher', 'error')"
);

fs.writeFileSync(path, code);
