import { DEFAULT_VEIL, type BackgroundKey, type PhotoVeil, type TextContrast } from "@/lib/backgrounds";
import { emptyGifts, type Gifts } from "@/lib/gifts";
import type { PhotoCrop } from "@/lib/photo-crop";
import { SECTION_TYPES, type SectionType, type Translations } from "@/lib/sections";
import { DEFAULT_TEMPLATE, resolveTemplate, type AccentValue, type TemplateKey } from "@/lib/templates";

/**
 * The invitation a couple designs in the builder, before they have an account.
 * It lives in the browser (localStorage, photos and music in IndexedDB) and is
 * moved to the database when they publish.
 */

/** 2: every gift method (v1 only had Zelle). */
export const DRAFT_VERSION = 2;

/** Where the builder sends the couple to save the draft in their account without publishing it. */
export const SAVE_PATH = "/crear/publicar?modo=guardar";

/** A file kept in the browser's IndexedDB; photos also keep how the couple framed them. */
export type LocalMedia = {
  id: string;
  mime: string;
  width: number | null;
  height: number | null;
  crop?: PhotoCrop | null;
};

export type BuilderDraft = {
  version: typeof DRAFT_VERSION;
  startedAt: string;
  couple: { partner1: string; partner2: string };
  /** Local date and time of the ceremony in `timeZone`. */
  event: { date: string; time: string; timeZone: string };
  appearance: {
    template: TemplateKey;
    accent: AccentValue | null;
    /** null = the template's recommended background. */
    background: BackgroundKey | null;
    veil: PhotoVeil;
    /** Missing in drafts saved before it existed (= automatic). */
    contrast?: TextContrast;
  };
  /** Link of the invitation; follows the names until the couple edits it. */
  slug: string;
  slugEdited: boolean;
  sections: Record<SectionType, { visible: boolean; content: unknown }>;
  /** English versions of the example texts (the rest is translated when publishing). */
  translations: Partial<Record<SectionType, Translations>>;
  media: {
    cover: LocalMedia | null;
    gallery: LocalMedia[];
    audio: LocalMedia | null;
    qr: LocalMedia | null;
    background: LocalMedia | null;
  };
  gifts: Gifts;
  rsvp: {
    /** Last day to reply (local date), or "" for no deadline. */
    deadline: string;
    maxCompanions: number;
    companionsMode: "names" | "count";
    guestbookPublic: boolean;
  };
};

// ---------------------------------------------------------------------
// Example texts: the invitation looks complete from the first minute.
// ---------------------------------------------------------------------

type Example = { content: Record<string, unknown>; en: Record<string, string> };

/** Example content per section, with the English of each text by path. */
export const EXAMPLES: Partial<Record<SectionType, Example>> = {
  intro: {
    content: { title: "", subtitle: "Acompáñanos a celebrar nuestro amor", button: "" },
    en: { subtitle: "Join us as we celebrate our love" },
  },
  celebration: {
    content: { title: "", message: "Nos encantaría que nos acompañes en este día tan especial." },
    en: { message: "We would love for you to join us on this very special day." },
  },
  dress_code: {
    content: {
      title: "",
      description: "Formal. Te sugerimos colores claros o tonos tierra; el blanco es solo para la novia.",
    },
    en: { description: "Formal. We suggest light or earthy tones; white is reserved for the bride." },
  },
  program: {
    content: {
      title: "",
      items: [
        { time: "16:00", title: "Ceremonia" },
        { time: "17:30", title: "Cóctel" },
        { time: "19:00", title: "Cena y baile" },
      ],
    },
    en: { "items.0.title": "Ceremony", "items.1.title": "Cocktail hour", "items.2.title": "Dinner and dancing" },
  },
};

/** Sections whose texts are still exactly the examples (shown as a reminder before publishing). */
export function sectionsWithExamples(draft: BuilderDraft): SectionType[] {
  return (Object.keys(EXAMPLES) as SectionType[]).filter(
    (type) =>
      draft.sections[type].visible &&
      JSON.stringify(draft.sections[type].content) === JSON.stringify(EXAMPLES[type]!.content),
  );
}

function exampleTranslations(): Partial<Record<SectionType, Translations>> {
  const out: Partial<Record<SectionType, Translations>> = {};
  for (const [type, example] of Object.entries(EXAMPLES) as [SectionType, Example][]) {
    const tr: Translations = {};
    for (const [path, en] of Object.entries(example.en)) {
      const src = path.split(".").reduce<unknown>((v, key) => (v as Record<string, unknown>)?.[key], example.content);
      if (typeof src === "string") tr[path] = { src, en };
    }
    out[type] = tr;
  }
  return out;
}

const SECTION_DEFAULTS: Partial<Record<SectionType, Record<string, unknown>>> = {
  gallery: { title: "", style: "coverflow", autoplay: true },
  music: { autoplay_on_open: true },
};

