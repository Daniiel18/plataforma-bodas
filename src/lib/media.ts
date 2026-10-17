import { parseCrop, type PhotoCrop } from "./photo-crop";

export const MEDIA_BUCKET = "wedding-media";

export type MediaKind = "gallery" | "cover" | "audio" | "qr" | "background";

export const MEDIA_LIMITS: Record<MediaKind, number> = { gallery: 30, cover: 1, audio: 1, qr: 1, background: 1 };

/** Maximum size of the processed file (the bucket accepts up to 15 MB). */
export const MAX_UPLOAD_BYTES: Record<MediaKind, number> = {
  gallery: 5 * 1024 * 1024,
  cover: 5 * 1024 * 1024,
  qr: 2 * 1024 * 1024,
  background: 5 * 1024 * 1024,
  audio: 15 * 1024 * 1024,
};

export function publicMediaUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

/** A photo ready to show; `crop` is how the couple framed it (centered when absent). */
export type MediaImage = { url: string; width: number; height: number; crop?: PhotoCrop | null };

/** A stored or local photo with its size (a portrait default when unknown) and framing. */
export function mediaImage(
  url: string,
  media: { width: number | null; height: number | null; crop?: unknown },
): MediaImage {
  return { url, width: media.width ?? 1200, height: media.height ?? 1600, crop: parseCrop(media.crop) };
}
