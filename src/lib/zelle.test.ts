import { describe, expect, it } from "vitest";

import { zelleLink } from "./zelle";

describe("zelle", () => {
  it("builds the same payment link Zelle QR codes use", () => {
    const link = zelleLink("Sofía Ramírez", " Demo@Example.com ")!;
    const data = decodeURIComponent(link.split("data=")[1]);
    expect(JSON.parse(Buffer.from(data, "base64").toString("utf8"))).toEqual({
      name: "Sofía Ramírez",
      token: "demo@example.com",
      action: "payment",
    });
    expect(zelleLink("Ana", "(305) 555-0100")).toContain(
      encodeURIComponent(
        Buffer.from(JSON.stringify({ name: "Ana", token: "3055550100", action: "payment" })).toString("base64"),
      ),
    );
    expect(zelleLink("Ana", "  ")).toBeNull();
  });
});
