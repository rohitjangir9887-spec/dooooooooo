import "../assets/styles/barbers.css";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { formatPeso, prettyDate, toDisplayTime } from "../utils/formatters.js";
import { api } from "../services/api.js";
import { Badge, Input, Modal, PageHeader, Segmented, Toggle } from "../components/ui/index.jsx";
import { useToast } from "../components/ui/toast.jsx";

export default function Barbers({ barbers, catalog, setBarbers, setCatalog }) {
  const toast = useToast();
  const [selected, setSelected] = useState(barbers[0]?.id || null);
  const [tab, setTab] = useState("Working Hours");
  const [addOpen, setAddOpen] = useState(false);
  const barber = barbers.find((item) => item.id === selected) || barbers[0];

  // Track selected ID when barbers load for the first time
  useEffect(() => {
    if (!selected && barbers[0]) setSelected(barbers[0].id);
  }, [barbers, selected]);

  async function toggleActive(target) {
    const next = !target.active;
    setBarbers(barbers.map((b) => b.id === target.id ? { ...b, active: next } : b));
    try {
      await api(`/api/admin/barbers/${target.id}`, { method: "PATCH", body: JSON.stringify({ is_active: next }) });
    } catch (error) {
      setBarbers(barbers);
      toast(error.message);
    }
  }

  async function patchHours(dayIndex, payload) {
    await api(`/api/admin/availability/hours/${barber.id}/${dayIndex}`, { method: "PATCH", body: JSON.stringify(payload) });
    setBarbers(barbers.map((b) => b.id === barber.id ? {
      ...b,
      hours: b.hours.map((h) => h.dayIndex === dayIndex ? {
        ...h,
        open: payload.isOpen,
        openTime: payload.openTime,
        closeTime: payload.closeTime,
        breakStart: payload.breakStart,
        breakEnd: payload.breakEnd,
        start: payload.isOpen ? toDisplayTime(payload.openTime) : "Closed",
        end: payload.isOpen ? toDisplayTime(payload.closeTime) : "--"
      } : h)
    } : b));
  }

  async function addBlock(values) {
    const response = await api("/api/admin/availability/block", {
      method: "POST",
      body: JSON.stringify({ ...values, barberId: barber.id })
    });
    setCatalog({ ...catalog, blockedTimes: [response.block, ...catalog.blockedTimes] });
  }

  async function deleteBlock(id) {
    const previous = catalog.blockedTimes;
    setCatalog({ ...catalog, blockedTimes: previous.filter((b) => b.id !== id) });
    try {
      await api(`/api/admin/availability/block/${id}`, { method: "DELETE" });
    } catch (error) {
      setCatalog({ ...catalog, blockedTimes: previous });
      toast(error.message);
    }
  }

  async function toggleOffered(service) {
    const current = barber.serviceIds || [];
    const next = current.includes(service.id) ? current.filter((x) => x !== service.id) : [...current, service.id];
    setBarbers(barbers.map((b) => b.id === barber.id ? { ...b, serviceIds: next } : b));
    try {
      await api(`/api/admin/barbers/${barber.id}/services`, { method: "PUT", body: JSON.stringify({ serviceIds: next }) });
    } catch (error) {
      setBarbers(barbers);
      toast(error.message);
    }
  }

  async function saveService(id, form) {
    const response = await api(`/api/admin/services/${id}`, { method: "PATCH", body: JSON.stringify(form) });
    setCatalog({ ...catalog, services: catalog.services.map((s) => s.id === id ? response.service : s) });
  }

  async function addService(form) {
    const response = await api("/api/admin/services", { method: "POST", body: JSON.stringify(form) });
    const created = response.service;
    setCatalog({ ...catalog, services: [...catalog.services, created] });
    // Offer the new service on the barber it was added under
    const next = [...(barber.serviceIds || []), created.id];
    setBarbers(barbers.map((b) => b.id === barber.id ? { ...b, serviceIds: next } : b));
    api(`/api/admin/barbers/${barber.id}/services`, { method: "PUT", body: JSON.stringify({ serviceIds: next }) }).catch((error) => toast(error.message));
  }

  const barberBlocks = catalog.blockedTimes.filter((b) => b.barberId === barber?.id);

  return (
    <section>
      <PageHeader title="Manage Availability" />
      <div className="availability-layout">
        <aside className="barber-list panel">
          <p>Team · {barbers.length} Barbers</p>
          {barbers.map((item) => (
            <button className={selected === item.id ? "selected" : ""} key={item.id} type="button" onClick={() => setSelected(item.id)}>
              <Badge label={item.initials} style={{ "--badge": item.color }} />
              <span><strong>{item.name}</strong><em>{item.role}</em></span>
              <Toggle checked={item.active} onChange={() => toggleActive(item)} />
            </button>
          ))}
          <button className="dashed-button" type="button" onClick={() => setAddOpen(true)}><Plus size={16} /> Add Barber</button>
        </aside>
        <section className="panel barber-detail">
          <header className="barber-header">
            <Badge label={barber?.initials || "?"} style={{ "--badge": barber?.color || "#C9A84C" }} />
            <div><h2>{barber?.name}</h2><p>{barber?.role}</p></div>
          </header>
          <Segmented options={["Working Hours", "Blocked Time", "Services"]} value={tab} onChange={setTab} />
          {tab === "Working Hours"
            ? <WorkingHours key={barber?.id} barber={barber} onPatch={patchHours} toast={toast} />
            : tab === "Blocked Time"
              ? <BlockedTime blockedTimes={barberBlocks} onAdd={addBlock} onDelete={deleteBlock} toast={toast} />
              : <ServiceGrid key={barber?.id} services={catalog.services} barber={barber} onToggleOffered={toggleOffered} onSave={saveService} onAdd={addService} toast={toast} />}
        </section>
      </div>
      <AnimatePresence>
        {addOpen ? (
          <AddBarberModal
            tagColors={catalog.tagColors || []}
            onClose={() => setAddOpen(false)}
            onAdd={(created) => {
              setBarbers([...barbers, created]);
              setSelected(created.id);
              setAddOpen(false);
            }}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function AddBarberModal({ tagColors, onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", role: "", tagColorId: tagColors[0]?.id ?? null });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const response = await api("/api/admin/barbers", {
        method: "POST",
        body: JSON.stringify({ name: form.name.trim(), role: form.role.trim() || "Barber", tagColorId: form.tagColorId })
      });
      onAdd(response.barber);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-card">
        <h2>Add Barber</h2>
        <span className="signature-divider" />
        <form className="panel-form" onSubmit={handleSubmit}>
          <label className="input-field">
            <span>Full Name</span>
            <input type="text" placeholder="e.g. Miguel Santos" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          </label>
          <label className="input-field">
            <span>Role / Position</span>
            <input type="text" placeholder="e.g. Senior Barber" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          </label>
          {tagColors.length > 0 ? (
            <div className="input-field">
              <span>Badge Color</span>
              <div className="color-swatch-row">
                {tagColors.map((color) => (
                  <button key={color.id} type="button" className={`color-swatch${form.tagColorId === color.id ? " active" : ""}`} style={{ background: color.hex }} onClick={() => setForm({ ...form, tagColorId: color.id })} aria-label={`Select color ${color.name}`} />
                ))}
              </div>
            </div>
          ) : null}
          {error ? <small className="form-error">{error}</small> : null}
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={onClose}>Cancel</button>
            <button className="gold-button" type="submit" disabled={saving}>{saving ? "Adding..." : "Add Barber"}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// Time fields per hours row, paired with their visible labels
const HOUR_FIELDS = [
  ["openTime", "Start"],
  ["closeTime", "End"],
  ["breakStart", "Break Start"],
  ["breakEnd", "Break End"]
];

function WorkingHours({ barber, onPatch, toast }) {
  const [rows, setRows] = useState(barber?.hours || []);
  const [busy, setBusy] = useState(false);

  useEffect(() => setRows(barber?.hours || []), [barber]);

  async function commit(row, changes) {
    const payload = {
      isOpen: row.open,
      openTime: row.openTime ?? "09:00",
      closeTime: row.closeTime ?? "19:00",
      breakStart: row.breakStart ?? "13:00",
      breakEnd: row.breakEnd ?? "14:00",
      ...changes
    };
    try {
      await onPatch(row.dayIndex, payload);
    } catch (error) {
      toast(error.message);
    }
  }

  async function applyMondayToAll() {
    const monday = rows[0];
    if (!monday) return;
    setBusy(true);
    try {
      await Promise.all(rows.slice(1).map((row) => commit(row, {
        isOpen: monday.open,
        openTime: monday.openTime,
        closeTime: monday.closeTime,
        breakStart: monday.breakStart,
        breakEnd: monday.breakEnd
      })));
    } finally {
      setBusy(false);
    }
  }

  function updateLocal(dayIndex, changes) {
    setRows(rows.map((r) => r.dayIndex === dayIndex ? { ...r, ...changes } : r));
  }

  return (
    <div className="hours-grid">
      <header><strong>Weekly schedule</strong><button type="button" onClick={applyMondayToAll} disabled={busy}>{busy ? "Applying..." : "Apply Mon hours to all days"}</button></header>
      <div className="hours-row head">
        <span>Day</span>
        <span>Open</span>
        <div className="hours-fields">
          {HOUR_FIELDS.map(([field, label]) => <span key={field}>{label}</span>)}
        </div>
      </div>
      {rows.map((row) => (
        <div className="hours-row" key={row.day}>
          <strong>{row.day}</strong>
          <Toggle checked={row.open} onChange={() => { updateLocal(row.dayIndex, { open: !row.open }); commit(row, { isOpen: !row.open }); }} />
          <div className="hours-fields">
            {HOUR_FIELDS.map(([field, label]) => (
              <label className="hours-field" key={field}>
                <em>{label}</em>
                <input
                  type="time"
                  value={row[field] ?? ""}
                  disabled={!row.open}
                  onChange={(e) => updateLocal(row.dayIndex, { [field]: e.target.value })}
                  onBlur={(e) => e.target.value && commit({ ...row, [field]: e.target.value }, {})}
                  aria-label={`${row.day} ${label}`}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BlockedTime({ blockedTimes, onAdd, onDelete, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), allDay: true, start: "09:00", end: "12:00", reason: "" });
  const [saving, setSaving] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.reason.trim()) return;
    setSaving(true);
    try {
      await onAdd({
        date: form.date,
        isAllDay: form.allDay,
        startTime: form.allDay ? null : form.start,
        endTime: form.allDay ? null : form.end,
        reason: form.reason.trim()
      });
      setShowForm(false);
      setForm({ ...form, reason: "" });
    } catch (error) {
      toast(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="block-list">
      {blockedTimes.length === 0 && !showForm ? <p className="muted-note">No blocked dates for this barber.</p> : null}
      {blockedTimes.map((block) => (
        <article key={block.id}>
          <div><strong>{prettyDate(block.date)}</strong><span>{block.reason} · {block.allDay ? "All day" : `${block.start}–${block.end}`}</span></div>
          <button aria-label="Delete block" onClick={() => onDelete(block.id)}><Trash2 size={16} /></button>
        </article>
      ))}
      {showForm ? (
        <form className="add-service-form" onSubmit={handleAdd}>
          <div className="add-service-row">
            <Input label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></Input>
            <label className="toggle-row compact"><span>All-day</span><Toggle checked={form.allDay} onChange={() => setForm({ ...form, allDay: !form.allDay })} /></label>
          </div>
          {!form.allDay ? (
            <div className="add-service-row">
              <Input label="Start"><input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></Input>
              <Input label="End"><input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></Input>
            </div>
          ) : null}
          <Input label="Reason"><input type="text" placeholder="e.g. Vacation" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required autoFocus /></Input>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="gold-button" type="submit" disabled={saving}>{saving ? "Blocking..." : "Block Time"}</button>
          </div>
        </form>
      ) : (
        <button className="outline-gold" type="button" onClick={() => setShowForm(true)}><Plus size={16} /> Block Time</button>
      )}
    </div>
  );
}

function ServiceGrid({ services, barber, onToggleOffered, onSave, onAdd, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "" });
  const [saving, setSaving] = useState(false);
  const offered = new Set(barber?.serviceIds || []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    try {
      await onAdd({ name: form.name.trim(), price: Number(form.price), durationMin: Number(form.duration) || 30 });
      setForm({ name: "", price: "", duration: "" });
      setShowForm(false);
    } catch (error) {
      toast(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="hours-grid">
      <header><strong>Services · {services.length}</strong><span className="muted-note">Toggle = offered by {barber?.name?.split(" ")[0] ?? "barber"}</span></header>
      <div className="service-grid">
        {services.map((service) => (
          editingId === service.id
            ? <EditServiceCard key={service.id} service={service} onSave={async (changes) => { try { await onSave(service.id, changes); setEditingId(null); } catch (error) { toast(error.message); } }} onCancel={() => setEditingId(null)} />
            : (
              <article key={service.id} className={service.active === false ? "inactive-service" : ""}>
                <div>
                  <h3>{service.name}{service.active === false ? <em className="inactive-tag"> · retired</em> : null}</h3>
                  <strong>{formatPeso(service.price)}</strong>
                  <time>{service.duration} min</time>
                </div>
                <Toggle checked={offered.has(service.id)} onChange={() => onToggleOffered(service)} />
                <button type="button" onClick={() => setEditingId(service.id)}>Edit pricing</button>
              </article>
            )
        ))}
      </div>
      {showForm ? (
        <form className="add-service-form" onSubmit={handleAdd}>
          <label className="input-field">
            <span>Service Name</span>
            <input type="text" placeholder="e.g. Hot Towel Shave" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          </label>
          <div className="add-service-row">
            <label className="input-field">
              <span>Price (₱)</span>
              <input type="number" min="0" placeholder="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </label>
            <label className="input-field">
              <span>Duration (min)</span>
              <input type="number" min="5" placeholder="30" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="gold-button" type="submit" disabled={saving}>{saving ? "Adding..." : "Add Service"}</button>
          </div>
        </form>
      ) : (
        <button className="outline-gold service-add-btn" type="button" onClick={() => setShowForm(true)}><Plus size={15} /> Add Service</button>
      )}
    </div>
  );
}

function EditServiceCard({ service, onSave, onCancel }) {
  const [form, setForm] = useState({ name: service.name, price: service.price, duration: service.duration, active: service.active !== false });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ name: form.name.trim(), price: Number(form.price), durationMin: Number(form.duration), active: form.active });
    setSaving(false);
  }

  return (
    <article className="edit-service-card">
      <form onSubmit={handleSave}>
        <Input label="Name"><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Input>
        <div className="add-service-row">
          <Input label="Price (₱)"><input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></Input>
          <Input label="Duration"><input type="number" min="5" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Input>
        </div>
        <label className="toggle-row compact"><span>Bookable</span><Toggle checked={form.active} onChange={() => setForm({ ...form, active: !form.active })} /></label>
        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="gold-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </article>
  );
}
