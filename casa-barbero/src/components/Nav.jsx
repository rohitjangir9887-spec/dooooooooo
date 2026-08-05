import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import styles from "./Nav.module.css";
import { ADMIN_LOGIN_URL } from "../config";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#team", label: "Team" },
  { href: "#gallery", label: "Gallery" },
  { href: "#pricing", label: "Pricing" },
  { href: "#contact", label: "Location" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <nav
        className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}
        aria-label="Main navigation"
      >
        <Link to="/" className={styles.logo}>
          Casa <span className={styles.logoAccent}>Barbero</span>
        </Link>

        <ul className={styles.links} role="list">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <a href={href} className={styles.link}>
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className={styles.navActions}>
          <a href={ADMIN_LOGIN_URL} className={styles.login}>
            Login
          </a>
          <Link to="/appointment" className={styles.cta}>
            Book Now
          </Link>
        </div>

        <button
          className={`${styles.hamburger} ${open ? styles.hamburgerOpen : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {createPortal(
        <div className={styles.mobileMenuLayer} aria-hidden={!open}>
          <div
            className={`${styles.backdrop} ${open ? styles.backdropOpen : ""}`}
            onClick={close}
            aria-hidden="true"
          />

          <aside
            id="mobile-navigation"
            className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}
            aria-label="Mobile navigation"
          >
            <div className={styles.drawerGlow} aria-hidden="true" />

            <div className={styles.drawerHead}>
              <Link to="/" className={styles.drawerLogo} onClick={close}>
                Casa <span className={styles.drawerLogoAccent}>Barbero</span>
              </Link>
              <button
                className={styles.closeBtn}
                onClick={close}
                aria-label="Close menu"
              >
                <span />
                <span />
              </button>
            </div>

            <div className={styles.drawerDivider} />

            <nav aria-label="Mobile links">
              <ul className={styles.drawerLinks} role="list">
                {NAV_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <a
                      href={href}
                      className={styles.drawerLink}
                      onClick={close}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className={styles.drawerDivider} />

            <Link
              to="/appointment"
              className={styles.drawerCta}
              onClick={close}
            >
              Book Appointment →
            </Link>

            <a
              href={ADMIN_LOGIN_URL}
              className={styles.drawerLogin}
              onClick={close}
            >
              Staff Login
            </a>

            <div className={styles.drawerFooter}>
              <p className={styles.drawerAddress}>
                123 Rizal St., Poblacion
                <br />
                Manila, Philippines
              </p>
              <a href="tel:+639171234567" className={styles.drawerPhone}>
                +63912 345 6789
              </a>
              <p className={styles.drawerHours}>
                Mon–Fri 9AM–8PM · Sat 9AM–6PM
              </p>
            </div>
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
