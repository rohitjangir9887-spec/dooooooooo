import "../assets/styles/schedule.css";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Plus, Slash } from "lucide-react";
import { Badge, Input, Modal, PageHeader, Segmented, SlidePanel, Toggle } from "../components/ui/index.jsx";
import { api } from "../services/api.js";
import { useToast } from "../components/ui/toast.jsx";
import { blockSchema, manualBookingSchema } from "../validation/schemas.js";
import { shortName } from "../utils/formatters.js";

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function mondayOf(date) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return copy;
}

export default function Schedule({ bookings, barbers, catalog, setBookings, setCatalog }) {
  const toast = useToast();
  const [view, setView] = useState("month");
  const [anchor, setAnchor] = useState(new Date());
  const [barberFilter, setBarberFilter] = useState("all");
  const [blockOpen, setBlockOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const blocks = catalog.blockedTimes;
  const visibleBookings = barberFilter === "all" ? bookings : bookings.filter((b) => b.barberId === barberFilter);
  const visibleBlocks = barberFilter === "all" ? blocks : blocks.filter((b) => b.barberId === barberFilter);
  const visibleBarbers = barberFilter === "all" ? barbers : barbers.filter((b) => b.id === barberFilter);

  function step(direction) {
    const next = new Date(anchor);
    if (view === "month") next.setMonth(next.getMonth() + direction, 1);
    else next.setDate(next.getDate() + direction * (view === "week" ? 7 : 1));
    setAnchor(next);
  }

  const heading = view === "month"
    ? anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : view === "week"
      ? `Week of ${mondayOf(anchor).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : anchor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <section>
      <PageHeader title="Schedule" />
      <div className="controls-bar">
        <button className="icon-btn" type="button" aria-label={`Previous ${view}`} onClick={() => step(-1)}><ChevronLeft size={18} /></button>
        <strong>{heading}</strong>
        <button className="icon-btn" type="button" aria-label={`Next ${view}`} onClick={() => step(1)}><ChevronRight size={18} /></button>
        <Segmented options={["month", "week", "day"]} value={view} onChange={setView} />
        <select aria-label="Filter barbers" value={barberFilter} onChange={(e) => setBarberFilter(e.target.value)}>
          <option value="all">All Barbers</option>
          {barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}
        </select>
        <div className="legend-row">{barbers.map((barber) => <span key={barber.id}><i style={{ background: barber.color }} />{barber.name}</span>)}</div>
        <button className="outline-gold" type="button" onClick={() => setBlockOpen(true)}><Plus size={16} /> Block Time</button>
        <button className="gold-button" type="button" onClick={() => setManualOpen(true)}><Plus size={16} /> Manual Booking</button>
      </div>
      {view === "month"
        ? <MonthView anchor={anchor} bookings={visibleBookings} blocks={visibleBlocks} onOpenDay={(date) => { setAnchor(date); setView("day"); }} />
        : <WeekView anchor={anchor} bookings={visibleBookings} barbers={visibleBarbers} day={view === "day"} />}
      <AnimatePresence>{blockOpen ? (
        <BlockModal
          onClose={() => setBlockOpen(false)}
          barbers={barbers}
          defaultDate={toISO(anchor)}
          onCreate={(block) => {
            setCatalog({ ...catalog, blockedTimes: [block, ...blocks] });
            toast("Time blocked.", "success");
          }}
        />
      ) : null}</AnimatePresence>
      <AnimatePresence>{manualOpen ? (
        <ManualBookingPanel
          onClose={() => setManualOpen(false)}
          barbers={barbers}
          services={catalog.services.filter((s) => s.active !== false)}
          defaultDate={toISO(anchor)}
          onCreate={(booking) => {
            setBookings([booking, ...bookings]);
            toast("Booking created.", "success");
          }}
        />
      ) : null}</AnimatePresence>
    </section>
  );
}

function MonthView({ anchor, bookings, blocks, onOpenDay }) {
  const todayIso = toISO(new Date());
  const cells = useMemo(() => {
    const month = anchor.getMonth();
    const first = new Date(anchor.getFullYear(), month, 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return { date, iso: toISO(date), inMonth: date.getMonth() === month };
    });
  }, [anchor]);

  const byDay = useMemo(() => bookings.reduce((map, booking) => {
    map[booking.date] = [...(map[booking.date] || []), booking];
    return map;
  }, {}), [bookings]);

  return (
    <div className="schedule-month">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span className="month-heading" key={d} aria-label={d}><i className="mh-full">{d}</i><i className="mh-short">{d[0]}</i></span>)}
      {cells.map((cell) => {
        const dayBookings = byDay[cell.iso] || [];
        const blocked = blocks.find((block) => block.date === cell.iso);
        return (
          <article
            className={`day-cell ${cell.inMonth ? "" : "out"} ${cell.iso === todayIso ? "today" : ""}`}
            key={cell.iso}
            role="button"
            tabIndex={0}
            onClick={() => onOpenDay(cell.date)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              if (e.key === " ") e.preventDefault();
              onOpenDay(cell.date);
            }}
          >
            <strong>{cell.date.getDate()}</strong>
            {blocked && cell.inMonth ? <div className="blocked"><Slash size={14} />{blocked.reason}</div> : null}
            {dayBookings.slice(0, 3).map((booking) => <BookingChip booking={booking} key={booking.id} />)}
            {dayBookings.length > 3 ? <button type="button" className="more-link" onClick={(e) => { e.stopPropagation(); onOpenDay(cell.date); }}>+{dayBookings.length - 3} more</button> : null}
            <div className="day-dots">
              {dayBookings.slice(0, 4).map((b) => <i key={b.id} style={{ background: b.barberColor }} />)}
              {dayBookings.length > 4 ? <em>+{dayBookings.length - 4}</em> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function WeekView({ anchor, bookings, barbers, day }) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);
  const days = useMemo(() => {
    if (day) return [toISO(anchor)];
    const monday = mondayOf(anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return toISO(d);
    });
  }, [anchor, day]);

  const label = day
    ? anchor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : `Week of ${mondayOf(anchor).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <div className="week-view" style={{ "--cols": barbers.length }}>
      <div className="time-col"><strong>{label}</strong>{hours.map((hour) => <span key={hour}>{hour > 12 ? hour - 12 : hour} {hour >= 12 ? "PM" : "AM"}</span>)}</div>
      {barbers.map((barber) => (
        <div className="barber-col" key={barber.id}>
          <header><Badge label={barber.initials} style={{ "--badge": barber.color }} /><strong>{barber.name}</strong></header>
          <div className="time-grid">
            {hours.map((hour) => <span key={hour} />)}
            {bookings
              .filter((booking) => booking.barberId === barber.id && days.includes(booking.date))
              .map((booking) => {
                const [h, m] = booking.time.split(":").map(Number);
                const top = ((h - 8) * 60 + (m || 0)) * (58 / 60) + 28;
                return (
                  <div className="booking-block" key={booking.id} style={{ top: `${top}px`, height: `${Math.max(36, booking.duration)}px`, "--barber": barber.color }}>
                    <strong>{booking.client}</strong><span>{booking.service}</span>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingChip({ booking }) {
  return <div className="booking-chip" style={{ "--barber": booking.barberColor }}>{shortName(booking.client)} · {booking.service}</div>;
}

function ManualBookingPanel({ onClose, onCreate, barbers, services, defaultDate }) {
  const toast = useToast();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(manualBookingSchema),
    defaultValues: {
      serviceId: services[0]?.id ?? "",
      barberId: barbers[0]?.id ?? "",
      date: defaultDate,
      time: "10:00",
      duration: services[0]?.duration ?? 30,
      price: services[0]?.price ?? 0,
      paymentStatus: "unpaid"
    }
  });

  // Keep duration and price in sync when the service changes
  function handleServiceChange(e) {
    const service = services.find((s) => s.id === e.target.value);
    if (service) {
      setValue("duration", service.duration);
      setValue("price", service.price);
    }
  }

  return (
    <SlidePanel title="Manual Booking" eyebrow="Create booking" onClose={onClose}>
      <form className="panel-form" onSubmit={handleSubmit(async (values) => {
        setServerError("");
        const payload = {
          clientName: values.client,
          phone: values.phone,
          serviceId: values.serviceId,
          barberId: values.barberId,
          bookedAt: `${values.date}T${values.time}:00+08:00`,
          durationMin: Number(values.duration),
          amount: Number(values.price),
          paymentStatus: values.paymentStatus
        };
        try {
          const response = await api("/api/admin/bookings", { method: "POST", body: JSON.stringify(payload) });
          onCreate(response.booking);
          onClose();
        } catch (error) {
          setServerError(error.message);
          toast(error.message);
        }
      })}>
        <Input label="Client Name" error={errors.client?.message}><input {...register("client")} /></Input>
        <Input label="Phone" error={errors.phone?.message}><input type="tel" {...register("phone")} /></Input>
        <Input label="Service"><select {...register("serviceId", { onChange: handleServiceChange })}>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></Input>
        <Input label="Barber"><select {...register("barberId")}>{barbers.filter((b) => b.active).map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}</select></Input>
        <Input label="Date" error={errors.date?.message}><input type="date" {...register("date")} /></Input>
        <Input label="Time" error={errors.time?.message}><input type="time" {...register("time")} /></Input>
        <Input label="Duration" error={errors.duration?.message}><input type="number" {...register("duration")} /></Input>
        <Input label="Price" error={errors.price?.message}><input type="number" {...register("price")} /></Input>
        <Input label="Payment status"><select {...register("paymentStatus")}><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></Input>
        {serverError ? <small className="form-error">{serverError}</small> : null}
        <button className="gold-button full bottom-cta" disabled={isSubmitting} type="submit">{isSubmitting ? "Creating..." : "Create Booking"}</button>
      </form>
    </SlidePanel>
  );
}

function BlockModal({ onClose, onCreate, barbers, defaultDate }) {
  const toast = useToast();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(blockSchema),
    defaultValues: { barberId: barbers[0]?.id ?? "", date: defaultDate, allDay: true, reason: "" }
  });

  return (
    <Modal onClose={onClose}>
      <form className="modal-card" onSubmit={handleSubmit(async (values) => {
        setServerError("");
        const payload = {
          barberId: values.barberId,
          date: values.date,
          isAllDay: values.allDay ?? true,
          startTime: values.allDay ? null : values.start,
          endTime: values.allDay ? null : values.end,
          reason: values.reason,
          notes: values.notes || null
        };
        try {
          const response = await api("/api/admin/availability/block", { method: "POST", body: JSON.stringify(payload) });
          onCreate(response.block);
          onClose();
        } catch (error) {
          setServerError(error.message);
          toast(error.message);
        }
      })}>
        <h2>Block Date</h2>
        <span className="signature-divider" />
        <Input label="Barber"><select {...register("barberId")}>{barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}</select></Input>
        <Input label="Date" error={errors.date?.message}><input type="date" {...register("date")} /></Input>
        <label className="toggle-row"><span>All-day</span><Toggle checked={watch("allDay")} register={register("allDay")} /></label>
        {!watch("allDay") ? <div className="two-col"><Input label="Start"><input type="time" {...register("start")} /></Input><Input label="End"><input type="time" {...register("end")} /></Input></div> : null}
        <Input label="Reason" error={errors.reason?.message}><input {...register("reason")} /></Input>
        <Input label="Optional notes"><textarea rows="4" {...register("notes")} /></Input>
        {serverError ? <small className="form-error">{serverError}</small> : null}
        <div className="modal-actions"><button className="ghost-button" type="button" onClick={onClose}>Cancel</button><button className="gold-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Blocking..." : "Block Date"}</button></div>
      </form>
    </Modal>
  );
}
