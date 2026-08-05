import { PLANS, PlanId } from '../config/plans';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Zap, ArrowRight, ShieldCheck, Sparkles, Star, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function Plans() {
  const { userProfile, updateUserProfile, addToast } = useAppStore();
  const navigate = useNavigate();

  const handleSelectPlan = (planId: PlanId) => {
    updateUserProfile({ planId });
    addToast(`Plan upgraded to ${PLANS[planId].name}!`, 'success');
    navigate('/settings');
  };

  return (
    <div className="min-h-screen pt-24 pb-28 md:pb-12 bg-transparent text-neutral-900 dark:text-neutral-100 px-4 md:px-8 relative overflow-hidden flex flex-col items-center justify-start">
      
      {/* iOS style sticky-styled prominent Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-200/40 dark:border-neutral-800/40 text-blue-500 dark:text-blue-400 text-xs font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer focus:outline-none"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
          <span>Home</span>
        </motion.button>
      </div>

      {/* iOS Ambient Glows */}
      <div className="absolute top-[-10%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-purple-300/20 to-indigo-400/20 dark:from-purple-900/10 dark:to-indigo-900/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-blue-300/20 to-teal-400/20 dark:from-blue-900/10 dark:to-teal-900/10 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="max-w-6xl w-full z-10 flex flex-col items-center"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 border border-blue-500/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Premium Subscription Plans</span>
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-700 dark:from-white dark:via-neutral-100 dark:to-neutral-300 mb-4 font-sans">
            Supercharge your workflow
          </h1>
          <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            Choose the perfect plan to explore, analyze, and export GitHub repositories at scale. Instant setup in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch w-full max-w-5xl px-2">
          {Object.values(PLANS).map((plan, index) => {
            const isCurrent = userProfile.planId === plan.id;
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                key={plan.id}
                className={`relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 border flex flex-col transition-all ${
                  isCurrent 
                    ? 'border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/20' 
                    : plan.id === 'unlimited' 
                      ? 'border-purple-500 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20'
                      : 'border-neutral-200/40 dark:border-neutral-800/40 shadow-sm hover:border-blue-300 dark:hover:border-blue-700/50'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-extrabold tracking-wider shadow-md shadow-blue-500/20">
                    CURRENT PLAN
                  </div>
                )}
                {plan.id === 'unlimited' && !isCurrent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-extrabold tracking-wider flex items-center gap-1 shadow-md shadow-purple-500/20">
                    <Zap className="w-3 h-3 animate-bounce" /> POPULAR Choice
                  </div>
                )}

                <div className="mb-6">
                  <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">{plan.id} tier</span>
                  <h3 className="text-2xl font-black mt-1 text-neutral-800 dark:text-neutral-100">{plan.name}</h3>
                </div>

                <div className="flex items-baseline gap-1 mb-6 border-b border-neutral-200/20 dark:border-neutral-800/20 pb-6">
                  <span className="text-4xl font-black text-neutral-900 dark:text-white">{plan.price}</span>
                  <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">/{plan.interval}</span>
                </div>

                <ul className="space-y-3.5 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.id === 'unlimited' ? 'text-purple-500' : 'text-blue-500'}`} />
                      <span className="text-xs md:text-sm text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: isCurrent ? 1 : 1.02 }}
                  whileTap={{ scale: isCurrent ? 1 : 0.97 }}
                  onClick={() => !isCurrent && handleSelectPlan(plan.id as PlanId)}
                  disabled={isCurrent}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-default border border-neutral-200/20 dark:border-neutral-700/20'
                      : plan.id === 'unlimited'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white shadow-lg shadow-purple-500/15'
                        : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90'
                  }`}
                >
                  <span>{isCurrent ? 'Active Plan' : 'Select Plan'}</span>
                  {!isCurrent && <ArrowRight className="w-4 h-4" />}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
        
        <div className="mt-12 text-center flex flex-col items-center">
          <motion.div 
            whileHover={{ y: -1 }}
            className="inline-flex items-center gap-2 text-xs text-neutral-500 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl px-4 py-2 rounded-full border border-neutral-200/30 dark:border-neutral-800/40 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure local processing. Limits are for demonstration purposes.</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
