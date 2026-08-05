import "../assets/styles/bookings.css";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, Download, Edit3, MessageSquare, Phone, RefreshCw, X } from "lucide-react";
import { formatPeso, prettyDate, toDisplayTime } from "../utils/formatters.js";
import { Badge, BulkBar, EmptyState, Input, Modal, PageHeader, Payment, Pill, SlidePanel } from "../components/ui/index.jsx";
import { api } from "../services/api.js";
import { useToast } from "../components/ui/toast.jsx";

const PAGE_SIZE = 20;

function toCSV(rows) {
  const headers = ["Client", "Phone", "Service", "Barber", "Date", "Time", "Duration (min)", "Price", "Payment", "Status"];
  const lines = rows.map((b) => [b.client, b.phone, b.service, b.barber, b.date, b.time, b.duration, b.price, b.paymentStatus, b.status]
    .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","));
  return [headers.join(","), ...lines].join("\n");
}

function downloadCSV(rows, filename) {
  const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Bookings({ bookings, barbers, setBookings }) {
  const toast = useToast();
  const [status, setStatus] = useState("All");
  const [payment, setPayment] = useState("All");
  const [barberFilter, setBarberFilter] = useState("all");
  const [range, setRange] = useState({ from: "", to: "" });
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const filtered = useMemo(() => bookings.filter((booking) =>
    (status === "All" || booking.status === status.toLowerCase()) &&
    (payment === "All" || booking.paymentStatus === payment.toLowerCase()) &&
    (barberFilter === "all" || booking.barberId === barberFilter) &&
    (!range.from || booking.date >= range.from) &&
    (!range.to || booking.date <= range.to)
  ), [bookings, status, payment, barberFilter, range]);

  const visible = filtered.slice(0, limit);

  async function patchBooking(id, changes, revertMessage) {
    const previous = bookings;
    setBookings(bookings.map((b) => b.id === id ? { ...b, ...changes.local } : b));
    try {
      await api(`/api/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify(changes.remote) });
    } catch (error) {
      setBookings(previous);
      toast(revertMessage || error.message);
    }
  }

  async function bulkPatch(ids, remote, local) {
    const previous = bookings;
    setBookings(bookings.map((b) => ids.includes(b.id) ? { ...b, ...local } : b));
    const results = await Promise.allSettled(ids.map((id) => api(`/api/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify(remote) })));
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      setBookings(previous);
      toast(`${failed} of ${ids.length} updates failed — changes reverted.`);
    } else {
      toast(`${ids.length} bookings updated.`, "success");
    }
    setSelected([]);
  }

  function clearFilters() {
    setStatus("All");
    setPayment("All");
    setBarberFilter("all");
    setRange({ from: "", to: "" });
  }

  return (
    <section>
      <PageHeader title="Bookings" meta={`${filtered.length} of ${bookings.length}`} />
      <div className="filter-bar">
        <div className="date-range">
          <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} aria-label="From date" />
          <span>–</span>
          <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} aria-label="To date" />
        </div>
        <select value={barberFilter} onChange={(e) => setBarberFilter(e.target.value)} aria-label="Filter by barber">
          <option value="all">All Barbers</option>
          {barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}
        </select>
        <ChipGroup label="Status" values={["All", "Pending", "Confirmed", "Completed", "Cancelled"]} active={status} onChange={setStatus} />
        <ChipGroup label="Payment" values={["All", "Paid", "Unpaid", "Refunded"]} active={payment} onChange={setPayment} />
        <button className="ghost-button push-right" type="button" onClick={() => downloadCSV(filtered, `bookings-${new Date().toISOString().slice(0, 10)}.csv`)}><Download size={15} /> Export CSV</button>
      </div>
      {visible.length
        ? <BookingsTable bookings={visible} selected={selected} setSelected={setSelected} onDetail={setDetail} onCancel={setCancelTarget} />
        : <EmptyState onClear={clearFilters} />}
      {filtered.length > limit ? (
        <button className="ghost-button show-more" type="button" onClick={() => setLimit(limit + PAGE_SIZE)}>
          Show more ({filtered.length - limit} remaining)
        </button>
      ) : null}
      <AnimatePresence>{selected.length ? (
        <BulkBar
          count={selected.length}
          onClear={() => setSelected([])}
          onCancel={() => bulkPatch(selected, { status: "cancelled" }, { status: "cancelled" })}
          onComplete={() => bulkPatch(selected, { status: "completed" }, { status: "completed" })}
          onExport={() => downloadCSV(bookings.filter((b) => selected.includes(b.id)), "bookings-selected.csv")}
        />
      ) : null}</AnimatePresence>
      <AnimatePresence>{detail ? (
        <BookingDetail
          booking={bookings.find((b) => b.id === detail.id) || detail}
          onClose={() => setDetail(null)}
          onCancel={() => setCancelTarget(detail)}
          onReschedule={() => setRescheduleTarget(detail)}
          onConfirm={() => { patchBooking(detail.id, { remote: { status: "confirmed" }, local: { status: "confirmed" } }); setDetail(null); }}
          onComplete={() => { patchBooking(detail.id, { remote: { status: "completed" }, local: { status: "completed" } }); setDetail(null); }}
          onMarkPaid={() => patchBooking(detail.id, { remote: { paymentStatus: "paid", paymentMethod: "counter" }, local: { paymentStatus: "paid" } })}
        />
      ) : null}</AnimatePresence>
      <AnimatePresence>{cancelTarget ? (
        <CancelModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={(message) => {
            patchBooking(cancelTarget.id, {
              remote: { status: "cancelled", ...(message ? { notes: message } : {}) },
              local: { status: "cancelled" }
            });
            setCancelTarget(null);
            setDetail(null);
          }}
        />
      ) : null}</AnimatePresence>
      <AnimatePresence>{rescheduleTarget ? (
        <RescheduleModal
          booking={rescheduleTarget}
          barbers={barbers}
          onClose={() => setRescheduleTarget(null)}
          onConfirm={async (values) => {
            const barber = barbers.find((b) => b.id === values.barberId);
            await patchBooking(rescheduleTarget.id, {
              remote: { bookedAt: `${values.date}T${values.time}:00+08:00`, barberId: values.barberId },
              local: { date: values.date, time: values.time, barberId: values.barberId, barber: barber?.name ?? "", barberInitials: barber?.initials ?? "", barberColor: barber?.color ?? "#888" }
            });
            setRescheduleTarget(null);
            setDetail(null);
            toast("Booking rescheduled.", "success");
          }}
        />
      ) : null}</AnimatePresence>
    </section>
  );
}

