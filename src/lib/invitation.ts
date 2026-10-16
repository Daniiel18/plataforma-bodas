import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";

import { publicMediaUrl, type MediaImage } from "@/lib/media";
import { assembleInvitation, type InvitationData, type ViewContext } from "@/lib/section-view";
import type { Bi, SectionType, Translations } from "@/lib/sections";
import type { Wedding } from "@/lib/types";
import { zelleLink } from "@/lib/zelle";

export const invitationTag = (slug: string) => `invitation:${slug}`;

export type { InvitationData, Photo, SectionView, ZelleInfo } from "@/lib/section-view";

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

/** Builds the invitation data with the given client (public or the couple's). */
export async function loadInvitation(supabase: SupabaseClient, wedding: Wedding): Promise<InvitationData> {
  return (await loadInvitationParts(supabase, wedding)).data;
}

/** The invitation data plus the context that lets the dashboard preview any section. */
export async function loadInvitationParts(
  supabase: SupabaseClient,
  wedding: Wedding,
): Promise<{ data: InvitationData; ctx: ViewContext }> {
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
  const gift = (giftRows ?? [])[0] as GiftRow | undefined;
  const qrRow = gift?.qr_media_id ? media.find((m) => m.id === gift.qr_media_id) : undefined;

  return assembleInvitation({
    slug: wedding.slug,
    updatedAt: wedding.updated_at,
    templateKey: wedding.template_key,
    themeOverrides: wedding.theme_overrides,
    backgroundPhoto: backgroundRow ? publicMediaUrl(backgroundRow.storage_path) : null,
    couple: { partner1: wedding.partner1_name, partner2: wedding.partner2_name },
    event:
      wedding.event_starts_at && wedding.timezone
        ? { startsAt: wedding.event_starts_at, timeZone: wedding.timezone }
        : null,
    rsvp: { deadline: wedding.rsvp_deadline, timeZone: wedding.timezone, maxCompanions: wedding.max_companions },
    sections: ((sectionRows ?? []) as SectionRow[]).map((row) => ({
      type: row.type,
      visible: row.is_visible,
      content: row.content,
      translations: row.content_en ?? {},
    })),
    cover: coverRow ? image(coverRow) : null,
    photos: byKind("gallery").map((m) => ({ ...image(m), id: m.id, caption: plainBi(m.caption, m.caption_en) })),
    audioUrl: audioRow ? publicMediaUrl(audioRow.storage_path) : null,
    zelle:
      gift?.is_visible && (gift.handle || qrRow)
        ? {
            holderName: gift.holder_name ?? "",
            handle: gift.handle ?? "",
            note: plainBi(gift.note, gift.note_en),
            qr: qrRow ? image(qrRow) : null,
            link: gift.handle ? zelleLink(gift.holder_name ?? "", gift.handle) : null,
          }
        : null,
  });
}

/** Published invitation, cached until the couple saves a change. */
export async function getPublicInvitation(slug: string): Promise<InvitationData | null> {
  "use cache";
  cacheLife("max");
  cacheTag(invitationTag(slug));

  const supabase = publicClient();
  const { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle<Wedding>();
  if (!wedding) return null;

  return loadInvitation(supabase, wedding);
}

/** Slugs of the published invitations, prerendered at build time. */
export async function getPublishedSlugs(): Promise<string[]> {
  const { data } = await publicClient().from("weddings").select("slug").eq("is_published", true).limit(500);
  return (data ?? []).map((wedding: { slug: string }) => wedding.slug);
}

/** Anonymous client: Row Level Security only exposes published weddings. */
function publicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
