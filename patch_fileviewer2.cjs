const fs = require('fs');
const path = 'src/components/FileViewer.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("import { smartCopy }")) {
  code = code.replace(
    "import { motion } from 'motion/react';",
    "import { motion } from 'motion/react';\nimport { smartCopy } from '../lib/clipboard';"
  );
}

fs.writeFileSync(path, code);
