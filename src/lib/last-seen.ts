import "server-only";

import { after } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/** Browsing the dashboard writes at most once every few minutes. */
const REFRESH_MINUTES = 5;

/**
 * Records that the account is using the platform, once the response is sent.
 * auth.users.last_sign_in_at only moves on a new sign-in, so it can't tell
 * when a couple who stays signed in last opened their dashboard.
 */
export function recordLastSeen(userId: string) {
  after(async () => {
    const stale = new Date(Date.now() - REFRESH_MINUTES * 60_000).toISOString();
    const { error } = await createAdminClient()
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", userId)
      .or(`last_seen_at.is.null,last_seen_at.lt."${stale}"`);
    if (error) console.error("Could not record last_seen_at:", error.message);
  });
}
