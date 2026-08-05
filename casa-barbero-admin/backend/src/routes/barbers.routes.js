import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const barbersRoutes = Router();

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Raw 24h times for editing plus display strings for read views
function mapHours(rows) {
  return DAYS.map((day, i) => {
    const row = (rows || []).find((h) => h.day_of_week === i);
    const open = row?.is_open ?? false;
    return {
      day,
      dayIndex: i,
      open,
      openTime: row?.open_time?.slice(0, 5) ?? null,
      closeTime: row?.close_time?.slice(0, 5) ?? null,
      breakStart: row?.break_start?.slice(0, 5) ?? null,
      breakEnd: row?.break_end?.slice(0, 5) ?? null,
      start: open ? (formatTime(row.open_time) ?? "9:00 AM") : "Closed",
      end: open ? (formatTime(row.close_time) ?? "7:00 PM") : "--"
    };
  });
}

barbersRoutes.get("/barbers", requireAdmin, async (_req, res) => {
  const [{ data: barbersData }, { data: servicesData }, { data: blockedData }, { data: colorsData }] = await Promise.all([
    supabase.from("barbers").select(`
      id, name, role, is_active,
      tag_colors (hex),
      barber_services (service_id),
      barber_working_hours (day_of_week, is_open, open_time, close_time, break_start, break_end)
    `).order("created_at"),
    supabase.from("services").select("id, name, duration_min, price, is_active").order("name"),
    supabase.from("blocked_dates").select("id, barber_id, blocked_date, is_all_day, start_time, end_time, reason, notes").order("blocked_date"),
    supabase.from("tag_colors").select("id, name, hex")
  ]);

  const barbers = (barbersData || []).map((b) => ({
    id: b.id,
    name: b.name,
    initials: initials(b.name),
    role: b.role,
    active: b.is_active,
    color: b.tag_colors?.hex ?? "#888",
    serviceIds: (b.barber_services || []).map((s) => s.service_id),
    hours: mapHours(b.barber_working_hours)
  }));

  // First active barber's hours double as the shop-wide schedule fallback
  const firstBarber = barbersData?.find((b) => b.is_active);
  const workingHours = mapHours(firstBarber?.barber_working_hours);

  const services = (servicesData || []).map((s) => ({
    id: s.id,
    name: s.name,
    duration: s.duration_min,
    price: s.price,
    active: s.is_active
  }));

  const tagColors = colorsData || [];

  const blockedTimes = (blockedData || []).map((b) => ({
    id: b.id,
    barberId: b.barber_id,
    date: b.blocked_date,
    reason: b.reason,
    allDay: b.is_all_day,
    notes: b.notes,
    start: b.start_time ? b.start_time.slice(0, 5) : undefined,
    end: b.end_time ? b.end_time.slice(0, 5) : undefined
  }));

  res.json({ barbers, workingHours, services, blockedTimes, tagColors });
});

barbersRoutes.post("/barbers", requireAdmin, async (req, res) => {
  const { name, role, tagColorId, isActive = true } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const { data: barber, error } = await supabase
    .from("barbers")
    .insert({ name, role: role || "Barber", tag_color_id: tagColorId || null, is_active: isActive })
    .select("id, name, role, is_active, tag_colors (hex)")
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Seed 7 working-hour rows (Mon–Sat open, Sun closed)
  const hours = Array.from({ length: 7 }, (_, d) => ({
    barber_id: barber.id,
    day_of_week: d,
    is_open: d < 6,
    open_time: d < 6 ? "09:00" : null,
    close_time: d < 6 ? "19:00" : null,
    break_start: d < 6 ? "13:00" : null,
    break_end: d < 6 ? "14:00" : null
  }));
  await supabase.from("barber_working_hours").insert(hours);

  // New barbers offer every active service by default
  const { data: activeServices } = await supabase.from("services").select("id").eq("is_active", true);
  const serviceIds = (activeServices || []).map((s) => s.id);
  if (serviceIds.length > 0) {
    await supabase.from("barber_services").insert(serviceIds.map((sid) => ({ barber_id: barber.id, service_id: sid })));
  }

  res.status(201).json({
    barber: {
      id: barber.id,
      name: barber.name,
      initials: initials(barber.name),
      role: barber.role,
      active: barber.is_active,
      color: barber.tag_colors?.hex ?? "#888",
      serviceIds,
      hours: mapHours(hours.map((h) => ({ ...h, is_open: h.is_open })))
    }
  });
});

barbersRoutes.patch("/barbers/:id", requireAdmin, async (req, res) => {
  const allowed = ["name", "role", "tag_color_id", "is_active"];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );

  const { data: barber, error } = await supabase
    .from("barbers")
    .update(updates)
    .eq("id", req.params.id)
    .select("id, name, role, is_active, tag_colors (hex)")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({
    barber: {
      id: barber.id,
      name: barber.name,
      initials: initials(barber.name),
      role: barber.role,
      active: barber.is_active,
      color: barber.tag_colors?.hex ?? "#888"
    }
  });
});

// Manage which services a barber offers
barbersRoutes.put("/barbers/:id/services", requireAdmin, async (req, res) => {
  const { serviceIds } = req.body;
  if (!Array.isArray(serviceIds)) return res.status(400).json({ error: "serviceIds must be an array" });

  await supabase.from("barber_services").delete().eq("barber_id", req.params.id);

  if (serviceIds.length > 0) {
    const rows = serviceIds.map((sid) => ({ barber_id: req.params.id, service_id: sid }));
    const { error } = await supabase.from("barber_services").insert(rows);
    if (error) return res.status(500).json({ error: error.message });
  }

  res.json({ ok: true });
});
