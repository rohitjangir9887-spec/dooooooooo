import useInView from '../hooks/useInView'
import styles from './Testimonial.module.css'

const STARS = '★★★★★'

export default function Testimonial() {
  const [ref, inView] = useInView()

  return (
    <section className={styles.section} aria-label="Client testimonial">
      <div className={styles.inner}>
        <div ref={ref} className={`${styles.content} ${inView ? styles.visible : ''}`}>

          <div className={styles.stars} aria-label="5 stars">{STARS}</div>

          <blockquote className={styles.quote}>
            "Best haircut I've had in years. They take their time, ask the
            right questions, and the result is exactly what I wanted.
            Clean, sharp, and worth every peso."
          </blockquote>

          <footer className={styles.attribution}>
            <span className={styles.rule} aria-hidden="true" />
            <cite className={styles.cite}>Ramon S. — Regular since 2023</cite>
            <span className={styles.rule} aria-hidden="true" />
          </footer>

        </div>
      </div>
    </section>
  )
}
