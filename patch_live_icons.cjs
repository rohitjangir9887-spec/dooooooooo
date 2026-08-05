const fs = require('fs');
let code = fs.readFileSync('src/components/LiveDashboard.tsx', 'utf8');

code = code.replace(
  'import { Activity, HardDrive, FileArchive, CheckCircle2, Loader2, Play, User, Zap } from \'lucide-react\';',
  'import { Activity, Database, DownloadCloud, CheckCircle2, Loader2 } from \'lucide-react\';'
);

code = code.replace(
  '<HardDrive className="w-4 h-4 text-blue-500 mb-2" />',
  '<Database className="w-4 h-4 text-blue-500 mb-2" />'
);

code = code.replace(
  '<FileArchive className="w-4 h-4 text-purple-500 mb-2" />',
  '<DownloadCloud className="w-4 h-4 text-purple-500 mb-2" />'
);

fs.writeFileSync('src/components/LiveDashboard.tsx', code);
