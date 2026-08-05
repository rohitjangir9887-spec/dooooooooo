import { AlertTriangle } from "lucide-react";

export function AuthField({ label, children, error, danger }) {
  return (
    <label className={`field ${danger ? "danger" : ""}`}>
      <span>{label}</span>
      {children}
      {error ? <small role="alert"><AlertTriangle size={14} /> {error}</small> : null}
    </label>
  );
}
