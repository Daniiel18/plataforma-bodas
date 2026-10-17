"use server";

import { getAdminContext, READ_ONLY_RESULT } from "@/lib/admin";
import { refreshInvitation } from "@/lib/admin-invitation";
import { toThemeOverrides } from "@/lib/appearance";
import { draftDeadline, draftStartsAt } from "@/lib/builder/invitation";
import { draftSchema, type ValidDraft } from "@/lib/builder/schema";
import { findSlug } from "@/lib/builder/slugs";
import { giftsToRows } from "@/lib/gifts";
import { MEDIA_BUCKET } from "@/lib/media";
import { SECTION_TYPES, syncTranslations, type Translations } from "@/lib/sections";
import { shareDetails, type ShareDetails } from "@/lib/share";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { translateEsToEn } from "@/lib/translate";

/**
 * Publishing from the builder, in two steps around the file uploads (which go
 * straight from the browser to Storage):
 *   1. prepareWedding: creates the wedding from the draft, or replaces the
 *      design of the account's wedding (guests' answers are kept).
 *   2. finishPublishing: translates the texts and publishes, or leaves the
 *      wedding as an unpublished draft when the couple only saves it.
 */

export type PrepareResult =
  | { status: "ready"; weddingId: string; slug: string }
  | { status: "has_wedding"; weddingId: string; slug: string; couple: string }
  | { status: "slug_taken"; suggestion: string | null }
  | { status: "signin" }
  | { status: "error"; error: string };

type Admin = ReturnType<typeof createAdminClient>;

const weddingFields = (draft: ValidDraft) => ({
  partner1_name: draft.couple.partner1,
  partner2_name: draft.couple.partner2,
  event_starts_at: draftStartsAt(draft),
  timezone: draft.event.timeZone,
  rsvp_deadline: draftDeadline(draft),
  max_companions: draft.rsvp.maxCompanions,
  template_key: draft.appearance.template,
  companions_mode: draft.rsvp.companionsMode,
  guestbook_public: draft.rsvp.guestbookPublic,
});

const sectionRows = (weddingId: string, draft: ValidDraft) =>
  SECTION_TYPES.map((type, position) => ({
    wedding_id: weddingId,
    type,
    position,
    is_visible: draft.sections[type].visible,
    content: draft.sections[type].content,
    // English of the example texts; the rest is translated in finishPublishing.
    content_en: (draft.translations[type] ?? {}) as Translations,
  }));

const giftRows = (weddingId: string, draft: ValidDraft) =>
  giftsToRows(draft.gifts).map((row) => ({ wedding_id: weddingId, ...row }));

async function audit(admin: Admin, userId: string, action: string, weddingId: string) {
  await admin.from("audit_log").insert({ actor_user_id: userId, action, target_type: "wedding", target_id: weddingId });
}

export async function prepareWedding(input: unknown, mode: "new" | "replace"): Promise<PrepareResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { status: "signin" };

  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) return { status: "error", error: parsed.error.issues[0]?.message ?? "El diseño no es válido" };
  const draft = parsed.data;
  const admin = createAdminClient();

  const { data: owned } = await admin
    .from("wedding_members")
    .select("wedding_id, weddings(slug, partner1_name, partner2_name, status, is_published, theme_overrides)")
    .eq("user_id", userId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle<{
      wedding_id: string;
      weddings: {
        slug: string;
        partner1_name: string;
        partner2_name: string;
        status: string;
        is_published: boolean;
        theme_overrides: Record<string, unknown> | null;
      };
    }>();

  if (owned) {
    const existing = owned.weddings;
    if (mode !== "replace") {
      return {
        status: "has_wedding",
        weddingId: owned.wedding_id,
        slug: existing.slug,
        couple: `${existing.partner1_name} & ${existing.partner2_name}`,
      };
    }
    if (!["draft", "active"].includes(existing.status)) {
      return { status: "error", error: "Tu boda ya no se puede editar." };
    }
    return replaceDesign(admin, userId, owned.wedding_id, existing, draft);
  }

  const slug = await findSlug(admin, draft.slug);
  if (!slug) return { status: "error", error: "No pudimos comprobar el enlace. Inténtalo de nuevo." };
  if (!slug.available) return { status: "slug_taken", suggestion: slug.suggestion };

  const { data: wedding, error } = await admin
    .from("weddings")
    .insert({
      slug: draft.slug,
      ...weddingFields(draft),
      theme_overrides: toThemeOverrides(draft.appearance),
      created_by: userId,
    })
    .select("id, slug")
    .single<{ id: string; slug: string }>();
  if (error || !wedding) {
    if (error?.code === "23505") return { status: "slug_taken", suggestion: null };
    return { status: "error", error: "No se pudo crear tu boda. Inténtalo de nuevo." };
  }

  const steps = await Promise.all([
    admin.from("wedding_members").insert({ wedding_id: wedding.id, user_id: userId, role: "owner" }),
    admin.from("sections").insert(sectionRows(wedding.id, draft)),
    admin.from("gift_methods").insert(giftRows(wedding.id, draft)),
  ]);
  if (steps.some((step) => step.error)) {
    await admin.from("weddings").delete().eq("id", wedding.id);
    return { status: "error", error: "No se pudo crear tu boda. Inténtalo de nuevo." };
  }

  await audit(admin, userId, "wedding.created_from_builder", wedding.id);
  return { status: "ready", weddingId: wedding.id, slug: wedding.slug };
}

