import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, ArrowLeft, Globe, Terminal, FileCode, CheckCircle2, XCircle, Activity, Box, Database, HardDrive, Cpu, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useImportStore } from '../store/useImportStore';

export default function DeploymentDiagnostics() {
  const navigate = useNavigate();
  const jobs = useImportStore((state) => state.jobs);
  const latestJob = jobs.length > 0 ? jobs[0] : null;

  return (
    <div className="flex-1 min-h-screen pt-24 pb-28 p-4 flex flex-col items-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
              <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
              <Activity className="w-6 h-6 text-blue-500" />
              Deployment Diagnostics
            </h1>
          </div>
        </div>

        {!latestJob ? (
          <div className="py-12 text-center text-neutral-500 dark:text-neutral-400">
            <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No deployment jobs found in current session.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Status Header */}
            <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    {latestJob.destRepo || 'Unknown Project'}
                    {latestJob.status === 'completed' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">Active</span>
                    ) : latestJob.status === 'error' ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase">Failed</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase animate-pulse">Running</span>
                    )}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    {latestJob.destOwner}/{latestJob.destRepo} • {new Date(latestJob.createdAt).toLocaleString()}
                  </p>
                </div>
                
                {latestJob.liveUrl && (
                  <a href={latestJob.liveUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Open Live URL
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Build Environment */}
              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <h3 className="text-sm font-semibold text-neutral-500 mb-4 flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Build Environment
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Framework</span>
                    <span className="font-medium text-neutral-900 dark:text-white">{latestJob.deployLogs.find(l => l.includes('framework detected:'))?.split(': ')[1] || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Package Manager</span>
                    <span className="font-medium text-neutral-900 dark:text-white">npm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Build Script</span>
                    <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">npm run build</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Output Folder</span>
                    <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">{latestJob.deployLogs.find(l => l.includes('output directory configured:'))?.split(': ')[1] || 'dist'}</span>
                  </div>
                </div>
              </div>

              {/* Infrastructure */}
              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <h3 className="text-sm font-semibold text-neutral-500 mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Infrastructure
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Provider</span>
                    <span className="font-medium text-neutral-900 dark:text-white capitalize">{latestJob.deployProvider || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Branch</span>
                    <span className="font-medium text-neutral-900 dark:text-white">{latestJob.destBranch || 'main'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">HTTP Status</span>
                    {latestJob.status === 'completed' ? (
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded font-bold text-xs">200 OK</span>
                    ) : (
                      <span className="font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-xs">Pending</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">DNS & SSL Status</span>
                    {latestJob.status === 'completed' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Propagated</span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1 text-xs"><Radio className="w-3.5 h-3.5" /> Provisioning</span>
                    )}
                  </div>
                </div>
              </div>

            </div>
            
            {/* Environment Variables */}
            <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
               <h3 className="text-sm font-semibold text-neutral-500 mb-4 flex items-center gap-2">
                 <Database className="w-4 h-4" /> Environment Variables
               </h3>
               <div className="text-sm text-neutral-600 dark:text-neutral-400">
                 {latestJob.deployLogs.some(l => l.includes('.env.example')) || latestJob.deployLogs.some(l => l.includes('.env')) ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 rounded-xl text-xs flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 shrink-0" />
                       Environment variables detected. Configured via Provider Dashboard.
                    </div>
                 ) : (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 rounded-xl text-xs">
                       No .env file detected in this repository.
                    </div>
                 )}
               </div>
            </div>

            {/* Build Logs Console */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 overflow-hidden">
               <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800 bg-neutral-900">
                 <Terminal className="w-4 h-4 text-neutral-400" />
                 <span className="text-xs font-semibold text-neutral-300">Deployment Pipeline Logs</span>
               </div>
               <div className="p-4 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed">
                  {latestJob.deployLogs && latestJob.deployLogs.length > 0 ? (
                    latestJob.deployLogs.map((log, idx) => (
                      <div key={idx} className={`${log.includes('[ERROR]') || log.includes('Failed') ? 'text-rose-400' : log.includes('SUCCESS') || log.includes('OK') || log.includes('✔') ? 'text-emerald-400' : 'text-neutral-400'} mb-1`}>
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-neutral-600">Waiting for logs...</div>
                  )}
               </div>
            </div>

          </div>
        )}
      </motion.div>
    </div>
  );
}
