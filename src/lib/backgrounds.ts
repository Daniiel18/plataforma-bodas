import type { MediaImage } from "./media";
import { CENTERED, photoAspect } from "./photo-crop";

/**
 * Page backgrounds. They are independent of the template: each one is painted
 * with the chosen template's colors (see `[data-bg]` in invitation.css), so
 * every combination stays harmonious.
 */
export const BACKGROUNDS = [
  { key: "liso", name: "Liso", description: "Solo el color de la plantilla." },
  { key: "papel", name: "Papel de algodón", description: "Textura de papel fino con luz suave." },
  { key: "lino", name: "Lino", description: "Trama de tela natural." },
  { key: "seda", name: "Seda satinada", description: "Brillos diagonales, como el satén." },
  { key: "acuarela", name: "Acuarela", description: "Manchas de color difuminadas." },
  { key: "marmol", name: "Mármol", description: "Vetas delicadas sobre crema." },
  { key: "destellos", name: "Destellos", description: "Luces doradas desenfocadas." },
  { key: "damasco", name: "Damasco", description: "Estampado clásico de salón." },
  { key: "encaje", name: "Encaje", description: "Festones y calados de encaje." },
  { key: "art-deco", name: "Art déco", description: "Abanicos geométricos." },
  { key: "botanico", name: "Botánico", description: "Ramitas de hojas repartidas." },
  { key: "lunares", name: "Lunares", description: "Puntitos discretos." },
  { key: "rayas", name: "Rayas finas", description: "Líneas verticales muy sutiles." },
  { key: "foto", name: "Tu foto", description: "Una foto tuya, con un velo para que se lea todo." },
] as const;

export type BackgroundKey = (typeof BACKGROUNDS)[number]["key"];

/** How visible the background photo is (the rest is a veil in the template's color). */
export const PHOTO_VEILS = [
  { key: "visible", label: "Se ve más", strength: "64%" },
  { key: "medio", label: "Equilibrado", strength: "80%" },
  { key: "sutil", label: "Sutil", strength: "90%" },
] as const;

export type PhotoVeil = (typeof PHOTO_VEILS)[number]["key"];

export const DEFAULT_VEIL: PhotoVeil = "medio";

export function isBackgroundKey(value: unknown): value is BackgroundKey {
  return BACKGROUNDS.some((b) => b.key === value);
}

/** Background chosen by the couple in `theme_overrides`, or null for the template's. */
export function chosenBackground(overrides: unknown): BackgroundKey | null {
  const value = (overrides as { background?: unknown } | null)?.background;
  return isBackgroundKey(value) ? value : null;
}

export function resolveVeil(overrides: unknown): PhotoVeil {
  const value = (overrides as { veil?: unknown } | null)?.veil;
  return PHOTO_VEILS.some((v) => v.key === value) ? (value as PhotoVeil) : DEFAULT_VEIL;
}

/**
 * Background to paint: the chosen one or the template's. "Tu foto" without an
 * uploaded photo falls back to the template's.
 */
export function resolveBackground(
  overrides: unknown,
  templateBackground: BackgroundKey,
  hasPhoto: boolean,
): BackgroundKey {
  const chosen = chosenBackground(overrides) ?? templateBackground;
  return chosen === "foto" && !hasPhoto ? templateBackground : chosen;
}

export function veilStrength(veil: PhotoVeil): string {
  return PHOTO_VEILS.find((v) => v.key === veil)?.strength ?? "80%";
}

/**
 * CSS variables that paint "Tu foto" behind the invitation, framed as the
 * couple adjusted it (see `.inv-backdrop::before` in invitation.css). A
 * background always fills the screen, so it never zooms out below 1.
 */
export function photoBackdropStyle(photo: MediaImage | null | undefined, veil: PhotoVeil): Record<string, string> {
  if (!photo) return {};
  const crop = photo.crop ?? CENTERED;
  return {
    "--inv-bg-photo": `url("${photo.url}")`,
    "--inv-veil": veilStrength(veil),
    "--inv-photo-ratio": photoAspect(photo).toFixed(4),
    "--inv-photo-x": crop.x.toFixed(4),
    "--inv-photo-y": crop.y.toFixed(4),
    "--inv-photo-zoom": Math.max(1, crop.zoom).toFixed(4),
  };
}
