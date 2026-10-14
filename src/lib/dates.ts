/**
 * Utilidades de fecha con zona horaria. Las fechas se guardan en UTC y se
 * muestran/editan en la zona horaria de la boda, sin depender de la zona
 * del servidor ni del navegador.
 */

/**
 * Zona usada solo para mostrar fechas del panel (p. ej. cuándo respondió
 * un invitado) mientras la novia no haya elegido la zona de la boda.
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

/** Diferencia (ms) entre la hora local de `timeZone` y UTC en ese instante. */
function offsetMs(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2026-12-19T15:00" en `timeZone` → instante UTC. */
export function zonedInputToDate(value: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error(`Fecha inválida: ${value}`);
  const [, y, mo, d, h, mi] = match.map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  let utc = naive - offsetMs(new Date(naive), timeZone);
  // Segunda pasada para cambios de horario (DST).
  const corrected = naive - offsetMs(new Date(utc), timeZone);
  if (corrected !== utc) utc = corrected;
  return new Date(utc);
}

/** Instante UTC → "2026-12-19T15:00" en `timeZone` (para <input type="datetime-local">). */
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

/** Días completos (redondeando hacia arriba) desde ahora hasta `date`. */
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

/** Zonas horarias más probables para los invitados (América + España). */
export const COMMON_TIME_ZONES = [
  { value: "America/New_York", label: "Este de EE. UU. (Nueva York, Miami)" },
  { value: "America/Chicago", label: "Centro de EE. UU. (Chicago, Houston)" },
  { value: "America/Denver", label: "Montaña de EE. UU. (Denver)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix)" },
  { value: "America/Los_Angeles", label: "Pacífico de EE. UU. (Los Ángeles)" },
  { value: "America/Puerto_Rico", label: "Puerto Rico" },
  { value: "America/Santo_Domingo", label: "República Dominicana" },
  { value: "America/Caracas", label: "Venezuela" },
  { value: "America/Bogota", label: "Colombia" },
  { value: "America/Mexico_City", label: "México (Centro)" },
  { value: "America/Panama", label: "Panamá" },
  { value: "Europe/Madrid", label: "España" },
] as const;
