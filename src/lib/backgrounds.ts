/**
 * Fondos de la página. Son independientes de la plantilla: cada uno se pinta con
 * los colores de la plantilla elegida (ver `[data-bg]` en invitation.css), así
 * que cualquier combinación queda armónica.
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

/** Qué tanto se ve la foto de fondo (el resto es un velo del color de la plantilla). */
export const PHOTO_VEILS = [
  { key: "visible", label: "Se ve más", strength: "55%" },
  { key: "medio", label: "Equilibrado", strength: "72%" },
  { key: "sutil", label: "Sutil", strength: "86%" },
] as const;

export type PhotoVeil = (typeof PHOTO_VEILS)[number]["key"];

export const DEFAULT_VEIL: PhotoVeil = "medio";

export function isBackgroundKey(value: unknown): value is BackgroundKey {
  return BACKGROUNDS.some((b) => b.key === value);
}

/** Fondo elegido por la novia en `theme_overrides`, o null si usa el de la plantilla. */
export function chosenBackground(overrides: unknown): BackgroundKey | null {
  const value = (overrides as { background?: unknown } | null)?.background;
  return isBackgroundKey(value) ? value : null;
}

export function resolveVeil(overrides: unknown): PhotoVeil {
  const value = (overrides as { veil?: unknown } | null)?.veil;
  return PHOTO_VEILS.some((v) => v.key === value) ? (value as PhotoVeil) : DEFAULT_VEIL;
}

/**
 * Fondo que se pinta: el elegido o el de la plantilla. "Tu foto" sin foto
 * subida vuelve al de la plantilla.
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
  return PHOTO_VEILS.find((v) => v.key === veil)?.strength ?? "72%";
}
