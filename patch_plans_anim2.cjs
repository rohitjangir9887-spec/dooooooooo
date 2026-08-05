const fs = require('fs');
let code = fs.readFileSync('src/pages/Plans.tsx', 'utf8');

if (code.includes('<motion.div')) {
  code = code.replace(
    '        <div className="mt-16 text-center flex flex-col items-center">\n      </motion.div>',
    '        <div className="mt-16 text-center flex flex-col items-center">'
  );
  code = code.replace(
    '        </div>\n      </div>\n    </div>\n  );\n}',
    '        </div>\n      </motion.div>\n    </div>\n  );\n}'
  );
  fs.writeFileSync('src/pages/Plans.tsx', code);
}
