import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Client with the secret key: bypasses RLS. Server only, for controlled
 * public operations (RSVP, wishes) and for reading private data such as the
 * couple's push subscriptions.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Falta SUPABASE_SECRET_KEY en las variables de entorno");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
