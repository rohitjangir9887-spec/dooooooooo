import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, DoorOpen, Scissors } from 'lucide-react'
import styles from './Hero.module.css'

const TRUST_ITEMS = [
  { Icon: DoorOpen,   label: 'Walk-ins Welcome' },
  { Icon: BadgeCheck, label: 'Honest Prices' },
  { Icon: Scissors,   label: 'Expert Barbers' },
]

export default function Hero() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function anim(delay) {
    return {
      className: `${styles.item} ${ready ? styles.animate : ''}`,
      style: { '--delay': delay },
    }
  }

  return (
    <header id="top" className={styles.hero}>
      <img
        src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1920&q=85"
        alt="Casa Barbero — barber at work"
        className={`${styles.bg} ${ready ? styles.bgZoom : ''}`}
      />
      <div className={styles.overlayH}    aria-hidden="true" />
      <div className={styles.overlayFade} aria-hidden="true" />
      <div className={styles.overlayGlow} aria-hidden="true" />

      <div className={styles.content}>
        <div {...anim('0.15s')}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden="true" />
            <span className={styles.badgeText}>Est. 2020 · Manila, Philippines</span>
          </div>
        </div>

        <h1 className={styles.headline}>
          <span {...anim('0.35s')} className={`${styles.item} ${ready ? styles.animate : ''} ${styles.block}`}>
            The Art of a
          </span>
          <em {...anim('0.55s')} className={`${styles.item} ${ready ? styles.animate : ''} ${styles.headlineAccent}`}>
            Great Cut.
          </em>
        </h1>

        <p {...anim('0.75s')} className={`${styles.item} ${ready ? styles.animate : ''} ${styles.sub}`}>
          Fresh cuts, clean fades, precise beards. Walk in and leave looking
          your best — every single time.
        </p>

        <div {...anim('0.85s')} className={`${styles.item} ${ready ? styles.animate : ''} ${styles.trust}`}>
          {TRUST_ITEMS.map(({ Icon, label }) => (
            <span className={styles.trustItem} key={label}>
              <Icon className={styles.trustIcon} size={15} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>

        <div {...anim('0.95s')} className={`${styles.item} ${ready ? styles.animate : ''} ${styles.actions}`}>
          <Link to="/booking" className={styles.btnPrimary}>View Services &amp; Prices</Link>
          <a href="#services" className={styles.btnGhost}>See What We Do →</a>
        </div>
      </div>

      <div className={styles.scrollHint} {...anim('1.2s')} aria-hidden="true">
        <span className={styles.scrollLine} />
        <span className={styles.scrollLabel}>Scroll</span>
      </div>
    </header>
  )
}
