import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";

import { resolveBackground, resolveVeil, type BackgroundKey, type PhotoVeil } from "@/lib/backgrounds";
import { publicMediaUrl, type MediaImage } from "@/lib/media";
import {
  bilingual,
  DEFAULT_TEXT,
  parseContent,
  type Bi,
  type GalleryStyle,
  type SectionType,
  type Translations,
} from "@/lib/sections";
import { getTemplate, resolveAccent, resolveTemplate, type TemplateKey } from "@/lib/templates";
import type { Wedding } from "@/lib/types";

export const invitationTag = (slug: string) => `invitation:${slug}`;

export type Photo = MediaImage & { id: string; caption: Bi | null };

export type ZelleInfo = { holderName: string; handle: string; note: Bi | null; qr: MediaImage | null };

export type SectionView =
  | { type: "hero"; kicker: Bi; cover: MediaImage | null }
  | { type: "parents"; title: Bi; intro: Bi | null; families: { title: Bi | null; names: string[] }[] }
  | { type: "celebration"; title: Bi; message: Bi | null }
  | { type: "gallery"; title: Bi; style: GalleryStyle; autoplay: boolean; photos: Photo[] }
  | { type: "location"; title: Bi; venue: string; address: string; note: Bi | null }
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
  | { type: "gifts"; title: Bi; message: Bi; zelle: ZelleInfo };

export type InvitationData = {
  slug: string;
  updatedAt: string;
  template: TemplateKey;
  accent: string | null;
  /** Fondo de la página; `photo` solo cuando el fondo es "Tu foto". */
  background: { key: BackgroundKey; photo: string | null; veil: PhotoVeil };
  couple: { partner1: string; partner2: string };
  event: { startsAt: string; timeZone: string } | null;
  intro: { title: Bi; subtitle: Bi | null; button: Bi } | null;
  music: { url: string; autoplayOnOpen: boolean } | null;
  location: { venue: string; address: string } | null;
  cover: MediaImage | null;
  sections: SectionView[];
};

type SectionRow = {
  type: SectionType;
  position: number;
  is_visible: boolean;
  content: unknown;
  content_en: Translations | null;
};

type MediaRow = {
  id: string;
  kind: "gallery" | "cover" | "audio" | "qr" | "og" | "background";
  storage_path: string;
  width: number | null;
  height: number | null;
  caption: string | null;
  caption_en: string | null;
  position: number;
};

type GiftRow = {
  holder_name: string | null;
  handle: string | null;
  qr_media_id: string | null;
  note: string | null;
  note_en: string | null;
  is_visible: boolean;
};

const image = (m: MediaRow): MediaImage => ({
  url: publicMediaUrl(m.storage_path),
  width: m.width ?? 1200,
  height: m.height ?? 1600,
});

const plainBi = (es: string | null, en: string | null): Bi | null =>
  es?.trim() ? { es: es.trim(), en: en?.trim() || es.trim() } : null;

