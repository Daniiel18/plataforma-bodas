"use client";

import { useState } from "react";

import { MAX_UPLOAD_BYTES, MEDIA_BUCKET, type MediaKind } from "@/lib/media";
import { prepareAudio, prepareImage } from "@/lib/media-prepare";
import { createClient } from "@/lib/supabase/client";

import { registerMedia, type RegisteredMedia } from "./media-actions";

/** Uploads a file straight to Storage (bypassing the server) and registers it. */
export function useMediaUpload(weddingId: string) {
  const [busy, setBusy] = useState(false);

  async function upload(file: File, kind: MediaKind): Promise<RegisteredMedia> {
    const prepared = kind === "audio" ? await prepareAudio(file) : await prepareImage(file, kind);
    if (prepared.blob.size > MAX_UPLOAD_BYTES[kind]) throw new Error("El archivo es demasiado grande.");

    const path = `${weddingId}/${kind}/${crypto.randomUUID()}.${prepared.ext}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, prepared.blob, {
      contentType: prepared.mime,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) {
      const denied = /row-level security|unauthorized|403/i.test(
        `${error.message} ${"statusCode" in error ? error.statusCode : ""}`,
      );
      throw new Error(
        denied
          ? "Modo demo: puedes explorar todo, pero los cambios no se guardan."
          : "No se pudo subir el archivo. Revisa tu conexión e inténtalo de nuevo.",
      );
    }

    const result = await registerMedia({
      kind,
      path,
      mime: prepared.mime,
      size: prepared.blob.size,
      width: prepared.width,
      height: prepared.height,
      duration: prepared.duration,
    });
    if (!result.ok || !result.media) throw new Error(result.ok ? "No se pudo guardar el archivo" : result.error);
    return result.media;
  }

  /** Uploads one or more files in order; returns how many were uploaded and the first error. */
  async function uploadMany(files: File[], kind: MediaKind, onEach?: (media: RegisteredMedia) => void) {
    setBusy(true);
    let uploaded = 0;
    let firstError: string | null = null;
    try {
      for (const file of files) {
        try {
          const media = await upload(file, kind);
          uploaded++;
          onEach?.(media);
        } catch (error) {
          firstError ??= error instanceof Error ? error.message : "Error al subir";
          if (firstError.includes("máximo")) break;
        }
      }
    } finally {
      setBusy(false);
    }
    return { uploaded, error: firstError };
  }

  return { busy, uploadMany };
}
