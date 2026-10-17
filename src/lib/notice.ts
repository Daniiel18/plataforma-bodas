export type CoupleNotice =
  | {
      kind: "rsvp";
      name: string;
      attending: boolean;
      companions: string[];
      /** People coming with the guest; equals companions.length when they are named. */
      companionsCount?: number;
      wish: string | null;
    }
  | { kind: "change"; name: string; attending: boolean; companions: string[]; companionsCount?: number }
  | { kind: "lifecycle"; title: string; body: string }
  | { kind: "test" };

export type NoticePayload = { title: string; body: string; url: string; tag: string };

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** Title, text and destination of the push notification the couple receives. */
export function composeNotice(notice: CoupleNotice): NoticePayload {
  switch (notice.kind) {
    case "rsvp": {
      const extra = notice.companionsCount ?? notice.companions.length;
      const answer = notice.attending
        ? notice.companions.length
          ? `${1 + extra} personas: ${notice.name}, ${notice.companions.join(", ")}`
          : extra
            ? `${1 + extra} personas: ${notice.name} y ${extra} ${extra === 1 ? "acompañante" : "acompañantes"}`
            : "Asistirá sin acompañantes"
        : "Respondió que no asistirá";
      return {
        title: notice.attending ? `✅ ${notice.name} confirmó` : `✉️ ${notice.name} no podrá asistir`,
        body: notice.wish
          ? `${answer}
💌 “${truncate(notice.wish, 140)}”`
          : answer,
        url: notice.wish ? "/panel/deseos" : "/panel/invitados",
        tag: "rsvp",
      };
    }
    case "change": {
      const extra = notice.companionsCount ?? notice.companions.length;
      const company = notice.companions.length
        ? ` con ${notice.companions.join(", ")}`
        : extra
          ? ` con ${extra} ${extra === 1 ? "acompañante" : "acompañantes"}`
          : "";
      return {
        title: `🔄 ${notice.name} cambió su respuesta`,
        body: notice.attending ? `Ahora asistirá${company}` : "Ahora no asistirá",
        url: "/panel/invitados",
        tag: "rsvp",
      };
    }
    case "lifecycle":
      return { title: notice.title, body: notice.body, url: "/panel", tag: "lifecycle" };
    case "test":
      return {
        title: "🔔 Notificaciones activadas",
        body: "Así te avisaremos cuando alguien confirme o deje un deseo.",
        url: "/panel",
        tag: "test",
      };
  }
}
