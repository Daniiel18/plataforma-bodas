import type { Bi } from "@/lib/sections";

/** Parts of the event date, in the wedding's time zone and in both languages. */
export function eventDateParts(startsAt: string, timeZone: string) {
  const date = new Date(startsAt);
  const fmt = (lang: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(lang, { timeZone, ...options }).format(date);
  const both = (options: Intl.DateTimeFormatOptions): Bi => ({ es: fmt("es", options), en: fmt("en-US", options) });

  return {
    weekday: both({ weekday: "long" }),
    day: fmt("en-US", { day: "numeric" }),
    month: both({ month: "long" }),
    year: fmt("en-US", { year: "numeric" }),
    time: fmt("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    long: both({ day: "numeric", month: "long", year: "numeric" }),
  };
}

/** "15:00" → "3:00 PM" */
export function formatClock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}
