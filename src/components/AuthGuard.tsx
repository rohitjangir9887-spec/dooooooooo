import { ReactNode } from "react";
import { useAppStore } from "../store/useAppStore";
import { Github, Lock } from "lucide-react";
import { handleGitHubLogin } from "../lib/auth";
import { motion } from "motion/react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 min-h-screen pt-20 pb-28 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-neutral-500" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">🔒 Login Required</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8">
          Please sign in to access the Workspace and advanced repository features.
        </p>

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={() => {
              localStorage.setItem('github_redirect_after_login', window.location.pathname + window.location.search);
              handleGitHubLogin();
            }}
            className="w-full py-3.5 px-4 bg-[#24292e] hover:bg-[#2f363d] text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Github className="w-5 h-5" /> Continue with GitHub
          </button>
        </div>
      </motion.div>
    </div>
  );
}
