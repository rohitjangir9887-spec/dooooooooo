// Pure client-side aggregation for the admin dashboard. Inputs are already-fetched arrays
// (bookings, payment transactions, 30-day dailyRevenue, barbers). No network access here.

function dayString(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d, n) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function startOfWeek(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  c.setDate(c.getDate() - ((c.getDay() + 6) % 7)); // Monday-first
  return c;
}

const sumAmount = (arr) => arr.reduce((sum, x) => sum + (x.amount || 0), 0);

// Percentage change vs a prior period; null when there is nothing to compare.
function pctTrend(current, previous) {
  if (previous === 0) return current > 0 ? { label: "new", tone: "up" } : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return { label: `${Math.abs(pct)}%`, tone: pct >= 0 ? "up" : "down" };
}

export function computeDashboard({ bookings = [], transactions = [], dailyRevenue = [], barbers = [], data = null }) {
  const now = new Date();
  const today = dayString(now);
  const lastWeekSameDay = dayString(addDays(now, -7));
  const weekStart = dayString(startOfWeek(now));
  const prevWeekStart = dayString(addDays(startOfWeek(now), -7));
  const monthStart = dayString(new Date(now.getFullYear(), now.getMonth(), 1));
  const prevMonthStart = dayString(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const prevMonthMtdEnd = dayString(new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()));

  const hasBookings = bookings.length > 0;
  const hasTxns = transactions.length > 0;
  const active = bookings.filter((b) => b.status !== "cancelled");

  // KPI values (real, from raw data) with server summary as fallback when unloaded.
  const todayBookings = active.filter((b) => b.date === today).length;
  const lastWeekToday = active.filter((b) => b.date === lastWeekSameDay).length;

  const weekRevenue = sumAmount(transactions.filter((t) => t.date >= weekStart));
  const prevWeekRevenue = sumAmount(transactions.filter((t) => t.date >= prevWeekStart && t.date < weekStart));

  const pending = bookings.filter((b) => b.status === "pending").length;

  const cancelledMtd = bookings.filter((b) => b.status === "cancelled" && b.date >= monthStart && b.date <= today).length;
  const cancelledPrevMtd = bookings.filter((b) => b.status === "cancelled" && b.date >= prevMonthStart && b.date <= prevMonthMtdEnd).length;

  const kpis = {
    todayBookings: hasBookings ? todayBookings : (data?.kpis?.todayBookings ?? 0),
    lastWeekToday,
    todayTrend: hasBookings ? pctTrend(todayBookings, lastWeekToday) : null,
    weekRevenue: hasTxns ? weekRevenue : (data?.kpis?.weekRevenue ?? 0),
    prevWeekRevenue,
    weekTrend: hasTxns ? pctTrend(weekRevenue, prevWeekRevenue) : null,
    pending: hasBookings ? pending : (data?.kpis?.pending ?? 0),
    cancellationsMtd: hasBookings ? cancelledMtd : (data?.kpis?.cancellationsMtd ?? 0),
    cancelledPrevMtd
  };

  // Secondary stats strip
  const weekTxnCount = transactions.filter((t) => t.date >= weekStart).length;
  const avgTicket = weekTxnCount ? Math.round(weekRevenue / weekTxnCount) : 0;
  const outstanding = bookings
    .filter((b) => b.status !== "cancelled" && b.paymentStatus === "unpaid")
    .reduce((sum, b) => sum + (b.price || 0), 0);
  const uniqueClients = new Set(
    active.filter((b) => b.date >= weekStart).map((b) => (b.client || "").trim().toLowerCase()).filter(Boolean)
  ).size;
  const activeBarbers = barbers.filter((b) => b.active).length;

  // Top barbers this month by collected revenue
  const barberMap = new Map();
  for (const t of transactions.filter((t) => t.date >= monthStart)) {
    const name = t.barber || "Unassigned";
    const cur = barberMap.get(name) || { name, color: t.barberColor || "#888", revenue: 0, count: 0 };
    cur.revenue += t.amount || 0;
    cur.count += 1;
    barberMap.set(name, cur);
  }
  const topBarbers = [...barberMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Popular services this month by booking count
  const serviceMap = new Map();
  for (const b of active.filter((b) => b.date >= monthStart)) {
    if (!b.service) continue;
    const cur = serviceMap.get(b.service) || { name: b.service, count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += b.price || 0;
    serviceMap.set(b.service, cur);
  }
  const topServices = [...serviceMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  // Revenue sparkline: last 7 days of the 30-day series, server summary as fallback.
  const last7 = (dailyRevenue || []).slice(-7).map(({ date, amount }) => ({
    day: new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
    date,
    amount
  }));
  const sparkline = last7.length ? last7 : (data?.sparkline || []);

  return {
    kpis,
    secondary: { avgTicket, outstanding, uniqueClients, activeBarbers },
    topBarbers,
    topServices,
    sparkline
  };
}
