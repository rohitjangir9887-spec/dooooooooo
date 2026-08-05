const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

if (!code.includes('<motion.div \n        initial={{ opacity: 0, y: 20 }}')) {
  code = code.replace(
    '<div className="max-w-4xl mx-auto space-y-6 md:space-y-8">',
    '<motion.div \n        initial={{ opacity: 0, y: 20 }}\n        animate={{ opacity: 1, y: 0 }}\n        transition={{ duration: 0.4 }}\n        className="max-w-4xl mx-auto space-y-6 md:space-y-8"\n      >'
  );

  code = code.replace(
    '        </AccordionSection>\n      </div>\n    </div>',
    '        </AccordionSection>\n      </motion.div>\n    </div>'
  );
  fs.writeFileSync('src/pages/Settings.tsx', code);
}
