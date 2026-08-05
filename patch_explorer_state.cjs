const fs = require('fs');
const path = 'src/pages/Explorer.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const [error, setError] = useState("");',
  'const [error, setError] = useState("");\n  const [showExportPreview, setShowExportPreview] = useState(false);'
);

code = code.replace(
  'Search, Moon, Sun, Download',
  'Search, Moon, Sun, Download, AlertCircle'
);

if (!code.includes('import { ExportPreviewModal } from')) {
  code = code.replace(
    'import { exportManager } from "../lib/exportManager";',
    'import { exportManager } from "../lib/exportManager";\nimport { ExportPreviewModal } from "../components/ExportPreviewModal";'
  );
}

fs.writeFileSync(path, code);
