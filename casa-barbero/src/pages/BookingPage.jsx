import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Phone } from 'lucide-react'
import styles from './BookingPage.module.css'
import ConciergeBanner from '../components/ConciergeBanner'
import { ADMIN_LOGIN_URL } from '../config'

const CATEGORIES = [
  {
    id:       'cuts',
    label:    'Haircut Services',
    eyebrow:  'For Every Style',
    services: [
      { name: 'Regular Haircut',  price: '₱120', amount: 120, duration: 30, desc: 'Clean scissor cut shaped to your face. Neckline and ear cleanup included.' },
      { name: 'Skin Fade',        price: '₱150', amount: 150, duration: 30, desc: 'Seamless fade from bare skin to length — high, mid, or low.' },
      { name: 'High Fade',        price: '₱180', amount: 180, duration: 30, desc: 'Bold contrast with skin at the temples. Sharp and modern.' },
      { name: 'Textured Crop',    price: '₱150', amount: 150, duration: 30, desc: 'Short crop with a textured, messy-styled finish on top.' },
      { name: 'Buzz Cut',         price: '₱100', amount: 100, duration: 20, desc: 'Machine cut all over. Neat, low-maintenance, done in minutes.' },
      { name: 'Classic Undercut', price: '₱160', amount: 160, duration: 30, desc: 'Longer top with shaved or faded sides. Timeless and versatile.' },
    ],
  },
  {
    id:       'beard',
    label:    'Beard Services',
    eyebrow:  'Sharp & Clean',
    services: [
      { name: 'Beard Trim & Shape',   price: '₱100', amount: 100, duration: 20, desc: 'Sculpted beard with defined lines and a clean, shaped finish.' },
      { name: 'Straight Razor Shave', price: '₱130', amount: 130, duration: 20, desc: 'Classic hot-towel straight-razor shave for a smooth, close result.' },
      { name: 'Hot Towel Shave',      price: '₱150', amount: 150, duration: 30, desc: 'Relaxing warm-towel ritual with straight razor and finishing balm.' },
      { name: 'Beard + Mustache',     price: '₱120', amount: 120, duration: 20, desc: 'Full beard and mustache groomed and shaped together.' },
    ],
  },
  {
    id:       'combos',
    label:    'Combo Deals',
    eyebrow:  'Best Value',
    services: [
      { name: 'Haircut + Beard Trim', price: '₱220', amount: 220, duration: 45, desc: 'Complete top-to-bottom look. Save ₱30 vs. booking separately.' },
      { name: 'Haircut + Hot Towel',  price: '₱250', amount: 250, duration: 45, desc: 'A full grooming experience — cut, straight-razor shave, finish.' },
      { name: 'The Full Package',     price: '₱300', amount: 300, duration: 60, desc: 'Haircut, beard service, hair wash, and styling — the works.' },
    ],
  },
  {
    id:       'kids',
    label:    "Kids' Services",
    eyebrow:  'Ages 12 & Below',
    services: [
      { name: "Kids' Haircut", price: '₱100', amount: 100, duration: 20, desc: 'A clean, kid-friendly cut. Patient barbers, great results.' },
    ],
  },
]

const TRUST = [
  { icon: '✓', text: 'Walk-ins welcome' },
  { icon: '✓', text: 'Cash & GCash accepted' },
  { icon: '✓', text: 'No hidden charges' },
  { icon: '✓', text: 'Honest pricing' },
]

export default function BookingPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          Casa <span className={styles.logoAccent}>Barbero</span>
        </Link>
        <div className={styles.headerActions}>
          <Link to="/" className={styles.back}>
            ← Back to Home
          </Link>
          <a href={ADMIN_LOGIN_URL} className={styles.login}>Login</a>
        </div>
      </header>

      <ConciergeBanner />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Complete Service Menu</span>
          <h1 className={styles.heroTitle}>
            Services &<br /><em className={styles.heroAccent}>Pricing.</em>
          </h1>
          <p className={styles.heroSub}>
            Straight cuts, clean fades, and fresh beards — all at prices that
            make sense. See what we offer and come in anytime.
          </p>

          <div className={styles.trustStrip}>
            {TRUST.map(({ icon, text }) => (
              <span key={text} className={styles.trustItem}>
                <span className={styles.trustIcon}>{icon}</span>
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Service categories */}
      <main className={styles.main}>
        {CATEGORIES.map(({ id, label, eyebrow, services }) => (
          <section key={id} className={styles.category} aria-labelledby={`cat-${id}`}>
            <div className={styles.catHeader}>
              <span className={styles.catEyebrow}>{eyebrow}</span>
              <h2 id={`cat-${id}`} className={styles.catTitle}>{label}</h2>
            </div>

            <div className={styles.serviceGrid}>
              {services.map(({ name, price, amount, duration, desc }) => (
                <article key={name} className={styles.serviceCard}>
                  <div className={styles.serviceTop}>
                    <h3 className={styles.serviceName}>{name}</h3>
                    <span className={styles.servicePrice}>{price}</span>
                  </div>
                  <p className={styles.serviceDesc}>{desc}</p>
                  <Link
                    to={`/appointment?svc=${encodeURIComponent(name)}&price=${amount}&dur=${duration}`}
                    className={styles.bookBtn}
                  >
                    Book This →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* CTA */}
      <section className={styles.cta} aria-label="How to book">
        <div className={styles.ctaInner}>
          <div className={styles.ctaGlow} aria-hidden="true" />

          <span className={styles.eyebrow}>Ready to Book?</span>
          <h2 className={styles.ctaTitle}>
            Call or WhatsApp us<br />to reserve your slot.
          </h2>
          <p className={styles.ctaSub}>
            Walk-ins are always welcome, but a quick call guarantees your spot.
          </p>

          <div className={styles.ctaActions}>
            <Link to="/appointment" className={styles.ctaBtnPrimary}>
              Book Online →
            </Link>
            <a href="tel:+639171234567" className={styles.ctaBtnGhost}>
              <Phone size={14} strokeWidth={1.75} aria-hidden="true" /> Call Now
            </a>
          </div>

          <div className={styles.ctaMeta}>
            <span>+63 912 345 6789</span>
            <span className={styles.ctaDivider}>·</span>
            <span>123 Rizal St., Poblacion, Manila</span>
            <span className={styles.ctaDivider}>·</span>
            <span>Mon–Sat Open</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <Link to="/" className={styles.footerBack}>← Back to Casa Barbero</Link>
        <span className={styles.footerCopy}>© 2026 Casa Barbero · Manila</span>
      </footer>

    </div>
  )
}
