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

type Decoded = { image: CanvasImageSource; width: number; height: number; release: () => void };

/**
 * Reads the photo. createImageBitmap is fast but some phones fail on very
 * large photos (48 MP) or HEIC; an <img> decodes whatever the browser can
 * show, so it is the fallback.
 */
async function decode(file: File): Promise<Decoded> {
  for (const options of [{ imageOrientation: "from-image" } as ImageBitmapOptions, undefined]) {
    try {
      const bitmap = await createImageBitmap(file, options);
      return { image: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Try the next way.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { image: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

const IMAGE_NAME = /\.(jpe?g|png|webp|heic|heif|avif|gif)$/i;

/** Resizes and compresses the photo in the browser before uploading it. */
export async function prepareImage(file: File, kind: Exclude<MediaKind, "audio">): Promise<Prepared> {
  // Some phones hand over HEIC photos without a type: trust the extension then.
  if (!file.type.startsWith("image/") && !IMAGE_NAME.test(file.name)) {
    throw new Error("Elige un archivo de imagen (JPG, PNG o WebP).");
  }
  let source: Decoded;
  try {
    source = await decode(file);
  } catch {
    throw new Error("No se pudo leer esta foto. Prueba con otra o haz una captura de pantalla de ella y súbela.");
  }

  const scale = Math.min(1, MAX_SIDE[kind] / Math.max(source.width, source.height));
  const width = Math.round(source.width * scale);
  const height = Math.round(source.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(source.image, 0, 0, width, height);
  source.release();

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
