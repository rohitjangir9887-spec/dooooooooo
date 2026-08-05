import { motion } from "framer-motion";
import { CreditCard, Search, X } from "lucide-react";
import { titleCase } from "../../utils/formatters.js";

export function PageHeader({ title, meta, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <span className="signature-divider" />
      </div>
      {meta ? <p className="mono">{meta}</p> : null}
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}

export function PanelTitle({ title, value }) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      {value ? <strong>{value}</strong> : null}
    </div>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map((option) => <button className={value === option ? "selected" : ""} type="button" key={option} onClick={() => onChange(option)}>{titleCase(option)}</button>)}
    </div>
  );
}

export function Input({ label, children, error }) {
  return <label className="input-field"><span>{label}</span>{children}{error ? <small>{error}</small> : null}</label>;
}

export function SlidePanel({ title, eyebrow, status, onClose, children }) {
  return (
    <>
      <motion.button className="panel-scrim" aria-label="Close panel" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.aside className="slide-panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}>
        <button className="close-btn" type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        {status}
        <span className="signature-divider" />
        {children}
      </motion.aside>
    </>
  );
}

export function Modal({ onClose, children }) {
  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button className="modal-clickout" aria-label="Close modal" onClick={onClose} />
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.2 }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function Toggle({ checked, onChange, register }) {
  return <input className="switch" type="checkbox" checked={checked} onChange={onChange} readOnly={!onChange && !register} {...register} aria-label="Toggle setting" />;
}

export function Badge({ label, style }) {
  return <span className="badge" style={style}>{label}</span>;
}

export function Pill({ value }) {
  return <span className={`pill ${String(value).toLowerCase()}`}>{String(value).toUpperCase()}</span>;
}

export function Payment({ payment }) {
  return <span className={`payment ${payment}`}><i /> {titleCase(payment)}</span>;
}

export function Method({ method }) {
  return <span className="method"><CreditCard size={15} />{method}</span>;
}

export function Kpi({ title, value, detail, trend, tone, dot }) {
  const showPill = trend && trend !== "amber";
  return (
    <article className="kpi-card">
      <p>{dot ? <span className="amber-dot" /> : null}{title}</p>
      <div>
        <strong>{value}</strong>
        {showPill ? <span className={`trend ${tone ?? ""}`}>{tone === "down" ? "↓" : "↑"} {trend.replace(/[+-]/, "")}</span> : null}
      </div>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

export function EmptyState({ onClear }) {
  return <div className="empty-state"><Search size={42} /><h2>No bookings match your filters.</h2><button className="outline-gold" type="button" onClick={onClear}>Clear filters</button></div>;
}

export function BulkBar({ count, onClear, onCancel, onComplete, onExport }) {
  return <motion.div className="bulk-bar" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}><strong>{count} selected</strong><button onClick={onCancel}>Cancel Selected</button><button onClick={onComplete}>Mark Completed</button><button onClick={onExport}>Export</button><button onClick={onClear} aria-label="Clear selection"><X size={16} /></button></motion.div>;
}
