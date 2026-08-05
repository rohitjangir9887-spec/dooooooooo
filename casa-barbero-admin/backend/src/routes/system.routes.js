import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const systemRoutes = Router();

systemRoutes.get("/sync", requireAdmin, async (_req, res) => {
  const { data: logData } = await supabase
    .from("calendar_sync_log")
    .select("id, event_type, description, success, synced_at")
    .order("synced_at", { ascending: false })
    .limit(20);

  const { data: profile } = await supabase
    .from("shop_profile")
    .select("email, google_calendar_id, updated_at")
    .single();

  const log = (logData || []).map((entry) => ({
    time: new Date(entry.synced_at).toLocaleTimeString("en-PH", { hour12: false }),
    type: entry.event_type,
    description: entry.description,
    ok: entry.success
  }));

  res.json({
    log,
    account: profile?.email ?? null,
    lastSynced: profile?.updated_at ?? null
  });
});

systemRoutes.get("/settings", requireAdmin, async (req, res) => {
  const [{ data: profile }, { data: notifData }] = await Promise.all([
    supabase.from("shop_profile").select("*").single(),
    supabase.from("notification_settings").select("*").single()
  ]);

  res.json({
    shopProfile: {
      name: profile?.shop_name ?? "",
      branch: profile?.branch_name ?? "",
      phone: profile?.phone ?? "",
      email: profile?.email ?? "",
      address: profile?.address ?? "",
      currency: `${profile?.currency_symbol ?? "₱"} ${profile?.currency_code ?? "PHP"}`
    },
    notifications: notifData ?? {},
    owner: req.user
  });
});

systemRoutes.patch("/settings", requireAdmin, async (req, res) => {
  const { shopName, branchName, phone, email, address } = req.body;
  const updates = {};
  if (shopName !== undefined)   updates.shop_name    = shopName;
  if (branchName !== undefined) updates.branch_name  = branchName;
  if (phone !== undefined)      updates.phone        = phone;
  if (email !== undefined)      updates.email        = email;
  if (address !== undefined)    updates.address      = address;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from("shop_profile").update(updates).neq("id", "");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

systemRoutes.patch("/settings/notifications", requireAdmin, async (req, res) => {
  const allowed = ["notify_new_booking", "notify_cancellation", "notify_reschedule", "notify_reminder"];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from("notification_settings").update(updates).neq("id", "");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
