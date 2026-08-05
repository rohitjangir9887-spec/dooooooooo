import useInView from '../hooks/useInView'
import styles from './Team.module.css'

const TEAM = [
  {
    name: 'Marco Santos',
    role: 'Master Barber · Founder',
    bio:  'Fifteen years behind the chair. Precision scissor work, clean fades, and the kind of attention to detail that keeps clients coming back.',
    img:  'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&h=800&q=80',
  },
  {
    name: 'Miko Reyes',
    role: 'Senior Stylist',
    bio:  'Specialist in skin fades, textured crops, and modern men\'s styling. Fast, clean, and always on point.',
    img:  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&h=800&q=80',
  },
  {
    name: 'Carlo Cruz',
    role: 'Barber · Razor Work',
    bio:  'Straight-razor purist with a steady, unhurried hand. Known for the cleanest beard lines in the shop.',
    img:  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&h=800&q=80',
  },
]

export default function Team() {
  const [ref, inView] = useInView()

  return (
    <section id="team" className={styles.section} aria-labelledby="team-heading">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <div ref={ref} className={`${styles.content} ${inView ? styles.visible : ''}`}>

          <div className={styles.header}>
            <span className={styles.eyebrow}>The People Behind the Chair</span>
            <h2 id="team-heading" className={styles.heading}>
              Meet the <em className={styles.accent}>barbers.</em>
            </h2>
          </div>

          <div className={styles.grid}>
            {TEAM.map(({ name, role, bio, img }) => (
              <article key={name} className={styles.member}>
                <div className={styles.portrait}>
                  <img src={img} alt={name} className={styles.photo} loading="lazy" />
                  <div className={styles.photoOverlay} aria-hidden="true" />
                  <div className={styles.photoName} aria-hidden="true">{name}</div>
                </div>
                <div className={styles.info}>
                  <h3 className={styles.name}>{name}</h3>
                  <p className={styles.role}>{role}</p>
                  <p className={styles.bio}>{bio}</p>
                </div>
              </article>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
