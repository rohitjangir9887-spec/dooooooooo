import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, History, Settings, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/import', icon: Compass, label: 'Import' },
    { path: '/plans', icon: Zap, label: 'Plans' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[340px] h-14 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-2xl border border-white/20 dark:border-neutral-850/40 rounded-3xl z-45 flex items-center justify-around px-4 shadow-[0_12px_36px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)] transition-all duration-300">
      {navItems.map(item => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        
        return (
          <motion.button
            key={item.path}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              navigate(item.path);
            }}
            className="relative flex flex-col items-center justify-center w-14 h-11 rounded-2xl transition-colors focus:outline-none"
          >
            {isActive && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl -z-10 border border-blue-500/10"
                transition={{ type: "spring", stiffness: 380, damping: 25 }}
              />
            )}
            <Icon className={`w-4.5 h-4.5 mb-1 transition-all ${isActive ? 'text-blue-500 scale-110 drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`} />
            <span className={`text-[9px] font-bold tracking-wide uppercase transition-colors ${isActive ? 'text-blue-500' : 'text-neutral-400 dark:text-neutral-500'}`}>
              {item.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  );
}
