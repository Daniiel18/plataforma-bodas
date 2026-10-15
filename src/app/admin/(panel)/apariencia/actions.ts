"use server";

import { z } from "zod";

import { getAdminContext, READ_ONLY_RESULT } from "@/lib/admin";
import { refreshInvitation } from "@/lib/admin-invitation";
import { BACKGROUNDS, DEFAULT_VEIL, PHOTO_VEILS } from "@/lib/backgrounds";
import { ACCENTS, TEMPLATES } from "@/lib/templates";
import type { ActionResult } from "@/lib/types";

const appearanceSchema = z.object({
  template: z.enum(TEMPLATES.map((t) => t.key)),
  accent: z.enum(ACCENTS.map((a) => a.value)).nullable(),
  /** null = the template's recommended background. */
  background: z.enum(BACKGROUNDS.map((b) => b.key)).nullable(),
  veil: z.enum(PHOTO_VEILS.map((v) => v.key)),
});

export type AppearanceInput = z.input<typeof appearanceSchema>;

export async function saveAppearance(input: AppearanceInput): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  const parsed = appearanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Apariencia no válida" };
  const { template, accent, background, veil } = parsed.data;

  // Only choices that differ from the template's defaults are stored.
  const overrides: Record<string, unknown> = { ...(wedding.theme_overrides ?? {}) };
  delete overrides.accent;
  delete overrides.background;
  delete overrides.veil;
  if (accent) overrides.accent = accent;
  if (background) overrides.background = background;
  if (veil !== DEFAULT_VEIL) overrides.veil = veil;

  const { error } = await supabase
    .from("weddings")
    .update({ template_key: template, theme_overrides: overrides })
    .eq("id", wedding.id);
  if (error) return { ok: false, error: "No se pudo guardar la apariencia" };

  refreshInvitation(wedding.slug);
  return { ok: true, message: "Apariencia guardada" };
}
