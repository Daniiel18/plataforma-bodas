"use server";

import { z } from "zod";

import { getAdminContext, READ_ONLY_RESULT } from "@/lib/admin";
import { refreshInvitation } from "@/lib/admin-invitation";
import { MAX_UPLOAD_BYTES, MEDIA_BUCKET, MEDIA_LIMITS, type MediaKind } from "@/lib/media";
import { translateEsToEn } from "@/lib/translate";
import type { ActionResult } from "@/lib/types";

const MIME_BY_KIND: Record<MediaKind, RegExp> = {
  gallery: /^image\/(webp|jpeg|png)$/,
  cover: /^image\/(webp|jpeg|png)$/,
  qr: /^image\/(png|jpeg|webp)$/,
  audio: /^audio\/(mpeg|mp4|aac|ogg|x-m4a)$/,
};

const registerSchema = z.object({
  kind: z.enum(["gallery", "cover", "audio", "qr"]),
  path: z.string().min(10).max(300),
  mime: z.string().max(60),
  size: z.number().int().positive(),
  width: z.number().int().positive().max(10000).nullable(),
  height: z.number().int().positive().max(10000).nullable(),
  duration: z.number().positive().max(3600).nullable(),
});

export type RegisteredMedia = { id: string; storage_path: string; width: number | null; height: number | null };

/**
 * Registra un archivo que el navegador ya subió a Storage. Para portada,
 * canción y QR reemplaza el anterior (y lo borra del almacenamiento).
 */
export async function registerMedia(
  input: z.input<typeof registerSchema>,
): Promise<ActionResult & { media?: RegisteredMedia }> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos del archivo no válidos" };
  const m = parsed.data;

  const removeUpload = () => supabase.storage.from(MEDIA_BUCKET).remove([m.path]);

  if (!m.path.startsWith(`${wedding.id}/${m.kind}/`) || m.path.includes("..")) {
    await removeUpload();
    return { ok: false, error: "Ruta de archivo no válida" };
  }
  if (!MIME_BY_KIND[m.kind].test(m.mime) || m.size > MAX_UPLOAD_BYTES[m.kind]) {
    await removeUpload();
    return { ok: false, error: "Tipo o tamaño de archivo no permitido" };
  }

  if (MEDIA_LIMITS[m.kind] === 1) {
    const { data: previous } = await supabase
      .from("media")
      .select("id, storage_path")
      .eq("wedding_id", wedding.id)
      .eq("kind", m.kind);
    if (previous?.length) {
      await supabase
        .from("media")
        .delete()
        .in(
          "id",
          previous.map((p) => p.id),
        );
      await supabase.storage.from(MEDIA_BUCKET).remove(previous.map((p) => p.storage_path));
    }
  }

  const { count } = await supabase
    .from("media")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", wedding.id)
    .eq("kind", m.kind);

  const { data: media, error } = await supabase
    .from("media")
    .insert({
      wedding_id: wedding.id,
      kind: m.kind,
      storage_path: m.path,
      mime_type: m.mime,
      size_bytes: m.size,
      width: m.width,
      height: m.height,
      duration_seconds: m.duration,
      position: count ?? 0,
    })
    .select("id, storage_path, width, height")
    .single<RegisteredMedia>();

  if (error || !media) {
    await removeUpload();
    const limit = error?.message.includes("Límite");
    return {
      ok: false,
      error: limit ? `Ya tienes el máximo de ${MEDIA_LIMITS[m.kind]} fotos` : "No se pudo guardar el archivo",
    };
  }

  if (m.kind === "qr") {
    await supabase
      .from("gift_methods")
      .update({ qr_media_id: media.id })
      .eq("wedding_id", wedding.id)
      .eq("type", "zelle");
  }

  refreshInvitation(wedding.slug);
  return { ok: true, media };
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Archivo no válido" };

  const { data: media, error } = await supabase
    .from("media")
    .delete()
    .eq("id", id)
    .eq("wedding_id", wedding.id)
    .select("storage_path")
    .single();
  if (error || !media) return { ok: false, error: "No se pudo borrar" };

  await supabase.storage.from(MEDIA_BUCKET).remove([media.storage_path]);
  refreshInvitation(wedding.slug);
  return { ok: true, message: "Archivo eliminado" };
}

export async function reorderGallery(ids: string[]): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  const parsed = z.array(z.uuid()).max(MEDIA_LIMITS.gallery).safeParse(ids);
  if (!parsed.success) return { ok: false, error: "Orden no válido" };

  const results = await Promise.all(
    parsed.data.map((id, position) =>
      supabase.from("media").update({ position }).eq("id", id).eq("wedding_id", wedding.id).eq("kind", "gallery"),
    ),
  );
  if (results.some((r) => r.error)) return { ok: false, error: "No se pudo guardar el orden" };

  refreshInvitation(wedding.slug);
  return { ok: true };
}

export async function updateCaption(id: string, caption: string): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Foto no válida" };
  const text = z.string().trim().max(140, "Máximo 140 caracteres").safeParse(caption);
  if (!text.success) return { ok: false, error: text.error.issues[0].message };

  const [english] = text.data ? await translateEsToEn([text.data]) : [null];
  const { error } = await supabase
    .from("media")
    .update({ caption: text.data || null, caption_en: english })
    .eq("id", id)
    .eq("wedding_id", wedding.id);
  if (error) return { ok: false, error: "No se pudo guardar el texto" };

  refreshInvitation(wedding.slug);
  return { ok: true, message: text.data ? "Texto de la foto guardado" : "Texto eliminado" };
}
