"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { invitationTag } from "@/lib/invitation";
import { lifecycleCutoffs } from "@/lib/lifecycle";
import { notifyCouple, notifyPlatform } from "@/lib/notify";
import { MEDIA_BUCKET } from "@/lib/media";
import { auditPlatform, getPlatformAdmin, PROTECTED_SLUGS } from "@/lib/platform-admin";
import type { ActionResult } from "@/lib/types";

const reasonSchema = z.string().trim().min(3, "Escribe el motivo").max(300, "Máximo 300 caracteres");

/** Hides a wedding (abuse). Reversible; the reason stays in the audit log. */
export async function suspendWedding(weddingId: string, reason: string): Promise<ActionResult> {
  const { db, userId } = await getPlatformAdmin();
  if (!z.uuid().safeParse(weddingId).success) return { ok: false, error: "Boda no válida" };
  const why = reasonSchema.safeParse(reason);
  if (!why.success) return { ok: false, error: why.error.issues[0].message };

  const { data: wedding, error } = await db
    .from("weddings")
    .update({ status: "suspended", suspension_reason: why.data })
    .eq("id", weddingId)
    .neq("status", "suspended")
    .not("slug", "in", `(${[...PROTECTED_SLUGS].join(",")})`)
    .select("slug, status")
    .single();
  if (error || !wedding) return { ok: false, error: "No se pudo suspender" };

  await auditPlatform(userId, "wedding.suspended", "wedding", weddingId, { reason: why.data });
  await notifyCouple(weddingId, {
    kind: "lifecycle",
    title: "Su invitación fue suspendida",
    body: "Escríbannos a lazosdeooroo@gmail.com si creen que es un error.",
  }).catch(() => 0);
  revalidateTag(invitationTag(wedding.slug), "max");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Boda suspendida" };
}

/** Lifts a suspension: back to where its lifecycle says it should be. */
export async function reactivateWedding(weddingId: string): Promise<ActionResult> {
  const { db, userId } = await getPlatformAdmin();
  if (!z.uuid().safeParse(weddingId).success) return { ok: false, error: "Boda no válida" };

  const { data: current } = await db
    .from("weddings")
    .select("slug, published_at, event_starts_at")
    .eq("id", weddingId)
    .eq("status", "suspended")
    .maybeSingle();
  if (!current) return { ok: false, error: "Esa boda no está suspendida" };

  const past = current.event_starts_at && new Date(current.event_starts_at) <= lifecycleCutoffs(new Date()).readOnly;
  const status = !current.published_at ? "draft" : past ? "read_only" : "active";
  const { error } = await db.from("weddings").update({ status, suspension_reason: null }).eq("id", weddingId);
  if (error) return { ok: false, error: "No se pudo reactivar" };

  await auditPlatform(userId, "wedding.reactivated", "wedding", weddingId, { status });
  revalidateTag(invitationTag(current.slug), "max");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Boda reactivada" };
}

const subscriptionSchema = z.object({
  endpoint: z.url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
  label: z.string().max(40),
});

/** This device receives platform notifications (weddings published, errors). */
export async function saveAdminPush(input: z.input<typeof subscriptionSchema>): Promise<ActionResult> {
  const { db, userId } = await getPlatformAdmin();
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Suscripción no válida" };
  const s = parsed.data;
  const { error } = await db
    .from("platform_push_subscriptions")
    .upsert(
      { user_id: userId, endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth, device_label: s.label },
      { onConflict: "endpoint" },
    );
  if (error) return { ok: false, error: "No se pudo activar en este dispositivo" };
  revalidatePath("/admin");
  return { ok: true, message: "Avisos activados en este dispositivo" };
}

export async function removeAdminPush(endpoint: string): Promise<ActionResult> {
  const { db, userId } = await getPlatformAdmin();
  await db.from("platform_push_subscriptions").delete().eq("user_id", userId).eq("endpoint", endpoint);
  revalidatePath("/admin");
  return { ok: true, message: "Avisos desactivados en este dispositivo" };
}

export async function testAdminPush(): Promise<ActionResult> {
  await getPlatformAdmin();
  const delivered = await notifyPlatform({
    title: "🔔 Avisos de Lazo de Oro activados",
    body: "Te avisaremos cuando se publique una boda o haya errores.",
    url: "/admin",
  });
  return delivered
    ? { ok: true, message: `Aviso de prueba enviado a ${delivered} dispositivo(s)` }
    : { ok: false, error: "No hay dispositivos activos." };
}

