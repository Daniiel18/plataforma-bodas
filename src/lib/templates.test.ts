import { describe, expect, it } from "vitest";

import { eventDateParts, formatClock } from "@/components/invitation/format";

import { DEFAULT_TEMPLATE, resolveAccent, resolveTemplate } from "./templates";

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
