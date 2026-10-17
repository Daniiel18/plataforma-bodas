import { revalidateTag } from "next/cache";

import { invitationTag } from "@/lib/invitation";
import { lifecycleCutoffs, lifecycleDates } from "@/lib/lifecycle";
import { MEDIA_BUCKET } from "@/lib/media";
import { notifyCouple } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Daily job (Vercel Cron) that applies the wedding lifecycle (see
 * lib/lifecycle.ts): read-only after the event, archive notices and
 * archiving, draft notices and deleting drafts never published.
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("No autorizado", { status: 401 });
  }

  const db = createAdminClient();
  const now = new Date();
  const cut = lifecycleCutoffs(now);
  const longDate = (date: Date | null) =>
    date ? new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" }).format(date) : "";

  /** Every file of a wedding in Storage (its folder holds one subfolder per kind). */
  const removeFiles = async (weddingId: string) => {
    const paths: string[] = [];
    const { data: folders } = await db.storage.from(MEDIA_BUCKET).list(weddingId, { limit: 100 });
    for (const folder of folders ?? []) {
      const { data: files } = await db.storage.from(MEDIA_BUCKET).list(`${weddingId}/${folder.name}`, { limit: 1000 });
      paths.push(...(files ?? []).map((f) => `${weddingId}/${folder.name}/${f.name}`));
    }
    if (paths.length) await db.storage.from(MEDIA_BUCKET).remove(paths);
    return paths.length;
  };

  // The public demo never ages.
  const DEMO = "demo";

  const summary = { readOnly: 0, archiveNotices: 0, archived: 0, draftNotices: 0, draftsDeleted: 0, errors: 0 };

  // 1. Past the event: replies close and the dashboard stops saving changes.
  const { data: past } = await db
    .from("weddings")
    .update({ status: "read_only", read_only_at: now.toISOString() })
    .eq("status", "active")
    .neq("slug", DEMO)
    .lte("event_starts_at", cut.readOnly.toISOString())
    .select("slug");
  summary.readOnly = past?.length ?? 0;

  // 2. Thirty days before archiving: one warning.
  const { data: soonArchived } = await db
    .from("weddings")
    .select("id, status, event_starts_at, created_at, published_at")
    .in("status", ["active", "read_only"])
    .neq("slug", DEMO)
    .lte("event_starts_at", cut.archiveNotice.toISOString())
    .gt("event_starts_at", cut.archive.toISOString())
    .is("archive_notified_at", null);
  for (const w of soonArchived ?? []) {
    await notifyCouple(w.id, {
      kind: "lifecycle",
      title: "📦 Su boda se archivará pronto",
      body: `El ${longDate(lifecycleDates(w).archiveAt)} la invitación dejará de verse y se borrarán fotos y música. Descarguen lo que quieran conservar.`,
    }).catch(() => 0);
    await db.from("weddings").update({ archive_notified_at: now.toISOString() }).eq("id", w.id);
    summary.archiveNotices++;
  }

  // 3. Twelve months after the event: take the invitation down and free its files.
  const { data: toArchive } = await db
    .from("weddings")
    .select("id, slug")
    .in("status", ["active", "read_only"])
    .neq("slug", DEMO)
    .lte("event_starts_at", cut.archive.toISOString());
  for (const w of toArchive ?? []) {
    try {
      await removeFiles(w.id);
      await db.from("media").delete().eq("wedding_id", w.id);
      await db
        .from("weddings")
        .update({ status: "archived", archived_at: now.toISOString(), is_published: false })
        .eq("id", w.id);
      revalidateTag(invitationTag(w.slug), "max");
      summary.archived++;
    } catch (error) {
      console.error("lifecycle archive", w.id, error);
      summary.errors++;
    }
  }

  // 4. A week before deleting a draft that was never published: one warning.
  const { data: oldDrafts } = await db
    .from("weddings")
    .select("id, status, event_starts_at, created_at, published_at")
    .eq("status", "draft")
    .is("published_at", null)
    .lte("created_at", cut.draftNotice.toISOString())
    .gt("created_at", cut.draftDelete.toISOString())
    .is("draft_notified_at", null);
  for (const w of oldDrafts ?? []) {
    await notifyCouple(w.id, {
      kind: "lifecycle",
      title: "⏳ Su borrador se borrará pronto",
      body: `Si no publican su invitación, se borrará el ${longDate(lifecycleDates(w).draftDeleteAt)}.`,
    }).catch(() => 0);
    await db.from("weddings").update({ draft_notified_at: now.toISOString() }).eq("id", w.id);
    summary.draftNotices++;
  }

  // 5. Drafts never published, 30 days old: deleted with their files.
  const { data: expired } = await db
    .from("weddings")
    .select("id")
    .eq("status", "draft")
    .is("published_at", null)
    .lte("created_at", cut.draftDelete.toISOString());
  for (const w of expired ?? []) {
    try {
      await removeFiles(w.id);
      await db.from("weddings").delete().eq("id", w.id);
      summary.draftsDeleted++;
    } catch (error) {
      console.error("lifecycle draft", w.id, error);
      summary.errors++;
    }
  }

  return Response.json({ ok: summary.errors === 0, ...summary });
}
