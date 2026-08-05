import { Link } from "react-router-dom";
import useInView from "../hooks/useInView";
import styles from "./Hours.module.css";

const HOURS = [
  { day: "Monday – Friday", time: "9:00 AM — 8:00 PM", closed: false },
  { day: "Saturday", time: "9:00 AM — 6:00 PM", closed: false },
  { day: "Sunday", time: "Closed", closed: true },
];

export default function Hours() {
  const [ref, inView] = useInView();

  return (
    <section className={styles.section} aria-label="Opening hours and location">
      <div className={styles.inner}>
        <div
          ref={ref}
          className={`${styles.content} ${inView ? styles.visible : ""}`}
        >
          <div className={styles.grid}>
            <aside className={styles.card}>
              <span className={styles.eyebrow}>Open House</span>
              <h2 className={styles.cardHeading}>Working Hours</h2>

              <dl className={styles.schedule}>
                {HOURS.map(({ day, time, closed }) => (
                  <div key={day} className={styles.scheduleRow}>
                    <dt className={styles.scheduleDay}>{day}</dt>
                    <dd
                      className={
                        closed ? styles.scheduleClosed : styles.scheduleTime
                      }
                    >
                      {time}
                    </dd>
                  </div>
                ))}
              </dl>

              <h3 className={styles.visitHeading}>Find Us</h3>
              <address className={styles.address}>
                <a href="tel:+639171234567">+63912 345 6789</a>
                <br />
                <a href="mailto:hello@casabarbero.ph">hello@casabarbero.ph</a>
                <br />
                123 Rizal St., Poblacion
                <br />
                Manila, Philippines
              </address>

              <Link to="/booking" className={styles.bookBtn}>
                View Services &amp; Book
              </Link>
            </aside>

            <div className={styles.imgWrap} aria-hidden="true">
              <img
                src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=80"
                alt="Casa Barbero interior"
                className={styles.img}
                loading="lazy"
              />
              <div className={styles.imgOverlay} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
