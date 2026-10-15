import { z } from "zod";

/**
 * Content model of each invitation section.
 *
 * - `content` (sections.content) stores what the couple writes, in Spanish.
 * - `content_en` (sections.content_en) stores the translation of each
 *   translatable text as { path: { src, en, manual } }. `src` is the Spanish
 *   text that was translated: if the couple changes it, it is translated again.
 */

export const SECTION_TYPES = [
  "intro",
  "hero",
  "parents",
  "celebration",
  "gallery",
  "location",
  "dress_code",
  "program",
  "rsvp",
  "gifts",
  "music",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_LABELS: Record<SectionType, string> = {
  intro: "Sobre de bienvenida",
  hero: "Portada",
  parents: "Padres de los novios",
  celebration: "Fecha y cuenta regresiva",
  gallery: "Galería de fotos",
  location: "Ubicación",
  dress_code: "Dress code",
  program: "Programa del día",
  rsvp: "Confirmar asistencia",
  gifts: "Regalos",
  music: "Música",
};

export type Bi = { es: string; en: string };

/** Texts shown when the couple leaves the field empty. */
export const DEFAULT_TEXT = {
  intro: {
    title: { es: "Les invitamos cordialmente", en: "You are cordially invited" },
    button: { es: "Abrir", en: "Open" },
  },
  hero: { kicker: { es: "La boda de", en: "The wedding of" } },
  parents: {
    title: { es: "Con la bendición de nuestros padres", en: "With the blessing of our parents" },
  },
  celebration: { title: { es: "La celebración", en: "The celebration" } },
  gallery: { title: { es: "Galería de fotos", en: "Photo gallery" } },
  location: { title: { es: "Lugar de la celebración", en: "Venue" } },
  dress_code: { title: { es: "Dress code", en: "Dress code" } },
  program: { title: { es: "Programa del día", en: "Schedule" } },
  rsvp: {
    title: { es: "Confirmar asistencia", en: "Will you join us?" },
    message: { es: "Por favor, confírmanos si podrás acompañarnos.", en: "Please let us know if you can make it." },
    closed: {
      es: "El plazo para confirmar asistencia ya terminó. Si necesitas algo, escríbenos directamente.",
      en: "The deadline to confirm attendance has passed. If you need anything, please reach out to us directly.",
    },
  },
  gifts: {
    title: { es: "Caja de regalos", en: "Gift box" },
    message: {
      es: "Su presencia será el mejor regalo que podríamos recibir.",
      en: "Your presence is the best gift we could receive.",
    },
  },
} satisfies Partial<Record<SectionType, Record<string, Bi>>>;

export const GALLERY_STYLES = [
  { value: "coverflow", label: "Coverflow 3D" },
  { value: "cube", label: "Cubo 3D" },
  { value: "cards", label: "Cartas apiladas" },
  { value: "flip", label: "Flip" },
  { value: "ring", label: "Anillo 3D" },
] as const;

export type GalleryStyle = (typeof GALLERY_STYLES)[number]["value"];

// ---------------------------------------------------------------------
// Schemas (validate what the dashboard saves)
// ---------------------------------------------------------------------

const text = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`).default("");

export const sectionSchemas = {
  intro: z.object({ title: text(120), subtitle: text(200), button: text(30) }),
  hero: z.object({ kicker: text(60) }),
  parents: z.object({
    title: text(120),
    intro: text(300),
    families: z
      .array(
        z.object({
          title: text(40),
          names: z.array(z.string().trim().min(1).max(80)).max(3),
        }),
      )
      .max(4, "Máximo 4 familias")
      .default([]),
  }),
  celebration: z.object({ title: text(120), message: text(300) }),
  gallery: z.object({
    title: text(120),
    style: z.enum(GALLERY_STYLES.map((s) => s.value) as [GalleryStyle, ...GalleryStyle[]]).default("coverflow"),
    autoplay: z.boolean().default(true),
  }),
  location: z.object({ title: text(120), venue: text(120), address: text(200), note: text(200) }),
  dress_code: z.object({ title: text(120), description: text(400) }),
  program: z.object({
    title: text(120),
    items: z
      .array(
        z.object({
          time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida (usa HH:MM)"),
          title: z.string().trim().min(1, "Escribe la actividad").max(80),
        }),
      )
      .max(15, "Máximo 15 actividades")
      .default([]),
  }),
  rsvp: z.object({ title: text(120), message: text(300), closed_message: text(300) }),
  gifts: z.object({ title: text(120), message: text(300) }),
  music: z.object({ autoplay_on_open: z.boolean().default(true) }),
} satisfies Record<SectionType, z.ZodType>;

export type SectionContent<T extends SectionType> = z.infer<(typeof sectionSchemas)[T]>;

/** Reads saved content, tolerating old or incomplete data. */
export function parseContent<T extends SectionType>(type: T, raw: unknown): SectionContent<T> {
  const schema = sectionSchemas[type] as unknown as z.ZodType<SectionContent<T>>;
  const parsed = schema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : (schema.parse({}) as SectionContent<T>);
}

// ---------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------

/** Translatable paths per section (`*` = each item of a list). */
const TRANSLATABLE: Record<SectionType, string[]> = {
  intro: ["title", "subtitle", "button"],
  hero: ["kicker"],
  parents: ["title", "intro", "families.*.title"],
  celebration: ["title", "message"],
  gallery: ["title"],
  location: ["title", "note"],
  dress_code: ["title", "description"],
  program: ["title", "items.*.title"],
  rsvp: ["title", "message", "closed_message"],
  gifts: ["title", "message"],
  music: [],
};

export type TranslationEntry = { src: string; en: string; manual?: boolean };
export type Translations = Record<string, TranslationEntry>;

/** Every non-empty translatable text of a section, with its path. */
export function collectTexts(type: SectionType, content: unknown): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  const walk = (value: unknown, parts: string[], prefix: string[]) => {
    if (parts.length === 0) {
      if (typeof value === "string" && value.trim()) out.push({ path: prefix.join("."), text: value.trim() });
      return;
    }
    const [head, ...rest] = parts;
    if (head === "*") {
      if (Array.isArray(value)) value.forEach((item, i) => walk(item, rest, [...prefix, String(i)]));
      return;
    }
    if (value && typeof value === "object") walk((value as Record<string, unknown>)[head], rest, [...prefix, head]);
  };
  for (const pattern of TRANSLATABLE[type]) walk(content, pattern.split("."), []);
  return out;
}

/**
 * Computes the new translations: keeps those still valid and translates only
 * new or changed texts. If translation fails, the text stays pending and the
 * invitation shows it in Spanish.
 */
export async function syncTranslations(
  type: SectionType,
  content: unknown,
  previous: Translations,
  translate: (texts: string[]) => Promise<(string | null)[]>,
): Promise<{ translations: Translations; pending: number }> {
  const texts = collectTexts(type, content);
  const next: Translations = {};
  const missing: { path: string; text: string }[] = [];

  for (const item of texts) {
    const prev = previous[item.path];
    if (prev && prev.src === item.text) next[item.path] = prev;
    else missing.push(item);
  }

  if (missing.length) {
    const results = await translate(missing.map((m) => m.text));
    missing.forEach((m, i) => {
      const en = results[i];
      if (en) next[m.path] = { src: m.text, en };
    });
  }

  return { translations: next, pending: texts.filter((t) => !next[t.path]).length };
}

/** Bilingual text of a path, using the translation only while it is still valid. */
export function bilingual(
  text: string | undefined,
  path: string,
  translations: Translations,
  fallback?: Bi,
): Bi | null {
  const es = text?.trim();
  if (!es) return fallback ?? null;
  const entry = translations[path];
  return { es, en: entry && entry.src === es ? entry.en : es };
}
