const fs = require('fs');
const path = 'src/components/CopyFallbackModal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "import { triggerDownloadFallback, smartCopy } from '../lib/clipboard';",
  "import { triggerDownloadFallback, smartCopy } from '../lib/clipboard';\nimport { useAppStore } from '../store/useAppStore';"
);

code = code.replace(
  "setCopiedIndex(i);\n      setTimeout(() => setCopiedIndex(null), 2000);",
  "setCopiedIndex(i);\n      useAppStore.getState().addToast(`Copied Part ${i + 1} ✓`, 'success');\n      setTimeout(() => setCopiedIndex(null), 2000);"
);

fs.writeFileSync(path, code);
