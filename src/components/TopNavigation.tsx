import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useSecureDeleteStore } from '../store/useSecureDeleteStore';
import { PLANS } from '../config/plans';
import { User, MoreVertical, Activity, Zap, ShieldCheck, Settings, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleGitHubLogin } from '../lib/auth';

export function TopNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppStore((state) => state.userProfile);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const githubUser = useAppStore((state) => state.githubUser);
  const logout = useAppStore((state) => state.logout);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const addToast = useAppStore((state) => state.addToast);
  const { requestDelete, moveToTrash } = useSecureDeleteStore();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);

  const handleClearUsage = () => {
    setIsMenuOpen(false);
    requestDelete('Usage Statistics', 'system', 'clear_stats');
  };

  const handleLogin = () => {
    handleGitHubLogin(() => {
      setIsMenuOpen(false);
      useAppStore.getState().setLoginWarningOpen(true);
    });
  };

  const handleLogout = async () => {
    await logout();
    addToast("Logged out successfully");
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-3 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl h-14 z-50 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-white/20 dark:border-neutral-800/40 rounded-2xl flex items-center justify-between px-4 lg:px-6 transition-all duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md border border-neutral-200/30 dark:border-neutral-800/30 rounded-full px-3 py-1 flex items-center gap-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20 overflow-hidden">
                  {isAuthenticated && githubUser?.avatar_url ? (
                    <img src={githubUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold leading-tight text-neutral-800 dark:text-neutral-200">
                    {isAuthenticated && githubUser?.login ? githubUser.login : userProfile.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight flex items-center gap-1">
                    <span className="font-semibold flex items-center gap-0.5 text-blue-500">
                      {userProfile.planId === 'pro' && <Zap className="w-2.5 h-2.5" />}
                      {userProfile.planId === 'unlimited' && <Zap className="w-2.5 h-2.5 text-purple-500" />}
                      {userProfile.planId === 'free' && <ShieldCheck className="w-2.5 h-2.5" />}
                      {PLANS[userProfile.planId].name}
                    </span>
                    <span>•</span>
                    <span>{userProfile.usage.reposExploredToday}/{PLANS[userProfile.planId].limits.reposPerDay === Infinity ? '∞' : PLANS[userProfile.planId].limits.reposPerDay} repos</span>
                  </div>
                </div>
              </div>
              <div className="h-4 w-[1px] bg-neutral-200/50 dark:bg-neutral-800/50"></div>
              {!isAuthenticated && (
                <button
                  onClick={handleLogin}
                  className="px-3 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" /> Sign In
                </button>
              )}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded-full hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </motion.div>

            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/40 dark:border-neutral-800/40 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col py-1"
                  >
                    {!isAuthenticated ? (
                      <button 
                        onClick={handleLogin}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium"
                      >
                        <User className="w-4 h-4 text-blue-500" /> Sign In with GitHub
                      </button>
                    ) : (
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium"
                      >
                        <User className="w-4 h-4 text-neutral-500" /> Sign Out
                      </button>
                    )}
                    <div className="h-[1px] bg-neutral-200/30 dark:bg-neutral-800/30 my-1"></div>
                    <button 
                      onClick={() => { setIsMenuOpen(false); setIsUsageModalOpen(true); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
                    >
                      <Activity className="w-4 h-4 text-blue-500" /> View Usage Details
                    </button>
                    <button 
                      onClick={() => { setIsMenuOpen(false); navigate('/plans'); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
                    >
                      <Zap className="w-4 h-4 text-purple-500" /> Upgrade Plan
                    </button>
                    <button 
                      onClick={() => { setIsMenuOpen(false); navigate('/settings'); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
                    >
                      <Settings className="w-4 h-4 text-neutral-500" /> Settings
                    </button>
                    <div className="h-[1px] bg-neutral-200/30 dark:bg-neutral-800/30 my-1"></div>
                    <button 
                      onClick={handleClearUsage}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400 font-medium"
                    >
                      <Trash2 className="w-4 h-4" /> Reset Statistics
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {location.pathname !== '/' && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')} 
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white/40 dark:bg-neutral-800/40 border border-neutral-200/20 dark:border-neutral-700/20 transition-all flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span>Back Home</span>
            </motion.button>
          )}
        </div>
      </header>

    <AnimatePresence>
        {isUsageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setIsUsageModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 relative"
            >
              <button 
                onClick={() => setIsUsageModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" /> Full Usage Details</h2>
              
              <div className="space-y-4">
                <div className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Repos Explored</span>
                    <span className="text-xs font-semibold">{userProfile.usage.reposExploredToday} / {PLANS[userProfile.planId].limits.reposPerDay === Infinity ? '∞' : PLANS[userProfile.planId].limits.reposPerDay}</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (userProfile.usage.reposExploredToday / (PLANS[userProfile.planId].limits.reposPerDay === Infinity ? Math.max(1, userProfile.usage.reposExploredToday) : PLANS[userProfile.planId].limits.reposPerDay)) * 100)}%` }} />
                  </div>
                </div>
                <div className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Exports Today</span>
                    <span className="text-xs font-semibold">{userProfile.usage.exportsToday} / {PLANS[userProfile.planId].limits.exportsPerDay === Infinity ? '∞' : PLANS[userProfile.planId].limits.exportsPerDay}</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, (userProfile.usage.exportsToday / (PLANS[userProfile.planId].limits.exportsPerDay === Infinity ? Math.max(1, userProfile.usage.exportsToday) : PLANS[userProfile.planId].limits.exportsPerDay)) * 100)}%` }} />
                  </div>
                </div>
                <div className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Background Jobs</span>
                    <span className="text-xs font-semibold">{userProfile.usage.backgroundJobsToday} / {PLANS[userProfile.planId].limits.backgroundJobsPerDay === Infinity ? '∞' : PLANS[userProfile.planId].limits.backgroundJobsPerDay}</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: `${Math.min(100, (userProfile.usage.backgroundJobsToday / (PLANS[userProfile.planId].limits.backgroundJobsPerDay === Infinity ? Math.max(1, userProfile.usage.backgroundJobsToday) : PLANS[userProfile.planId].limits.backgroundJobsPerDay)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
