import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import Sidebar from "../components/layout/Sidebar.jsx";
import { api } from "../services/api.js";
import { ToastProvider } from "../components/ui/toast.jsx";
import { sessionStorage } from "../services/sessionStorage.js";

// Each page is its own chunk so heavy dependencies (chart.js) load on demand
const BarbersPage = lazy(() => import("../pages/BarbersPage.jsx"));
const BookingsPage = lazy(() => import("../pages/BookingsPage.jsx"));
const DashboardPage = lazy(() => import("../pages/DashboardPage.jsx"));
const PaymentsPage = lazy(() => import("../pages/PaymentsPage.jsx"));
const SchedulePage = lazy(() => import("../pages/SchedulePage.jsx"));
const SettingsPage = lazy(() => import("../pages/SettingsPage.jsx"));
const SyncPage = lazy(() => import("../pages/SyncPage.jsx"));

function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-hidden="true">
      <span className="skeleton-line title" />
      <div className="skeleton-row">
        <span className="skeleton-block" /><span className="skeleton-block" /><span className="skeleton-block" /><span className="skeleton-block" />
      </div>
      <span className="skeleton-block tall" />
    </div>
  );
}

export default function AdminApp({ path, onLogout }) {
  const [drawer, setDrawer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [catalog, setCatalog] = useState({ services: [], workingHours: [], blockedTimes: [], tagColors: [] });
  const [settings, setSettings] = useState(null);
  const [sync, setSync] = useState(null);
  const user = sessionStorage.get()?.user ?? null;

  useEffect(() => {
    Promise.allSettled([
      api("/api/admin/bookings"),
      api("/api/admin/dashboard"),
      api("/api/admin/barbers"),
      api("/api/admin/payments"),
      api("/api/admin/settings"),
      api("/api/admin/sync")
    ]).then(([bookingRes, dashRes, barberRes, paymentRes, settingsRes, syncRes]) => {
      if (bookingRes.status === "fulfilled") setBookings(bookingRes.value.bookings);
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      if (barberRes.status === "fulfilled") {
        const { barbers: b, workingHours, services, blockedTimes, tagColors } = barberRes.value;
        setBarbers(b);
        setCatalog({ services, workingHours, blockedTimes, tagColors: tagColors || [] });
      }
      if (paymentRes.status === "fulfilled") {
        setPayments(paymentRes.value.transactions);
        setDailyRevenue(paymentRes.value.dailyRevenue);
      }
      if (settingsRes.status === "fulfilled") setSettings(settingsRes.value);
      if (syncRes.status === "fulfilled") setSync(syncRes.value);
      setLoading(false);
    });
  }, []);

  const page = path.split("/").pop();
  return (
    <ToastProvider>
    <div className="admin-shell">
      <button className="hamburger" type="button" onClick={() => setDrawer(true)} aria-label="Open navigation"><Menu size={20} /></button>
      <Sidebar path={path} onLogout={onLogout} drawer={drawer} onClose={() => setDrawer(false)} user={user} />
      <main className="main-area">
        {loading ? <PageSkeleton /> : (
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
            <Suspense fallback={null}>
            {page === "dashboard" && <DashboardPage data={dashboard} bookings={bookings} transactions={payments} dailyRevenue={dailyRevenue} barbers={barbers} settings={settings} />}
            {page === "schedule" && <SchedulePage bookings={bookings} barbers={barbers} catalog={catalog} setBookings={setBookings} setCatalog={setCatalog} />}
            {page === "bookings" && <BookingsPage bookings={bookings} barbers={barbers} setBookings={setBookings} />}
            {page === "barbers" && <BarbersPage barbers={barbers} catalog={catalog} setBarbers={setBarbers} setCatalog={setCatalog} />}
            {page === "payments" && <PaymentsPage transactions={payments} dailyRevenue={dailyRevenue} barbers={barbers} />}
            {page === "sync" && <SyncPage sync={sync} user={user} />}
            {page === "settings" && <SettingsPage settings={settings} user={user} onLogout={onLogout} />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
        )}
      </main>
    </div>
    </ToastProvider>
  );
}
