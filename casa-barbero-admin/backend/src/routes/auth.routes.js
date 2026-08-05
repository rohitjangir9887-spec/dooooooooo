import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const authRoutes = Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Use a direct fetch so the service role client's session is never touched
async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json();
  if (!res.ok) return { data: null, error: json };
  return {
    data: {
      user: json.user,
      session: { access_token: json.access_token, expires_at: json.expires_at }
    },
    error: null
  };
}

authRoutes.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await signIn(email, password);
  if (error) return res.status(401).json({ error: "Email or password is incorrect" });

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id, email, name, role")
    .eq("id", data.user.id)
    .eq("is_active", true)
    .single();

  if (!adminUser) return res.status(403).json({ error: "Not an admin account" });

  res.json({ token: data.session.access_token, expiresAt: data.session.expires_at, user: adminUser });
});

// JWT is stateless — client drops the token; nothing to revoke server-side
authRoutes.post("/auth/logout", requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

authRoutes.get("/me", requireAdmin, (req, res) => {
  res.json({ user: req.user });
});
