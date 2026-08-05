import "../assets/styles/dashboard.css";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { CalendarClock } from "lucide-react";
import { formatPeso, relativeDay, toDisplayTime } from "../utils/formatters.js";
import { Badge, PageHeader, PanelTitle, Payment, Pill } from "../components/ui/index.jsx";
import { lineData, lineOptions } from "../lib/charts.js";
import { navigate } from "../services/navigation.js";
import { computeDashboard } from "../utils/dashboardMetrics.js";

export default function Dashboard({ data, bookings, transactions, dailyRevenue, barbers, settings }) {
  const metrics = useMemo(
    () => computeDashboard({ bookings, transactions, dailyRevenue, barbers, data }),
    [bookings, transactions, dailyRevenue, barbers, data]
  );
  const { kpis, secondary, topBarbers, topServices, sparkline } = metrics;

  // Real upcoming list: future, non-cancelled, chronological. Falls back to server data when bookings unloaded.
  const upcoming = useMemo(() => {
    const nowMs = Date.now();
    const derived = (bookings || [])
      .filter((b) => b.status !== "cancelled" && b.date && b.time && new Date(`${b.date}T${b.time}`).getTime() >= nowMs)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const list = derived.length ? derived : (data?.upcoming || []);
    return list.slice(0, 6);
  }, [bookings, data]);

  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const shopName = settings?.shopProfile?.name;

  return (
    <section>
      <PageHeader title="Dashboard" meta={shopName ? `${shopName} · ${todayLabel}` : todayLabel} />
      <div className="kpi-grid">
        <Kpi title="Today's Bookings" value={kpis.todayBookings} detail={`vs ${kpis.lastWeekToday} same day last week`} trend={kpis.todayTrend?.label} tone={kpis.todayTrend?.tone} />
        <Kpi title="This Week's Revenue" value={formatPeso(kpis.weekRevenue)} detail={`vs ${formatPeso(kpis.prevWeekRevenue)} last week`} trend={kpis.weekTrend?.label} tone={kpis.weekTrend?.tone} />
        <Kpi title="Pending Confirmations" value={kpis.pending} detail="awaiting confirmation" dot />
        <Kpi title="Cancellations (MTD)" value={kpis.cancellationsMtd} detail={`vs ${kpis.cancelledPrevMtd} last month`} />
      </div>
      <StatStrip items={[
        { label: "Avg Ticket", value: formatPeso(secondary.avgTicket) },
        { label: "Outstanding", value: formatPeso(secondary.outstanding), warn: secondary.outstanding > 0 },
        { label: "Clients This Week", value: secondary.uniqueClients },
        { label: "Active Barbers", value: secondary.activeBarbers }
      ]} />
      <div className="dashboard-grid">
        <MiniCalendar bookings={bookings} />
        <UpcomingList items={upcoming} />
      </div>
      <section className="panel chart-panel">
        <PanelTitle title="Revenue · Last 7 Days" value={formatPeso(kpis.weekRevenue)} />
        <Line data={lineData(sparkline)} options={lineOptions} />
      </section>
      <div className="insights-grid">
        <RankPanel
          title="Top Barbers · This Month"
          emptyLabel="No revenue recorded yet this month."
          rows={topBarbers.map((b) => ({ key: b.name, label: b.name, value: formatPeso(b.revenue), sub: `${b.count} booking${b.count !== 1 ? "s" : ""}`, weight: b.revenue, color: b.color }))}
        />
        <RankPanel
          title="Popular Services · This Month"
          emptyLabel="No bookings recorded yet this month."
          rows={topServices.map((s) => ({ key: s.name, label: s.name, value: s.count, sub: formatPeso(s.revenue), weight: s.count }))}
        />
      </div>
    </section>
  );
}

