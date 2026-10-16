import { describe, expect, it, vi } from "vitest";

import { bilingual, collectTexts, parseContent, syncTranslations, type Translations } from "./sections";

describe("parseContent", () => {
  it("fills defaults and tolerates missing or invalid data", () => {
    expect(parseContent("gallery", undefined)).toEqual({ title: "", style: "coverflow", autoplay: true });
    expect(parseContent("gallery", { style: "not-a-style" })).toEqual({
      title: "",
      style: "coverflow",
      autoplay: true,
    });
    expect(parseContent("music", {})).toEqual({ autoplay_on_open: true });
  });
});

describe("location", () => {
  it("keeps the pinned spot and treats older content as not pinned", () => {
    expect(parseContent("location", { venue: "Salón", address: "Calle 1" })).toMatchObject({ lat: null, lng: null });
    expect(parseContent("location", { venue: "Salón", lat: 25.7, lng: -80.2 })).toMatchObject({
      lat: 25.7,
      lng: -80.2,
    });
  });
});

describe("collectTexts", () => {
  it("collects translatable texts, including items inside lists", () => {
    const content = {
      title: "Programa",
      items: [
        { time: "15:00", title: "Ceremonia" },
        { time: "18:00", title: "  " },
      ],
    };
    expect(collectTexts("program", content)).toEqual([
      { path: "title", text: "Programa" },
      { path: "items.0.title", text: "Ceremonia" },
    ]);
  });

  it("never collects names or addresses", () => {
    const content = { venue: "Vizcaya", address: "3251 S Miami Ave", note: "Estacionamiento gratis", title: "" };
    expect(collectTexts("location", content).map((t) => t.path)).toEqual(["note"]);
  });
});

describe("syncTranslations", () => {
  const previous: Translations = {
    title: { src: "Galería", en: "Gallery manually fixed", manual: true },
  };

  it("keeps translations whose Spanish text did not change and translates only new text", async () => {
    const translate = vi.fn(async (texts: string[]) => texts.map((t) => `EN:${t}`));
    const result = await syncTranslations(
      "program",
      { title: "Galería", items: [{ time: "15:00", title: "Cena" }] },
      previous,
      translate,
    );

    expect(translate).toHaveBeenCalledWith(["Cena"]);
    expect(result.translations.title.en).toBe("Gallery manually fixed");
    expect(result.translations["items.0.title"]).toEqual({ src: "Cena", en: "EN:Cena" });
    expect(result.pending).toBe(0);
  });

  it("re-translates when the Spanish text changes and drops removed paths", async () => {
    const translate = vi.fn(async (texts: string[]) => texts.map(() => "Photos"));
    const result = await syncTranslations(
      "gallery",
      { title: "Fotos" },
      { ...previous, old: { src: "x", en: "y" } },
      translate,
    );

    expect(result.translations).toEqual({ title: { src: "Fotos", en: "Photos" } });
  });

  it("reports pending texts when the translation service fails", async () => {
    const result = await syncTranslations("dress_code", { title: "", description: "Formal" }, {}, async () => [null]);
    expect(result).toEqual({ translations: {}, pending: 1 });
  });
});

describe("bilingual", () => {
  it("uses the translation only while it matches the current Spanish text", () => {
    const tr: Translations = { title: { src: "Hola", en: "Hello" } };
    expect(bilingual("Hola", "title", tr)).toEqual({ es: "Hola", en: "Hello" });
    expect(bilingual("Hola de nuevo", "title", tr)).toEqual({ es: "Hola de nuevo", en: "Hola de nuevo" });
  });

  it("falls back to the default text when the field is empty", () => {
    const fallback = { es: "Galería de fotos", en: "Photo gallery" };
    expect(bilingual("   ", "title", {}, fallback)).toBe(fallback);
    expect(bilingual(undefined, "title", {})).toBeNull();
  });
});
