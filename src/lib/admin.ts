import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Wedding } from "@/lib/types";

/**
 * Checks that there is a session and that the account manages a wedding.
 * Used by every dashboard page and every Server Action
 * (actions can be invoked directly, without going through the UI).
 */
export const getAdminContext = cache(async () => {
  // The dashboard is always resolved at request time: the Supabase session
  // compares the token's expiry with the current time.
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
    /** Demo account: can see everything but cannot save changes. */
    readOnly: membership.role !== "owner",
  };
});

/** Standard response when the demo account tries to save something. */
export const READ_ONLY_RESULT = {
  ok: false as const,
  error: "Modo demo: puedes explorar todo, pero los cambios no se guardan.",
};

/** Unread wishes (menu badge). */
export const getUnreadWishesCount = cache(async () => {
  const { supabase, wedding } = await getAdminContext();
  const { count } = await supabase
    .from("wishes")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", wedding.id)
    .eq("is_read", false);
  return count ?? 0;
});
