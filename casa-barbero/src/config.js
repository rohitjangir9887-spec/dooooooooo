// Shared customer-app config — single source for cross-app links and contact info.

// Staff admin login lives in the separate casa-barbero-admin app (dev port 5174).
// Override with VITE_ADMIN_URL for staging/production.
export const ADMIN_LOGIN_URL =
  import.meta.env.VITE_ADMIN_URL || "http://localhost:5174/admin/login";

// Concierge phone — shown in the booking banner and nav drawer.
export const CONCIERGE_PHONE = "+63912 345 6789";
export const CONCIERGE_TEL = "+639171234567";
