import { describe, expect, it } from "vitest";

import { composeNotice } from "./notice";

describe("couple notifications", () => {
  it("sends the answer and the wish together", () => {
    const notice = composeNotice({
      kind: "rsvp",
      name: "Ana Pérez",
      attending: true,
      companions: ["Luis Gómez"],
      wish: "¡Que sean muy felices!",
    });
    expect(notice.title).toBe("✅ Ana Pérez confirmó");
    expect(notice.body).toBe("2 personas: Ana Pérez, Luis Gómez\n💌 “¡Que sean muy felices!”");
    expect(notice.url).toBe("/panel/deseos");
  });

  it("opens the guest list when there is no wish", () => {
    const notice = composeNotice({ kind: "rsvp", name: "Carlos", attending: false, companions: [], wish: null });
    expect(notice.title).toBe("✉️ Carlos no podrá asistir");
    expect(notice.body).toBe("Respondió que no asistirá");
    expect(notice.url).toBe("/panel/invitados");
  });

  it("shortens long wishes", () => {
    const notice = composeNotice({ kind: "rsvp", name: "Ana", attending: true, companions: [], wish: "a".repeat(400) });
    expect(notice.body.length).toBeLessThan(200);
    expect(notice.body.endsWith("…”")).toBe(true);
  });
});
