import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const paymentsRoutes = Router();

function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

paymentsRoutes.get("/payments", requireAdmin, async (_req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [{ data: txData, error: txError }, { data: dailyData }] = await Promise.all([
    supabase
      .from("transactions")
      .select(`
        id, amount, payment_method, processed_at, receipt_url, note,
        booking:booking_id (
          id, client_name,
          service:service_id (name),
          barber:barber_id (name, tag_colors (hex))
        )
      `)
      .order("processed_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("amount, processed_at")
      .gte("processed_at", thirtyDaysAgo.toISOString())
  ]);

  if (txError) return res.status(500).json({ error: txError.message });

  const transactions = (txData || []).map((t) => {
    const b = t.booking;
    const barberName = b?.barber?.name || "";
    return {
      id: t.id,
      bookingId: t.booking_id,
      client: b?.client_name || "",
      service: b?.service?.name || "",
      barber: barberName,
      barberInitials: barberName ? initials(barberName) : "",
      barberColor: b?.barber?.tag_colors?.hex ?? "#888",
      date: t.processed_at?.split("T")[0] ?? "",
      amount: t.amount,
      method: t.payment_method || "cash",
      status: "paid",
      receiptUrl: t.receipt_url || null
    };
  });

  // Aggregate last 30 days revenue by day
  const byDay = {};
  for (const t of dailyData || []) {
    const day = t.processed_at.split("T")[0];
    byDay[day] = (byDay[day] || 0) + t.amount;
  }
  const dailyRevenue = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));

  res.json({ transactions, dailyRevenue });
});

// Record a manual payment (cash/counter collection)
paymentsRoutes.post("/payments", requireAdmin, async (req, res) => {
  const { bookingId, paymentMethod, amount, receiptUrl, note } = req.body;
  if (!bookingId || !paymentMethod || !amount) {
    return res.status(400).json({ error: "bookingId, paymentMethod, and amount are required" });
  }

  const { data: tx, error } = await supabase
    .from("transactions")
    .insert({ booking_id: bookingId, payment_method: paymentMethod, amount, receipt_url: receiptUrl || null, note: note || null })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Mark booking as paid
  await supabase.from("bookings")
    .update({ payment_status: "paid", payment_method: paymentMethod })
    .eq("id", bookingId);

  res.status(201).json({ transaction: tx });
});
