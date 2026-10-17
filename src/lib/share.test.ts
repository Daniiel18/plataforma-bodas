import { describe, expect, it } from "vitest";

import { invitationMessage, shareDetails, shareLinks } from "./share";

const wedding = {
  partner1_name: "Sofía Ramírez",
  partner2_name: "Mateo Fernández",
  event_starts_at: "2027-06-12T21:00:00Z",
  timezone: "America/New_York",
  rsvp_deadline: "2027-05-16T03:59:00Z",
};
const url = "https://lazodeoro.vercel.app/demo";

describe("share", () => {
  it("formats the date and deadline in the wedding's time zone", () => {
    const details = shareDetails(wedding);
    expect(details.partner1).toBe("Sofía");
    expect(details.date).toEqual({ es: "sábado 12 de junio de 2027", en: "Saturday, June 12, 2027" });
    expect(details.deadline).toEqual({ es: "15 de mayo", en: "May 15" });
  });

  it("writes a Spanish message that ends with the link", () => {
    const message = invitationMessage(shareDetails(wedding), url, { english: false });
    expect(message).toContain(
      "Sofía y Mateo tienen el honor de invitarte a celebrar su boda el sábado 12 de junio de 2027.",
    );
    expect(message).toContain("antes del 15 de mayo");
    expect(message).not.toContain("married");
    expect(message.endsWith(`\n${url}`)).toBe(true);
  });

  it("adds the English version without ever saying RSVP", () => {
    const message = invitationMessage(shareDetails(wedding), url, { english: true });
    expect(message).toContain(
      "Sofía & Mateo would love for you to celebrate their wedding with them on Saturday, June 12, 2027.",
    );
    expect(message).not.toMatch(/rsvp/i);
  });

  it("leaves out the date when the couple has not set it", () => {
    const message = invitationMessage(shareDetails({ ...wedding, event_starts_at: null, rsvp_deadline: null }), url, {
      english: false,
    });
    expect(message).toContain("celebrar su boda.");
    expect(message).not.toContain("antes del");
  });

  it("builds one link per app", () => {
    const message = invitationMessage(shareDetails(wedding), url, { english: false });
    const apple = shareLinks(message, url, "Boda", "apple");
    expect(apple.messages.startsWith("sms:&body=")).toBe(true);
    expect(shareLinks(message, url, "Boda", "android").messages.startsWith("sms:?body=")).toBe(true);
    expect(apple.whatsapp).toBe(`https://wa.me/?text=${encodeURIComponent(message)}`);
    // Telegram adds the link itself, so the text must not repeat it.
    expect(decodeURIComponent(apple.telegram.split("&text=")[1])).not.toContain(url);
    expect(apple.facebook).toContain(encodeURIComponent(url));
  });
});
