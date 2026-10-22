import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { recordLastSeen } from "@/lib/last-seen";
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
  if (!claims?.sub) redirect("/entrar");

  const { data: membership } = await supabase
    .from("wedding_members")
    .select("wedding_id, role")
    .eq("user_id", claims.sub)
    .limit(1)
    .maybeSingle();
  if (!membership) {
    // Platform admins have no wedding: their home is the back office.
    const { data: admin } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", claims.sub)
      .maybeSingle();
    redirect(admin ? "/admin" : "/panel/sin-acceso");
  }

  const { data: wedding, error } = await supabase
    .from("weddings")
    .select("*")
    .eq("id", membership.wedding_id)
    .single<Wedding>();
  if (error || !wedding) redirect("/panel/sin-acceso");

  recordLastSeen(claims.sub);

  return {
    supabase,
    userId: claims.sub,
    email: (claims.email as string | undefined) ?? "",
    wedding,
    /** Demo account: can see everything but cannot save changes. */
    isViewer: membership.role !== "owner",
    /** Nothing can be saved: demo account, or a wedding past its event (read-only, archived, suspended). */
    readOnly: membership.role !== "owner" || !["draft", "active"].includes(wedding.status),
  };
});

/** Standard response when the demo account tries to save something. */
export const READ_ONLY_RESULT = {
  ok: false as const,
  error: "Esta boda está en modo solo lectura: puedes ver todo, pero los cambios no se guardan.",
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
