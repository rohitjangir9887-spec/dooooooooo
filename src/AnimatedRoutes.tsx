import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import Home from "./pages/Home";
import Explorer from "./pages/Explorer";
import Settings from "./pages/Settings";
import Plans from "./pages/Plans";
import Import from "./pages/Import";
import Diagnostics from "./pages/Diagnostics";
import DeploymentDiagnostics from "./pages/DeploymentDiagnostics";
import TrashManager from "./pages/TrashManager";
import VerificationRunner from "./pages/VerificationRunner";

const pageVariants = {
  initial: { opacity: 0, y: 10, filter: "blur(4px)" },
  in: { opacity: 1, y: 0, filter: "blur(0px)" },
  out: { opacity: 0, y: -10, filter: "blur(4px)" },
};

const pageTransition = {
  duration: 0.3,
};

export function AnimatedRoutes() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const redirectTo = localStorage.getItem('github_redirect_after_login');
    if (redirectTo) {
      localStorage.removeItem('github_redirect_after_login');
      navigate(redirectTo, { replace: true });
    }
  }, [navigate]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.split('/')[1] || '/'}>
        <Route path="/" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full flex flex-col"><Home /></motion.div>} />
        <Route path="/import" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full flex flex-col"><Import /></motion.div>} />
        <Route path="/settings" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full flex flex-col"><Settings /></motion.div>} />
        <Route path="/settings/trash" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full flex flex-col"><TrashManager /></motion.div>} />
        <Route path="/plans" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full flex flex-col"><Plans /></motion.div>} />
        <Route path="/diagnostics" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full flex flex-col"><Diagnostics /></motion.div>} />
        <Route path="/deployment-diagnostics" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full flex flex-col"><DeploymentDiagnostics /></motion.div>} />
        <Route path="/verification" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full flex flex-col"><VerificationRunner /></motion.div>} />
        <Route path="/:owner/:repo/*" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="h-full flex flex-col"><Explorer /></motion.div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
