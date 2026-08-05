const fs = require('fs');
const path = 'src/pages/Home.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/<\/div>\s*<\/motion\.div>\s*<\/div>\s*\);\s*\}/, 
  '</div>\n<div className="w-full mt-8">\n<LiveDashboard />\n</div>\n</motion.div>\n</div>\n);\n}'
);

code = code.replace(/max-w-2xl/, 'max-w-4xl');

fs.writeFileSync(path, code);
