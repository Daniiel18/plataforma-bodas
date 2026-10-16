import { describe, expect, it } from "vitest";

import { buildIcs, foldLine, icsText } from "./ics";

describe("buildIcs", () => {
  const ics = buildIcs({
    uid: "demo@plataforma-bodas",
    summary: "Boda de Sofía & Mateo",
    startsAt: "2027-06-12T21:00:00Z",
    stampedAt: "2026-10-14T10:00:00Z",
    location: "Vizcaya Museum & Gardens, 3251 S Miami Ave, Miami, FL 33129",
    url: "https://example.com/demo",
    reminder: "-P1D",
  });

  it("produces a valid calendar with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.split("\r\n").every((line) => !line.includes("\n"))).toBe(true);
  });

  it("stores the start in UTC and includes a reminder the day before", () => {
    expect(ics).toContain("DTSTART:20270612T210000Z");
    expect(ics).toContain("TRIGGER:-P1D");
  });

  it("escapes commas in text fields", () => {
    expect(ics).toContain("LOCATION:Vizcaya Museum & Gardens\\, 3251 S Miami Ave\\, Miami\\, FL 33129");
  });

  it("omits optional fields that are not provided", () => {
    const minimal = buildIcs({
      uid: "x",
      summary: "Boda",
      startsAt: "2027-01-01T00:00:00Z",
      stampedAt: "2026-01-01T00:00:00Z",
    });
    expect(minimal).not.toContain("LOCATION:");
    expect(minimal).not.toContain("VALARM");
  });
});

describe("venue position", () => {
  it("adds the exact spot when the couple pinned it on the map", () => {
    const ics = buildIcs({
      uid: "geo@test",
      summary: "Boda",
      startsAt: "2026-12-19T20:00:00Z",
      stampedAt: "2026-01-01T00:00:00Z",
      geo: { lat: 25.744279, lng: -80.211922 },
    });
    expect(ics).toContain("GEO:25.744279;-80.211922");
  });
});

describe("text helpers", () => {
  it("escapes special characters", () => {
    expect(icsText("a;b,c\\d\ne")).toBe("a\\;b\\,c\\\\d\\ne");
  });

  it("folds long lines to at most 75 bytes, counting multi-byte characters", () => {
    const folded = foldLine(`SUMMARY:${"ñ".repeat(80)}`);
    for (const line of folded.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(
      folded
        .split("\r\n")
        .slice(1)
        .every((line) => line.startsWith(" ")),
    ).toBe(true);
  });
});
