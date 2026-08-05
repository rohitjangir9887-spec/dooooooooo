import { supabase } from "../config/supabase.js";

export async function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Unauthorized" });

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id, email, name, role, is_active")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();

  if (!adminUser) return res.status(403).json({ error: "Not an admin account" });

  req.user = adminUser;
  next();
}
