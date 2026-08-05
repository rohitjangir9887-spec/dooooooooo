import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import styles from "./AppointmentPage.module.css";
import ConciergeBanner from "../components/ConciergeBanner";
import { ADMIN_LOGIN_URL } from "../config";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// "Any Available" is always the first barber option — stable reference so
// useState(ANY_BARBER) doesn't change on re-render.
const ANY_BARBER = { id: "any", name: "Any Available" };

const TEST_CARDS = [
  { label: "Visa — instant approval (no 3DS)", num: "4343434343434345", exp: "12/28", cvc: "123" },
  { label: "Visa — triggers 3DS popup",        num: "4120000000000007", exp: "12/28", cvc: "123" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function next7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    const label =
      i === 0
        ? "Today"
        : d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });
    return { value, label };
  });
}

function fmt12h(t) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fmtCard(raw) {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

const DAYS  = next7Days();
const STEPS = ["Schedule", "Details", "Payment", "Done"];

const panel = {
  initial:  { opacity: 0, y: 10 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit:     { opacity: 0, y: -6, transition: { duration: 0.18, ease: [0.55, 0, 1, 0.45] } },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function AppointmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const svcName  = searchParams.get("svc");
  const svcPrice = searchParams.get("price");
  const svcDur   = searchParams.get("dur");

  // Live catalog — barbers and services from the DB
  const [catalog, setCatalog] = useState({ barbers: [], services: [] });

  // Step 1 — Schedule
  const [step,         setStep]         = useState(1);
  const [barber,       setBarber]       = useState(ANY_BARBER);
  const [date,         setDate]         = useState(null);
  const [slot,         setSlot]         = useState(null);
  const [slots,        setSlots]        = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError,   setSlotsError]   = useState("");

  // Step 2 — Details
  const [name,         setName]         = useState("");
  const [phone,        setPhone]        = useState("");
  const [email,        setEmail]        = useState("");
  const [saveDetails,  setSaveDetails]  = useState(false);
  const [bookingId,    setBookingId]    = useState(null);
  const [bookingBusy,  setBookingBusy]  = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [payMethod,    setPayMethod]    = useState("online");

  // Step 3 — Payment
  const [cardNum,  setCardNum]  = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear,  setExpYear]  = useState("");
  const [cvc,      setCvc]      = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [payBusy,  setPayBusy]  = useState(false);
  const [payError, setPayError] = useState("");
  const [polling,  setPolling]  = useState(false);

  // Fetch catalog (barbers + services) once on mount
  useEffect(() => {
    fetch(`${API}/api/catalog`)
      .then((r) => r.json())
      .then((data) => {
        if (data.barbers) setCatalog(data);
      })
      .catch(() => {});
  }, []);

  // Restore saved customer & card info
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("casabarbero_customer") || "null");
      if (saved) {
        setName(saved.name || "");
        setPhone(saved.phone || "");
        setEmail(saved.email || "");
        setSaveDetails(true);
      }
    } catch {}
    try {
      const savedCard = JSON.parse(localStorage.getItem("casabarbero_card") || "null");
      if (savedCard) {
        setCardNum(savedCard.cardNum || "");
        setExpMonth(savedCard.expMonth || "");
        setExpYear(savedCard.expYear || "");
        setCvc(savedCard.cvc || "");
        setSaveCard(true);
      }
    } catch {}
  }, []);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Fetch available slots whenever barber, date, service duration, or catalog changes.
  // catalog.barbers.length guards against querying "any" before barbers have loaded.
  useEffect(() => {
    if (!date || !svcDur) return;
    if (barber.id === "any" && catalog.barbers.length === 0) return;

    setSlots([]);
    setSlot(null);
    setSlotsError("");
    setSlotsLoading(true);

    const dur = svcDur;
    if (barber.id === "any") {
      Promise.all(
        catalog.barbers.map((b) =>
          fetch(`${API}/api/available-slots?barber=${b.id}&date=${date}&duration=${dur}`)
            .then((r) => r.json())
        )
      )
        .then((results) => {
          const union = [...new Set(results.flatMap((d) => d.slots || []))].sort();
          setSlots(union);
        })
        .catch((e) => setSlotsError(e.message))
        .finally(() => setSlotsLoading(false));
    } else {
      fetch(`${API}/api/available-slots?barber=${barber.id}&date=${date}&duration=${dur}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) throw new Error(d.error);
          setSlots(d.slots || []);
        })
        .catch((e) => setSlotsError(e.message))
        .finally(() => setSlotsLoading(false));
    }
  }, [barber.id, date, svcDur, catalog.barbers.length]);

  // All hooks must be above any early return
  if (!svcName || !svcPrice || !svcDur) {
    return <Navigate to="/booking" replace />;
  }

  const service = {
    id:       "preset",
    name:     svcName,
    price:    parseInt(svcPrice, 10),
    duration: parseInt(svcDur, 10),
    desc:     "",
  };

  // All barbers shown in the picker: "Any Available" + catalog barbers
  const allBarbers = [ANY_BARBER, ...catalog.barbers];

  // ── Step 2 → 3 (online) or → 4 (counter): create booking record ──
  async function reserveSlot(method) {
    setPayMethod(method);
    setBookingBusy(true);
    setBookingError("");

    if (saveDetails) {
      localStorage.setItem(
        "casabarbero_customer",
        JSON.stringify({ name: name.trim(), phone: phone.trim(), email: email.trim() })
      );
    } else {
      localStorage.removeItem("casabarbero_customer");
    }

    // "Any Available" resolves to the first barber from the catalog
    const actualBarber =
      barber.id === "any"
        ? (catalog.barbers[0] ?? ANY_BARBER)
        : barber;

    try {
      const res = await fetch(`${API}/api/bookings`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim(),
          phone:         phone.trim(),
          service_id:    service.id,
          service_name:  service.name,
          barber_id:     actualBarber.id,
          barber_name:   actualBarber.name,
          date,
          time_slot:     slot,
          duration_min:  service.duration,
          amount:        service.price,
          payment_method: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reserve slot");
      setBookingId(data.booking.id);
      setStep(method === "counter" ? 4 : 3);
    } catch (e) {
      setBookingError(e.message);
    } finally {
      setBookingBusy(false);
    }
  }

  // Poll after 3DS redirect
  const pollIntent = useCallback(async (id) => {
    setPolling(true);
    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`${API}/api/payments/status/${id}`);
        const { status } = await res.json();
        if (status === "succeeded") { setStep(4); setPolling(false); return; }
        if (status === "awaiting_payment_method") {
          setPayError("Payment was not completed. Please try a different card.");
          setPolling(false);
          return;
        }
      } catch {}
    }
    setPayError("Verification timed out. Contact us if your card was charged.");
    setPolling(false);
  }, []);

  // ── Step 3 → 4: process payment ──
  async function pay() {
    setPayBusy(true);
    setPayError("");

    if (saveCard) {
      localStorage.setItem(
        "casabarbero_card",
        JSON.stringify({ cardNum, expMonth, expYear, cvc })
      );
    } else {
      localStorage.removeItem("casabarbero_card");
    }

    try {
      const res = await fetch(`${API}/api/payments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          email:      email.trim(),
          card_number: cardNum.replace(/\s/g, ""),
          exp_month:  parseInt(expMonth, 10),
          exp_year:   parseInt(expYear, 10),
          cvc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      if (data.status === "paid") {
        setStep(4);
      } else if (data.status === "requires_action" && data.redirect_url) {
        window.open(data.redirect_url, "paymongo_3ds", "width=600,height=700,resizable=yes");
        pollIntent(data.intent_id);
      } else {
        setPayError(`Payment status: ${data.status}. Please try again.`);
      }
    } catch (e) {
      setPayError(e.message);
    } finally {
      setPayBusy(false);
    }
  }

  function fillTestCard({ num, exp, cvc: c }) {
    const [m, y] = exp.split("/");
    setCardNum(fmtCard(num));
    setExpMonth(m);
    setExpYear(y);
    setCvc(c);
  }

  const detailsValid =
    name.trim() && phone.trim() && email.trim() && email.includes("@");

  const canPay =
    cardNum.replace(/\s/g, "").length === 16 &&
    expMonth && expYear && cvc.length >= 3 &&
    !payBusy && !polling;

  const barberLabel =
    barber.id === "any" ? "Any Available" : barber.name;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          Casa <span className={styles.logoAccent}>Barbero</span>
        </Link>
        <div className={styles.headerActions}>
          <Link to="/booking" className={styles.back}>← Change Service</Link>
          <a href={ADMIN_LOGIN_URL} className={styles.login}>Login</a>
        </div>
      </header>

      <ConciergeBanner />

      {/* Progress stepper */}
      <nav className={styles.progress} aria-label="Booking steps">
        {STEPS.map((label, i) => {
          const n      = i + 1;
          const active = step === n;
          const done   = step > n;
          return (
            <div
              key={n}
              className={`${styles.stepItem} ${active ? styles.stepActive : ""} ${done ? styles.stepDone : ""}`}
            >
              <div className={styles.stepCircle} aria-current={active ? "step" : undefined}>
                {done ? "✓" : n}
              </div>
              <span className={styles.stepLabel}>{label}</span>
              {i < STEPS.length - 1 && <div className={styles.stepLine} />}
            </div>
          );
        })}
      </nav>

      <main className={styles.main}>
        <AnimatePresence mode="wait">

          {/* ════════════════════════════════════════════════════
              STEP 1 — Schedule (barber optional, date required)
          ════════════════════════════════════════════════════ */}
          {step === 1 && (
            <motion.div key="step1" className={styles.panel} {...panel}>
              <span className={styles.eyebrow}>Step 1 of 4</span>
              <h1 className={styles.panelTitle}>Pick Your Schedule</h1>
              <p className={styles.panelSub}>
                Choose your barber, date, and a time that works.
              </p>

              {/* Selected service chip */}
              <div className={styles.serviceChip}>
                <span className={styles.serviceChipName}>{service.name}</span>
                <span className={styles.serviceChipMeta}>
                  ₱{service.price} · {service.duration} min
                </span>
              </div>

              {/* Barber — optional */}
              <fieldset className={styles.fieldset}>
                <legend className={styles.fieldLegend}>
                  Select Barber <span className={styles.tagOptional}>Optional</span>
                </legend>
                <div className={styles.barberGrid}>
                  {allBarbers.map((b) => (
                    <motion.button
                      key={b.id}
                      type="button"
                      className={`${styles.barberCard} ${barber?.id === b.id ? styles.selected : ""}`}
                      onClick={() => setBarber(b)}
                      aria-pressed={barber?.id === b.id}
                      whileHover={{ y: -2, transition: { duration: 0.15 } }}
                      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                    >
                      <div className={styles.barberAvatar}>
                        {b.id === "any" ? "✦" : b.initials ?? b.name[0]}
                      </div>
                      <span className={styles.barberName}>{b.name}</span>
                    </motion.button>
                  ))}
                </div>
              </fieldset>

              {/* Date — required */}
              <fieldset className={styles.fieldset}>
                <legend className={styles.fieldLegend}>
                  Select Date <span className={styles.tagRequired}>Required</span>
                </legend>
                <div className={styles.dateGrid}>
                  {DAYS.map((d) => (
                    <motion.button
                      key={d.value}
                      className={`${styles.dateCard} ${date === d.value ? styles.selected : ""}`}
                      onClick={() => setDate(d.value)}
                      whileTap={{ scale: 0.96, transition: { duration: 0.1 } }}
                    >
                      {d.label}
                    </motion.button>
                  ))}
                </div>
              </fieldset>

              {/* Time slots — shown once date is selected */}
              {date && (
                <motion.fieldset
                  className={styles.fieldset}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <legend className={styles.fieldLegend}>
                    Available Times <span className={styles.tagRequired}>Required</span>
                    {slotsLoading && <span className={styles.loadingTag}> Loading…</span>}
                  </legend>

                  {!slotsLoading && slotsError && (
                    <p className={styles.errorMsg}>{slotsError}</p>
                  )}
                  {!slotsLoading && !slotsError && slots.length === 0 && (
                    <p className={styles.noSlots}>
                      No slots available for this date. Try another day.
                    </p>
                  )}

                  <div className={styles.timeGrid}>
                    {slots.map((t, i) => (
                      <motion.button
                        key={t}
                        className={`${styles.timeCard} ${slot === t ? styles.selected : ""}`}
                        onClick={() => setSlot(t)}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.025, duration: 0.2 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        {fmt12h(t)}
                      </motion.button>
                    ))}
                  </div>
                </motion.fieldset>
              )}

              <div className={styles.navRow}>
                <button className={styles.btnGhost} onClick={() => navigate("/booking")}>
                  ← Back
                </button>
                <button
                  className={styles.btnPrimary}
                  disabled={!date || !slot}
                  onClick={() => setStep(2)}
                >
                  Continue →
                </button>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════
              STEP 2 — Customer details + save info
          ════════════════════════════════════════════════════ */}
          {step === 2 && (
            <motion.div key="step2" className={styles.panel} {...panel}>
              <span className={styles.eyebrow}>Step 2 of 4</span>
              <h1 className={styles.panelTitle}>Your Details</h1>
              <p className={styles.panelSub}>
                We'll use this to confirm your appointment.
              </p>

              <div className={styles.summaryBox}>
                <SummaryRow label="Service" value={service.name} />
                <SummaryRow label="Barber"  value={barberLabel} />
                <SummaryRow label="Date"    value={date} />
                <SummaryRow label="Time"    value={slot && fmt12h(slot)} />
                <SummaryRow label="Total"   value={`₱${service.price}`} total />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="fn">Full Name</label>
                <input
                  id="fn" type="text" className={styles.input}
                  placeholder="Juan dela Cruz" autoComplete="name"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="ph">Phone Number</label>
                <input
                  id="ph" type="tel" className={styles.input}
                  placeholder="09171234567" autoComplete="tel"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="em-a">Email Address</label>
                <input
                  id="em-a" type="email" className={styles.input}
                  placeholder="you@email.com" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <label className={styles.saveRow}>
                <input
                  type="checkbox" className={styles.saveCheck}
                  checked={saveDetails}
                  onChange={(e) => setSaveDetails(e.target.checked)}
                />
                <span className={styles.saveLabel}>Save my info for faster rebooking</span>
              </label>

              {bookingError && <p className={styles.errorMsg}>{bookingError}</p>}

              <div className={styles.navRow}>
                <button
                  className={styles.btnGhost}
                  onClick={() => setStep(1)}
                  disabled={bookingBusy}
                >
                  ← Back
                </button>
                <div className={styles.payChoice}>
                  <button
                    className={styles.btnGhost}
                    disabled={!detailsValid || bookingBusy}
                    onClick={() => reserveSlot("counter")}
                  >
                    {bookingBusy && payMethod === "counter" ? "Reserving…" : "Pay at the Counter"}
                  </button>
                  <button
                    className={styles.btnPrimary}
                    disabled={!detailsValid || bookingBusy}
                    onClick={() => reserveSlot("online")}
                  >
                    {bookingBusy && payMethod === "online" ? "Reserving…" : "Pay Online Now →"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════
              STEP 3 — Payment + save card
          ════════════════════════════════════════════════════ */}
          {step === 3 && (
            <motion.div key="step3" className={styles.panel} {...panel}>
              <span className={styles.eyebrow}>Step 3 of 4</span>
              <h1 className={styles.panelTitle}>Payment</h1>
              <p className={styles.panelSub}>Enter your card to confirm and pay.</p>

              <div className={styles.testBox}>
                <p className={styles.testTitle}>Sandbox Mode — Use a test card</p>
                <div className={styles.testCards}>
                  {TEST_CARDS.map((c) => (
                    <button key={c.num} className={styles.testCard} onClick={() => fillTestCard(c)}>
                      <span className={styles.testLabel}>{c.label}</span>
                      <code className={styles.testNum}>{c.num.replace(/(.{4})/g, "$1 ").trim()}</code>
                      <span className={styles.testFill}>↓ Fill</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.summaryBox}>
                <SummaryRow label="Service" value={service.name} />
                <SummaryRow label="Barber"  value={barberLabel} />
                <SummaryRow label="When"    value={`${date}  ${slot && fmt12h(slot)}`} />
                <SummaryRow label="Total"   value={`₱${service.price}`} total />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="cn">Card Number</label>
                <input
                  id="cn" type="text" inputMode="numeric" className={styles.input}
                  placeholder="4343 4343 4343 4345" maxLength={19}
                  value={cardNum} onChange={(e) => setCardNum(fmtCard(e.target.value))}
                />
              </div>

              <div className={styles.row3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="em">Month (MM)</label>
                  <input
                    id="em" type="text" inputMode="numeric" className={styles.input}
                    placeholder="12" maxLength={2}
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="ey">Year (YY)</label>
                  <input
                    id="ey" type="text" inputMode="numeric" className={styles.input}
                    placeholder="28" maxLength={2}
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="cv">CVC</label>
                  <input
                    id="cv" type="text" inputMode="numeric" className={styles.input}
                    placeholder="123" maxLength={4}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
              </div>

              <label className={styles.saveRow}>
                <input
                  type="checkbox" className={styles.saveCheck}
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                />
                <span className={styles.saveLabel}>Save card for next time</span>
              </label>

              {payError && <p className={styles.errorMsg}>{payError}</p>}
              {polling && (
                <p className={styles.waitMsg}>
                  Waiting for 3DS verification in the popup window…
                </p>
              )}

              <div className={styles.navRow}>
                <button
                  className={styles.btnGhost}
                  onClick={() => setStep(2)}
                  disabled={payBusy || polling}
                >
                  ← Back
                </button>
                <button className={styles.btnPrimary} disabled={!canPay} onClick={pay}>
                  {payBusy ? "Processing…" : `Pay ₱${service.price}`}
                </button>
              </div>

              <p className={styles.secureNote}>
                Secured by <strong>PayMongo</strong> · Sandbox / Test Mode
              </p>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════
              STEP 4 — Confirmation
          ════════════════════════════════════════════════════ */}
          {step === 4 && (
            <motion.div key="step4" className={`${styles.panel} ${styles.confirmPanel}`} {...panel}>
              <motion.div
                className={styles.confirmIcon}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.12, type: "spring", stiffness: 280, damping: 22 }}
                aria-hidden="true"
              >
                ✓
              </motion.div>

              <span className={styles.eyebrow}>
                {payMethod === "counter" ? "Reservation Confirmed" : "Booking Confirmed"}
              </span>
              <h1 className={styles.panelTitle}>You&rsquo;re all set!</h1>
              <p className={styles.panelSub}>
                {payMethod === "counter"
                  ? "Your slot is reserved. Just pay at the counter when you arrive."
                  : "Payment received and your slot is reserved. See you soon."}
              </p>

              <div className={styles.summaryBox}>
                <SummaryRow label="Booking ID"   value={bookingId?.slice(0, 8).toUpperCase()} mono />
                <SummaryRow label="Service"      value={service.name} />
                <SummaryRow label="Barber"       value={barberLabel} />
                <SummaryRow label="Date"         value={date} />
                <SummaryRow label="Time"         value={slot && fmt12h(slot)} />
                <SummaryRow label="Customer"     value={name} />
                <SummaryRow label="Email"        value={email} />
                <SummaryRow
                  label={payMethod === "counter" ? "Pay at Counter" : "Amount Paid"}
                  value={`₱${service.price}`}
                  total
                />
              </div>

              <p className={styles.confirmNote}>
                {payMethod === "counter" ? (
                  <>
                    Please settle <strong>₱{service.price}</strong> at the counter — cash or GCash accepted.
                  </>
                ) : (
                  <>A Google Calendar event has been added to your barber&rsquo;s schedule.</>
                )}
                <br />
                Walk in at: <strong>123 Rizal St., Poblacion, Manila</strong>
              </p>

              <div className={styles.confirmActions}>
                <Link to="/" className={styles.btnPrimary}>← Back to Home</Link>
                <Link to="/booking" className={styles.btnGhost}>Book Again</Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

function SummaryRow({ label, value, total, mono }) {
  return (
    <div className={`${styles.sRow} ${total ? styles.sTotal : ""}`}>
      <span className={styles.sLabel}>{label}</span>
      <strong className={`${styles.sValue} ${mono ? styles.sMono : ""}`}>{value}</strong>
    </div>
  );
}
