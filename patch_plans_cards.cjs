const fs = require('fs');
let code = fs.readFileSync('src/pages/Plans.tsx', 'utf8');

code = code.replace(
  '              <div \n                key={plan.id}',
  '              <motion.div \n                initial={{ opacity: 0, y: 20 }}\n                animate={{ opacity: 1, y: 0 }}\n                transition={{ duration: 0.4, delay: index * 0.1 }}\n                key={plan.id}'
);
code = code.replace(
  /<\/div>\n            \)\);\n          }\)}\n        <\/div>/,
  '              </motion.div>\n            ));\n          })}\n        </div>'
);

fs.writeFileSync('src/pages/Plans.tsx', code);
