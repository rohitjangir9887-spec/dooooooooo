import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Github, ArrowRight, Clock, Star, Code2, Zap, Compass, Sparkles, Flame, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../store/useAppStore";
import { LiveDashboard } from "../components/LiveDashboard";
import { UserRepositories } from "../components/UserRepositories";

const SUGGESTED_REPOS = [
  { name: "React", path: "facebook/react", desc: "A declarative, efficient, and flexible UI library.", stars: "225k", lang: "TypeScript", color: "from-cyan-400 to-blue-500" },
  { name: "Vite", path: "vitejs/vite", desc: "Next generation frontend tooling.", stars: "67k", lang: "TypeScript", color: "from-yellow-400 to-purple-600" },
  { name: "Tailwind", path: "tailwindlabs/tailwindcss", desc: "A utility-first CSS framework for rapid building.", stars: "82k", lang: "CSS", color: "from-sky-400 to-teal-500" },
  { name: "FastAPI", path: "fastapi/fastapi", desc: "High performance web framework for APIs.", stars: "75k", lang: "Python", color: "from-emerald-400 to-green-600" },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleNavigateRepo = (owner: string, repo: string) => {
    const { incrementUsage, addToast, userProfile } = useAppStore.getState();
    if (!incrementUsage('repos')) {
      addToast(`Daily limit reached for your ${userProfile.planId} plan. Upgrade to continue.`, 'error');
      navigate('/settings');
      return;
    }
    navigate(`/${owner}/${repo}`);
  };

  const allHistory = useAppStore((state) => state.history);
  const history = useMemo(() => allHistory?.filter((h) => h.type === "repo"), [allHistory]);
  const favorites = useAppStore((state) => state.favorites);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) return;

    let rawUrl = url.trim();
    rawUrl = rawUrl.split('?')[0].split('#')[0];
    
    if (rawUrl.startsWith('git@github.com:')) {
      rawUrl = rawUrl.replace('git@github.com:', '');
    }
    
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      try {
        const parsedUrl = new URL(rawUrl);
        if (parsedUrl.hostname !== 'github.com' && parsedUrl.hostname !== 'www.github.com') {
          setError("Invalid GitHub repository URL. Must be a github.com link.");
          return;
        }
        rawUrl = parsedUrl.pathname.substring(1);
      } catch {
        setError("Invalid URL format.");
        return;
      }
    } else if (rawUrl.startsWith('github.com/')) {
      rawUrl = rawUrl.replace('github.com/', '');
    }
    
    if (rawUrl.endsWith('.git')) {
      rawUrl = rawUrl.slice(0, -4);
    }
    
    rawUrl = rawUrl.replace(/\/+$/, '');
    
    const parts = rawUrl.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const owner = parts[0];
      const repo = parts[1];
      
      const { incrementUsage, addToast, userProfile } = useAppStore.getState();
      if (!incrementUsage('repos')) {
        addToast(`Daily limit reached for your ${userProfile.planId} plan. Upgrade to continue.`, 'error');
        navigate('/plans');
        return;
      }
      
      navigate(`/${owner}/${repo}`);
    } else {
      setError("Invalid GitHub repository URL. Example: facebook/react");
    }
  };

  const handleQuickExplore = (path: string) => {
    const parts = path.split('/');
    if (parts.length === 2) {
      handleNavigateRepo(parts[0], parts[1]);
    }
  };

  return (
    <div className="flex-1 min-h-screen pt-24 pb-28 flex flex-col items-center justify-start p-4 md:p-8 bg-transparent text-neutral-900 dark:text-neutral-100 relative overflow-x-hidden">
      
      {/* iOS Liquid Aurora Background Blobs */}
      <div className="absolute top-[-10%] left-[-20%] w-[60vw] h-[60vw] md:w-[45vw] md:h-[45vw] rounded-full bg-gradient-to-tr from-blue-300/30 to-indigo-400/20 dark:from-blue-900/15 dark:to-indigo-900/10 blur-[100px] pointer-events-none animate-[pulse_8s_infinite_alternate]" />
      <div className="absolute bottom-[20%] right-[-20%] w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] rounded-full bg-gradient-to-tr from-pink-300/20 to-purple-400/20 dark:from-purple-900/10 dark:to-pink-900/10 blur-[120px] pointer-events-none animate-[pulse_10s_infinite_alternate_delay-2s]" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-5xl z-10 flex flex-col items-center"
      >
        {/* Dynamic Island Header Emblem */}
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 3 }}
          whileTap={{ scale: 0.95 }}
          className="w-16 h-16 bg-white dark:bg-neutral-900 border border-neutral-200/40 dark:border-neutral-800/40 rounded-3xl shadow-[0_12px_24px_-10px_rgba(0,0,0,0.1)] flex items-center justify-center mb-6"
        >
          <Github className="w-8 h-8 text-neutral-800 dark:text-neutral-100" />
        </motion.div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-700 dark:from-white dark:via-neutral-100 dark:to-neutral-300 mb-3 font-sans">
          Explore Codebase
        </h1>
        <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 text-center mb-8 max-w-md px-4 leading-relaxed">
          Instantly browse, view, and export any public GitHub repository with a fast, high-performance editor.
        </p>
        
        {/* Gorgeous Search Bar with iOS Glassmorphic Design */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl px-2 mb-8 relative">
          <div className="relative flex items-center bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl border border-white/40 dark:border-neutral-800/50 rounded-2xl shadow-[0_10px_35px_-8px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_45px_rgba(0,0,0,0.3)] p-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/50">
            <Search className="w-5 h-5 text-neutral-400 ml-3 shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste repository URL, e.g. facebook/react"
              className="flex-1 bg-transparent border-none outline-none px-3 py-2.5 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-sm md:text-base w-full focus:ring-0"
            />
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="bg-blue-500 text-white dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-blue-500/10"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 dark:text-red-400 text-xs text-center mt-3 font-medium"
            >
              {error}
            </motion.p>
          )}
        </form>

        {/* Curator Shelf: Tech Category Shortcuts (New Premium Feature) */}
        <div className="w-full max-w-3xl mb-12 px-2">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Quick-Explore Shortcuts</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SUGGESTED_REPOS.map((repo, idx) => (
              <motion.button
                key={repo.path}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleQuickExplore(repo.path)}
                className="flex flex-col items-start p-4 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200/30 dark:border-neutral-800/40 rounded-2xl text-left hover:bg-white dark:hover:bg-neutral-900 transition-all shadow-sm relative group overflow-hidden"
              >
                {/* Accent mini glow inside */}
                <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-gradient-to-tr ${repo.color} opacity-[0.06] blur-xl group-hover:opacity-[0.15] transition-opacity`} />
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${repo.color}`} />
                  <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">{repo.name}</span>
                </div>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug line-clamp-2 mb-2 flex-1">
                  {repo.desc}
                </span>
                <div className="flex justify-between items-center w-full text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-current" /> {repo.stars}</span>
                  <span className="text-blue-500 dark:text-blue-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center">Browse →</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* History and Favorites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-2">
          {/* History */}
          <div className="bg-white/40 dark:bg-neutral-900/30 backdrop-blur-xl border border-neutral-200/40 dark:border-neutral-800/40 rounded-3xl p-5 shadow-sm flex flex-col min-h-[160px]">
            <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Recent Repositories
            </h3>
            {history && history.length > 0 ? (
              <div className="flex flex-col gap-2.5 flex-1">
                {history.slice(0, 3).map((item, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigateRepo(item.owner, item.repo)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-neutral-900/60 border border-neutral-200/10 dark:border-neutral-800/10 hover:bg-white dark:hover:bg-neutral-850 shadow-sm transition-all text-left"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{item.owner}/{item.repo}</p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Viewed recently</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-neutral-400 dark:text-neutral-600">
                <Compass className="w-8 h-8 mb-2 stroke-[1.5]" />
                <p className="text-xs">No recently explored repositories</p>
              </div>
            )}
          </div>

          {/* Favorites */}
          <div className="bg-white/40 dark:bg-neutral-900/30 backdrop-blur-xl border border-neutral-200/40 dark:border-neutral-800/40 rounded-3xl p-5 shadow-sm flex flex-col min-h-[160px]">
            <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" /> Favorites
            </h3>
            {favorites && favorites.length > 0 ? (
              <div className="flex flex-col gap-2.5 flex-1">
                {favorites.slice(0, 3).map((fav, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigateRepo(fav.owner, fav.repo)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-neutral-900/60 border border-neutral-200/10 dark:border-neutral-800/10 hover:bg-white dark:hover:bg-neutral-850 shadow-sm transition-all text-left"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/5 flex items-center justify-center text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{fav.owner}/{fav.repo}</p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Pinned to dashboard</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-neutral-400 dark:text-neutral-600">
                <Star className="w-8 h-8 mb-2 stroke-[1.5]" />
                <p className="text-xs">Mark repositories as favorites to pin them here</p>
              </div>
            )}
          </div>
        </div>

        {/* User Repositories (If Authenticated) */}
        <UserRepositories />

        {/* Live Dashboard System Widget */}
        <div className="w-full mt-8 px-2">
          <LiveDashboard />
        </div>
      </motion.div>
    </div>
  );
}
