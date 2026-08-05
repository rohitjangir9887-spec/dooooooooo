import useInView from '../hooks/useInView'
import CountUp from './CountUp'
import styles from './Stats.module.css'

const STATS = [
  { to: 3,   prefix: '',  suffix: '',  label: 'Expert Barbers' },
  { to: 15,  prefix: '',  suffix: '+', label: 'Years Combined Exp.' },
  { to: 500, prefix: '',  suffix: '+', label: 'Happy Clients' },
  { to: 120, prefix: '₱', suffix: '',  label: 'Starting Price' },
]

export default function Stats() {
  const [ref, inView] = useInView()

  return (
    <div className={styles.strip}>
      <ul
        ref={ref}
        className={`${styles.grid} ${inView ? styles.visible : ''}`}
        role="list"
      >
        {STATS.map(({ to, prefix, suffix, label }, i) => (
          <li key={label} className={styles.stat} style={{ '--i': i }}>
            <span className={styles.value}>
              {prefix}
              <CountUp to={to} duration={0.9} delay={i * 0.12} separator="," className={styles.countUp} />
              {suffix}
            </span>
            <span className={styles.label}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
