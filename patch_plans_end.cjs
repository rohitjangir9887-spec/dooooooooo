const fs = require('fs');
let code = fs.readFileSync('src/pages/Plans.tsx', 'utf8');

code = code.replace(
  '              </div>\n            );\n          })}\n        </div>',
  '              </motion.div>\n            );\n          })}\n        </div>'
);
fs.writeFileSync('src/pages/Plans.tsx', code);
