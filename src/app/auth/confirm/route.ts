import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Destino de los enlaces que envía Supabase por correo (p. ej. recuperar
 * contraseña). Canjea el código por una sesión y redirige dentro del panel.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = searchParams.get("next") ?? "/admin";
  const safeNext = next.startsWith("/admin") ? next : "/admin";

  const supabase = await createClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Enlace incompleto") };

  if (error) return NextResponse.redirect(`${origin}/admin/login?error=enlace`);
  return NextResponse.redirect(`${origin}${safeNext}`);
}
