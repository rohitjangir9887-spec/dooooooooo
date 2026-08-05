import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const bookingsRoutes = Router();

function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

function transformBooking(b, index) {
  const booked = b.booked_at ? new Date(b.booked_at) : null;
  return {
    id: b.id,
    number: index + 1,
    client: b.client_name || "",
    phone: b.client_phone || "",
    serviceId: b.service?.id || null,
    service: b.service?.name || "",
    barberId: b.barber?.id || null,
    barber: b.barber?.name || "",
    barberInitials: b.barber?.name ? initials(b.barber.name) : "",
    barberColor: b.barber?.tag_colors?.hex ?? "#888",
    date: booked ? booked.toISOString().split("T")[0] : "",
    time: booked ? booked.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: false }) : "",
    duration: b.duration_min,
    price: b.amount,
    paymentStatus: b.payment_status || "unpaid",
    status: b.booking_status || "pending",
    paymentMethod: b.payment_method || null,
    notes: b.notes || ""
  };
}

const BOOKING_SELECT = `
  id, booked_at, duration_min, amount, booking_status, payment_status, payment_method,
  client_name, client_phone, notes, created_at,
  service:service_id (id, name),
  barber:barber_id (id, name, tag_colors (hex))
`;

bookingsRoutes.get("/bookings", requireAdmin, async (_req, res) => {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ bookings: (data || []).map(transformBooking) });
});

bookingsRoutes.post("/bookings", requireAdmin, async (req, res) => {
  const { clientName, phone, clientEmail, serviceId, barberId, bookedAt, durationMin, amount, notes, paymentStatus } = req.body;
  if (!clientName || !phone || !serviceId || !barberId || !bookedAt || !amount) {
    return res.status(400).json({ error: "clientName, phone, serviceId, barberId, bookedAt, and amount are required" });
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      client_name: clientName,
      client_phone: phone,
      client_email: clientEmail || null,
      service_id: serviceId,
      barber_id: barberId,
      booked_at: bookedAt,
      duration_min: durationMin,
      amount,
      notes: notes || null,
      booking_status: "confirmed",
      payment_status: paymentStatus || "unpaid",
      payment_method: "counter"
    })
    .select(BOOKING_SELECT)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ booking: transformBooking(data, 0) });
});

bookingsRoutes.patch("/bookings/:id", requireAdmin, async (req, res) => {
  const fieldMap = {
    status: "booking_status",
    paymentStatus: "payment_status",
    paymentMethod: "payment_method",
    notes: "notes",
    clientName: "client_name",
    clientPhone: "client_phone",
    bookedAt: "booked_at",
    barberId: "barber_id",
    serviceId: "service_id",
    durationMin: "duration_min",
    amount: "amount"
  };

  const updates = {};
  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in req.body) updates[col] = req.body[key];
  }

  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", req.params.id)
    .select(BOOKING_SELECT)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ booking: transformBooking(data, 0) });
});

bookingsRoutes.delete("/bookings/:id", requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from("bookings")
    .update({ booking_status: "cancelled" })
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
