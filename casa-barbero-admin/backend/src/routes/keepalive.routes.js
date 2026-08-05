import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";

export const keepaliveRoutes = Router();

// Hit on a schedule by .github/workflows/keepalive.yml and a redundant Claude
// scheduled routine so the Supabase free-tier project doesn't auto-pause after
// 7 days without an API request. Two independent secrets so a leak of either
// heartbeat's credential doesn't compromise the other.
keepaliveRoutes.get("/keepalive", async (req, res) => {
  const validSecrets = [env.keepaliveSecret, env.keepaliveSecretClaude].filter(Boolean);
  if (validSecrets.length && !validSecrets.includes(req.headers["x-keepalive-secret"])) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data, error } = await supabase
    .from("keepalive_log")
    .update({ pinged_at: new Date().toISOString() })
    .eq("id", "default")
    .select("pinged_at")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, pingedAt: data.pinged_at });
});
