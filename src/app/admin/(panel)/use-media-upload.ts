"use client";

import { useState } from "react";

import { MAX_UPLOAD_BYTES, MEDIA_BUCKET, type MediaKind } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";

import { registerMedia, type RegisteredMedia } from "./media-actions";

const MAX_SIDE: Record<Exclude<MediaKind, "audio">, number> = {
  gallery: 2000,
  cover: 1600,
  qr: 1200,
  background: 2000,
};
const AUDIO_TYPES = /^audio\/(mpeg|mp4|aac|ogg|x-m4a)$/;

type Prepared = {
  blob: Blob;
  ext: string;
  mime: string;
  width: number | null;
  height: number | null;
  duration: number | null;
};

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function decode(file: File) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(file);
  }
}

/** Reduce y comprime la foto en el navegador antes de subirla. */
async function prepareImage(file: File, kind: Exclude<MediaKind, "audio">): Promise<Prepared> {
  if (!file.type.startsWith("image/")) throw new Error("Elige un archivo de imagen (JPG, PNG o WebP).");
  let bitmap: ImageBitmap;
  try {
    bitmap = await decode(file);
  } catch {
    throw new Error("No se pudo leer la imagen. Usa una foto JPG o PNG.");
  }

  const scale = Math.min(1, MAX_SIDE[kind] / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // El QR se guarda en PNG para que siga siendo nítido y escaneable.
  if (kind === "qr") {
    const blob = await canvasToBlob(canvas, "image/png");
    if (!blob) throw new Error("No se pudo procesar la imagen.");
    return { blob, ext: "png", mime: "image/png", width, height, duration: null };
  }

  // WebP si el navegador sabe generarlo (Safari en iPhone no): si no, JPEG.
  let blob = await canvasToBlob(canvas, "image/webp", 0.82);
  if (!blob || blob.type !== "image/webp") blob = await canvasToBlob(canvas, "image/jpeg", 0.85);
  if (!blob) throw new Error("No se pudo procesar la imagen.");
  const isWebp = blob.type === "image/webp";
  return { blob, ext: isWebp ? "webp" : "jpg", mime: blob.type, width, height, duration: null };
}

function readDuration(file: File) {
  return new Promise<number | null>((resolve) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration * 100) / 100 : null);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    audio.src = url;
  });
}

async function prepareAudio(file: File): Promise<Prepared> {
  const mime = file.type || "audio/mpeg";
  if (!AUDIO_TYPES.test(mime)) throw new Error("Elige una canción en formato MP3 o M4A.");
  if (file.size > MAX_UPLOAD_BYTES.audio)
    throw new Error("La canción pesa más de 15 MB. Usa una versión MP3 más ligera.");
  const ext = mime === "audio/mpeg" ? "mp3" : mime === "audio/ogg" ? "ogg" : "m4a";
  return { blob: file, ext, mime, width: null, height: null, duration: await readDuration(file) };
}

/** Sube un archivo directo a Storage (sin pasar por el servidor) y lo registra. */
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

  /** Sube uno o varios archivos en orden; devuelve cuántos se subieron y el primer error. */
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
