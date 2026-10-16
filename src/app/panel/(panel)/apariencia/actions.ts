"use server";

import { getAdminContext, READ_ONLY_RESULT } from "@/lib/admin";
import { refreshInvitation } from "@/lib/admin-invitation";
import { appearanceSchema, toThemeOverrides, type AppearanceInput } from "@/lib/appearance";
import type { ActionResult } from "@/lib/types";

export async function saveAppearance(input: AppearanceInput): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  const parsed = appearanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Apariencia no válida" };
  const { error } = await supabase
    .from("weddings")
    .update({
      template_key: parsed.data.template,
      theme_overrides: toThemeOverrides(parsed.data, wedding.theme_overrides as Record<string, unknown> | null),
    })
    .eq("id", wedding.id);
  if (error) return { ok: false, error: "No se pudo guardar la apariencia" };

  refreshInvitation(wedding.slug);
  return { ok: true, message: "Apariencia guardada" };
}
