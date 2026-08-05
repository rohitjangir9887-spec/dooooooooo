export const tokens = {
  background: "#1A1A1A",
  card: "#242424",
  hover: "#2E2E2E",
  border: "#333333",
  gold: "#C9A84C",
  text: "#F5F5F0",
  muted: "#8A8A82",
  success: "#4CAF7D",
  warning: "#E5A443",
  danger: "#E05555",
  info: "#5B9BD5"
};

export const owner = {
  name: "Miguel Santos",
  email: "miguel@casabarbero.ph",
  phone: "0917 555 0100",
  role: "Owner",
  initials: "MS"
};

export const barbers = [
  { id: "ms", name: "Miguel Santos", initials: "MS", role: "Master Barber", active: true, color: "#C9A84C" },
  { id: "rc", name: "Rafael Cruz", initials: "RC", role: "Senior Barber", active: true, color: "#56BFB5" },
  { id: "al", name: "Andres Lim", initials: "AL", role: "Barber", active: true, color: "#E88C93" },
  { id: "jr", name: "Joel Reyes", initials: "JR", role: "Barber", active: false, color: "#5B9BD5" }
];

export const services = [
  { id: "skin-fade", name: "Skin Fade", duration: 45, price: 450 },
  { id: "cut-beard", name: "Cut & Beard", duration: 55, price: 550 },
  { id: "classic-cut", name: "Classic Cut", duration: 30, price: 350 },
  { id: "hot-towel", name: "Hot Towel Shave", duration: 40, price: 400 },
  { id: "hair-color", name: "Hair Color", duration: 90, price: 1200 },
  { id: "beard-sculpt", name: "Beard Sculpt", duration: 25, price: 250 }
];

const clients = [
  "Juan Dela Cruz",
  "Marco Reyes",
  "Anton Villa",
  "Paolo Mendoza",
  "Carlo Aquino",
  "Diego Ramos",
  "Emil Bautista",
  "Gabriel Tan",
  "Nico Garcia",
  "Lance Ocampo",
  "Vince Salas",
  "Rico Pascual",
  "Teddy Gonzales",
  "Benjie Torres",
  "Jose Villanueva",
  "Arman Castillo",
  "Noel Santiago",
  "Jiro Mendoza"
];

const statuses = ["confirmed", "completed", "pending", "confirmed", "completed", "cancelled"];
const paymentStatuses = ["paid", "paid", "unpaid", "paid", "refunded"];
const methods = ["GCash", "Card", "Cash"];

const pad = (value) => String(value).padStart(2, "0");
const timeFor = (index) => {
  const hour = 9 + (index % 9);
  const minute = [0, 30, 0, 15][index % 4];
  return `${pad(hour)}:${pad(minute)}`;
};

export function formatPeso(value) {
  return `₱${Number(value).toLocaleString("en-PH")}`;
}

export function makeBooking(index) {
  const service = services[index % services.length];
  const barber = barbers[index % barbers.length];
  const day = 1 + ((index * 7 + 1) % 30);
  const date = `2026-06-${pad(day)}`;
  const status = statuses[index % statuses.length];
  const paymentStatus = paymentStatuses[index % paymentStatuses.length];
  return {
    id: `bk_${String(index + 1).padStart(4, "0")}`,
    number: index + 1,
    client: clients[index % clients.length],
    phone: `0917 555 ${pad(10 + index)}${pad(42 + (index % 30))}`,
    serviceId: service.id,
    service: service.name,
    barberId: barber.id,
    barber: barber.name,
    barberInitials: barber.initials,
    barberColor: barber.color,
    date,
    time: timeFor(index),
    duration: service.duration,
    price: service.price,
    paymentStatus,
    status,
    notes: index % 5 === 0 ? "Client prefers the usual chair by the mirror." : ""
  };
}

export const bookings = Array.from({ length: 64 }, (_, index) => makeBooking(index));

export const transactions = bookings
  .filter((booking, index) => index % 6 !== 0)
  .slice(0, 42)
  .map((booking, index) => ({
    id: `pm_${Math.random().toString(36).slice(2, 12)}${index.toString(36)}`,
    bookingId: booking.id,
    client: booking.client,
    service: booking.service,
    barber: booking.barber,
    barberInitials: booking.barberInitials,
    barberColor: booking.barberColor,
    date: booking.date,
    amount: booking.price,
    method: methods[index % methods.length],
    status: booking.paymentStatus === "refunded" ? "refunded" : booking.paymentStatus === "unpaid" ? "pending" : "paid"
  }));

export const blockedTimes = [
  { id: "bl_01", barberId: "al", date: "2026-06-19", reason: "Private event", allDay: true, notes: "Wedding party grooming" },
  { id: "bl_02", barberId: "jr", date: "2026-06-24", reason: "Training", allDay: false, start: "13:00", end: "17:00" }
];

export const workingHours = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => ({
  day,
  open: index !== 6,
  start: index === 6 ? "Closed" : "9:00 AM",
  end: index === 6 ? "--" : "7:00 PM",
  breakStart: index === 6 ? "--" : "1:00 PM",
  breakEnd: index === 6 ? "--" : "2:00 PM"
}));

export const syncLog = [
  { time: "14:32:08", type: "booking", description: "Added Juan Dela Cruz · Skin Fade to calendar", ok: true },
  { time: "14:28:51", type: "reschedule", description: "Updated Marco Reyes event to 11:30 AM", ok: true },
  { time: "13:55:12", type: "cancellation", description: "Removed Emil Bautista · Skin Fade", ok: true },
  { time: "13:42:03", type: "reminder", description: "Reminder sync for Carlo Aquino failed", ok: false }
];

export const shopProfile = {
  name: "Casa Barbero",
  branch: "Poblacion, Makati",
  phone: "0917 555 0100",
  currency: "₱ Philippine Peso (PHP)"
};