function ChipGroup({ label, values, active, onChange }) {
  return <div className="chip-group"><span>{label}</span>{values.map((value) => <button className={active === value ? "selected" : ""} key={value} type="button" onClick={() => onChange(value)}>{value}</button>)}</div>;
}

function BookingsTable({ bookings, selected, setSelected, onDetail, onCancel }) {
  const allSelected = bookings.length > 0 && bookings.every((b) => selected.includes(b.id));

  function toggle(id) {
    setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  }

  function toggleAll() {
    setSelected(allSelected ? [] : bookings.map((b) => b.id));
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all visible rows" /></th><th>#</th><th>Client</th><th>Service</th><th>Barber</th><th>Date & Time</th><th>Dur.</th><th>Price</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{bookings.map((booking) => (
          <tr key={booking.id} onClick={() => onDetail(booking)}>
            <td data-label="Select" onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selected.includes(booking.id)} onChange={() => toggle(booking.id)} /></td>
            <td data-label="#">{String(booking.number).padStart(2, "0")}</td>
            <td data-label="Client"><strong>{booking.client}</strong></td>
            <td data-label="Service">{booking.service}</td>
            <td data-label="Barber"><Badge label={booking.barberInitials} style={{ "--badge": booking.barberColor }} /> {booking.barber}</td>
            <td data-label="Date & Time">{prettyDate(booking.date)} · {toDisplayTime(booking.time)}</td>
            <td data-label="Duration">{booking.duration}m</td>
            <td data-label="Price"><strong>{formatPeso(booking.price)}</strong></td>
            <td data-label="Payment"><Payment payment={booking.paymentStatus} /></td>
            <td data-label="Status"><Pill value={booking.status} /></td>
            <td data-label="Actions" className="row-actions" onClick={(event) => event.stopPropagation()}><button aria-label="Edit booking" onClick={() => onDetail(booking)}><Edit3 size={16} /></button><button aria-label="Cancel booking" onClick={() => onCancel(booking)}><X size={16} /></button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function BookingDetail({ booking, onClose, onCancel, onConfirm, onComplete, onReschedule, onMarkPaid }) {
  const active = booking.status === "pending" || booking.status === "confirmed";
  return (
    <SlidePanel title={booking.client} eyebrow="Booking Detail" onClose={onClose} status={<Pill value={booking.status} />}>
      <dl className="detail-list">
        <div><dt>Phone</dt><dd>{booking.phone}</dd></div>
        <div><dt>Service</dt><dd>{booking.service}</dd></div>
        <div><dt>Barber</dt><dd><Badge label={booking.barberInitials} style={{ "--badge": booking.barberColor }} /> {booking.barber}</dd></div>
        <div><dt>Date & Time</dt><dd>{prettyDate(booking.date)} · {toDisplayTime(booking.time)}</dd></div>
        <div><dt>Duration</dt><dd>{booking.duration} min</dd></div>
        <div><dt>Price</dt><dd>{formatPeso(booking.price)}</dd></div>
        <div><dt>Payment</dt><dd><Pill value={booking.paymentStatus} /></dd></div>
        {booking.notes ? <div><dt>Notes</dt><dd>{booking.notes}</dd></div> : null}
      </dl>
      <div className="panel-actions">
        {booking.status === "pending" ? <button className="outline-gold" type="button" onClick={onConfirm}><Check size={15} /> Confirm Booking</button> : null}
        {active ? <button className="ghost-button" type="button" onClick={onReschedule}><RefreshCw size={15} /> Reschedule</button> : null}
        {active ? <button className="ghost-button" type="button" onClick={onComplete}><Check size={15} /> Mark Complete</button> : null}
        {booking.paymentStatus === "unpaid" ? <button className="ghost-button" type="button" onClick={onMarkPaid}><Check size={15} /> Mark Paid</button> : null}
        <a className="ghost-button" href={`sms:${booking.phone}`}><MessageSquare size={15} /> Message</a>
        <a className="ghost-button" href={`tel:${booking.phone}`}><Phone size={15} /> Call</a>
      </div>
      {active ? <button className="danger-outline booking-cancel-btn" type="button" onClick={onCancel}>Cancel Booking</button> : null}
    </SlidePanel>
  );
}

function CancelModal({ booking, onClose, onConfirm }) {
  const [message, setMessage] = useState("");
  return (
    <Modal onClose={onClose}>
      <div className="modal-card warning-card">
        <div className="warning-title"><AlertTriangle size={22} /><h2>Cancel this booking?</h2></div>
        <p>This will cancel <strong>{booking.client}</strong>'s {booking.service} on {prettyDate(booking.date)}. You can include a note that will be saved on the booking.</p>
        <Input label="Cancellation note (optional)"><textarea rows="4" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Apologies, your barber is unavailable. Please rebook at your convenience." /></Input>
        <div className="modal-actions"><button className="ghost-button" type="button" onClick={onClose}>Keep Booking</button><button className="danger-button" type="button" onClick={() => onConfirm(message.trim())}>Confirm Cancel</button></div>
      </div>
    </Modal>
  );
}

function RescheduleModal({ booking, barbers, onClose, onConfirm }) {
  const [form, setForm] = useState({ date: booking.date, time: booking.time, barberId: booking.barberId });
  const [saving, setSaving] = useState(false);
  return (
    <Modal onClose={onClose}>
      <form className="modal-card" onSubmit={async (e) => { e.preventDefault(); setSaving(true); await onConfirm(form); setSaving(false); }}>
        <h2>Reschedule</h2>
        <span className="signature-divider" />
        <p className="muted-note">{booking.client} · {booking.service}</p>
        <div className="two-col">
          <Input label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></Input>
          <Input label="Time"><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></Input>
        </div>
        <Input label="Barber"><select value={form.barberId} onChange={(e) => setForm({ ...form, barberId: e.target.value })}>{barbers.filter((b) => b.active).map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}</select></Input>
        <div className="modal-actions"><button className="ghost-button" type="button" onClick={onClose}>Cancel</button><button className="gold-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Reschedule"}</button></div>
      </form>
    </Modal>
  );
}