/** Replaces the design of an existing wedding with the draft; replies and wishes stay. */
async function replaceDesign(
  admin: Admin,
  userId: string,
  weddingId: string,
  existing: { slug: string; theme_overrides: Record<string, unknown> | null },
  draft: ValidDraft,
): Promise<PrepareResult> {
  const { data: media } = await admin.from("media").select("id, storage_path").eq("wedding_id", weddingId);

  const steps = await Promise.all([
    admin
      .from("weddings")
      .update({
        ...weddingFields(draft),
        theme_overrides: toThemeOverrides(draft.appearance, existing.theme_overrides),
      })
      .eq("id", weddingId),
    admin.from("sections").upsert(sectionRows(weddingId, draft), { onConflict: "wedding_id,type" }),
    admin
      .from("gift_methods")
      .delete()
      .eq("wedding_id", weddingId)
      .then(() => admin.from("gift_methods").insert(giftRows(weddingId, draft))),
  ]);
  if (steps.some((step) => step.error)) return { status: "error", error: "No se pudo reemplazar el diseño." };

  // The draft brings its own photos, song and QR.
  if (media?.length) {
    await admin
      .from("media")
      .delete()
      .in(
        "id",
        media.map((m) => m.id),
      );
    await admin.storage.from(MEDIA_BUCKET).remove(media.map((m) => m.storage_path));
  }

  await audit(admin, userId, "wedding.design_replaced", weddingId);
  refreshInvitation(existing.slug);
  return { status: "ready", weddingId, slug: existing.slug };
}

export type FinishResult = { ok: true; slug: string; share: ShareDetails } | { ok: false; error: string };

/** Translates every text into English and publishes the couple's wedding (unless they only save it). */
export async function finishPublishing({ publish = true }: { publish?: boolean } = {}): Promise<FinishResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;

  const { data: sections } = await supabase
    .from("sections")
    .select("type, content, content_en")
    .eq("wedding_id", wedding.id);
  for (const section of sections ?? []) {
    const previous = (section.content_en ?? {}) as Translations;
    const { translations } = await syncTranslations(section.type, section.content, previous, translateEsToEn);
    if (JSON.stringify(translations) !== JSON.stringify(previous)) {
      await supabase
        .from("sections")
        .update({ content_en: translations })
        .eq("wedding_id", wedding.id)
        .eq("type", section.type);
    }
  }

  const { data: gifts } = await supabase
    .from("gift_methods")
    .select("type, note, note_en")
    .eq("wedding_id", wedding.id);
  for (const gift of gifts ?? []) {
    if (!gift.note || gift.note_en) continue;
    const [noteEn] = await translateEsToEn([gift.note]);
    if (noteEn) {
      await supabase
        .from("gift_methods")
        .update({ note_en: noteEn })
        .eq("wedding_id", wedding.id)
        .eq("type", gift.type);
    }
  }

  if (publish) {
    const { error } = await supabase.from("weddings").update({ is_published: true }).eq("id", wedding.id);
    if (error) return { ok: false, error: "No se pudo publicar. Inténtalo de nuevo desde tu panel." };
  }

  refreshInvitation(wedding.slug);
  return { ok: true, slug: wedding.slug, share: shareDetails(wedding) };
}
