import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";

import { giftViews, rowsToGifts, type GiftRow } from "@/lib/gifts";
import { mediaImage, publicMediaUrl, type MediaImage } from "@/lib/media";
import { createAdminClient } from "@/lib/supabase/admin";
import { assembleInvitation, type GuestbookEntry, type InvitationData, type ViewContext } from "@/lib/section-view";
import type { Bi, SectionType, Translations } from "@/lib/sections";
import type { Wedding } from "@/lib/types";

export const invitationTag = (slug: string) => `invitation:${slug}`;

export type { InvitationData, Photo, SectionView } from "@/lib/section-view";

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
  crop: unknown;
};

const image = (m: MediaRow): MediaImage => mediaImage(publicMediaUrl(m.storage_path), m);

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
      .select("id, kind, storage_path, width, height, caption, caption_en, position, crop")
      .eq("wedding_id", wedding.id)
      .order("position"),
    supabase
      .from("gift_methods")
      .select("type, holder_name, handle, qr_media_id, note, note_en, details, is_visible")
      .eq("wedding_id", wedding.id)
      .order("position"),
  ]);

  const media = (mediaRows ?? []) as MediaRow[];
  const byKind = (kind: MediaRow["kind"]) => media.filter((m) => m.kind === kind);
  const coverRow = byKind("cover")[0];
  const audioRow = byKind("audio")[0];
  const backgroundRow = byKind("background")[0];
  const gifts = (giftRows ?? []) as GiftRow[];
  const zelleRow = gifts.find((g) => g.type === "zelle");
  const qrRow = zelleRow?.qr_media_id ? media.find((m) => m.id === zelleRow.qr_media_id) : undefined;

  return assembleInvitation({
    slug: wedding.slug,
    updatedAt: wedding.updated_at,
    templateKey: wedding.template_key,
    themeOverrides: wedding.theme_overrides,
    backgroundPhoto: backgroundRow ? image(backgroundRow) : null,
    couple: { partner1: wedding.partner1_name, partner2: wedding.partner2_name },
    event:
      wedding.event_starts_at && wedding.timezone
        ? { startsAt: wedding.event_starts_at, timeZone: wedding.timezone }
        : null,
    rsvp: {
      deadline: wedding.rsvp_deadline,
      timeZone: wedding.timezone,
      maxCompanions: wedding.max_companions,
      companionsMode: wedding.companions_mode,
      guestbook: wedding.guestbook_public ? await loadGuestbook(wedding.id) : [],
    },
    sections: ((sectionRows ?? []) as SectionRow[]).map((row) => ({
      type: row.type,
      visible: row.is_visible,
      content: row.content,
      translations: row.content_en ?? {},
    })),
    cover: coverRow ? image(coverRow) : null,
    photos: byKind("gallery").map((m) => ({ ...image(m), id: m.id, caption: plainBi(m.caption, m.caption_en) })),
    audioUrl: audioRow ? publicMediaUrl(audioRow.storage_path) : null,
    gifts: giftViews(rowsToGifts(gifts), {
      qr: qrRow ? image(qrRow) : null,
      notesEn: Object.fromEntries(gifts.map((g) => [g.type, g.note_en ?? null])),
    }),
  });
}

/**
 * Wishes shown on the invitation, signed with the guest's first name only.
 * public_guestbook is server-only, so it is read with the secret key (absent
 * in previews, where the guestbook simply stays empty).
 */
async function loadGuestbook(weddingId: string): Promise<GuestbookEntry[]> {
  try {
    const { data } = await createAdminClient().rpc("public_guestbook", { p_wedding_id: weddingId });
    return ((data ?? []) as { author: string; message: string }[]).map((row) => ({
      author: row.author.trim().split(/\s+/)[0] ?? "",
      message: row.message,
    }));
  } catch {
    return [];
  }
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
