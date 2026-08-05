const fs = require('fs');
let code = fs.readFileSync('src/components/TopNavigation.tsx', 'utf8');

code = code.replace(
  'import { User, MoreVertical, Activity, Zap, Settings, Trash2, X } from \'lucide-react\';',
  'import { User, MoreVertical, Activity, Zap, ShieldCheck, Settings, Trash2, X } from \'lucide-react\';'
);

code = code.replace(
  '<span className="font-medium text-blue-500">{PLANS[userProfile.planId].name}</span>',
  `<span className="font-medium flex items-center gap-1 text-blue-500">
                    {userProfile.planId === 'pro' && <Zap className="w-3 h-3" />}
                    {userProfile.planId === 'unlimited' && <Zap className="w-3 h-3 text-purple-500" />}
                    {userProfile.planId === 'free' && <ShieldCheck className="w-3 h-3" />}
                    {PLANS[userProfile.planId].name}
                  </span>`
);

fs.writeFileSync('src/components/TopNavigation.tsx', code);
