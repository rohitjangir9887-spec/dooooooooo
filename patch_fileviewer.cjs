const fs = require('fs');
const path = 'src/components/FileViewer.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "import { Download, X, Copy, ExternalLink, Play } from 'lucide-react';",
  "import { Download, X, Copy, ExternalLink, Play } from 'lucide-react';\nimport { smartCopy } from '../lib/clipboard';"
);

code = code.replace(
  "navigator.clipboard.writeText(content);",
  "smartCopy(content, { filenameFallback: file.path });"
);

code = code.replace(
  "navigator.clipboard.writeText(file.path)",
  "smartCopy(file.path, { filenameFallback: 'path.txt' })"
);

fs.writeFileSync(path, code);
