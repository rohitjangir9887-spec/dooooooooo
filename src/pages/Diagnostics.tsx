import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Server, Globe, AlertCircle, CheckCircle2, Github, XCircle, ArrowLeft, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Diagnostics() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  
  const origin = 'https://ramrepo.ramagro.workers.dev';
  const callbackUrl = `${origin}/api/auth/github/callback`;
  const isPreview = false; // Disabled preview check as per user request

  const runDiagnostics = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/auth/github/diagnostics');
      const backendData = await res.json();
      
      let reachable = false;
      try {
        const ping = await fetch(`/api/auth/github/url?origin=${encodeURIComponent(origin)}`);
        if (ping.ok) reachable = true;
      } catch (e) {}

      setData({
        ...backendData,
        reachable
      });
    } catch (error) {
      console.error(error);
      setData({
        clientIdLoaded: false,
        clientSecretLoaded: false,
        sessionConfigured: false,
        reachable: false
      });
    }
    setTesting(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="flex-1 min-h-screen pt-24 pb-28 p-4 flex flex-col items-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            OAuth Diagnostics
          </h1>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4" /> Environment
            </h2>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-neutral-700 dark:text-neutral-300">Current Origin</span>
                <div className="flex items-center gap-2 bg-neutral-200 dark:bg-neutral-700 px-3 py-2 rounded-lg">
                  <span className="font-mono text-sm break-all flex-1">{origin}</span>
                  <button onClick={() => navigator.clipboard.writeText(origin)} className="p-1.5 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-md transition-colors" title="Copy Origin">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-neutral-700 dark:text-neutral-300">OAuth Callback URL</span>
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 px-3 py-2 rounded-lg">
                  <span className="font-mono text-sm text-blue-800 dark:text-blue-300 break-all flex-1">{callbackUrl}</span>
                  <button onClick={() => navigator.clipboard.writeText(callbackUrl)} className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 rounded-md transition-colors" title="Copy Callback URL">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-neutral-700 dark:text-neutral-300">AI Studio Preview</span>
                {isPreview ? (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500 font-medium"><AlertCircle className="w-4 h-4" /> Yes</span>
                ) : (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-500 font-medium"><CheckCircle2 className="w-4 h-4" /> No</span>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4" /> Backend Configuration
            </h2>
            
            {!data ? (
              <div className="text-center py-4 text-neutral-500 animate-pulse">Loading backend status...</div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-700 dark:text-neutral-300">GitHub Client ID loaded</span>
                  {data.clientIdLoaded ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-700 dark:text-neutral-300">GitHub Client Secret loaded</span>
                  {data.clientSecretLoaded ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-700 dark:text-neutral-300">Session configured</span>
                  {data.sessionConfigured ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-700 dark:text-neutral-300">OAuth endpoint reachable</span>
                  {data.reachable ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
            )}
          </div>
          
          {isPreview && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
              <div className="flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  You are currently running in the AI Studio preview environment. GitHub OAuth will not work because the AI Studio <code>applet-auth-bridge</code> proxy intercepts external callbacks (like the one from GitHub) with a 403 Access Denied error. Deploy the app to a provider like Vercel, Netlify, or Render to use authentication.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button 
              onClick={runDiagnostics}
              disabled={testing}
              className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
            >
              {testing ? <span className="animate-pulse">Testing...</span> : <><ShieldCheck className="w-5 h-5" /> Test OAuth</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
