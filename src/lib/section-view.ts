import { resolveBackground, resolveVeil, type BackgroundKey, type PhotoVeil } from "./backgrounds";
import type { GiftView } from "./gifts";
import type { MediaImage } from "./media";
import {
  bilingual,
  DEFAULT_TEXT,
  parseContent,
  type Bi,
  type GalleryStyle,
  type SectionType,
  type Translations,
} from "./sections";
import { getTemplate, resolveAccent, resolveTemplate, type TemplateKey } from "./templates";

/**
 * Turns a section's saved (or draft) content into what the invitation renders.
 * Pure, so the public invitation and the dashboard's live previews share it.
 */

export type Photo = MediaImage & { id: string; caption: Bi | null };

export type Coords = { lat: number; lng: number };

/** The exact spot when the couple set one on the map. */
export const locationCoords = (c: { lat: number | null; lng: number | null }): Coords | null =>
  c.lat !== null && c.lng !== null ? { lat: c.lat, lng: c.lng } : null;

export type SectionView =
  | { type: "hero"; kicker: Bi; cover: MediaImage | null }
  | { type: "parents"; title: Bi; intro: Bi | null; families: { title: Bi | null; names: string[] }[] }
  | { type: "celebration"; title: Bi; message: Bi | null }
  | { type: "gallery"; title: Bi; style: GalleryStyle; autoplay: boolean; photos: Photo[] }
  | { type: "location"; title: Bi; venue: string; address: string; note: Bi | null; coords: Coords | null }
  | { type: "dress_code"; title: Bi; description: Bi }
  | { type: "program"; title: Bi; items: { time: string; title: Bi }[] }
  | {
      type: "rsvp";
      title: Bi;
      message: Bi;
      closed: Bi;
      deadline: string | null;
      deadlineLabel: Bi | null;
      maxCompanions: number;
    }
  | { type: "gifts"; title: Bi; message: Bi; methods: GiftView[] };

export type InvitationData = {
  slug: string;
  updatedAt: string;
  template: TemplateKey;
  accent: string | null;
  /** Page background; `photo` only when the background is "Tu foto". */
  background: { key: BackgroundKey; photo: string | null; veil: PhotoVeil };
  couple: { partner1: string; partner2: string };
  event: { startsAt: string; timeZone: string } | null;
  intro: { title: Bi; subtitle: Bi | null; button: Bi } | null;
  music: { url: string; autoplayOnOpen: boolean } | null;
  location: { venue: string; address: string; coords: Coords | null } | null;
  cover: MediaImage | null;
  sections: SectionView[];
};

/** Everything a section needs besides its own content. */
export type ViewContext = {
  cover: MediaImage | null;
  photos: Photo[];
  event: { startsAt: string; timeZone: string } | null;
  rsvp: { deadline: string | null; timeZone: string | null; maxCompanions: number };
  /** Gift methods that are on and complete (empty: the section is not shown). */
  gifts: GiftView[];
};

