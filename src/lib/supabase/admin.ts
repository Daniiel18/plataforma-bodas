import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la clave secreta: ignora RLS. Solo para el servidor, en
 * operaciones públicas controladas (RSVP, deseos) y para leer datos
 * privados como el correo de avisos.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Falta SUPABASE_SECRET_KEY en las variables de entorno");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
