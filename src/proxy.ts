import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { safeNext } from "@/lib/auth-redirect";

/** Dashboard pages that work without a session (password sign-in and recovery). */
const PUBLIC_PANEL_PATHS = ["/panel/login", "/panel/recuperar"];

/**
 * Refreshes the Supabase session and runs an optimistic check on the pages
 * that need an account: no session → /entrar, which brings the couple back
 * afterwards. Real authorization (being a member of the wedding) is verified
 * in every page and action.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    const [pathOnly, query] = path.split("?");
    url.pathname = pathOnly;
    url.search = query ? `?${query}` : "";
    return NextResponse.redirect(url);
  };

  if (pathname === "/entrar" || pathname === "/panel/login") {
    return isLoggedIn ? redirectTo(safeNext(request.nextUrl.searchParams.get("next"))) : response;
  }

  const isPublic = PUBLIC_PANEL_PATHS.some((p) => pathname.startsWith(p));
  if (!isLoggedIn && !isPublic) {
    return redirectTo(`/entrar?next=${encodeURIComponent(`${pathname}${search}`)}`);
  }

  return response;
}

export const config = {
  matcher: ["/panel/:path*", "/admin", "/admin/:path*", "/crear/publicar", "/entrar"],
};
