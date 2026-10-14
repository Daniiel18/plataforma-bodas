import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Wedding } from "@/lib/types";

/**
 * Verifica que haya sesión y que la cuenta administre una boda.
 * Se usa en cada página del panel y en cada Server Action
 * (las acciones se pueden invocar directamente, sin pasar por la UI).
 */
export const getAdminContext = cache(async () => {
  // El panel siempre se resuelve en tiempo de petición: la sesión de Supabase
  // compara la expiración del token con la hora actual.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/admin/login");

  const { data: membership } = await supabase
    .from("wedding_members")
    .select("wedding_id, role")
    .eq("user_id", claims.sub)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/admin/sin-acceso");

  const { data: wedding, error } = await supabase
    .from("weddings")
    .select("*")
    .eq("id", membership.wedding_id)
    .single<Wedding>();
  if (error || !wedding) redirect("/admin/sin-acceso");

  return {
    supabase,
    userId: claims.sub,
    email: (claims.email as string | undefined) ?? "",
    wedding,
    /** Cuenta demo: puede ver todo, pero no guardar cambios. */
    readOnly: membership.role !== "owner",
  };
});

/** Respuesta estándar cuando la cuenta demo intenta guardar algo. */
export const READ_ONLY_RESULT = {
  ok: false as const,
  error: "Modo demo: puedes explorar todo, pero los cambios no se guardan.",
};

/** Deseos sin leer (contador del menú). */
export const getUnreadWishesCount = cache(async () => {
  const { supabase, wedding } = await getAdminContext();
  const { count } = await supabase
    .from("wishes")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", wedding.id)
    .eq("is_read", false);
  return count ?? 0;
});
