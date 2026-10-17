import { z } from "zod";

/**
 * How a photo sits in its frame (cover polaroid, gallery card, page background).
 *
 * `x` and `y` are the point of the photo (0–1 of its width and height) shown at
 * the frame's center; `zoom` is relative to filling the frame: 1 fills it, less
 * shows more of the photo (down to all of it, over a blurred copy) and more
 * zooms in. Being relative, the same framing adapts to frames of another shape
 * (a gallery style change, a phone or a computer screen).
 */
export type PhotoCrop = { x: number; y: number; zoom: number };

export const MAX_ZOOM = 3;
export const CENTERED: PhotoCrop = { x: 0.5, y: 0.5, zoom: 1 };

export const photoCropSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  zoom: z.number().min(0.05).max(MAX_ZOOM),
});

/** Shapes (width / height) of the frames photos are shown in. */
export const FRAME = {
  cover: 4 / 5,
  card: 4 / 5,
  square: 1,
  ring: 1 / 1.3,
  /** A phone held upright: most guests open the invitation on one. */
  background: 9 / 19.5,
} as const;

/** Frame of the gallery photos in each carousel style. */
export function galleryFrame(style: string): number {
  if (style === "ring") return FRAME.ring;
  if (style === "cube" || style === "flip") return FRAME.square;
  return FRAME.card;
}

/** Width / height of a photo, or a portrait default when its size is unknown. */
export function photoAspect(photo: { width: number | null; height: number | null }): number {
  return photo.width && photo.height ? photo.width / photo.height : 3 / 4;
}

/** Zoom that shows the whole photo inside the frame. */
export function fitZoom(photoRatio: number, frameRatio: number): number {
  const r = photoRatio / frameRatio;
  return Math.min(r, 1 / r);
}

/** Where the photo goes, in fractions of the frame (left/width of its width, top/height of its height). */
export type Placement = { left: number; top: number; width: number; height: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const EPSILON = 1e-6;

/**
 * Places a photo in a frame. The zoom is kept between "whole photo" (or
 * `minZoom`, e.g. 1 for backgrounds that must fill the screen) and MAX_ZOOM, and
 * the photo never leaves a gap when it is larger than the frame. Returns the
 * framing actually used, so editors can store it.
 */
export function placePhoto(
  photoRatio: number,
  frameRatio: number,
  crop: PhotoCrop | null | undefined,
  minZoom = 0,
): Placement & { crop: PhotoCrop; fills: boolean } {
  const { x, y, zoom } = crop ?? CENTERED;
  const r = photoRatio / frameRatio;
  const z = clamp(zoom, Math.max(fitZoom(photoRatio, frameRatio), minZoom), MAX_ZOOM);
  const width = Math.max(1, r) * z;
  const height = width / r;
  const left = width > 1 + EPSILON ? clamp(0.5 - x * width, 1 - width, 0) : (1 - width) / 2;
  const top = height > 1 + EPSILON ? clamp(0.5 - y * height, 1 - height, 0) : (1 - height) / 2;
  return {
    left,
    top,
    width,
    height,
    crop: { x: clamp((0.5 - left) / width, 0, 1), y: clamp((0.5 - top) / height, 0, 1), zoom: z },
    fills: width >= 1 - EPSILON && height >= 1 - EPSILON,
  };
}

/** A framing worth storing (null when it is the default one). */
export function storableCrop(crop: PhotoCrop): PhotoCrop | null {
  const round = (v: number) => Math.round(v * 1000) / 1000;
  const value = { x: round(crop.x), y: round(crop.y), zoom: round(crop.zoom) };
  return value.x === 0.5 && value.y === 0.5 && value.zoom === 1 ? null : value;
}

/** Reads a stored framing, ignoring anything malformed. */
export function parseCrop(value: unknown): PhotoCrop | null {
  const parsed = photoCropSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
