/** Builds the calendar file (.ics, RFC 5545) for "Add to calendar". */

export type IcsEvent = {
  uid: string;
  summary: string;
  startsAt: string;
  stampedAt: string;
  location?: string;
  url?: string;
  /** Reminder before the event (iCalendar duration, e.g. "-P1D"). */
  reminder?: string;
};

export const icsText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export const icsDate = (iso: string) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/** .ics lines must not exceed 75 bytes: longer ones continue after a space. */
export function foldLine(line: string) {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = "";
  for (const char of line) {
    if (encoder.encode(current + char).length > 74) {
      out.push(current);
      current = ` ${char}`;
    } else {
      current += char;
    }
  }
  out.push(current);
  return out.join("\r\n");
}

export function buildIcs(event: IcsEvent) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Plataforma de Bodas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${icsDate(event.stampedAt)}`,
    `DTSTART:${icsDate(event.startsAt)}`,
    `SUMMARY:${icsText(event.summary)}`,
    event.location && `LOCATION:${icsText(event.location)}`,
    event.url && `DESCRIPTION:${icsText(event.url)}`,
    event.url && `URL:${event.url}`,
    ...(event.reminder
      ? [
          "BEGIN:VALARM",
          `TRIGGER:${event.reminder}`,
          "ACTION:DISPLAY",
          `DESCRIPTION:${icsText(event.summary)}`,
          "END:VALARM",
        ]
      : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[];

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
