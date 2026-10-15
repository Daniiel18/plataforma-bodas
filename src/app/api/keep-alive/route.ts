import { createClient } from "@supabase/supabase-js";

/**
 * Daily job (Vercel Cron): a minimal query so Supabase's free plan never
 * pauses the project for inactivity. Vercel sends
 * `Authorization: Bearer <CRON_SECRET>` automatically.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("No autorizado", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await supabase.from("weddings").select("id", { head: true, count: "exact" });

  return Response.json({ ok: !error }, { status: error ? 500 : 200 });
}
