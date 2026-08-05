const fs = require('fs');
const path = 'src/components/ExportModal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const { settings, updateSettings } = useAppStore();",
  "const { settings, updateSettings, userProfile } = useAppStore();\n  const isFreePlan = userProfile.planId === 'free';"
);

code = code.replace(
  "active={exportMode === 'minified'} onClick={() => updateSettings({ exportMode: 'minified' })}",
  "active={exportMode === 'minified'} onClick={() => isFreePlan ? alert('Minified copy requires Pro plan') : updateSettings({ exportMode: 'minified' })}"
);
code = code.replace(
  "active={exportMode === 'chunked'} onClick={() => updateSettings({ exportMode: 'chunked' })}",
  "active={exportMode === 'chunked'} onClick={() => isFreePlan ? alert('Chunked copy requires Pro plan') : updateSettings({ exportMode: 'chunked' })}"
);

// We need a proper alert or UI indicator instead of native `alert` based on prompt rules: "Never use blocking alert() - only toasts/small modals"
// I will rewrite this part to use toasts instead of alert.

