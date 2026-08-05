const fs = require('fs');

const dashPath = 'src/components/LiveDashboard.tsx';
let dashCode = fs.readFileSync(dashPath, 'utf8');

const profileWidgetStart = dashCode.indexOf('<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">');
const profileWidgetEnd = dashCode.indexOf('<div className="grid grid-cols-1 md:grid-cols-3 gap-6">');

const profileWidgetCode = dashCode.substring(profileWidgetStart, profileWidgetEnd);

dashCode = dashCode.substring(0, profileWidgetStart) + dashCode.substring(profileWidgetEnd);
fs.writeFileSync(dashPath, dashCode);

const homePath = 'src/pages/Home.tsx';
let homeCode = fs.readFileSync(homePath, 'utf8');

const insertPos = homeCode.indexOf('<div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl flex items-center justify-center mb-8 border border-neutral-200 dark:border-neutral-700/50">');

// I need to make sure the imports User, Zap, PLANS are in Home.tsx
let importsToAdd = `
import { User, Zap } from 'lucide-react';
import { PLANS } from '../config/plans';
`;

homeCode = homeCode.replace(
  'import { Search, Github, ArrowRight, Clock, Star, Code2 } from "lucide-react";',
  'import { Search, Github, ArrowRight, Clock, Star, Code2, User, Zap } from "lucide-react";'
);
homeCode = homeCode.replace(
  'import { useAppStore } from "../store/useAppStore";',
  'import { useAppStore } from "../store/useAppStore";\nimport { PLANS } from "../config/plans";'
);

homeCode = homeCode.substring(0, insertPos) + profileWidgetCode + '\n' + homeCode.substring(insertPos);

fs.writeFileSync(homePath, homeCode);

// Now handle Settings.tsx
const settingsPath = 'src/pages/Settings.tsx';
let settingsCode = fs.readFileSync(settingsPath, 'utf8');

const profileSettingsStart = settingsCode.indexOf('{/* Profile & Plan Billing */}');
const profileSettingsEnd = settingsCode.indexOf('{/* Background Jobs */}');

settingsCode = settingsCode.substring(0, profileSettingsStart) + settingsCode.substring(profileSettingsEnd);
fs.writeFileSync(settingsPath, settingsCode);

