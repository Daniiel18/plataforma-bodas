import { z } from "zod";

import { BACKGROUNDS, DEFAULT_VEIL, PHOTO_VEILS, TEXT_CONTRASTS } from "./backgrounds";
import { ACCENTS, TEMPLATES } from "./templates";

/** Template and page look the couple chooses (dashboard and builder). */
export const appearanceSchema = z.object({
  template: z.enum(TEMPLATES.map((t) => t.key)),
  accent: z.enum(ACCENTS.map((a) => a.value)).nullable(),
  /** null = the template's recommended background. */
  background: z.enum(BACKGROUNDS.map((b) => b.key)).nullable(),
  veil: z.enum(PHOTO_VEILS.map((v) => v.key)),
  contrast: z.enum(TEXT_CONTRASTS.map((c) => c.key)).default("auto"),
});

export type AppearanceInput = z.input<typeof appearanceSchema>;

/** weddings.theme_overrides: only the choices that differ from the template's defaults. */
export function toThemeOverrides(
  { accent, background, veil, contrast }: z.output<typeof appearanceSchema>,
  existing: Record<string, unknown> | null = null,
): Record<string, unknown> {
  const overrides: Record<string, unknown> = { ...(existing ?? {}) };
  delete overrides.accent;
  delete overrides.background;
  delete overrides.veil;
  delete overrides.contrast;
  if (accent) overrides.accent = accent;
  if (contrast !== "auto") overrides.contrast = contrast;
  if (background) overrides.background = background;
  if (veil !== DEFAULT_VEIL) overrides.veil = veil;
  return overrides;
}
