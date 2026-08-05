import useInView from '../hooks/useInView'
import styles from './Gallery.module.css'

const IMAGES = [
  { src: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=500&q=80', span: 'tall' },
  { src: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=80', span: '' },
  { src: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=500&q=80', span: '' },
  { src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=80', span: 'tall' },
  { src: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=500&q=80', span: '' },
  { src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=500&q=80', span: '' },
  { src: 'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=900&q=80', span: 'wide' },
]

export default function Gallery() {
  const [ref, inView] = useInView()

  return (
    <section id="gallery" className={styles.section} aria-labelledby="gallery-heading">
      <div className={styles.inner}>
        <div
          ref={ref}
          className={`${styles.content} ${inView ? styles.visible : ''}`}
        >
          <div className={styles.header}>
            <div>
              <span className={styles.eyebrow}>From the Chair</span>
              <h2 id="gallery-heading" className={styles.heading}>
                The <em className={styles.headingAccent}>gallery.</em>
              </h2>
            </div>
            <a href="#" className={styles.instagramLink}>
              @casabarbero on Instagram →
            </a>
          </div>

          <div className={styles.grid} role="list">
            {IMAGES.map(({ src, span }, i) => (
              <div
                key={i}
                role="listitem"
                className={`${styles.cell} ${span === 'tall' ? styles.tall : ''} ${span === 'wide' ? styles.wide : ''}`}
              >
                <img src={src} alt="" className={styles.img} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
