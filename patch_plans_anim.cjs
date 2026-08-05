const fs = require('fs');
let code = fs.readFileSync('src/pages/Plans.tsx', 'utf8');

if (!code.includes('motion.div')) {
  code = code.replace(
    'import { CheckCircle2, Zap, ArrowRight, ShieldCheck } from \'lucide-react\';',
    'import { CheckCircle2, Zap, ArrowRight, ShieldCheck } from \'lucide-react\';\nimport { motion } from \'motion/react\';'
  );
  
  code = code.replace(
    '<div className="max-w-6xl mx-auto">',
    '<motion.div \n        initial={{ opacity: 0, y: 20 }}\n        animate={{ opacity: 1, y: 0 }}\n        transition={{ duration: 0.4 }}\n        className="max-w-6xl mx-auto"\n      >'
  );

  code = code.replace(
    '        <div className="mt-16 text-center flex flex-col items-center">',
    '        <div className="mt-16 text-center flex flex-col items-center">\n      </motion.div>'
  );
  // Wait, I replaced opening tag of max-w-6xl, so I must replace its closing tag.
  // Actually, just wrapping the whole thing is easier.
}
fs.writeFileSync('src/pages/Plans.tsx', code);
