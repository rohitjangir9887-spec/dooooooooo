import { lazy, Suspense, useEffect, useState } from "react";
import { usePathname } from "../hooks/usePathname.js";
import { api } from "../services/api.js";
import { navigate } from "../services/navigation.js";
import { sessionStorage } from "../services/sessionStorage.js";
import LoginPage from "../pages/LoginPage.jsx";

// Heavy admin shell and rarely-visited pages load on demand
const AdminApp = lazy(() => import("./AdminApp.jsx"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage.jsx"));
const NotFound = lazy(() => import("../pages/errors/NotFound.jsx"));

const KNOWN_ADMIN_PAGES = new Set([
  "dashboard", "bookings", "barbers", "payments", "schedule", "settings", "sync",
]);

export default function App() {
  const path = usePathname();
  const [session, setSession] = useState(sessionStorage.get());

  useEffect(() => {
    if (!path.startsWith("/admin")) navigate("/admin/login");
    if (!session && !["/admin/login", "/admin/forgot-password"].includes(path)) navigate("/admin/login");
    if (session && ["/admin", "/admin/login"].includes(path)) navigate("/admin/dashboard");
  }, [path, session]);

  if (path === "/admin/forgot-password") return <Suspense fallback={null}><ForgotPasswordPage /></Suspense>;
  if (!session || path === "/admin/login") return <LoginPage onLogin={(nextSession, remember) => {
    sessionStorage.set(nextSession, remember);
    setSession(nextSession);
    navigate("/admin/dashboard");
  }} />;

  const segment = path.split("/").pop();
  if (segment && !KNOWN_ADMIN_PAGES.has(segment) && segment !== "admin") {
    return <Suspense fallback={null}><NotFound /></Suspense>;
  }

  return (
    <Suspense fallback={null}>
      <AdminApp
        path={path}
        onLogout={async () => {
          try {
            await api("/api/admin/auth/logout", { method: "POST" });
          } catch {
            // Logging out should still clear the local credentials.
          }
          sessionStorage.clear();
          setSession(null);
          navigate("/admin/login");
        }}
      />
    </Suspense>
  );
}
