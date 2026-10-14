"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAdminContext, READ_ONLY_RESULT } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

const credentialsSchema = z.object({
  email: z.email("Escribe un correo válido"),
  password: z.string().min(1, "Escribe la contraseña"),
});

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: "Correo o contraseña incorrectos" };

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestPasswordReset(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = z.email().safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: "Escribe un correo válido" };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent("/admin/ajustes?recuperacion=1")}`,
  });

  // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados.
  return { ok: true, message: "Si el correo está registrado, te llegará un enlace para crear una nueva contraseña." };
}

const passwordSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Las contraseñas no coinciden" });

export async function updatePassword(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: "No se pudo cambiar la contraseña. Intenta de nuevo." };
  return { ok: true, message: "Contraseña actualizada" };
}
