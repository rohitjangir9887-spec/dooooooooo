import { useState } from "react";
import useInView from "../hooks/useInView";
import styles from "./Contact.module.css";

export default function Contact() {
  const [ref, inView] = useInView();
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <section
      id="contact"
      className={styles.section}
      aria-labelledby="contact-heading"
    >
      <div className={styles.inner}>
        <div
          ref={ref}
          className={`${styles.content} ${inView ? styles.visible : ""}`}
        >
          <div className={styles.grid}>
            <div className={styles.formSide}>
              <span className={styles.eyebrow}>Get in Touch</span>
              <h2 id="contact-heading" className={styles.heading}>
                Drop us a <em className={styles.accent}>message.</em>
              </h2>
              <p className={styles.sub}>
                Questions, special requests, or group bookings — we'll get back
                to you within the day.
              </p>

              <form onSubmit={handleSubmit} className={styles.form} noValidate>
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label htmlFor="contact-name" className={styles.srOnly}>
                      Your name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="Your name"
                      className={styles.input}
                      autoComplete="name"
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="contact-phone" className={styles.srOnly}>
                      Phone / WhatsApp
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      placeholder="Phone / WhatsApp"
                      className={styles.input}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="contact-message" className={styles.srOnly}>
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    placeholder="How can we help? (preferred service, schedule, etc.)"
                    rows={4}
                    className={styles.textarea}
                  />
                </div>

                <button
                  type="submit"
                  className={`${styles.submit} ${sent ? styles.submitSent : ""}`}
                >
                  {sent ? "Message Sent ✓" : "Send Message"}
                </button>
              </form>

              <p className={styles.altContact}>
                Or reach us directly:{" "}
                <a href="tel:+639171234567">+63912 345 6789</a>
              </p>
            </div>

            <div className={styles.mapWrap}>
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=121.0250,14.5480,121.0410,14.5580&layer=mapnik&marker=14.5530,121.0330"
                className={styles.map}
                title="Casa Barbero location — Manila, Philippines"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
