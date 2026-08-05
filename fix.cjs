const fs = require('fs');
let code = fs.readFileSync('src/components/FileViewer.tsx', 'utf8');
code = code.replace('        </div>\n</div>\n      </div>\n\n      {/* Content Area */}', '        </div>\n      </div>\n\n      {/* Content Area */}');
fs.writeFileSync('src/components/FileViewer.tsx', code);
