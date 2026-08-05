import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#team", label: "The Team" },
  { href: "#gallery", label: "Gallery" },
  { href: "#pricing", label: "Pricing" },
];

const SOCIALS = [
  { href: "#", label: "IG", title: "Instagram" },
  { href: "#", label: "FB", title: "Facebook" },
  { href: "#", label: "TK", title: "TikTok" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link to="/">
              <h2 className={styles.logo}>
                Casa <em className={styles.logoAccent}>Barbero</em>
              </h2>
            </Link>
            <p className={styles.tagline}>
              Fresh cuts, clean fades, honest prices. Your go-to barbershop in
              Poblacion, Manila.
            </p>
            <ul className={styles.socials} aria-label="Social links">
              {SOCIALS.map(({ href, label, title }) => (
                <li key={label}>
                  <a href={href} className={styles.social} aria-label={title}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer navigation">
            <span className={styles.colLabel}>Navigate</span>
            <ul className={styles.colLinks}>
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a href={href} className={styles.colLink}>
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/booking" className={styles.colLink}>
                  Book Now
                </Link>
              </li>
            </ul>
          </nav>

          <address className={styles.location}>
            <span className={styles.colLabel}>Location</span>
            <p className={styles.locationText}>
              123 Rizal St., Poblacion
              <br />
              Manila, Philippines
            </p>
            <p className={styles.locationText}>
              <a href="tel:+639171234567">+63912 345 6789</a>
            </p>
            <p className={styles.locationText}>
              Mon–Fri: 9AM – 8PM
              <br />
              Sat: 9AM – 6PM
              <br />
              Sun: Closed
            </p>
          </address>
        </div>

        <div className={styles.bottom}>
          <span className={styles.copy}>
            © 2026 Casa Barbero · Manila, Philippines
          </span>
          <span className={styles.copy}>Walk-ins always welcome</span>
        </div>
      </div>
    </footer>
  );
}
