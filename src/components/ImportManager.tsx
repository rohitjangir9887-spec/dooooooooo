import { useState, useEffect } from 'react';
import { 
  Play, FileArchive, Activity, Github, Trash2, Search, AlertCircle, 
  Plus, FolderGit, Network, Globe, Terminal, CheckCircle2, Lock, 
  Unlock, Settings, Link, Loader2, ArrowRight, Server, ChevronDown, ChevronUp
} from 'lucide-react';
import { useImportStore, ImportJob, ImportFile, ImportStep, DeployProvider } from '../store/useImportStore';
import { useAppStore } from '../store/useAppStore';
import { useSecureDeleteStore } from '../store/useSecureDeleteStore';
import { importFromZip, importFromUrl, executeImportJob } from '../lib/importService';
import { motion, AnimatePresence } from 'motion/react';

export function ImportManager() {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const jobs = useImportStore(state => state.jobs);
  const removeJob = useImportStore(state => state.removeJob);
  const clearCompletedJobs = useImportStore(state => state.clearCompletedJobs);
  const addToast = useAppStore(state => state.addToast);
  const { requestDelete, moveToTrash } = useSecureDeleteStore();

  // Tabs
  const [sourceTab, setSourceTab] = useState<'zip' | 'url'>('zip');
  const [destOption, setDestOption] = useState<'create' | 'existing'>('create');

  // New Repository Form
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);

  // Existing Repository Form
  const [destRepo, setDestRepo] = useState('');
  const [destBranch, setDestBranch] = useState('main');

  // Input Data
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [importUrl, setImportUrl] = useState('');

  // Deployment Options
  const [deployProvider, setDeployProvider] = useState<DeployProvider>('vercel');
  const [vercelToken, setVercelToken] = useState(() => localStorage.getItem('vercel_token') || '');
  const [vercelTeamId, setVercelTeamId] = useState(() => localStorage.getItem('vercel_team_id') || '');
  const [vercelProjectId, setVercelProjectId] = useState(() => localStorage.getItem('vercel_project_id') || '');
  const [netlifyToken, setNetlifyToken] = useState(() => localStorage.getItem('netlify_token') || '');
  const [netlifySiteId, setNetlifySiteId] = useState(() => localStorage.getItem('netlify_site_id') || '');
  const [showCredentials, setShowCredentials] = useState(false);
  const [showMissingConfigDialog, setShowMissingConfigDialog] = useState(false);
  const [pendingDeployJobId, setPendingDeployJobId] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [myRepos, setMyRepos] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileFilter, setFileFilter] = useState('');
  const [expandedLogsJobId, setExpandedLogsJobId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyRepos();
    }
  }, [isAuthenticated]);

  // Persist Deployment Tokens
  useEffect(() => {
    localStorage.setItem('vercel_token', vercelToken);
  }, [vercelToken]);
  useEffect(() => {
    localStorage.setItem('vercel_team_id', vercelTeamId);
  }, [vercelTeamId]);
  useEffect(() => {
    localStorage.setItem('vercel_project_id', vercelProjectId);
  }, [vercelProjectId]);

  useEffect(() => {
    localStorage.setItem('netlify_token', netlifyToken);
  }, [netlifyToken]);
  useEffect(() => {
    localStorage.setItem('netlify_site_id', netlifySiteId);
  }, [netlifySiteId]);

  const fetchMyRepos = async () => {
    try {
      const res = await fetch('/api/github/user/repos?per_page=100');
      if (res.ok) {
        const data = await res.json();
        setMyRepos(data);
        if (data.length > 0 && !destRepo) {
          setDestRepo(data[0].full_name);
        }
      }
    } catch (err) {
      console.error("Failed to load user repositories", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        setZipFile(file);
        addToast('ZIP file loaded successfully: ' + file.name, 'success');
      } else {
        addToast('Unsupported file format. Please upload a .zip file.', 'error');
      }
    }
  };

  const handleStartImport = async () => {
    if (!isAuthenticated) {
      addToast('Please login to continue.', 'error');
      return;
    }

    let owner = '';
    let repo = '';
    let branch = destBranch || 'main';

    if (destOption === 'create') {
      if (!newRepoName.trim()) {
        addToast('Please specify a repository name', 'error');
        return;
      }
      repo = newRepoName.trim().replace(/\s+/g, '-').toLowerCase();
      // Owner will be detected automatically during job execution via GitHub profile
    } else {
      if (!destRepo) {
        addToast('Please select a destination repository', 'error');
        return;
      }
      const parts = destRepo.split('/');
      owner = parts[0];
      repo = parts[1];
    }

    setLoading(true);
    try {
      if (sourceTab === 'zip') {
        if (!zipFile) {
          addToast('Please select a ZIP file to upload', 'error');
          setLoading(false);
          return;
        }
        await importFromZip(zipFile, destOption, owner, repo, branch);
        setZipFile(null);
      } else {
        if (!importUrl.trim()) {
          addToast('Please specify a valid source URL', 'error');
          setLoading(false);
          return;
        }
        await importFromUrl(importUrl.trim(), destOption, owner, repo, branch);
        setImportUrl('');
      }
      addToast('Automated workspace import pipeline triggered!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to start automated import', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunExecution = (jobId: string) => {
    executeImportJob(jobId);
    setExpandedLogsJobId(jobId);
    addToast('Import & deployment workflow triggered!', 'success');
  };

  const getStepProgressText = (step?: ImportStep) => {
    switch (step) {
      case 'analyzing': return 'Analyzing project...';
      case 'downloading': return 'Downloading...';
      case 'extracting': return 'Extracting ZIP...';
      case 'reading_files': return 'Reading files...';
      case 'creating_repo': return 'Creating repository...';
      case 'initializing_repo': return 'Initializing repository...';
      case 'detecting_branch': return 'Detecting default branch...';
      case 'uploading_files': return 'Uploading files...';
      case 'creating_commit': return 'Creating commit...';
      case 'pushing': return 'Pushing to GitHub...';
      case 'verifying': return 'Verifying upload...';
      case 'deploying': return 'Deploying...';
      case 'completed': return 'Deployment successful.';
      case 'error': return 'Execution Error Encountered';
      default: return 'Queued for processing...';
    }
  };

  return (
    <div className="w-full flex flex-col gap-8">
      
      {/* Configuration Hub */}
      <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
        
        {/* Step 1: Source Code Type */}
        <div>
          <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3">1. Select Project Source</h3>
          <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-2xl border border-neutral-200/20">
            <button 
              onClick={() => setSourceTab('zip')}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${sourceTab === 'zip' ? 'bg-white dark:bg-neutral-900 text-blue-600 shadow-sm border border-neutral-200/30' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <FileArchive className="w-4 h-4" /> ZIP File Upload
            </button>
            <button 
              onClick={() => setSourceTab('url')}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${sourceTab === 'url' ? 'bg-white dark:bg-neutral-900 text-blue-600 shadow-sm border border-neutral-200/30' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <Link className="w-4 h-4" /> Direct URL Import
            </button>
          </div>
        </div>

        {/* Source Inputs */}
        <AnimatePresence mode="wait">
          {sourceTab === 'zip' ? (
            <motion.div
              key="zip-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-500/5 scale-[1.01]' : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 hover:border-blue-400'}`}
                onClick={() => document.getElementById('zip-picker')?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  id="zip-picker" 
                  accept=".zip" 
                  className="hidden" 
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      if (!file.name.toLowerCase().endsWith('.zip')) {
                        addToast('Unsupported format. ZIP only.', 'error');
                      } else {
                        setZipFile(file);
                        addToast('Loaded: ' + file.name, 'success');
                      }
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-3">
                  <FileArchive className="w-6 h-6 text-blue-500" />
                </div>
                <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm mb-1">
                  {zipFile ? zipFile.name : 'Select or drop project ZIP file'}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {zipFile ? `${(zipFile.size / 1024 / 1024).toFixed(2)} MB` : 'Complete folder structures will be preserved'}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="url-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-2"
            >
              <div className="relative">
                <Network className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  placeholder="Paste GitHub Repository, ZIP, or general Git project URL..."
                  className="w-full bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed px-1">
                Supports standard GitHub repo URLs (e.g., <code>https://github.com/facebook/react</code>), Git URLs, or raw ZIP links. Files are downloaded and unpacked in-browser.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-[1px] bg-neutral-200/50 dark:bg-neutral-800/50" />

        {/* Step 2: Destination Option */}
        <div>
          <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3">2. Choose Destination</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setDestOption('create')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${destOption === 'create' ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 shadow-sm' : 'border-neutral-200 dark:border-neutral-800 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-950/20'}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${destOption === 'create' ? 'bg-blue-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">Create New Repository</h4>
                <p className="text-xs text-neutral-500 mt-0.5">Provision a new repository on your GitHub profile.</p>
              </div>
            </button>

            <button
              onClick={() => setDestOption('existing')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${destOption === 'existing' ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 shadow-sm' : 'border-neutral-200 dark:border-neutral-800 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-950/20'}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${destOption === 'existing' ? 'bg-blue-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                <FolderGit className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">Use Existing Repository</h4>
                <p className="text-xs text-neutral-500 mt-0.5">Push changes to an existing project or branch.</p>
              </div>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {destOption === 'create' ? (
              <motion.div 
                key="create-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden flex flex-col gap-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Repository Name</label>
                    <input 
                      type="text" 
                      value={newRepoName}
                      onChange={e => setNewRepoName(e.target.value)}
                      placeholder="my-new-app"
                      className="bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Privacy Status</label>
                    <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl h-[42px] border border-neutral-200/20">
                      <button 
                        onClick={() => setNewRepoPrivate(false)}
                        className={`flex-1 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${!newRepoPrivate ? 'bg-white dark:bg-neutral-900 text-blue-500 shadow-sm' : 'text-neutral-500'}`}
                      >
                        <Unlock className="w-3.5 h-3.5" /> Public
                      </button>
                      <button 
                        onClick={() => setNewRepoPrivate(true)}
                        className={`flex-1 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${newRepoPrivate ? 'bg-white dark:bg-neutral-900 text-blue-500 shadow-sm' : 'text-neutral-500'}`}
                      >
                        <Lock className="w-3.5 h-3.5" /> Private
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Description (Optional)</label>
                  <input 
                    type="text" 
                    value={newRepoDesc}
                    onChange={e => setNewRepoDesc(e.target.value)}
                    placeholder="Brief outline of the project scope..."
                    className="bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="existing-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden flex flex-col gap-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Select Project</label>
                    {isAuthenticated ? (
                      <select 
                        value={destRepo}
                        onChange={e => setDestRepo(e.target.value)}
                        className="bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="" disabled>Choose a project...</option>
                        {myRepos.map(r => (
                          <option key={r.id} value={r.full_name}>{r.full_name} {r.private ? '(🔒)' : ''}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        disabled 
                        value="Sign in with GitHub required" 
                        className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm opacity-50 cursor-not-allowed"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Target Branch</label>
                    <input 
                      type="text" 
                      value={destBranch}
                      onChange={e => setDestBranch(e.target.value)}
                      placeholder="main (automatically detected if empty)"
                      className="bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-[1px] bg-neutral-200/50 dark:bg-neutral-800/50" />

        {/* Submit Section */}
        <div className="flex justify-end pt-2">
          <button 
            onClick={handleStartImport}
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/15"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Prepare Workspace Project
          </button>
        </div>

      </div>

      {/* Workspace Import Queue / Jobs Monitor */}
      {jobs.length > 0 && (
        <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500 animate-pulse" /> Active Deployments Queue
            </h3>
            <button 
              onClick={() => {
                requestDelete('Completed Deployments', 'system', 'clear_completed_jobs');
              }}
              className="text-xs font-semibold text-neutral-500 hover:text-blue-500 transition-colors"
            >
              Clear Completed
            </button>
          </div>
          
          <div className="flex flex-col gap-4">
            {jobs.map(job => {
              const showResult = job.status === 'completed';
              const showLogs = expandedLogsJobId === job.id;
              
              return (
                <div key={job.id} className="bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200/50 dark:border-neutral-800/40 rounded-2xl p-5 flex flex-col gap-4">
                  
                  {/* Job Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                        {job.type === 'zip' ? <FileArchive className="w-5 h-5 text-blue-500" /> : <Github className="w-5 h-5 text-blue-500" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                          {job.sourceName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
                          <span>→</span>
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">
                            {job.destOwner || 'Pending'}/{job.destRepo}
                          </span>
                          <span className="bg-neutral-200/55 dark:bg-neutral-800/55 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400">
                            {job.destBranch || 'main'}
                          </span>
                          <span>•</span>
                          <span className={`capitalize font-semibold ${job.status === 'completed' ? 'text-green-500' : job.status === 'error' ? 'text-red-500' : 'text-blue-500'}`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        requestDelete(`Deployment Job: ${job.sourceName}`, 'system', 'remove_job', { jobId: job.id });
                      }}
                      className="p-2 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40 rounded-lg text-neutral-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Step-by-Step Progress Checklist (Requirements 9) */}
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200/40 dark:border-neutral-800/20">
                    <h5 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3">Workflow Execution Steps</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {[
                        { key: 'analyzing', label: 'Analyzing project' },
                        { key: 'downloading', label: 'Downloading files' },
                        { key: 'extracting', label: 'Extracting ZIP content' },
                        { key: 'reading_files', label: 'Reading files' },
                        { key: 'creating_repo', label: 'Creating repository' },
                        { key: 'initializing_repo', label: 'Initializing repository' },
                        { key: 'detecting_branch', label: 'Detecting default branch' },
                        { key: 'uploading_files', label: 'Uploading files' },
                        { key: 'creating_commit', label: 'Creating commit' },
                        { key: 'pushing', label: 'Pushing to GitHub' },
                        { key: 'verifying', label: 'Verifying upload integrity' },
                        { key: 'deploying', label: 'Cloud deployment' }
                      ].map((stepItem) => {
                        const stepKeysList = [
                          'analyzing',
                          'downloading',
                          'extracting',
                          'reading_files',
                          'creating_repo',
                          'initializing_repo',
                          'detecting_branch',
                          'uploading_files',
                          'creating_commit',
                          'pushing',
                          'verifying',
                          'deploying',
                          'completed'
                        ];
                        const currentIdx = stepKeysList.indexOf(job.currentStep || 'analyzing');
                        const stepIdx = stepKeysList.indexOf(stepItem.key);
                        
                        let icon = <div className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-700 shrink-0" />;
                        let textColor = "text-neutral-500 dark:text-neutral-400";
                        
                        if (job.status === 'error' && job.currentStep === stepItem.key) {
                          icon = <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />;
                          textColor = "text-red-500 font-semibold";
                        } else if (job.status === 'completed') {
                          icon = <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
                          textColor = "text-neutral-800 dark:text-neutral-200 font-medium";
                        } else if (stepIdx < currentIdx) {
                          icon = <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
                          textColor = "text-neutral-800 dark:text-neutral-200 font-medium";
                        } else if (stepIdx === currentIdx) {
                          icon = <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />;
                          textColor = "text-blue-600 dark:text-blue-400 font-semibold";
                        }

                        // Special case: skip creating_repo/initializing_repo if destOption is existing
                        if (job.destOption === 'existing' && (stepItem.key === 'creating_repo' || stepItem.key === 'initializing_repo') && stepIdx > currentIdx) {
                          return null;
                        }

                        return (
                          <div key={stepItem.key} className="flex items-center gap-2 text-xs">
                            {icon}
                            <span className={textColor}>{stepItem.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Progress Slider */}
                  <div className="w-full">
                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5 font-semibold">
                      <span>{getStepProgressText(job.currentStep)}</span>
                      <span>{Math.round(job.progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden border border-neutral-300/10">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${job.status === 'error' ? 'bg-red-500' : job.status === 'completed' ? 'bg-green-500' : 'bg-blue-600 animate-pulse'}`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Final Deployment Outcomes */}
                  {(showResult || job.status === 'deployed') && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex flex-col gap-3"
                    >
                      <h4 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> 4. GitHub Push Completed Successfully
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-neutral-500">Repository Link</span>
                          <a href={job.repoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-semibold flex items-center gap-1">
                            <Github className="w-3.5 h-3.5" /> View on GitHub <ArrowRight className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-neutral-500">Target Branch</span>
                          <span className="font-mono bg-neutral-200/50 dark:bg-neutral-800/50 px-1.5 py-0.5 rounded w-fit text-neutral-800 dark:text-neutral-200">
                            {job.destBranch}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-neutral-500">Commit Reference SHA</span>
                          <span className="font-mono text-neutral-700 dark:text-neutral-300 select-all truncate max-w-[220px]">
                            {job.commitSha || 'Initializing'}
                          </span>
                        </div>
                        {job.status === 'deployed' && job.liveUrl && (
                          <div className="flex flex-col gap-1">
                            <span className="text-neutral-500">Deployment Live URL</span>
                            <a href={job.liveUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline font-semibold flex items-center gap-1">
                              <Globe className="w-3.5 h-3.5" /> Visit Production App <ArrowRight className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {showResult && job.status === 'completed' && (
                        <div className="mt-2 border-t border-green-500/20 pt-4">
                           <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest flex items-center gap-2">
                              <Server className="w-4 h-4 text-blue-500" /> 5. Deploy to Production
                            </h3>
                            <button 
                              onClick={() => setShowCredentials(!showCredentials)}
                              className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                            >
                              <Settings className="w-3.5 h-3.5" /> API Config
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <button
                              onClick={() => setDeployProvider('github')}
                              className={`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${deployProvider === 'github' ? 'border-blue-500 bg-blue-500/5' : 'border-green-500/20 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-950/20'}`}
                            >
                              <Github className="w-4 h-4 text-neutral-800 dark:text-neutral-200 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">GitHub Repository</h4>
                                <p className="text-[10px] text-neutral-500 mt-0.5">Prepare, validate, push code</p>
                              </div>
                            </button>

                            <button
                              onClick={() => setDeployProvider('vercel')}
                              className={`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${deployProvider === 'vercel' ? 'border-blue-500 bg-blue-500/5' : 'border-green-500/20 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-950/20'}`}
                            >
                              <svg className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" viewBox="0 0 76 65" fill="currentColor">
                                <path d="M37.5 0L75 65H0L37.5 0Z" />
                              </svg>
                              <div>
                                <h4 className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">Vercel Deploy</h4>
                                <p className="text-[10px] text-neutral-500 mt-0.5">Link and push production edges</p>
                              </div>
                            </button>

                            <button
                              onClick={() => setDeployProvider('netlify')}
                              className={`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${deployProvider === 'netlify' ? 'border-blue-500 bg-blue-500/5' : 'border-green-500/20 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-950/20'}`}
                            >
                              <svg className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0a12 12 0 00-12 12 12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm1.75 5.5v3.25h3.25a.75.75 0 010 1.5h-3.25V13.5a.75.75 0 01-1.5 0V10.25H9a.75.75 0 010-1.5h3.25V5.5a.75.75 0 011.5 0zm-5.5 12h5.5a.75.75 0 010 1.5h-5.5a.75.75 0 010-1.5zm.37-3.87h4.75a.75.75 0 010 1.5H8.62a.75.75 0 010-1.5z" />
                              </svg>
                              <div>
                                <h4 className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">Netlify Deploy</h4>
                                <p className="text-[10px] text-neutral-500 mt-0.5">Build CDN nodes instantly</p>
                              </div>
                            </button>
                          </div>

                          <AnimatePresence>
                            {showCredentials && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden bg-neutral-50 dark:bg-neutral-950/20 border border-neutral-200/50 dark:border-neutral-800/40 rounded-2xl p-4 flex flex-col gap-3 mb-4"
                              >
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
                                    <svg className="w-3 h-3 text-black dark:text-white" viewBox="0 0 76 65" fill="currentColor"><path d="M37.5 0L75 65H0L37.5 0Z" /></svg>
                                    Vercel API Token (Optional)
                                  </label>
                                  <input 
                                    type="password" 
                                    value={vercelToken}
                                    onChange={e => setVercelToken(e.target.value)}
                                    placeholder="Paste your Vercel Personal Token..."
                                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
                                    <svg className="w-3 h-3 text-teal-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 00-12 12 12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm1.75 5.5v3.25h3.25a.75.75 0 010 1.5h-3.25V13.5a.75.75 0 01-1.5 0V10.25H9a.75.75 0 010-1.5h3.25V5.5a.75.75 0 011.5 0zm-5.5 12h5.5a.75.75 0 010 1.5h-5.5a.75.75 0 010-1.5zm.37-3.87h4.75a.75.75 0 010 1.5H8.62a.75.75 0 010-1.5z" /></svg>
                                    Netlify Personal Token (Optional)
                                  </label>
                                  <input 
                                    type="password" 
                                    value={netlifyToken}
                                    onChange={e => setNetlifyToken(e.target.value)}
                                    placeholder="Paste your Netlify Personal Access Token..."
                                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                if (deployProvider === 'vercel' && !vercelToken.trim()) {
                                  setPendingDeployJobId(job.id);
                                  setShowMissingConfigDialog(true);
                                  return;
                                }
                                if (deployProvider === 'netlify' && (!netlifyToken.trim() || !netlifySiteId.trim())) {
                                  setPendingDeployJobId(job.id);
                                  setShowMissingConfigDialog(true);
                                  return;
                                }

                                import('../lib/importService').then(({ runCloudDeployment }) => {
                                  runCloudDeployment(job.id, deployProvider, deployProvider === 'vercel' ? vercelToken : netlifyToken, deployProvider === 'vercel' ? vercelTeamId : undefined, deployProvider === 'vercel' ? vercelProjectId : undefined, deployProvider === 'netlify' ? netlifySiteId : undefined);
                                });
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/15"
                            >
                              Deploy to {deployProvider === 'vercel' ? 'Vercel' : deployProvider === 'netlify' ? 'Netlify' : 'GitHub'}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Terminal Deploy Logs (Requirement 8) */}
                  {job.deployLogs && job.deployLogs.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => setExpandedLogsJobId(showLogs ? null : job.id)}
                        className="text-xs font-semibold text-neutral-500 hover:text-blue-500 flex items-center gap-1 self-start transition-colors"
                      >
                        <Terminal className="w-3.5 h-3.5 text-blue-500" /> 
                        {showLogs ? 'Hide Console Logs' : 'View Real-time Console Logs'} 
                        {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {showLogs && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="font-mono text-[11px] bg-neutral-900 text-neutral-200 rounded-xl p-4 overflow-x-auto max-h-56 leading-relaxed flex flex-col gap-1 border border-neutral-800"
                        >
                          {job.deployLogs.map((log, lIdx) => (
                            <div key={lIdx} className="whitespace-pre">{log}</div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Action Triggers */}
                  {job.status === 'confirming' && (
                    <button 
                      onClick={() => handleRunExecution(job.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 hover:scale-[1.01]"
                    >
                      <Play className="w-4 h-4" /> Trigger Automated Commit & Cloud Deploy
                    </button>
                  )}

                  {/* Error Notification (Requirement 10) */}
                  {job.error && (
                    <div className="text-xs text-red-500 bg-red-500/5 p-3 rounded-xl border border-red-500/20 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <div>
                        <span className="font-semibold block mb-0.5">
                          {job.error === 'Deployment configuration required.' 
                            ? 'Deployment Skipped' 
                            : 'Automated push or configuration failure'}
                        </span>
                        <span>{job.error}</span>
                        {job.error !== 'Deployment configuration required.' && (
                          <button 
                            onClick={() => handleRunExecution(job.id)}
                            className="mt-2 block bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all"
                          >
                            Retry Workflow
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showMissingConfigDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 dark:border-neutral-800"
            >
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Missing Configuration</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Required fields:
                </p>
                {deployProvider === 'vercel' ? (
                  <ul className="list-disc pl-5 text-sm text-neutral-800 dark:text-neutral-200 space-y-1 mb-6">
                    <li>Vercel Token</li>
                    <li>Team ID (optional)</li>
                    <li>Project ID (optional)</li>
                  </ul>
                ) : (
                  <ul className="list-disc pl-5 text-sm text-neutral-800 dark:text-neutral-200 space-y-1 mb-6">
                    <li>Netlify Token</li>
                    <li>Site ID</li>
                  </ul>
                )}
                
                <div className="flex flex-col gap-4">
                  {deployProvider === 'vercel' ? (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-neutral-500">Vercel Token <span className="text-red-500">*</span></label>
                        <input 
                          type="password" 
                          value={vercelToken}
                          onChange={e => setVercelToken(e.target.value)}
                          className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-neutral-500">Team ID (optional)</label>
                        <input 
                          type="text" 
                          value={vercelTeamId}
                          onChange={e => setVercelTeamId(e.target.value)}
                          className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-neutral-500">Project ID (optional)</label>
                        <input 
                          type="text" 
                          value={vercelProjectId}
                          onChange={e => setVercelProjectId(e.target.value)}
                          className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-neutral-500">Netlify Token <span className="text-red-500">*</span></label>
                        <input 
                          type="password" 
                          value={netlifyToken}
                          onChange={e => setNetlifyToken(e.target.value)}
                          className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-neutral-500">Site ID <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          value={netlifySiteId}
                          onChange={e => setNetlifySiteId(e.target.value)}
                          className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex justify-between gap-3">
                <button 
                  onClick={() => setShowCredentials(true)}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-600 px-4 py-2"
                >
                  Open Deployment Settings
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setShowMissingConfigDialog(false);
                      setPendingDeployJobId(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (deployProvider === 'vercel' && !vercelToken.trim()) return;
                      if (deployProvider === 'netlify' && (!netlifyToken.trim() || !netlifySiteId.trim())) return;
                      
                      setShowMissingConfigDialog(false);
                      if (pendingDeployJobId) {
                        import('../lib/importService').then(({ runCloudDeployment }) => {
                          runCloudDeployment(pendingDeployJobId, deployProvider, deployProvider === 'vercel' ? vercelToken : netlifyToken, deployProvider === 'vercel' ? vercelTeamId : undefined, deployProvider === 'vercel' ? vercelProjectId : undefined, deployProvider === 'netlify' ? netlifySiteId : undefined);
                        });
                        setPendingDeployJobId(null);
                      }
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
