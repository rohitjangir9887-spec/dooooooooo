import { supabase } from "../config/supabase.js";

function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

function isoDate(d) {
  return d.toISOString().split("T")[0];
}

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function startOfWeek(d) {
  const c = new Date(d);
  const dow = c.getDay();
  // Monday = 0 in our schema; JS getDay() returns 0=Sun
  c.setDate(c.getDate() - ((dow + 6) % 7));
  c.setHours(0, 0, 0, 0);
  return c;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getDashboardSummary() {
  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
  const weekStart = startOfWeek(now).toISOString();
  const monthStart = startOfMonth(now).toISOString();
  const last7Start = new Date(startOfDay(now).getTime() - 6 * 86400000).toISOString();

  const [
    { count: todayBookings },
    { count: pending },
    { count: cancellationsMtd },
    { data: weekTx },
    { data: recentTx },
    { data: upcomingData }
  ] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true })
      .gte("booked_at", todayStart).lte("booked_at", todayEnd).neq("booking_status", "cancelled"),
    supabase.from("bookings").select("*", { count: "exact", head: true })
      .eq("booking_status", "pending"),
    supabase.from("bookings").select("*", { count: "exact", head: true })
      .eq("booking_status", "cancelled").gte("booked_at", monthStart),
    supabase.from("transactions").select("amount").gte("processed_at", weekStart),
    supabase.from("transactions").select("amount, processed_at").gte("processed_at", last7Start),
    supabase.from("bookings")
      .select(`
        id, booked_at, duration_min, amount, booking_status, payment_status,
        client_name, notes,
        service:service_id (name),
        barber:barber_id (name, tag_colors (hex))
      `)
      .gte("booked_at", now.toISOString())
      .neq("booking_status", "cancelled")
      .order("booked_at", { ascending: true })
      .limit(7)
  ]);

  const weekRevenue = (weekTx || []).reduce((sum, t) => sum + t.amount, 0);

  // Aggregate recentTx by day for 7-day sparkline
  const dayMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayMap[isoDate(d)] = 0;
  }
  for (const t of recentTx || []) {
    const day = t.processed_at.split("T")[0];
    if (day in dayMap) dayMap[day] += t.amount;
  }
  const sparkline = Object.entries(dayMap).map(([date, amount]) => {
    const d = new Date(date);
    return { day: d.toLocaleDateString("en-US", { weekday: "short" }), date, amount };
  });

  const upcoming = (upcomingData || []).map((b, i) => {
    const booked = b.booked_at ? new Date(b.booked_at) : null;
    const barberName = b.barber?.name || "";
    return {
      id: b.id,
      number: i + 1,
      client: b.client_name || "",
      service: b.service?.name || "",
      barber: barberName,
      barberInitials: barberName ? initials(barberName) : "",
      barberColor: b.barber?.tag_colors?.hex ?? "#888",
      date: booked ? isoDate(booked) : "",
      time: booked ? booked.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: false }) : "",
      duration: b.duration_min,
      price: b.amount,
      status: b.booking_status,
      paymentStatus: b.payment_status
    };
  });

  return {
    kpis: {
      todayBookings: todayBookings ?? 0,
      weekRevenue,
      pending: pending ?? 0,
      cancellationsMtd: cancellationsMtd ?? 0
    },
    revenue: weekRevenue,
    upcoming,
    sparkline,
    dailyRevenue: sparkline
  };
}
