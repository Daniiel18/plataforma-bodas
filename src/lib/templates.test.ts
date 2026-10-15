import { describe, expect, it } from "vitest";

import { eventDateParts, formatClock } from "@/components/invitation/format";

import { BACKGROUNDS, resolveBackground, resolveVeil } from "./backgrounds";
import { DEFAULT_TEMPLATE, getTemplate, resolveAccent, resolveTemplate, TEMPLATES, themeStyle } from "./templates";

describe("templates", () => {
  it("falls back to the default template for unknown keys", () => {
    expect(resolveTemplate("dorado-elegante")).toBe("dorado-elegante");
    expect(resolveTemplate("neon-party")).toBe(DEFAULT_TEMPLATE);
    expect(resolveTemplate(null)).toBe(DEFAULT_TEMPLATE);
  });

  it("only accepts curated accent colors", () => {
    expect(resolveAccent({ accent: "#7d8b6a" })).toBe("#7d8b6a");
    expect(resolveAccent({ accent: "red; background: url(x)" })).toBeNull();
    expect(resolveAccent(null)).toBeNull();
  });

  it("has a consistent catalog", () => {
    const keys = TEMPLATES.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    const hex = /^#[0-9a-f]{6}$/;
    for (const t of TEMPLATES) {
      for (const color of Object.values(t.colors)) expect(color).toMatch(hex);
      if ("ornamentColors" in t) for (const color of Object.values(t.ornamentColors)) expect(color).toMatch(hex);
      expect(BACKGROUNDS.some((b) => b.key === t.background)).toBe(true);
    }
  });

  it("lets the accent override light templates but not dark ones", () => {
    const light = getTemplate("champagne-clasico");
    const dark = getTemplate("noche-champagne");
    expect(themeStyle(light, "#7b3f4a")).toMatchObject({ "--inv-accent": "#7b3f4a" });
    expect(themeStyle(dark, "#7b3f4a")).toMatchObject({ "--inv-accent": dark.colors.accent });
  });
});

describe("backgrounds", () => {
  it("uses the template's background unless the couple picked another", () => {
    expect(resolveBackground(null, "papel", false)).toBe("papel");
    expect(resolveBackground({ background: "damasco" }, "papel", false)).toBe("damasco");
    expect(resolveBackground({ background: "neon" }, "papel", false)).toBe("papel");
  });

  it("only uses the photo background when a photo exists", () => {
    expect(resolveBackground({ background: "foto" }, "seda", false)).toBe("seda");
    expect(resolveBackground({ background: "foto" }, "seda", true)).toBe("foto");
  });

  it("falls back to the balanced veil", () => {
    expect(resolveVeil({ veil: "sutil" })).toBe("sutil");
    expect(resolveVeil({ veil: "100%; color: red" })).toBe("medio");
  });
});

describe("invitation formatting", () => {
  it("formats program times in 12-hour clock", () => {
    expect(formatClock("00:05")).toBe("12:05 AM");
    expect(formatClock("15:00")).toBe("3:00 PM");
    expect(formatClock("12:30")).toBe("12:30 PM");
  });

  it("formats the event date in the wedding's time zone, in both languages", () => {
    const parts = eventDateParts("2026-12-19T20:00:00Z", "America/New_York");
    expect(parts.time).toBe("3:00 PM");
    expect(parts.day).toBe("19");
    expect(parts.weekday).toEqual({ es: "sábado", en: "Saturday" });
    expect(parts.month).toEqual({ es: "diciembre", en: "December" });
  });
});
