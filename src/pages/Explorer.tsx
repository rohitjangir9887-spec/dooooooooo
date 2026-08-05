import { useTaskStore } from "../store/useTaskStore";
import { useSecureDeleteStore } from "../store/useSecureDeleteStore";
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RepoTree } from "../components/RepoTree";
import { FileViewer } from "../components/FileViewer";
import { RepoInfoView } from "../components/RepoInfo";
import { fetchRepoInfo, fetchRepoTree, RepoInfo, GitTreeItem, fetchReadme, fetchBranches, Branch } from "../lib/github";
import { useAppStore } from "../store/useAppStore";
import { 
  ArrowLeft, Star, Settings, Sidebar, PanelRight, Menu, 
  Search, Moon, Sun, Download, AlertCircle, ChevronDown, GitBranch
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { exportManager } from "../lib/exportManager";
import { ExportPreviewModal } from "../components/ExportPreviewModal";

export default function Explorer() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [tree, setTree] = useState<GitTreeItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [readme, setReadme] = useState<string | null>(null);

  const filteredTree = useMemo(() => {
    if (!searchQuery) return tree;
    const lowerQuery = searchQuery.toLowerCase();
    return tree.filter(item => item.path.toLowerCase().includes(lowerQuery));
  }, [tree, searchQuery]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExportPreview, setShowExportPreview] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<GitTreeItem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  
  const { requestDelete, moveToTrash } = useSecureDeleteStore();
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const favorites = useAppStore((state) => state.favorites);
  const addToast = useAppStore((state) => state.addToast);

  const handleFavoriteClick = () => {
    if (!owner || !repo) return;
    if (isFavorite) {
      requestDelete(`Favorite: ${owner}/${repo}`, 'repository', 'toggle_favorite', { owner, repo });
    } else {
      toggleFavorite(owner, repo);
      addToast('Added to favorites', 'success');
    }
  };
  const addToHistory = useAppStore((state) => state.addToHistory);
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const isFavorite = favorites?.some(f => f.owner === owner && f.repo === repo);

  useEffect(() => {
    if (!owner || !repo) return;
    
    let isMounted = true;
    const loadRepo = async () => {
      setIsLoading(true);
      setError("");
      try {
        const info = await fetchRepoInfo(owner, repo);
        if (!isMounted) return;
        setRepoInfo(info);
        addToHistory({ type: 'repo', owner, repo });
        
        const branchesData = await fetchBranches(owner, repo).catch(() => []);
        if (!isMounted) return;
        setBranches(branchesData);

        setSelectedBranch(info.default_branch);

        const treeData = await fetchRepoTree(owner, repo, info.default_branch);
        if (!isMounted) return;
        setTree(treeData);

        const readmeData = await fetchReadme(owner, repo, info.default_branch);
        if (!isMounted) return;
        setReadme(readmeData);

      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadRepo();
    return () => { isMounted = false; };
  }, [owner, repo, addToHistory]);

  const handleBranchSelect = async (branchName: string) => {
    if (!owner || !repo) return;
    setIsBranchDropdownOpen(false);
    setSelectedBranch(branchName);
    setIsLoading(true);
    setError("");
    try {
      const treeData = await fetchRepoTree(owner, repo, branchName);
      setTree(treeData);
      
      const readmeData = await fetchReadme(owner, repo, branchName);
      setReadme(readmeData);
      
      navigate(`/${owner}/${repo}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const pathParam = useParams()["*"];

  useEffect(() => {
    if (tree.length > 0) {
      if (pathParam) {
        if (window.innerWidth < 768) setIsSidebarOpen(false);
        const file = tree.find(t => t.path === pathParam && t.type === "blob");
        if (file) {
          setSelectedFile(file);
          if (owner && repo) {
             addToHistory({ type: "file", owner, repo, path: file.path });
          }
        } else {
          setSelectedFile(null);
        }
      } else {
        setSelectedFile(null);
        if (window.innerWidth < 768) setIsSidebarOpen(true);
      }
    }
  }, [tree, pathParam, owner, repo, addToHistory]);

  const handleFileSelect = (file: GitTreeItem) => {
    navigate(`/${owner}/${repo}/${file.path}`);
    if (window.innerWidth < 1024) {
       setIsSidebarOpen(false); // Close sidebar on mobile when file selected
    }
    if (owner && repo) {
       addToHistory({ type: 'file', owner, repo, path: file.path });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen pt-16 pb-16 md:pb-0 flex flex-col overflow-hidden bg-white dark:bg-[#09090b]">
        <header className="h-14 flex items-center justify-between px-4 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/70 dark:bg-[#09090b]/70 backdrop-blur-xl z-20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="w-24 h-6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-72 border-r border-neutral-200/50 dark:border-neutral-800/50 hidden md:flex flex-col">
            <div className="p-4 flex-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 mb-4">
                  <div className="w-4 h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                  <div className={`h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'}`} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 p-6 md:p-12">
             <div className="max-w-3xl mx-auto space-y-6">
                <div className="w-1/3 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
                <div className="space-y-3 pt-4">
                   <div className="w-full h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                   <div className="w-5/6 h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                   <div className="w-4/6 h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen pt-16 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Oops!</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen pt-16 pb-16 md:pb-0 flex flex-col overflow-hidden bg-white dark:bg-[#09090b]">
      {/* Top Navbar */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/70 dark:bg-[#09090b]/70 backdrop-blur-xl z-20 shrink-0">
        <div className="flex items-center gap-1 overflow-hidden">
          {/* iOS Style Back Button */}
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-blue-500 dark:text-blue-400 font-bold text-sm mr-2 hover:opacity-80 transition-all shrink-0 focus:outline-none"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="text-sm">Back</span>
          </motion.button>

          <div className="h-4 w-[1px] bg-neutral-200/50 dark:bg-neutral-800/50 mr-2"></div>
          
          <div className="flex items-center gap-2 truncate">
             {repoInfo?.owner.avatar_url && (
               <img src={repoInfo.owner.avatar_url} alt="" className="w-5 h-5 rounded-full shrink-0 shadow-sm" />
             )}
             <span className="font-bold text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 truncate">
               {repo}
             </span>
          </div>

          <div className="h-4 w-[1px] bg-neutral-200/50 dark:bg-neutral-800/50 mx-1 md:mx-2"></div>

          {/* Branch Dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
            >
              <GitBranch className="w-3.5 h-3.5 hidden sm:block" />
              <span className="truncate max-w-[80px] sm:max-w-[150px]">{selectedBranch || 'Loading...'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isBranchDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isBranchDropdownOpen && branches.length > 0 && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsBranchDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-1 w-56 max-h-64 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl z-50 py-1"
                  >
                    {branches.map((branch) => (
                      <button
                        key={branch.name}
                        onClick={() => handleBranchSelect(branch.name)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${selectedBranch === branch.name ? 'text-blue-500 font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}
                      >
                        <GitBranch className="w-4 h-4 shrink-0" />
                        <span className="truncate">{branch.name}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleFavoriteClick}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${isFavorite ? 'text-yellow-500' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </motion.button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
           {repoInfo && !repoInfo.private && (
             <>
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => navigate(`/import?source=${owner}/${repo}`)}
                 title="Import to My Repo"
                 className="hidden sm:flex p-1.5 px-3 rounded-full hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 text-indigo-500 dark:text-indigo-400 transition-all items-center gap-1 shrink-0 border border-indigo-500/10 mr-1"
               >
                 <Download className="w-4 h-4 rotate-180" />
                 <span className="text-xs font-bold">Import</span>
               </motion.button>
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setShowExportPreview(true)}
                 title="Export Repository Code"
                 className="p-1.5 px-3 rounded-full hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 text-blue-500 dark:text-blue-400 transition-all flex items-center gap-1 shrink-0 border border-blue-500/10"
               >
                 <Download className="w-4 h-4" />
                 <span className="text-xs font-bold hidden sm:inline-block">Export</span>
               </motion.button>
             </>
           )}
           <button
             onClick={() => updateSettings({ darkMode: !settings?.darkMode })}
             className="p-2 rounded-full hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
           >
             {settings?.darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
           </button>
           <button
             onClick={() => setIsSettingsOpen(true)}
             className="p-2 rounded-full hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
           >
             <Settings className="w-4.5 h-4.5" />
           </button>
           <button 
             className="lg:hidden p-2 rounded-full hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
           >
             <Menu className="w-4.5 h-4.5" />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="absolute lg:relative z-10 w-80 h-full bg-neutral-50 dark:bg-neutral-900/50 border-r border-neutral-200 dark:border-neutral-800 flex flex-col"
            >
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
                 <div className="relative">
                   <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                   <input 
                     type="text" 
                     placeholder="Search files..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                   />
                 </div>
              </div>
              <div className="flex-1 overflow-hidden">
                 <RepoTree 
                   tree={filteredTree} 
                   onSelect={handleFileSelect} 
                   selectedPath={selectedFile?.path} searchQuery={searchQuery} 
                 />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-950 relative">
          <AnimatePresence mode="wait">
            {selectedFile && owner && repo && repoInfo ? (
              <motion.div 
                key="fileviewer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                <FileViewer 
                  file={selectedFile} 
                  owner={owner} 
                  repo={repo} 
                  branch={selectedBranch || repoInfo.default_branch}
                  onClose={() => navigate(`/${owner}/${repo}`)}
                />
              </motion.div>
            ) : repoInfo ? (
              <motion.div 
                key="repoinfo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                <RepoInfoView info={repoInfo} readme={readme} />
              </motion.div>
            ) : null}
          </AnimatePresence>
          
          

          <AnimatePresence>
            {isSettingsOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800"
                >
                  <h3 className="text-xl font-bold mb-6 text-neutral-900 dark:text-white">Settings</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium">Dark Mode</span>
                      <button 
                        onClick={() => updateSettings({ darkMode: !settings?.darkMode })}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${settings?.darkMode ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings?.darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium">Editor Font Size</span>
                      <div className="flex items-center gap-3">
                         <input 
                           type="range" min="10" max="24" 
                           value={settings?.editorFontSize}
                           onChange={e => updateSettings({ editorFontSize: parseInt(e.target.value) })}
                           className="w-24 accent-blue-500"
                         />
                         <span className="text-sm font-mono text-neutral-500 w-6">{settings?.editorFontSize}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium">Wrap Lines</span>
                      <button 
                        onClick={() => updateSettings({ wrapLines: !settings?.wrapLines })}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${settings?.wrapLines ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings?.wrapLines ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium">Show Line Numbers</span>
                      <button 
                        onClick={() => updateSettings({ showLineNumbers: !settings?.showLineNumbers })}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${settings?.showLineNumbers ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings?.showLineNumbers ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium">Auto Expand Tree</span>
                      <button 
                        onClick={() => updateSettings({ autoExpandTree: !settings?.autoExpandTree })}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${settings?.autoExpandTree ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings?.autoExpandTree ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="w-full mt-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium"
                  >
                    Close
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          
          {showExportPreview && repoInfo && tree.length > 0 && (
            <ExportPreviewModal
              owner={owner!}
              repo={repo!}
              files={tree}
              onClose={() => setShowExportPreview(false)}
              onConfirm={(background) => {
                const { incrementUsage, addToast, userProfile } = useAppStore.getState();
                const planName = userProfile.planId;
                
                if (!incrementUsage('exports')) {
                  addToast(`Daily limit reached for your ${planName} plan. Upgrade to continue.`, 'error');
                  setShowExportPreview(false);
                  return;
                }
                
                if (background) {
                  if (!incrementUsage('backgroundJobs')) {
                    // Reverting export increment is hard, but button is disabled anyway if limit reached.
                  }
                }
                
                setShowExportPreview(false);
                exportManager.startExport(owner!, repo!, selectedBranch || repoInfo.default_branch, tree, () => { /* already handled */ });
                if (!background) {
                  useTaskStore.getState().openExportModal(`export-${owner}-${repo}`);
                }
                addToast(background ? "Export started in background" : "Export started", "success");
              }}
            />
          )}

          {/* Overlay for mobile sidebar */}
          <AnimatePresence>
             {isSidebarOpen && window.innerWidth < 1024 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="absolute inset-0 bg-black/20 dark:bg-black/40 z-0 lg:hidden backdrop-blur-sm"
                />
             )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
