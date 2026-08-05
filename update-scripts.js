const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts.dev = "wrangler dev src/worker.ts --port 3000 --local";
pkg.scripts.build = "vite build";
pkg.scripts.start = "wrangler dev src/worker.ts --port 3000 --local";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