function Kpi({ title, value, detail, trend, tone, dot }) {
  const showTrend = trend && trend !== "amber";
  return (
    <article className="kpi-card">
      <p>{dot ? <span className="amber-dot" /> : null}{title}</p>
      <div>
        <strong>{value}</strong>
        {showTrend ? <span className={`trend ${tone || ""}`}>{tone === "down" ? "↓" : "↑"} {String(trend).replace(/[+-]/, "")}</span> : null}
      </div>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

function StatStrip({ items }) {
  return (
    <div className="stat-strip">
      {items.map((item) => (
        <div className="stat-item" key={item.label}>
          <span>{item.label}</span>
          <strong className={item.warn ? "warn" : ""}>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function RankPanel({ title, rows, emptyLabel }) {
  const max = rows.reduce((peak, row) => Math.max(peak, row.weight), 0) || 1;
  return (
    <section className="panel">
      <PanelTitle title={title} />
      {rows.length ? (
        <div className="rank-list">
          {rows.map((row, index) => (
            <article className="rank-row" key={row.key}>
              <div>
                <span className="rank-num">{index + 1}</span>
                <strong>{row.label}</strong>
                <em>{row.value}</em>
              </div>
              <i style={{ width: `${Math.round((row.weight / max) * 100)}%`, ...(row.color ? { "--bar": row.color } : {}) }} />
              {row.sub ? <small>{row.sub}</small> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="upcoming-empty"><p>{emptyLabel}</p></div>
      )}
    </section>
  );
}

function MiniCalendar({ bookings }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Non-cancelled booking counts keyed by day-of-month, for the current month only.
  const counts = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
    return (bookings || []).reduce((map, b) => {
      if (b.status !== "cancelled" && typeof b.date === "string" && b.date.startsWith(prefix)) {
        const day = Number(b.date.slice(8, 10));
        map[day] = (map[day] || 0) + 1;
      }
      return map;
    }, {});
  }, [bookings, year, month]);

  // 6-week grid aligned Monday-first, with muted spillover days from adjacent months.
  const cells = useMemo(() => {
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const dayNum = index - firstDow + 1;
      const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
      const label = dayNum < 1 ? daysInPrev + dayNum : dayNum > daysInMonth ? dayNum - daysInMonth : dayNum;
      return { dayNum, label, inMonth };
    });
  }, [year, month]);

  return (
    <section className="panel mini-calendar">
      <PanelTitle title={monthLabel} value={<span className="legend-dot">has bookings</span>} />
      <div className="weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}</div>
      <div className="month-dots">
        {cells.map((cell, index) => {
          const count = cell.inMonth ? counts[cell.dayNum] : 0;
          const isToday = cell.inMonth && cell.dayNum === todayDate;
          return (
            <button className={`${isToday ? "today" : ""} ${cell.inMonth ? "" : "muted"}`} key={index} type="button">
              <span>{cell.label}</span>
              {count ? <i /> : null}
              {count ? <em>{count} booking{count > 1 ? "s" : ""}</em> : null}
            </button>
          );
        })}
      </div>
      <button className="panel-link" type="button" onClick={() => navigate("/admin/schedule")}>View full calendar →</button>
    </section>
  );
}

function UpcomingList({ items }) {
  const expected = useMemo(() => items.reduce((sum, b) => sum + (b.price || 0), 0), [items]);
  const groups = useMemo(() => {
    const map = new Map();
    for (const b of items) {
      if (!map.has(b.date)) map.set(b.date, []);
      map.get(b.date).push(b);
    }
    return [...map.entries()].map(([date, list]) => ({ date, list }));
  }, [items]);

  return (
    <section className="panel upcoming">
      <PanelTitle title="Upcoming Bookings" value={items.length ? `${items.length} · ${formatPeso(expected)}` : null} />
      {items.length ? (
        <div className="upcoming-list">
          {groups.map((group) => (
            <div className="day-group" key={group.date}>
              <div className="day-label"><span>{relativeDay(group.date)}</span><i>{group.list.length}</i></div>
              {group.list.map((booking) => <BookingLine key={booking.id} booking={booking} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="upcoming-empty">
          <CalendarClock size={34} strokeWidth={1.5} />
          <p>No upcoming bookings</p>
          <span>New appointments will appear here.</span>
        </div>
      )}
      <button className="panel-link" type="button" onClick={() => navigate("/admin/bookings")}>View all bookings →</button>
    </section>
  );
}

function BookingLine({ booking }) {
  return (
    <article className="booking-line">
      <div className="bl-time">
        <time>{toDisplayTime(booking.time)}</time>
        {booking.duration ? <span>{booking.duration} min</span> : null}
      </div>
      <div className="bl-main">
        <strong>{booking.client}</strong>
        <div className="bl-sub">
          <span className="bl-service">{booking.service}</span>
          {booking.barberInitials ? <Badge label={booking.barberInitials} style={{ "--badge": booking.barberColor }} /> : null}
        </div>
      </div>
      <div className="bl-right">
        {booking.price != null ? <b>{formatPeso(booking.price)}</b> : null}
        <div className="bl-tags">
          {booking.paymentStatus ? <Payment payment={booking.paymentStatus} /> : null}
          <Pill value={booking.status} />
        </div>
      </div>
    </article>
  );
}
