const fs = require('fs');
let code = fs.readFileSync('src/lib/exportManager.ts', 'utf8');

code = code.replace(
  /details: \`\$\{payload.processed\} of \$\{payload.total\} files \(\$\{\(payload.bytesProcessed \/ 1024 \/ 1024\)\.toFixed\(2\)\} MB\)\`/g,
  "details: `${payload.processed} of ${payload.total} files (${(payload.bytesProcessed / 1024 / 1024).toFixed(2)} MB)`,\n          processedFiles: payload.processed,\n          totalFiles: payload.total,\n          bytesProcessed: payload.bytesProcessed"
);

code = code.replace(
  /details: 'Starting export\.\.\.',\n      owner/g,
  "details: 'Starting export...',\n      startTime: Date.now(),\n      owner"
);

const estimatedBytesStr = `      const estimatedBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);`;

code = code.replace(
  /const files = tree.filter\(t => t.type === 'blob'\);/g,
  `const files = tree.filter(t => t.type === 'blob');\n${estimatedBytesStr}`
);

code = code.replace(
  /startTime: Date\.now\(\),\n      owner/g,
  "startTime: Date.now(),\n      totalBytes: estimatedBytes,\n      owner"
);


fs.writeFileSync('src/lib/exportManager.ts', code);
