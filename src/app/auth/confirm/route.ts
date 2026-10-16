import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { safeNext } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Target of the sign-in links (email code links, Google, password recovery).
 * Exchanges the code or token for a session and continues to the dashboard or
 * to publishing the builder's draft.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Enlace incompleto") };

  if (error) return NextResponse.redirect(`${origin}/entrar?error=enlace&next=${encodeURIComponent(next)}`);
  return NextResponse.redirect(`${origin}${next}`);
}
