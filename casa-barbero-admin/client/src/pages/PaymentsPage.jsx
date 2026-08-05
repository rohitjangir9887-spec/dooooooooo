import "../assets/styles/payments.css";
import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { formatPeso } from "../utils/formatters.js";
import { Badge, Kpi, Method, PageHeader, PanelTitle, Pill, Segmented } from "../components/ui/index.jsx";
import { barData, barOptions } from "../lib/charts.js";
import { prettyDate } from "../utils/formatters.js";

export default function Payments({ transactions, dailyRevenue, barbers }) {
  const [period, setPeriod] = useState("This Month");
  const [byBarber, setByBarber] = useState(false);

  const totalRevenue = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const pendingAmount = transactions.filter((t) => t.status === "pending").reduce((s, t) => s + (t.amount || 0), 0);
  const refundsAmount = transactions.filter((t) => t.status === "refunded").reduce((s, t) => s + (t.amount || 0), 0);

  const chartData = dailyRevenue.map(({ date, amount }) => ({
    date: new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    amount
  }));

  return (
    <section className="page-payments">
      <PageHeader title="Payments & Revenue" actions={<Segmented options={["This Week", "This Month", "Last 3 Months", "Custom"]} value={period} onChange={setPeriod} />} />
      <div className="payment-kpis">
        <Kpi title="Total Revenue · This Month" value={formatPeso(totalRevenue)} detail="from recorded transactions" trend="+0%" tone="up" />
        <Kpi title="Pending Payments" value={formatPeso(pendingAmount)} detail={`${transactions.filter((t) => t.status === "pending").length} transactions`} trend="amber" dot />
        <Kpi title="Refunds Issued" value={formatPeso(refundsAmount)} detail={`${transactions.filter((t) => t.status === "refunded").length} this month`} trend="amber" />
      </div>
      <div className="payments-grid">
        <section className="panel"><PanelTitle title="Daily Revenue · Last 30 Days" value={<button className="ghost-button small" onClick={() => setByBarber(!byBarber)}>By Barber</button>} /><Bar data={barData(chartData, byBarber, barbers)} options={barOptions} /></section>
        <section className="panel"><PanelTitle title="Top Services" /><TopServices transactions={transactions} /></section>
      </div>
      <section className="panel transaction-panel">
        <PanelTitle title="Transaction History" value="PayMongo" />
        <div className="table-wrap"><table className="data-table compact"><thead><tr><th>Transaction ID</th><th>Client</th><th>Service</th><th>Barber</th><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead><tbody>{transactions.slice(0, 8).map((item) => <tr key={item.id}><td data-label="Transaction ID" title={item.id} className="mono gold-text">{item.id.slice(0, 12)}...</td><td data-label="Client"><strong>{item.client}</strong></td><td data-label="Service">{item.service}</td><td data-label="Barber"><Badge label={item.barberInitials} style={{ "--badge": item.barberColor }} /> {item.barber}</td><td data-label="Date">{prettyDate(item.date, true)}</td><td data-label="Amount"><strong>{formatPeso(item.amount)}</strong></td><td data-label="Method"><Method method={item.method} /></td><td data-label="Status"><Pill value={item.status} /></td><td data-label="Actions" className="row-actions"><button className="text-link">View Receipt</button>{item.status === "paid" ? <button className="danger-text">Refund</button> : null}</td></tr>)}</tbody></table></div>
      </section>
    </section>
  );
}

function TopServices({ transactions }) {
  const totals = transactions.reduce((acc, t) => {
    if (!t.service) return acc;
    acc[t.service] = (acc[t.service] || 0) + (t.amount || 0);
    return acc;
  }, {});
  const top = Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const max = top[0]?.[1] || 1;
  return <div className="top-services">{top.map(([name, amount], index) => <article key={name}><div><span>{index + 1}</span><strong>{name}</strong><em>{formatPeso(amount)}</em></div><i style={{ width: `${Math.round((amount / max) * 100)}%` }} /></article>)}</div>;
}
