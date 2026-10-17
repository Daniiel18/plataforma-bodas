"use server";

import { z } from "zod";

import { allowRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Remembers the language of the page for an existing account, so the sign-in
 * email (built by Supabase from user_metadata.locale) arrives in that language.
 * New accounts get it with the sign-up itself.
 */
export async function rememberEmailLanguage(email: string, lang: string): Promise<void> {
  const parsed = z.object({ email: z.email().max(200), lang: z.enum(["es", "en"]) }).safeParse({ email, lang });
  if (!parsed.success || !(await allowRequest("email-lang", 20))) return;
  await createAdminClient().rpc("set_auth_locale", { p_email: parsed.data.email, p_locale: parsed.data.lang });
}
