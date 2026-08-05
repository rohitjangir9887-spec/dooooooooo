export function formatPeso(value) {
  return `₱${Number(value).toLocaleString("en-PH")}`;
}

export function titleCase(value) {
  return String(value).replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function prettyDate(date, short = false) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(short ? {} : { year: "numeric" }) });
}

export function toDisplayTime(time) {
  const [hourRaw, minute] = time.split(":").map(Number);
  const hour = hourRaw % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${hourRaw >= 12 ? "PM" : "AM"}`;
}

export function shortName(name) {
  const [first, ...rest] = name.split(" ");
  return `${first} ${rest[0]?.[0] || ""}.`;
}

// Human-friendly day label for an ISO date (YYYY-MM-DD): Today, Tomorrow, or "Thu, Jul 9".
export function relativeDay(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const diffDays = Math.round((target - today) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return target.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
