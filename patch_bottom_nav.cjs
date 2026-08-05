const fs = require('fs');
let code = fs.readFileSync('src/components/BottomNavigation.tsx', 'utf8');

code = code.replace(
  "    { path: '/explore', icon: Compass, label: 'Explore' }, // We'll adapt this later\n    { path: '/history', icon: History, label: 'History' },",
  "    { path: '/plans', icon: Zap, label: 'Plans' },"
);

code = code.replace(
  "import { Home, Compass, History, Settings } from 'lucide-react';",
  "import { Home, Compass, History, Settings, Zap } from 'lucide-react';"
);

// We need to fix the button click logic
const clickLogicOld = `              if (item.path === '/explore' && location.pathname.split('/').length > 2) return;
              if (item.path === '/explore') {
                navigate('/'); // Redirect to home if they click explore but aren't in a repo
              } else if (item.path === '/history') {
                navigate('/settings'); // Quick hack, history is in settings or home
              } else {
                navigate(item.path);
              }`;

const clickLogicNew = `              navigate(item.path);`;

code = code.replace(clickLogicOld, clickLogicNew);

const activeLogicOld = `const isActive = location.pathname === item.path || (item.path === '/explore' && location.pathname.split('/').length > 2);`;
const activeLogicNew = `const isActive = location.pathname === item.path;`;

code = code.replace(activeLogicOld, activeLogicNew);

fs.writeFileSync('src/components/BottomNavigation.tsx', code);
