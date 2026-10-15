import type { Bi } from "./sections";

/** What the share message needs to know about the wedding. */
export type ShareDetails = {
  partner1: string;
  partner2: string;
  /** "sábado 19 de diciembre de 2026" / "Saturday, December 19, 2026" */
  date: Bi | null;
  /** "15 de noviembre" / "November 15" */
  deadline: Bi | null;
};

export type SharePlatform = "apple" | "android" | "other";

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export function shareDetails(wedding: {
  partner1_name: string;
  partner2_name: string;
  event_starts_at: string | null;
  timezone: string | null;
  rsvp_deadline: string | null;
}): ShareDetails {
  const timeZone = wedding.timezone ?? "UTC";
  const parts = (iso: string, lang: string, options: Intl.DateTimeFormatOptions) =>
    Object.fromEntries(
      new Intl.DateTimeFormat(lang, { timeZone, ...options })
        .formatToParts(new Date(iso))
        .map((p) => [p.type, p.value]),
    );

  const date = (iso: string): Bi => {
    const es = parts(iso, "es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return {
      es: `${es.weekday} ${es.day} de ${es.month} de ${es.year}`,
      en: new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(iso)),
    };
  };
  const dayMonth = (iso: string): Bi => {
    const es = parts(iso, "es", { day: "numeric", month: "long" });
    return {
      es: `${es.day} de ${es.month}`,
      en: new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric", month: "long" }).format(new Date(iso)),
    };
  };

  return {
    partner1: firstName(wedding.partner1_name),
    partner2: firstName(wedding.partner2_name),
    date: wedding.event_starts_at && wedding.timezone ? date(wedding.event_starts_at) : null,
    deadline: wedding.rsvp_deadline && wedding.timezone ? dayMonth(wedding.rsvp_deadline) : null,
  };
}

/** The invitation text guests receive, in Spanish and optionally in English, ending with the link. */
export function invitationMessage(details: ShareDetails, url: string, { english }: { english: boolean }) {
  const { partner1, partner2, date, deadline } = details;
  const spanish = [
    "💍 ¡Nos casamos!",
    `${partner1} y ${partner2} tienen el honor de invitarte a celebrar su boda${date ? ` el ${date.es}` : ""}.`,
    `Abre tu invitación y confírmanos tu asistencia${deadline ? ` antes del ${deadline.es}` : ""} 👇`,
  ].join("\n\n");
  const inEnglish = [
    "💍 We're getting married!",
    `${partner1} & ${partner2} would love for you to celebrate their wedding with them${date ? ` on ${date.en}` : ""}.`,
    `Open your invitation and let us know if you can make it${deadline ? ` by ${deadline.en}` : ""} 👇`,
  ].join("\n\n");

  return `${english ? `${spanish}\n\n—\n\n${inEnglish}` : spanish}\n${url}`;
}

/** Share links for each app. Messenger and Facebook only take the link (they show its preview). */
export function shareLinks(message: string, url: string, subject: string, platform: SharePlatform) {
  const enc = encodeURIComponent;
  const withoutUrl = message.endsWith(url) ? message.slice(0, -url.length).trimEnd() : message;
  return {
    // iOS and macOS Messages read the body after "&"; Android expects "?".
    messages: `sms:${platform === "apple" ? "&" : "?"}body=${enc(message)}`,
    whatsapp: `https://wa.me/?text=${enc(message)}`,
    messenger: `fb-messenger://share/?link=${enc(url)}`,
    telegram: `https://t.me/share/url?url=${enc(url)}&text=${enc(withoutUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    email: `mailto:?subject=${enc(subject)}&body=${enc(message)}`,
  };
}
