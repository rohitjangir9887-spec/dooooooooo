import { Link } from 'react-router-dom'
import useInView from '../hooks/useInView'
import styles from './Services.module.css'

const SERVICES = [
  {
    num:   '01',
    title: 'Classic Cut',
    desc:  'Precision scissor work shaped to your face. Neckline and ear clean-up included.',
    tag:   'Most Popular',
  },
  {
    num:   '02',
    title: 'Skin Fade',
    desc:  'Seamless fade from skin to length — high, mid, or low.',
    tag:   'Best Value',
  },
  {
    num:   '03',
    title: 'Beard Service',
    desc:  'Sculpted trim or straight-razor shave. Finished with warm oil.',
    tag:   null,
  },
]

export default function Services() {
  const [ref, inView] = useInView()

  return (
    <section id="services" className={styles.section} aria-labelledby="services-heading">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <div ref={ref} className={`${styles.content} ${inView ? styles.visible : ''}`}>

          <div className={styles.header}>
            <div>
              <span className={styles.eyebrow}>What We Do</span>
              <h2 id="services-heading" className={styles.heading}>
                Cuts built for<br />the <em className={styles.accent}>modern man.</em>
              </h2>
            </div>
            <p className={styles.lead}>
              Every service is done with full attention — no rush, no shortcuts.
              Just a great result you can trust.
            </p>
          </div>

          <div className={styles.grid} role="list">
            {SERVICES.map(({ num, title, desc, tag }) => (
              <article key={num} className={styles.card} role="listitem">
                <div className={styles.cardTop}>
                  <span className={styles.cardNum} aria-hidden="true">{num}</span>
                  {tag && <span className={styles.cardTag}>{tag}</span>}
                </div>
                <h3 className={styles.cardTitle}>{title}</h3>
                <p className={styles.cardDesc}>{desc}</p>
              </article>
            ))}
          </div>

          <div className={styles.viewAll}>
            <Link to="/booking" className={styles.viewAllBtn}>View All Services →</Link>
          </div>

        </div>
      </div>
    </section>
  )
}
