import { Link } from 'react-router-dom'
import useInView from '../hooks/useInView'
import styles from './Pricing.module.css'

const LEFT = [
  { label: 'Regular Haircut',   price: '₱120' },
  { label: 'Skin Fade',         price: '₱150' },
  { label: 'High Fade',         price: '₱180' },
]

const RIGHT = [
  { label: 'Beard Trim',        price: '₱100' },
  { label: 'Straight Shave',    price: '₱130' },
  { label: 'Cut + Beard Combo', price: '₱220' },
]

function PriceRow({ label, price }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowDots} aria-hidden="true" />
      <span className={styles.rowPrice}>{price}</span>
    </div>
  )
}

export default function Pricing() {
  const [ref, inView] = useInView()

  return (
    <section id="pricing" className={styles.section} aria-labelledby="pricing-heading">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <div ref={ref} className={`${styles.content} ${inView ? styles.visible : ''}`}>

          <div className={styles.header}>
            <span className={styles.eyebrow}>Transparent Pricing</span>
            <h2 id="pricing-heading" className={styles.heading}>
              Honest <em className={styles.accent}>rates.</em>
            </h2>
            <p className={styles.sub}>No hidden charges. What you see is what you pay.</p>
          </div>

          <div className={styles.grid}>
            <div className={styles.col}>{LEFT.map(item => <PriceRow key={item.label} {...item} />)}</div>
            <div className={styles.col}>{RIGHT.map(item => <PriceRow key={item.label} {...item} />)}</div>
          </div>

          <div className={styles.cta}>
            <Link to="/booking" className={styles.ctaBtn}>See Full Service Menu</Link>
            <span className={styles.ctaNote}>Walk-ins welcome · Cash & GCash accepted</span>
          </div>

        </div>
      </div>
    </section>
  )
}
