const fs = require('fs');
const path = 'src/components/LiveDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "onClick={() => navigate('/settings')} className=\"mt-4 text-xs font-medium text-blue-500 hover:text-blue-600\">Upgrade Plan</button>",
  "onClick={() => navigate('/plans')} className=\"mt-4 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors\">Upgrade Plan</button>"
);

fs.writeFileSync(path, code);
