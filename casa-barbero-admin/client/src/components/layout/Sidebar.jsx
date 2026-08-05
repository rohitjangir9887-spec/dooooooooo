import { AnimatePresence, motion } from "framer-motion";
import { Calendar, CreditCard, Grid2X2, List, LogOut, RefreshCw, SlidersHorizontal, User } from "lucide-react";
import { navigate } from "../../services/navigation.js";

const nav = [
  { path: "/admin/dashboard", label: "Dashboard", icon: Grid2X2 },
  { path: "/admin/schedule", label: "Schedule", icon: Calendar },
  { path: "/admin/bookings", label: "Bookings", icon: List },
  { path: "/admin/barbers", label: "Barbers", icon: User },
  { path: "/admin/payments", label: "Payments", icon: CreditCard },
  { path: "/admin/sync", label: "Google Sync", icon: RefreshCw },
  { path: "/admin/settings", label: "Settings", icon: SlidersHorizontal }
];

export default function Sidebar({ path, onLogout, drawer, onClose, user }) {
  return (
    <>
      <AnimatePresence>{drawer ? <motion.button className="mobile-scrim" aria-label="Close navigation" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /> : null}</AnimatePresence>
      <aside className={`sidebar ${drawer ? "open" : ""}`}>
        <div className="side-top">
          <div className="brand-row">
            <div className="logo-mark">B</div>
            <div>
              <strong>CASA BARBERO</strong>
              <span>Admin</span>
            </div>
          </div>
        </div>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = path === item.path;
            return (
              <button className={active ? "active" : ""} key={item.path} type="button" onClick={() => { navigate(item.path); onClose(); }}>
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="owner-block">
          <div className="avatar">{(user?.name || "").split(" ").map((w) => w[0]).join("").toUpperCase() || "?"}</div>
          <div>
            <strong>{user?.name ?? ""}</strong>
            <span>{user?.role ?? ""}</span>
          </div>
          <button type="button" onClick={onLogout} aria-label="Log out"><LogOut size={16} /></button>
        </div>
      </aside>
    </>
  );
}