/** Returns null when the section has nothing to show yet. */
export function buildSectionView(
  type: SectionType,
  raw: unknown,
  tr: Translations,
  ctx: ViewContext,
): SectionView | null {
  switch (type) {
    case "hero": {
      const c = parseContent("hero", raw);
      return { type, kicker: bilingual(c.kicker, "kicker", tr, DEFAULT_TEXT.hero.kicker)!, cover: ctx.cover };
    }
    case "parents": {
      const c = parseContent("parents", raw);
      const families = c.families
        .map((f, i) => ({ title: bilingual(f.title, `families.${i}.title`, tr), names: f.names.filter(Boolean) }))
        .filter((f) => f.names.length > 0);
      if (!families.length) return null;
      return {
        type,
        title: bilingual(c.title, "title", tr, DEFAULT_TEXT.parents.title)!,
        intro: bilingual(c.intro, "intro", tr),
        families,
      };
    }
    case "celebration": {
      if (!ctx.event) return null;
      const c = parseContent("celebration", raw);
      return {
        type,
        title: bilingual(c.title, "title", tr, DEFAULT_TEXT.celebration.title)!,
        message: bilingual(c.message, "message", tr),
      };
    }
    case "gallery": {
      if (!ctx.photos.length) return null;
      const c = parseContent("gallery", raw);
      return {
        type,
        title: bilingual(c.title, "title", tr, DEFAULT_TEXT.gallery.title)!,
        style: c.style,
        autoplay: c.autoplay,
        photos: ctx.photos,
      };
    }
    case "location": {
      const c = parseContent("location", raw);
      if (!c.venue && !c.address) return null;
      return {
        type,
        title: bilingual(c.title, "title", tr, DEFAULT_TEXT.location.title)!,
        venue: c.venue,
        address: c.address,
        note: bilingual(c.note, "note", tr),
        coords: locationCoords(c),
      };
    }
    case "dress_code": {
      const c = parseContent("dress_code", raw);
      const description = bilingual(c.description, "description", tr);
      if (!description) return null;
      return { type, title: bilingual(c.title, "title", tr, DEFAULT_TEXT.dress_code.title)!, description };
    }
    case "program": {
      const c = parseContent("program", raw);
      if (!c.items.length) return null;
      return {
        type,
        title: bilingual(c.title, "title", tr, DEFAULT_TEXT.program.title)!,
        items: c.items.map((item, i) => ({ time: item.time, title: bilingual(item.title, `items.${i}.title`, tr)! })),
      };
    }
    case "rsvp": {
      const c = parseContent("rsvp", raw);
      const { deadline, timeZone, maxCompanions } = ctx.rsvp;
      const formatDeadline = (lang: string) =>
        new Intl.DateTimeFormat(lang, {
          timeZone: timeZone ?? "UTC",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(deadline!));
      return {
        type,
        title: bilingual(c.title, "title", tr, DEFAULT_TEXT.rsvp.title)!,
        message: bilingual(c.message, "message", tr, DEFAULT_TEXT.rsvp.message)!,
        closed: bilingual(c.closed_message, "closed_message", tr, DEFAULT_TEXT.rsvp.closed)!,
        deadline,
        deadlineLabel: deadline ? { es: formatDeadline("es"), en: formatDeadline("en-US") } : null,
        maxCompanions,
      };
    }
    case "gifts": {
      if (!ctx.gifts.length) return null;
      const c = parseContent("gifts", raw);
      return {
        type,
        title: bilingual(c.title, "title", tr, DEFAULT_TEXT.gifts.title)!,
        message: bilingual(c.message, "message", tr, DEFAULT_TEXT.gifts.message)!,
        methods: ctx.gifts,
      };
    }
    default:
      return null; // intro and music are not content blocks
  }
}

/**
 * Everything an invitation is made of, already resolved to URLs. The public
 * page builds it from the database and the builder from the browser draft.
 */
export type InvitationSource = {
  slug: string;
  updatedAt: string;
  templateKey: string | null;
  /** Saved appearance choices: accent, background and photo veil. */
  themeOverrides: unknown;
  /** URL of the "Tu foto" background, when uploaded. */
  backgroundPhoto: string | null;
  couple: { partner1: string; partner2: string };
  event: { startsAt: string; timeZone: string } | null;
  rsvp: ViewContext["rsvp"];
  /** In display order. */
  sections: { type: SectionType; visible: boolean; content: unknown; translations: Translations }[];
  cover: MediaImage | null;
  photos: Photo[];
  audioUrl: string | null;
  gifts: GiftView[];
};

/** Builds the invitation data plus the context that lets an editor preview any section. */
export function assembleInvitation(source: InvitationSource): { data: InvitationData; ctx: ViewContext } {
  const visible = source.sections.filter((s) => s.visible);
  const find = (type: SectionType) => visible.find((s) => s.type === type);
  const backgroundKey = resolveBackground(
    source.themeOverrides,
    getTemplate(source.templateKey).background,
    Boolean(source.backgroundPhoto),
  );

  const introSection = find("intro");
  const intro = introSection
    ? (() => {
        const c = parseContent("intro", introSection.content);
        const tr = introSection.translations;
        return {
          title: bilingual(c.title, "title", tr, DEFAULT_TEXT.intro.title)!,
          subtitle: bilingual(c.subtitle, "subtitle", tr),
          button: bilingual(c.button, "button", tr, DEFAULT_TEXT.intro.button)!,
        };
      })()
    : null;

  const musicSection = find("music");
  const music =
    musicSection && source.audioUrl
      ? { url: source.audioUrl, autoplayOnOpen: parseContent("music", musicSection.content).autoplay_on_open }
      : null;

  const ctx: ViewContext = {
    cover: source.cover,
    photos: source.photos,
    event: source.event,
    rsvp: source.rsvp,
    gifts: source.gifts,
  };

  const locationContent = parseContent("location", find("location")?.content);
  const data: InvitationData = {
    slug: source.slug,
    updatedAt: source.updatedAt,
    template: resolveTemplate(source.templateKey),
    accent: resolveAccent(source.themeOverrides),
    background: {
      key: backgroundKey,
      photo: backgroundKey === "foto" ? source.backgroundPhoto : null,
      veil: resolveVeil(source.themeOverrides),
    },
    couple: source.couple,
    event: source.event,
    intro,
    music,
    location:
      locationContent.venue || locationContent.address
        ? { venue: locationContent.venue, address: locationContent.address, coords: locationCoords(locationContent) }
        : null,
    cover: source.cover,
    sections: visible
      .map((s) => buildSectionView(s.type, s.content, s.translations, ctx))
      .filter((view) => view !== null),
  };
  return { data, ctx };
}
