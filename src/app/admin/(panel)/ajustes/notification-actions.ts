"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminContext, READ_ONLY_RESULT } from "@/lib/admin";
import { notifyCouple } from "@/lib/notify";
import type { ActionResult } from "@/lib/types";

const subscriptionSchema = z.object({
  endpoint: z.url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
  label: z.string().max(40),
});

/** Guarda este dispositivo para recibir avisos de la boda. */
export async function savePushSubscription(input: z.input<typeof subscriptionSchema>): Promise<ActionResult> {
  const { supabase, wedding, userId, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Suscripción no válida" };
  const s = parsed.data;

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      wedding_id: wedding.id,
      user_id: userId,
      endpoint: s.endpoint,
      p256dh: s.keys.p256dh,
      auth: s.keys.auth,
      device_label: s.label,
    },
    { onConflict: "endpoint" },
  );
  if (error) return { ok: false, error: "No se pudo activar en este dispositivo" };

  revalidatePath("/admin/ajustes");
  return { ok: true, message: "Avisos activados en este dispositivo" };
}

export async function removePushSubscription(endpoint: string): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("wedding_id", wedding.id)
    .eq("endpoint", endpoint);
  if (error) return { ok: false, error: "No se pudo desactivar" };

  revalidatePath("/admin/ajustes");
  return { ok: true, message: "Avisos desactivados en este dispositivo" };
}

export async function sendTestPush(): Promise<ActionResult> {
  const { wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  const delivered = await notifyCouple(wedding.id, { kind: "test" });
  return delivered
    ? { ok: true, message: `Aviso de prueba enviado a ${delivered} dispositivo(s)` }
    : { ok: false, error: "No hay dispositivos activos. Activa los avisos primero." };
}
