const fs = require('fs');
let code = fs.readFileSync('src/components/FileViewer.tsx', 'utf8');

code = code.replace(
  '        </div>\n</div>\n      </div>\n\n      {/* Content Area */}',
  '        </div>\n      </div>\n\n      {/* Content Area */}'
);

// wait, let's just see lines 189-195 exactly:
