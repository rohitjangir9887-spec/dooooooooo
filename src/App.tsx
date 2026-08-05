/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTaskStore } from "./store/useTaskStore";
import { useAppStore } from "./store/useAppStore";
import { useEffect } from "react";
import { AnimatedRoutes } from "./AnimatedRoutes";
import { GlobalExportModal } from "./components/GlobalExportModal";
import { BackgroundTasksWidget } from "./components/BackgroundTasksWidget";
import { ToastContainer } from "./components/ToastContainer";
import { GlobalCopyModal } from "./components/GlobalCopyModal";
import SecureDeleteDialog from "./components/SecureDeleteDialog";
import TrashWidget from "./components/TrashWidget";
import { motion } from "motion/react";

import { TopNavigation } from "./components/TopNavigation";
import { BottomNavigation } from "./components/BottomNavigation";
import { initiateAutoResume } from "./lib/importService";

export default function App() {
  const settings = useAppStore((state) => state.settings);

  const checkAuth = useAppStore((state) => state.checkAuth);
  
  useEffect(() => {
    checkAuth();
    
    // Auto-resume background import jobs that didn't complete
    initiateAutoResume().catch(console.error);
    
    // One-time cleanup for corrupted usage counters
    const profile = useAppStore.getState().userProfile;
    if (profile.usage.reposExploredToday > 500 || profile.usage.reposExploredToday < 0) {
      const history = useAppStore.getState().history.filter(h => h.type === 'repo');
      const tasks = useTaskStore.getState().tasks;
      const exportsCount = tasks.filter(t => t.name === 'Repository Export').length;
      
      useAppStore.getState().updateUserProfile({
        usage: {
          ...profile.usage,
          reposExploredToday: history.length,
          exportsToday: exportsCount,
          backgroundJobsToday: exportsCount // assuming exports are the background jobs
        }
      });
    }
    
    return () => {};
  }, []);

  useEffect(() => {
    if (settings?.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings?.darkMode]);

  return (
    <BrowserRouter>
      <div className="min-h-screen pb-24 bg-[#fbfbfd] dark:bg-[#000000] text-neutral-900 dark:text-neutral-50 font-sans transition-colors duration-300 selection:bg-blue-500/30 relative overflow-hidden">
        {/* iOS Dynamic Glassmorphic Floating Mesh Aurora background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <motion.div 
            animate={{
              scale: [1, 1.15, 0.95, 1.05, 1],
              x: [0, 40, -30, 20, 0],
              y: [0, -50, 40, -20, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-[-20%] left-[-15%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-tr from-blue-400/20 to-purple-500/15 dark:from-blue-950/15 dark:to-indigo-950/10 blur-[130px]"
          />
          <motion.div 
            animate={{
              scale: [1, 0.9, 1.1, 1.02, 1],
              x: [0, -30, 50, -40, 0],
              y: [0, 60, -30, 40, 0],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-pink-400/15 to-purple-500/20 dark:from-purple-950/10 dark:to-pink-950/10 blur-[140px]"
          />
          <motion.div 
            animate={{
              scale: [0.95, 1.05, 0.9, 1],
              x: [30, -20, 20, 30],
              y: [-40, 30, -25, -40],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-[40%] left-[30%] w-[35vw] h-[35vw] rounded-full bg-blue-300/10 dark:bg-indigo-950/5 blur-[100px]"
          />
        </div>

        <div className="relative z-10">
          <TopNavigation />
          <AnimatedRoutes />
          <BottomNavigation />
          <GlobalExportModal />
          <BackgroundTasksWidget />
          <ToastContainer />
          <GlobalCopyModal />
          <SecureDeleteDialog />
          <TrashWidget />
        </div>
      </div>
    </BrowserRouter>
  );
}
