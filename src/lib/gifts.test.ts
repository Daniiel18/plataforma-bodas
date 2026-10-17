import { describe, expect, it } from "vitest";

import { emptyGifts, giftsSchema, giftsToRows, giftViews, paypalLink, registryUrl, rowsToGifts } from "./gifts";

describe("gift links", () => {
  it("accepts a PayPal.me user typed in any form", () => {
    expect(paypalLink("anayluis")).toBe("https://paypal.me/anayluis");
    expect(paypalLink("paypal.me/anayluis")).toBe("https://paypal.me/anayluis");
    expect(paypalLink(" https://www.paypal.me/anayluis/ ")).toBe("https://paypal.me/anayluis");
    expect(paypalLink("ana y luis")).toBeNull();
    expect(paypalLink("https://evil.com/ana")).toBeNull();
  });

  it("adds https to registry links and drops anything else", () => {
    expect(registryUrl("amazon.com/wedding/ana")).toBe("https://amazon.com/wedding/ana");
    expect(registryUrl("https://mesaderegalos.liverpool.com.mx/123")).toBe(
      "https://mesaderegalos.liverpool.com.mx/123",
    );
    expect(registryUrl("javascript:alert(1)")).toBeNull();
    expect(registryUrl("no es un enlace")).toBeNull();
    expect(registryUrl("")).toBeNull();
  });
});

describe("gift methods", () => {
  const gifts = () => {
    const g = emptyGifts();
    g.zelle = { enabled: true, holderName: "Ana", handle: "ana@example.com", note: "Gracias" };
    g.paypal = { enabled: true, user: "anayluis", note: "" };
    g.bank = {
      enabled: true,
      holderName: "Ana López",
      bank: "BBVA",
      account: "0123456789",
      accountType: "Ahorros",
      routing: "",
      note: "",
    };
    g.registry = { enabled: false, links: [{ store: "Amazon", url: "amazon.com/wedding/ana" }], note: "" };
    return g;
  };

  it("survive the round trip through the database rows", () => {
    const rows = giftsToRows(gifts());
    expect(rows.map((r) => [r.type, r.is_visible])).toEqual([
      ["zelle", true],
      ["paypal", true],
      ["bank", true],
      ["registry", false],
    ]);
    expect(rowsToGifts(rows)).toEqual(gifts());
  });

  it("only show the methods that are on and complete", () => {
    const g = gifts();
    g.paypal.user = "";
    const views = giftViews(g, { qr: null, notesEn: { zelle: "Thank you" } });
    expect(views.map((v) => v.kind)).toEqual(["zelle", "bank"]);
    expect(views[0].note).toEqual({ es: "Gracias", en: "Thank you" });
  });

  it("show Zelle with only a QR", () => {
    const g = emptyGifts();
    g.zelle.enabled = true;
    const qr = { url: "https://example.com/qr.png", width: 400, height: 400 };
    const [zelle] = giftViews(g, { qr });
    expect(zelle).toMatchObject({ kind: "zelle", qr, link: null });
  });

  it("reject a wrong Zelle handle or PayPal user", () => {
    const g = gifts();
    g.zelle.handle = "ana";
    g.paypal.user = "ana y luis";
    const result = giftsSchema.safeParse(g);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path.join("."))).toEqual(["zelle.handle", "paypal.user"]);
  });
});
