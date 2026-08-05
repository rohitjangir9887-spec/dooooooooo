const fs = require('fs');
let vars = '';
if (process.env.GITHUB_CLIENT_ID) vars += `GITHUB_CLIENT_ID=${process.env.GITHUB_CLIENT_ID}\n`;
if (process.env.GITHUB_CLIENT_SECRET) vars += `GITHUB_CLIENT_SECRET=${process.env.GITHUB_CLIENT_SECRET}\n`;
if (process.env.SESSION_SECRET) vars += `SESSION_SECRET=${process.env.SESSION_SECRET}\n`;
fs.writeFileSync('.dev.vars', vars);
