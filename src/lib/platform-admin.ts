import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Checks that the signed-in account is a platform admin (public.platform_admins)
 * and returns a service-role client for the back office. Used by every /admin
 * page and action: anyone else is sent to their own dashboard.
 */
export const getPlatformAdmin = cache(async () => {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/entrar?next=%2Fadmin");

  // RLS lets each account read only its own admin row.
  const { data: admin } = await supabase.from("platform_admins").select("role").eq("user_id", userId).maybeSingle();
  if (!admin) redirect("/panel");

  return {
    userId,
    email: (data?.claims?.email as string | undefined) ?? "",
    role: admin.role as "superadmin" | "support",
    db: createAdminClient(),
  };
});

/** First publish of a wedding: audit entry and a notification to the admins. */
export async function announcePublished(
  wedding: { id: string; slug: string; partner1_name: string; partner2_name: string },
  actorUserId: string,
) {
  const { notifyPlatform } = await import("@/lib/notify");
  await auditPlatform(actorUserId, "wedding.published", "wedding", wedding.id, { slug: wedding.slug });
  await notifyPlatform({
    title: "💍 Nueva boda publicada",
    body: `${wedding.partner1_name.split(" ")[0]} & ${wedding.partner2_name.split(" ")[0]} · /${wedding.slug}`,
    url: `/admin/bodas/${wedding.id}`,
  });
}

/** Records a sensitive action in the audit log. */
export async function auditPlatform(
  actorUserId: string | null,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {},
) {
  await createAdminClient().from("audit_log").insert({
    actor_user_id: actorUserId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  });
}