/** A fresh draft; `template` comes from "Crea la tuya con esta plantilla". */
export function createDraft(template?: string | null, timeZone?: string): BuilderDraft {
  const sections = Object.fromEntries(
    SECTION_TYPES.map((type) => [
      type,
      { visible: true, content: structuredClone(EXAMPLES[type]?.content ?? SECTION_DEFAULTS[type] ?? {}) },
    ]),
  ) as BuilderDraft["sections"];

  return {
    version: DRAFT_VERSION,
    startedAt: new Date().toISOString(),
    couple: { partner1: "", partner2: "" },
    event: { date: "", time: "16:00", timeZone: timeZone || "America/New_York" },
    appearance: {
      template: resolveTemplate(template ?? DEFAULT_TEMPLATE),
      accent: null,
      background: null,
      veil: DEFAULT_VEIL,
      contrast: "auto",
    },
    slug: "",
    slugEdited: false,
    sections,
    translations: exampleTranslations(),
    media: { cover: null, gallery: [], audio: null, qr: null, background: null },
    gifts: emptyGifts(),
    rsvp: { deadline: "", maxCompanions: 4, companionsMode: "names", guestbookPublic: false },
  };
}

// ---------------------------------------------------------------------
// Invitation link
// ---------------------------------------------------------------------

/** App paths a wedding link can never take (mirrors private.is_reserved_slug). */
export const RESERVED_SLUGS = new Set([
  "admin", "panel", "crear", "entrar", "salir", "cuenta", "login", "registro",
  "api", "auth", "app", "www", "static", "media", "icons", "sw", "manifest",
  "sitemap", "robots", "favicon", "plantillas", "precios", "donar", "ayuda",
  "soporte", "legal", "terminos", "privacidad", "blog", "vista-previa",
  "ejemplo", "boda", "bodas", "invitacion", "invitaciones", "lazodoro", "lazodeoro", "lazo-de-oro",
  "demo",
]); // prettier-ignore

/** Lowercase ASCII words joined by dashes: "José María" → "jose-maria". */
export function toSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

/** Cleans what the couple types in the link field, keeping a trailing dash while they type. */
export function normalizeSlugInput(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, 60);
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/** "María José" + "Juan" → "maria-y-juan". */
export function suggestSlug(partner1: string, partner2: string): string {
  const a = toSlug(firstName(partner1));
  const b = toSlug(firstName(partner2));
  return a && b ? `${a}-y-${b}` : a || b;
}

export type SlugProblem = "short" | "format" | "reserved" | null;

/** Why a link cannot be used, before asking the server whether it is taken. */
export function slugProblem(slug: string): SlugProblem {
  if (slug.length < 3 || slug.length > 60) return "short";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "format";
  if (RESERVED_SLUGS.has(slug)) return "reserved";
  return null;
}

// ---------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------

export const STEPS = [
  { key: "nombres", title: "Sus nombres", required: true },
  { key: "fecha", title: "Fecha y hora", required: true },
  { key: "plantilla", title: "Plantilla y fondo" },
  { key: "portada", title: "Sobre y portada" },
  { key: "padres", title: "Padres" },
  { key: "celebracion", title: "Mensaje de celebración" },
  { key: "lugar", title: "Lugar" },
  { key: "programa", title: "Programa del día" },
  { key: "vestimenta", title: "Código de vestimenta" },
  { key: "fotos", title: "Fotos" },
  { key: "musica", title: "Música" },
  { key: "regalos", title: "Regalos" },
  { key: "confirmaciones", title: "Confirmaciones" },
  { key: "revisar", title: "Revisar y publicar" },
] as const satisfies readonly { key: string; title: string; required?: boolean }[];

export type StepKey = (typeof STEPS)[number]["key"];

/** What is still missing to publish (names and date are required). */
export function missingForPublish(draft: BuilderDraft): StepKey[] {
  const missing: StepKey[] = [];
  if (!draft.couple.partner1.trim() || !draft.couple.partner2.trim()) missing.push("nombres");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.event.date) || !/^\d{2}:\d{2}$/.test(draft.event.time)) missing.push("fecha");
  return missing;
}

/**
 * Brings a draft saved by an older version of the builder up to date, so
 * nobody loses their design when the builder changes.
 */
export function migrateDraft(raw: unknown): BuilderDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const draft = raw as Record<string, unknown>;
  if (draft.version === DRAFT_VERSION) return draft as unknown as BuilderDraft;
  if (draft.version === 1) {
    const old = (draft.gift ?? {}) as { holderName?: string; handle?: string; note?: string };
    const media = (draft.media ?? {}) as { qr?: unknown };
    const gifts = emptyGifts();
    gifts.zelle = {
      enabled: Boolean(old.handle || media.qr),
      holderName: old.holderName ?? "",
      handle: old.handle ?? "",
      note: old.note ?? "",
    };
    const rest = { ...draft };
    delete rest.gift;
    return { ...(rest as unknown as BuilderDraft), version: DRAFT_VERSION, gifts };
  }
  return null;
}
