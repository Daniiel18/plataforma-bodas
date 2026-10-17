import { describe, expect, it } from "vitest";

import {
  createDraft,
  migrateDraft,
  missingForPublish,
  normalizeSlugInput,
  sectionsWithExamples,
  slugProblem,
  suggestSlug,
  toSlug,
} from "./draft";
import { draftDeadline, draftStartsAt, draftToInvitation } from "./invitation";

describe("invitation link", () => {
  it("is built from the first names, without accents", () => {
    expect(suggestSlug("María José López", "Andrés Peña")).toBe("maria-y-andres");
    expect(toSlug("  Ñandú & Café!  ")).toBe("nandu-cafe");
  });

  it("keeps a trailing dash while typing", () => {
    expect(normalizeSlugInput("Ana Y ")).toBe("ana-y-");
    expect(slugProblem("ana-y-")).toBe("format");
    expect(slugProblem("ana-y-luis")).toBeNull();
  });

  it("rejects reserved and too short links", () => {
    expect(slugProblem("panel")).toBe("reserved");
    expect(slugProblem("demo")).toBe("reserved");
    expect(slugProblem("ab")).toBe("short");
  });
});

describe("draft", () => {
  it("starts with example texts and English for them", () => {
    const draft = createDraft("art-deco", "America/Mexico_City");
    expect(draft.appearance.template).toBe("art-deco");
    expect(draft.event.timeZone).toBe("America/Mexico_City");
    expect(sectionsWithExamples(draft)).toEqual(["intro", "celebration", "dress_code", "program"]);
    expect(draft.translations.program?.["items.0.title"]).toEqual({ src: "Ceremonia", en: "Ceremony" });
  });

  it("falls back to the default template for unknown keys", () => {
    expect(createDraft("no-existe").appearance.template).toBe("champagne-clasico");
  });

  it("requires names and a date to publish", () => {
    const draft = createDraft();
    expect(missingForPublish(draft)).toEqual(["nombres", "fecha"]);
    draft.couple = { partner1: "Ana", partner2: "Luis" };
    draft.event.date = "2026-12-19";
    expect(missingForPublish(draft)).toEqual([]);
  });

  it("converts local date, time and deadline in the wedding's zone", () => {
    const draft = createDraft(null, "America/New_York");
    draft.event = { date: "2026-12-19", time: "15:00", timeZone: "America/New_York" };
    draft.rsvp.deadline = "2026-11-30";
    expect(draftStartsAt(draft)).toBe("2026-12-19T20:00:00.000Z");
    expect(draftDeadline(draft)).toBe("2026-12-01T04:59:00.000Z");
  });

  it("becomes an invitation the public page can draw", () => {
    const draft = createDraft();
    draft.couple = { partner1: "Ana María", partner2: "Luis" };
    draft.event.date = "2026-12-19";
    draft.gifts.zelle = { enabled: true, holderName: "Ana", handle: "ana@example.com", note: "" };
    const { data } = draftToInvitation(draft, {});
    expect(data.couple).toEqual({ partner1: "Ana María", partner2: "Luis" });
    expect(data.event?.startsAt).toBeTruthy();
    const types = data.sections.map((s) => s.type);
    // No photos, venue or parents yet: those sections stay out; the example texts show.
    expect(types).toEqual(["hero", "celebration", "dress_code", "program", "rsvp", "gifts"]);
    const program = data.sections.find((s) => s.type === "program");
    expect(program?.type === "program" && program.items[0].title).toEqual({ es: "Ceremonia", en: "Ceremony" });
  });

  it("moves the Zelle details of a draft saved before gift methods", () => {
    const { gifts, ...current } = createDraft();
    const old = { ...current, version: 1, gift: { holderName: "Ana", handle: "ana@example.com", note: "Gracias" } };
    const draft = migrateDraft(old);
    expect(draft?.version).toBe(2);
    expect(draft?.gifts.zelle).toEqual({
      enabled: true,
      holderName: "Ana",
      handle: "ana@example.com",
      note: "Gracias",
    });
    expect(draft?.gifts.paypal.enabled).toBe(false);
    expect(draft && "gift" in draft).toBe(false);
    expect(gifts.zelle.enabled).toBe(false);
    expect(migrateDraft({ version: 99 })).toBeNull();
  });
});
