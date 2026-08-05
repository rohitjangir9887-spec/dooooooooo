import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const availabilityRoutes = Router();

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

availabilityRoutes.get("/availability", requireAdmin, async (_req, res) => {
  const [{ data: hoursData }, { data: blockedData }] = await Promise.all([
    supabase
      .from("barber_working_hours")
      .select("barber_id, day_of_week, is_open, open_time, close_time, break_start, break_end")
      .order("day_of_week"),
    supabase
      .from("blocked_dates")
      .select("id, barber_id, blocked_date, is_all_day, start_time, end_time, reason, notes")
      .order("blocked_date")
  ]);

  // Use first barber's hours as the shop-wide schedule for the UI
  const barberIds = [...new Set((hoursData || []).map((h) => h.barber_id))];
  const firstId = barberIds[0];
  const workingHours = DAYS.map((day, i) => {
    const row = (hoursData || []).find((h) => h.barber_id === firstId && h.day_of_week === i);
    return {
      day,
      open: row?.is_open ?? (i < 6),
      start: row?.is_open ? (formatTime(row.open_time) ?? "9:00 AM") : "Closed",
      end: row?.is_open ? (formatTime(row.close_time) ?? "7:00 PM") : "--",
      breakStart: row?.is_open ? (formatTime(row.break_start) ?? "1:00 PM") : "--",
      breakEnd: row?.is_open ? (formatTime(row.break_end) ?? "2:00 PM") : "--"
    };
  });

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

  res.json({ workingHours, blockedTimes });
});

availabilityRoutes.post("/availability/block", requireAdmin, async (req, res) => {
  const { barberId, date, isAllDay = true, startTime, endTime, reason, notes } = req.body;
  if (!barberId || !date || !reason) {
    return res.status(400).json({ error: "barberId, date, and reason are required" });
  }

  const { data: block, error } = await supabase
    .from("blocked_dates")
    .insert({
      barber_id: barberId,
      blocked_date: date,
      is_all_day: isAllDay,
      start_time: isAllDay ? null : startTime,
      end_time: isAllDay ? null : endTime,
      reason,
      notes: notes || null
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({
    block: {
      id: block.id,
      barberId: block.barber_id,
      date: block.blocked_date,
      reason: block.reason,
      allDay: block.is_all_day,
      notes: block.notes,
      start: block.start_time ? block.start_time.slice(0, 5) : undefined,
      end: block.end_time ? block.end_time.slice(0, 5) : undefined
    }
  });
});

availabilityRoutes.delete("/availability/block/:id", requireAdmin, async (req, res) => {
  const { error } = await supabase.from("blocked_dates").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Update a single barber's working hours for one day
availabilityRoutes.patch("/availability/hours/:barberId/:day", requireAdmin, async (req, res) => {
  const dayIndex = parseInt(req.params.day, 10);
  const { isOpen, openTime, closeTime, breakStart, breakEnd } = req.body;

  const { data, error } = await supabase
    .from("barber_working_hours")
    .update({
      is_open: isOpen,
      open_time: isOpen ? openTime : null,
      close_time: isOpen ? closeTime : null,
      break_start: isOpen ? breakStart : null,
      break_end: isOpen ? breakEnd : null
    })
    .eq("barber_id", req.params.barberId)
    .eq("day_of_week", dayIndex)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ hours: data });
});
