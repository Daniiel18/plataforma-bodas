/**
 * Time-zone aware date helpers. Dates are stored in UTC and shown or edited
 * in the wedding's time zone, regardless of the server's or browser's zone.
 */

/**
 * Zone used only to display dashboard dates (e.g. when a guest answered)
 * until the couple sets the wedding's time zone.
 */
const FALLBACK_TIME_ZONE = "America/New_York";

export function displayZone(timeZone: string | null) {
  return timeZone ?? FALLBACK_TIME_ZONE;
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Offset (ms) between local time in `timeZone` and UTC at that instant. */
function offsetMs(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2026-12-19T15:00" in `timeZone` → UTC instant. */
export function zonedInputToDate(value: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error(`Fecha inválida: ${value}`);
  const [, y, mo, d, h, mi] = match.map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  let utc = naive - offsetMs(new Date(naive), timeZone);
  // Second pass for daylight-saving transitions.
  const corrected = naive - offsetMs(new Date(utc), timeZone);
  if (corrected !== utc) utc = corrected;
  return new Date(utc);
}

/** UTC instant → "2026-12-19T15:00" in `timeZone` (for <input type="datetime-local">). */
export function dateToZonedInput(date: Date | string, timeZone: string): string {
  const p = zonedParts(new Date(date), timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatDateTime(date: Date | string, timeZone: string, locale = "es") {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatShortDateTime(date: Date | string, timeZone: string, locale = "es") {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days (rounded up) from now until `date`. */
export function daysUntil(date: Date | string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS);
}

export function isPast(date: Date | string) {
  return new Date(date).getTime() <= Date.now();
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Most likely time zones for the guests (the Americas and Spain). */
export const COMMON_TIME_ZONES = [
  { value: "America/New_York", label: "Este de EE. UU. (Nueva York, Miami)" },
  { value: "America/Chicago", label: "Centro de EE. UU. (Chicago, Houston)" },
  { value: "America/Denver", label: "Montaña de EE. UU. (Denver)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix)" },
  { value: "America/Los_Angeles", label: "Pacífico de EE. UU. (Los Ángeles)" },
  { value: "America/Puerto_Rico", label: "Puerto Rico" },
  { value: "America/Santo_Domingo", label: "República Dominicana" },
  { value: "America/Havana", label: "Cuba" },
  { value: "America/Mexico_City", label: "México (Centro)" },
  { value: "America/Cancun", label: "México (Cancún)" },
  { value: "America/Tijuana", label: "México (Tijuana)" },
  { value: "America/Guatemala", label: "Guatemala" },
  { value: "America/El_Salvador", label: "El Salvador" },
  { value: "America/Tegucigalpa", label: "Honduras" },
  { value: "America/Managua", label: "Nicaragua" },
  { value: "America/Costa_Rica", label: "Costa Rica" },
  { value: "America/Panama", label: "Panamá" },
  { value: "America/Bogota", label: "Colombia" },
  { value: "America/Caracas", label: "Venezuela" },
  { value: "America/Guayaquil", label: "Ecuador" },
  { value: "America/Lima", label: "Perú" },
  { value: "America/La_Paz", label: "Bolivia" },
  { value: "America/Santiago", label: "Chile" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina" },
  { value: "America/Montevideo", label: "Uruguay" },
  { value: "America/Asuncion", label: "Paraguay" },
  { value: "Europe/Madrid", label: "España" },
] as const;