/** Deletes a wedding for good: its files, answers, wishes and the owners' link to it. */
export async function deleteWedding(weddingId: string, confirmSlug: string): Promise<ActionResult> {
  const { db, userId } = await getPlatformAdmin();
  if (!z.uuid().safeParse(weddingId).success) return { ok: false, error: "Boda no válida" };

  const { data: wedding } = await db.from("weddings").select("slug").eq("id", weddingId).maybeSingle();
  if (!wedding) return { ok: false, error: "Esa boda ya no existe" };
  if (PROTECTED_SLUGS.has(wedding.slug))
    return { ok: false, error: "La demo de la página principal no se puede borrar" };
  if (confirmSlug.trim() !== wedding.slug) return { ok: false, error: "Escribe el enlace exacto para confirmar" };

  // Storage first: the files live in a folder named after the wedding.
  const paths: string[] = [];
  const { data: folders } = await db.storage.from(MEDIA_BUCKET).list(weddingId, { limit: 100 });
  for (const folder of folders ?? []) {
    const { data: files } = await db.storage.from(MEDIA_BUCKET).list(`${weddingId}/${folder.name}`, { limit: 1000 });
    paths.push(...(files ?? []).map((f) => `${weddingId}/${folder.name}/${f.name}`));
  }
  if (paths.length) {
    const { error: storageError } = await db.storage.from(MEDIA_BUCKET).remove(paths);
    if (storageError) return { ok: false, error: "No se pudieron borrar sus archivos" };
  }

  const { error } = await db.from("weddings").delete().eq("id", weddingId);
  if (error) return { ok: false, error: "No se pudo borrar la boda" };

  await auditPlatform(userId, "wedding.deleted", "wedding", weddingId, { slug: wedding.slug, files: paths.length });
  revalidateTag(invitationTag(wedding.slug), "max");
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Boda /${wedding.slug} eliminada` };
}

/** Marks an account as a test one (left out of the real numbers) or back as real. */
export async function setAccountTest(accountId: string, isTest: boolean): Promise<ActionResult> {
  const { db, userId } = await getPlatformAdmin();
  if (!z.uuid().safeParse(accountId).success) return { ok: false, error: "Cuenta no válida" };
  const { data: admin } = await db.from("platform_admins").select("user_id").eq("user_id", accountId).maybeSingle();
  if (admin) return { ok: false, error: "Las cuentas de administración ya están fuera de los números" };

  const { error } = await db.from("profiles").update({ is_test: isTest }).eq("id", accountId);
  if (error) return { ok: false, error: "No se pudo actualizar" };
  await auditPlatform(userId, isTest ? "account.marked_test" : "account.marked_real", "account", accountId);
  revalidatePath("/admin", "layout");
  return { ok: true, message: isTest ? "Cuenta marcada como de prueba" : "Cuenta marcada como real" };
}

/** Deletes an account (its sign-in and profile). Its weddings must be deleted first. */
export async function deleteAccount(accountId: string, confirmEmail: string): Promise<ActionResult> {
  const { db, userId } = await getPlatformAdmin();
  if (!z.uuid().safeParse(accountId).success) return { ok: false, error: "Cuenta no válida" };
  if (accountId === userId) return { ok: false, error: "No puedes borrar tu propia cuenta" };

  const { data: admin } = await db.from("platform_admins").select("user_id").eq("user_id", accountId).maybeSingle();
  if (admin) return { ok: false, error: "Las cuentas de administración no se borran desde aquí" };

  const { data: account } = await db.auth.admin.getUserById(accountId);
  const email = account.user?.email ?? "";
  if (!account.user) return { ok: false, error: "Esa cuenta ya no existe" };
  if (confirmEmail.trim().toLowerCase() !== email.toLowerCase()) {
    return { ok: false, error: "Escribe el correo exacto para confirmar" };
  }

  const { count } = await db
    .from("wedding_members")
    .select("wedding_id", { count: "exact", head: true })
    .eq("user_id", accountId)
    .eq("role", "owner");
  if (count) return { ok: false, error: "Esta cuenta tiene una boda: elimínala primero en Bodas" };

  const { error } = await db.auth.admin.deleteUser(accountId);
  if (error) return { ok: false, error: "No se pudo borrar la cuenta" };

  await auditPlatform(userId, "account.deleted", "account", accountId, { email });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Cuenta ${email} eliminada` };
}
