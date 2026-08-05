const fs = require('fs');
const path = 'src/pages/Home.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "        </div>\n      </motion.div>\n    </div>\n  );\n}",
  "        </div>\n        <div className=\"w-full mt-8\">\n          <LiveDashboard />\n        </div>\n      </motion.div>\n    </div>\n  );\n}"
);

code = code.replace(
  "className=\"w-full max-w-2xl z-10 flex flex-col items-center\"",
  "className=\"w-full max-w-4xl z-10 flex flex-col items-center\""
);

fs.writeFileSync(path, code);
