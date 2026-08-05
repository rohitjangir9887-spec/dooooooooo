const fs = require('fs');
const path = 'src/components/CopyFallbackModal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "await smartCopy(txt, data.filename.replace('.txt', `-${type}.txt`));",
  "await smartCopy(txt, { filenameFallback: data.filename.replace('.txt', `-${type}.txt`) });"
);

fs.writeFileSync(path, code);
