"use server";

import { getAdminContext, READ_ONLY_RESULT } from "@/lib/admin";
import { refreshInvitation } from "@/lib/admin-invitation";
import { ACCENTS, TEMPLATES } from "@/lib/templates";
import type { ActionResult } from "@/lib/types";

export async function saveAppearance(templateKey: string, accent: string | null): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  if (!TEMPLATES.some((t) => t.key === templateKey)) return { ok: false, error: "Plantilla no válida" };
  if (accent !== null && !ACCENTS.some((a) => a.value === accent)) return { ok: false, error: "Color no válido" };

  const overrides = { ...(wedding.theme_overrides ?? {}), accent };
  if (accent === null) delete (overrides as { accent?: string | null }).accent;

  const { error } = await supabase
    .from("weddings")
    .update({ template_key: templateKey, theme_overrides: overrides })
    .eq("id", wedding.id);
  if (error) return { ok: false, error: "No se pudo guardar la apariencia" };

  refreshInvitation(wedding.slug);
  return { ok: true, message: "Apariencia guardada" };
}
