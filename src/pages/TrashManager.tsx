import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Search, Filter, RotateCcw, ShieldAlert, File, Folder, Image, Video, FileArchive, Github, Package } from 'lucide-react';
import { useSecureDeleteStore, TrashItem } from '../store/useSecureDeleteStore';

function RemainingTime({ deletedAt }: { deletedAt: number }) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const calculate = () => {
      const ms = (deletedAt + 5 * 60 * 1000) - Date.now();
      setRemaining(Math.max(0, ms));
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [deletedAt]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  return (
    <span className={`font-mono text-xs ${remaining < 60000 ? 'text-red-500' : 'text-neutral-500'}`}>
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'file': return <File className="w-4 h-4 text-neutral-500" />;
    case 'folder': return <Folder className="w-4 h-4 text-blue-500" />;
    case 'image': return <Image className="w-4 h-4 text-purple-500" />;
    case 'video': return <Video className="w-4 h-4 text-pink-500" />;
    case 'zip': return <FileArchive className="w-4 h-4 text-yellow-500" />;
    case 'repository': return <Github className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />;
    case 'workspace': return <Package className="w-4 h-4 text-indigo-500" />;
    default: return <Trash2 className="w-4 h-4 text-neutral-500" />;
  }
};

export default function TrashManager() {
  const navigate = useNavigate();
  const { trashItems, restoreItem, permanentlyDelete, clearExpired } = useSecureDeleteStore();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'deletedAt' | 'remainingTime'>('deletedAt');

  // Trigger reaping on mount
  useEffect(() => {
    clearExpired();
  }, [clearExpired]);

  const filteredItems = useMemo(() => {
    let result = trashItems;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.originalPath.toLowerCase().includes(q) || 
        item.repository.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'deletedAt') return b.deletedAt - a.deletedAt;
      if (sortBy === 'remainingTime') {
        const timeA = a.deletedAt + 5 * 60 * 1000;
        const timeB = b.deletedAt + 5 * 60 * 1000;
        return timeA - timeB;
      }
      return 0;
    });

    return result;
  }, [trashItems, search, sortBy]);

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            <div className="p-2.5 bg-red-500 text-white rounded-2xl shadow-md shadow-red-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-800 dark:text-white">Trash Manager</h1>
              <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                {trashItems.length} Items
              </span>
            </div>
          </div>
          
          <button 
            onClick={clearExpired}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            Clear Expired
          </button>
        </div>

        {/* Filters & Sort */}
        <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl p-4 rounded-2xl border border-neutral-200/30 dark:border-neutral-800/40 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name, path, or repository..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full sm:w-40 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500"
            >
              <option value="deletedAt">Delete Time</option>
              <option value="remainingTime">Remaining Time</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200/30 dark:border-neutral-800/40 shadow-sm overflow-hidden min-h-[400px]">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-neutral-400 dark:text-neutral-500">
              <Trash2 className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">Trash is empty</p>
              <p className="text-xs mt-1">Items are automatically deleted after 5 minutes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500">Original Path</th>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500">Repository</th>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500">Deleted</th>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500">Remaining</th>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredItems.map(item => (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 group"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getIconForType(item.type)}
                            <span className="font-medium text-sm text-neutral-800 dark:text-neutral-200 truncate max-w-[150px] sm:max-w-[200px]" title={item.name}>
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-500 truncate max-w-[150px]" title={item.originalPath}>
                          {item.originalPath}
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-500">
                          {item.repository}
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-500">
                          {new Date(item.deletedAt).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3">
                          <RemainingTime deletedAt={item.deletedAt} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => restoreItem(item.id)}
                              className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                              title="Restore"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => permanentlyDelete(item.id)}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                              title="Delete Now"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
