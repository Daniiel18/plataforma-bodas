"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminContext, READ_ONLY_RESULT } from "@/lib/admin";
import { refreshInvitation } from "@/lib/admin-invitation";
import type { ActionResult } from "@/lib/types";

export async function setWishRead(wishId: string, isRead: boolean): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  if (!z.uuid().safeParse(wishId).success) return { ok: false, error: "Deseo no válido" };

  const { error } = await supabase
    .from("wishes")
    .update({ is_read: isRead })
    .eq("id", wishId)
    .eq("wedding_id", wedding.id);
  if (error) return { ok: false, error: "No se pudo actualizar" };

  revalidatePath("/panel", "layout");
  return { ok: true };
}

/** Shows a wish on the invitation's guestbook (when it is public) or takes it back. */
export async function setWishApproved(wishId: string, approved: boolean): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  if (!z.uuid().safeParse(wishId).success) return { ok: false, error: "Deseo no válido" };

  const { error } = await supabase
    .from("wishes")
    .update({ approved_at: approved ? new Date().toISOString() : null, is_read: true })
    .eq("id", wishId)
    .eq("wedding_id", wedding.id);
  if (error) return { ok: false, error: "No se pudo actualizar" };

  refreshInvitation(wedding.slug);
  revalidatePath("/panel", "layout");
  return {
    ok: true,
    message: approved
      ? wedding.guestbook_public
        ? "Deseo visible en la invitación"
        : "Deseo aprobado. Se verá cuando activen «Mostrar deseos en la invitación» en Ajustes."
      : "Deseo retirado de la invitación",
  };
}

export async function markAllWishesRead(): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  const { error } = await supabase
    .from("wishes")
    .update({ is_read: true })
    .eq("wedding_id", wedding.id)
    .eq("is_read", false);
  if (error) return { ok: false, error: "No se pudo actualizar" };

  revalidatePath("/panel", "layout");
  return { ok: true, message: "Todos los deseos marcados como leídos" };
}
