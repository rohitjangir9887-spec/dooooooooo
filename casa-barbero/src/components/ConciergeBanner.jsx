import { Phone } from "lucide-react";
import styles from "./ConciergeBanner.module.css";
import { CONCIERGE_PHONE, CONCIERGE_TEL } from "../config";

// Prominent strip nudging customers who would rather book over the phone.
export default function ConciergeBanner() {
  return (
    <aside className={styles.banner} aria-label="Book by phone">
      <Phone className={styles.icon} size={15} strokeWidth={1.75} aria-hidden="true" />
      <p className={styles.text}>
        Prefer to book by phone? Call our concierge at{" "}
        <a href={`tel:${CONCIERGE_TEL}`} className={styles.phone}>{CONCIERGE_PHONE}</a>
      </p>
    </aside>
  );
}
