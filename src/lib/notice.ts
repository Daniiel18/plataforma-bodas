export type CoupleNotice =
  | { kind: "rsvp"; name: string; attending: boolean; companions: string[]; wish: string | null }
  | { kind: "change"; name: string; attending: boolean; companions: string[] }
  | { kind: "test" };

export type NoticePayload = { title: string; body: string; url: string; tag: string };

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** Title, text and destination of the push notification the couple receives. */
export function composeNotice(notice: CoupleNotice): NoticePayload {
  switch (notice.kind) {
    case "rsvp": {
      const people = 1 + notice.companions.length;
      const answer = notice.attending
        ? notice.companions.length
          ? `${people} personas: ${notice.name}, ${notice.companions.join(", ")}`
          : "Asistirá sin acompañantes"
        : "Respondió que no asistirá";
      return {
        title: notice.attending ? `✅ ${notice.name} confirmó` : `✉️ ${notice.name} no podrá asistir`,
        body: notice.wish
          ? `${answer}
💌 “${truncate(notice.wish, 140)}”`
          : answer,
        url: notice.wish ? "/admin/deseos" : "/admin/invitados",
        tag: "rsvp",
      };
    }
    case "change":
      return {
        title: `🔄 ${notice.name} cambió su respuesta`,
        body: notice.attending
          ? `Ahora asistirá${notice.companions.length ? ` con ${notice.companions.join(", ")}` : ""}`
          : "Ahora no asistirá",
        url: "/admin/invitados",
        tag: "rsvp",
      };
    case "test":
      return {
        title: "🔔 Notificaciones activadas",
        body: "Así te avisaremos cuando alguien confirme o deje un deseo.",
        url: "/admin",
        tag: "test",
      };
  }
}