/** Arma los datos de la invitación con el cliente recibido (público o de los novios). */
export async function loadInvitation(supabase: SupabaseClient, wedding: Wedding): Promise<InvitationData> {
  const [{ data: sectionRows }, { data: mediaRows }, { data: giftRows }] = await Promise.all([
    supabase
      .from("sections")
      .select("type, position, is_visible, content, content_en")
      .eq("wedding_id", wedding.id)
      .order("position"),
    supabase
      .from("media")
      .select("id, kind, storage_path, width, height, caption, caption_en, position")
      .eq("wedding_id", wedding.id)
      .order("position"),
    supabase
      .from("gift_methods")
      .select("holder_name, handle, qr_media_id, note, note_en, is_visible")
      .eq("wedding_id", wedding.id)
      .eq("type", "zelle")
      .order("position")
      .limit(1),
  ]);

  const media = (mediaRows ?? []) as MediaRow[];
  const byKind = (kind: MediaRow["kind"]) => media.filter((m) => m.kind === kind);
  const coverRow = byKind("cover")[0];
  const audioRow = byKind("audio")[0];
  const backgroundRow = byKind("background")[0];
  const backgroundKey = resolveBackground(
    wedding.theme_overrides,
    getTemplate(wedding.template_key).background,
    Boolean(backgroundRow),
  );
  const sections = ((sectionRows ?? []) as SectionRow[]).filter((s) => s.is_visible);
  const find = (type: SectionType) => sections.find((s) => s.type === type);

  const introRow = find("intro");
  const intro = introRow
    ? (() => {
        const c = parseContent("intro", introRow.content);
        const tr = introRow.content_en ?? {};
        return {
          title: bilingual(c.title, "title", tr, DEFAULT_TEXT.intro.title)!,
          subtitle: bilingual(c.subtitle, "subtitle", tr),
          button: bilingual(c.button, "button", tr, DEFAULT_TEXT.intro.button)!,
        };
      })()
    : null;

  const musicRow = find("music");
  const music =
    musicRow && audioRow
      ? {
          url: publicMediaUrl(audioRow.storage_path),
          autoplayOnOpen: parseContent("music", musicRow.content).autoplay_on_open,
        }
      : null;

  const locationContent = parseContent("location", find("location")?.content);
  const event =
    wedding.event_starts_at && wedding.timezone
      ? { startsAt: wedding.event_starts_at, timeZone: wedding.timezone }
      : null;

  const gift = (giftRows ?? [])[0] as GiftRow | undefined;
  const qrRow = gift?.qr_media_id ? media.find((m) => m.id === gift.qr_media_id) : undefined;

  const views: SectionView[] = [];
  for (const row of sections) {
    const tr = row.content_en ?? {};
    const view = buildSection(row.type, row.content, tr);
    if (view) views.push(view);
  }

  function buildSection(type: SectionType, raw: unknown, tr: Translations): SectionView | null {
    switch (type) {
      case "hero": {
        const c = parseContent("hero", raw);
        return {
          type,
          kicker: bilingual(c.kicker, "kicker", tr, DEFAULT_TEXT.hero.kicker)!,
          cover: coverRow ? image(coverRow) : null,
        };
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
        if (!event) return null;
        const c = parseContent("celebration", raw);
        return {
          type,
          title: bilingual(c.title, "title", tr, DEFAULT_TEXT.celebration.title)!,
          message: bilingual(c.message, "message", tr),
        };
      }
      case "gallery": {
        const photos = byKind("gallery").map((m) => ({
          ...image(m),
          id: m.id,
          caption: plainBi(m.caption, m.caption_en),
        }));
        if (!photos.length) return null;
        const c = parseContent("gallery", raw);
        return {
          type,
          title: bilingual(c.title, "title", tr, DEFAULT_TEXT.gallery.title)!,
          style: c.style,
          autoplay: c.autoplay,
          photos,
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
        const deadline = wedding.rsvp_deadline;
        const formatDeadline = (lang: string) =>
          new Intl.DateTimeFormat(lang, {
            timeZone: wedding.timezone ?? "UTC",
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
          maxCompanions: wedding.max_companions,
        };
      }
      case "gifts": {
        if (!gift?.is_visible || (!gift.handle && !qrRow)) return null;
        const c = parseContent("gifts", raw);
        return {
          type,
          title: bilingual(c.title, "title", tr, DEFAULT_TEXT.gifts.title)!,
          message: bilingual(c.message, "message", tr, DEFAULT_TEXT.gifts.message)!,
          zelle: {
            holderName: gift.holder_name ?? "",
            handle: gift.handle ?? "",
            note: plainBi(gift.note, gift.note_en),
            qr: qrRow ? image(qrRow) : null,
          },
        };
      }
      default:
        return null; // intro y music no son bloques de contenido
    }
  }

  return {
    slug: wedding.slug,
    updatedAt: wedding.updated_at,
    template: resolveTemplate(wedding.template_key),
    accent: resolveAccent(wedding.theme_overrides),
    background: {
      key: backgroundKey,
      photo: backgroundKey === "foto" && backgroundRow ? publicMediaUrl(backgroundRow.storage_path) : null,
      veil: resolveVeil(wedding.theme_overrides),
    },
    couple: { partner1: wedding.partner1_name, partner2: wedding.partner2_name },
    event,
    intro,
    music,
    location:
      locationContent.venue || locationContent.address
        ? { venue: locationContent.venue, address: locationContent.address }
        : null,
    cover: coverRow ? image(coverRow) : null,
    sections: views,
  };
}

/** Invitación publicada, cacheada hasta que la novia guarde un cambio. */
export async function getPublicInvitation(slug: string): Promise<InvitationData | null> {
  "use cache";
  cacheLife("max");
  cacheTag(invitationTag(slug));

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle<Wedding>();
  if (!wedding) return null;

  return loadInvitation(supabase, wedding);
}
