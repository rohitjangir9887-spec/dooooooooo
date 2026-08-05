import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { Code2, ArrowRight, Github, Lock, Users, Search, Filter, Folder, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string;
  updated_at: string;
  stargazers_count: number;
}

interface Org {
  login: string;
  avatar_url: string;
}

export function UserRepositories() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const githubUser = useAppStore((state) => state.githubUser);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name'>('updated');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      Promise.all([
        fetch('/api/github/user/repos?sort=updated&per_page=100').then(res => res.json()),
        fetch('/api/github/user/orgs').then(res => res.json())
      ])
      .then(([reposData, orgsData]) => {
        if (!Array.isArray(reposData)) throw new Error(reposData.message || 'Failed to fetch user repos');
        setRepos(reposData);
        setOrgs(Array.isArray(orgsData) ? orgsData : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
    }
  }, [isAuthenticated]);

  const filteredRepos = useMemo(() => {
    return repos
      .filter(r => {
        if (filterType === 'public' && r.private) return false;
        if (filterType === 'private' && !r.private) return false;
        if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [repos, filterType, sortBy, search]);

  if (!isAuthenticated || !githubUser) return null;

  return (
    <div className="w-full max-w-4xl px-2 mt-8 flex flex-col gap-6">
      {/* GitHub Profile Dashboard */}
      <div className="bg-white/40 dark:bg-neutral-900/30 backdrop-blur-xl border border-neutral-200/40 dark:border-neutral-800/40 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={githubUser.avatar_url} alt="Avatar" className="w-16 h-16 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800" />
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              {githubUser.name || githubUser.login}
            </h2>
            <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-3 mt-1">
              <span>@{githubUser.login}</span>
              {githubUser.email && <span>• {githubUser.email}</span>}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs font-medium text-neutral-600 dark:text-neutral-300">
               <span className="flex items-center gap-1"><Folder className="w-3.5 h-3.5" /> {githubUser.public_repos} Public</span>
               {githubUser.total_private_repos !== undefined && (
                 <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> {githubUser.total_private_repos} Private</span>
               )}
            </div>
          </div>
        </div>
        
        {orgs.length > 0 && (
          <div className="flex flex-col items-start sm:items-end gap-2">
             <span className="text-xs font-semibold text-neutral-400 uppercase">Organizations</span>
             <div className="flex items-center gap-1 flex-wrap">
               {orgs.map(org => (
                 <img key={org.login} src={org.avatar_url} alt={org.login} title={org.login} className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-800" />
               ))}
             </div>
          </div>
        )}
      </div>

      {/* Repository Manager */}
      <div className="bg-white/40 dark:bg-neutral-900/30 backdrop-blur-xl border border-neutral-200/40 dark:border-neutral-800/40 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest flex items-center gap-2">
            <Github className="w-5 h-5 text-neutral-800 dark:text-white" /> Repository Manager
          </h3>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs outline-none focus:border-blue-500 w-32 sm:w-48 transition-all"
              />
            </div>
            
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value as any)}
              className="px-2 py-1.5 bg-white/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs outline-none focus:border-blue-500"
            >
              <option value="all">All Repos</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>

            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2 py-1.5 bg-white/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs outline-none focus:border-blue-500"
            >
              <option value="updated">Recently Updated</option>
              <option value="stars">Most Stars</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">
             <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-xs text-center p-4">{error}</p>
        ) : filteredRepos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredRepos.map((repo) => (
              <motion.button
                key={repo.id}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/${repo.full_name}`)}
                className="flex flex-col text-left p-4 rounded-xl bg-white/60 dark:bg-neutral-900/60 border border-neutral-200/10 dark:border-neutral-800/10 hover:bg-white dark:hover:bg-neutral-800 shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  {repo.private ? (
                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <Code2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  )}
                  <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">{repo.name}</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate w-full mt-1 mb-3 flex-1">
                  {repo.description || 'No description'}
                </p>
                <div className="flex justify-between items-center w-full text-[10px] text-neutral-400 font-medium mt-auto">
                  <span>{new Date(repo.updated_at).toLocaleDateString()}</span>
                  <span className="text-blue-500 font-semibold group-hover:underline">Explore</span>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 text-xs text-center p-8">No repositories match your criteria.</p>
        )}
      </div>
    </div>
  );
}

