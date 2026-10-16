import { MAX_UPLOAD_BYTES, type MediaKind } from "@/lib/media";

/**
 * Prepares files in the browser before they are stored: photos are resized
 * and compressed (WebP, or JPEG where WebP cannot be encoded) and QR codes
 * kept as sharp PNG. Shared by the dashboard uploads and the builder.
 */

const MAX_SIDE: Record<Exclude<MediaKind, "audio">, number> = {
  gallery: 2000,
  cover: 1600,
  qr: 1200,
  background: 2000,
};
const AUDIO_TYPES = /^audio\/(mpeg|mp4|aac|ogg|x-m4a)$/;

export type Prepared = {
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

/** Resizes and compresses the photo in the browser before uploading it. */
export async function prepareImage(file: File, kind: Exclude<MediaKind, "audio">): Promise<Prepared> {
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

  // The QR is stored as PNG so it stays sharp and scannable.
  if (kind === "qr") {
    const blob = await canvasToBlob(canvas, "image/png");
    if (!blob) throw new Error("No se pudo procesar la imagen.");
    return { blob, ext: "png", mime: "image/png", width, height, duration: null };
  }

  // WebP when the browser can encode it (Safari on iPhone cannot); otherwise JPEG.
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

export async function prepareAudio(file: File): Promise<Prepared> {
  const mime = file.type || "audio/mpeg";
  if (!AUDIO_TYPES.test(mime)) throw new Error("Elige una canción en formato MP3 o M4A.");
  if (file.size > MAX_UPLOAD_BYTES.audio)
    throw new Error("La canción pesa más de 15 MB. Usa una versión MP3 más ligera.");
  const ext = mime === "audio/mpeg" ? "mp3" : mime === "audio/ogg" ? "ogg" : "m4a";
  return { blob: file, ext, mime, width: null, height: null, duration: await readDuration(file) };
}
