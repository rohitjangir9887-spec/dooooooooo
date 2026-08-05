const fs = require('fs');

const metaPath = 'metadata.json';
let meta = fs.readFileSync(metaPath, 'utf8');
meta = meta.replace(/"name":\s*".*?"/, '"name": "Ram Repo"');
fs.writeFileSync(metaPath, meta);

const indexPath = 'index.html';
let index = fs.readFileSync(indexPath, 'utf8');
index = index.replace(/<title>.*?<\/title>/, '<title>Ram Repo</title>');
fs.writeFileSync(indexPath, index);

