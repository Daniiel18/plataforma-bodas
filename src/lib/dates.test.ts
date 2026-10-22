import { afterEach, describe, expect, it, vi } from "vitest";

import { dateToZonedInput, daysUntil, isPast, isValidTimeZone, latest, zonedInputToDate } from "./dates";

describe("zonedInputToDate", () => {
  it("interprets the local wall time in the wedding's time zone", () => {
    // 3:00 PM in Miami during standard time (UTC-5).
    expect(zonedInputToDate("2026-12-19T15:00", "America/New_York").toISOString()).toBe("2026-12-19T20:00:00.000Z");
    // 5:00 PM in Miami during daylight saving time (UTC-4).
    expect(zonedInputToDate("2027-06-12T17:00", "America/New_York").toISOString()).toBe("2027-06-12T21:00:00.000Z");
  });

  it("supports zones with no daylight saving and positive offsets", () => {
    expect(zonedInputToDate("2026-12-19T15:00", "America/Caracas").toISOString()).toBe("2026-12-19T19:00:00.000Z");
    expect(zonedInputToDate("2026-12-19T15:00", "Europe/Madrid").toISOString()).toBe("2026-12-19T14:00:00.000Z");
  });

  it("rejects malformed input", () => {
    expect(() => zonedInputToDate("19/12/2026 3pm", "America/New_York")).toThrow();
  });
});

describe("dateToZonedInput", () => {
  it("round-trips with zonedInputToDate, including across DST changes", () => {
    for (const value of ["2026-03-08T12:30", "2026-11-01T09:15", "2026-12-19T15:00"]) {
      expect(dateToZonedInput(zonedInputToDate(value, "America/New_York"), "America/New_York")).toBe(value);
    }
  });
});

describe("time helpers", () => {
  afterEach(() => vi.useRealTimers());

  it("counts whole days until a date, rounding up", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-17T21:00:00Z"));
    expect(daysUntil("2026-12-19T20:00:00Z")).toBe(2);
    expect(isPast("2026-12-17T20:59:59Z")).toBe(true);
    expect(isPast("2026-12-17T21:00:01Z")).toBe(false);
  });

  it("validates IANA time zones", () => {
    expect(isValidTimeZone("America/Santo_Domingo")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
  });
});

describe("latest", () => {
  it("compares the instants, not the text, across Postgres and Supabase Auth formats", () => {
    // Same day: Auth writes "…Z" with milliseconds, Postgres "+00:00" with microseconds.
    expect(latest("2026-10-21T15:16:20.250123+00:00", "2026-10-21T15:16:20.9Z")).toBe("2026-10-21T15:16:20.9Z");
    expect(latest("2026-10-17T17:45:46.639Z", "2026-10-21T15:16:20.25+00:00")).toBe("2026-10-21T15:16:20.25+00:00");
  });

  it("skips missing values", () => {
    expect(latest(null, "2026-10-19T12:50:09.639Z", undefined)).toBe("2026-10-19T12:50:09.639Z");
    expect(latest(null, undefined)).toBeNull();
  });
});
