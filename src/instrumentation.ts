import type { Instrumentation } from "next";

/**
 * Records every server error (pages, Server Actions, route handlers) in
 * public.error_log for the back office, and tells the platform admins — at
 * most once every 30 minutes so a burst of errors is a single notification.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  // Not found and redirects travel as errors; they are not failures.
  const digest = (error as { digest?: string }).digest ?? null;
  if (digest?.startsWith("NEXT_HTTP_ERROR_FALLBACK") || digest?.startsWith("NEXT_REDIRECT")) return;
  if (!process.env.SUPABASE_SECRET_KEY || process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { notifyPlatform } = await import("@/lib/notify");
    const db = createAdminClient();
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const path = request.path.split("?")[0].slice(0, 300);

    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { count } = await db.from("error_log").select("id", { count: "exact", head: true }).gte("occurred_at", since);

    await db.from("error_log").insert({
      source: context.routeType,
      message: message.slice(0, 2000),
      digest,
      path,
      details: { method: request.method, route: context.routePath, kind: context.routerKind },
    });

    if (!count) {
      await notifyPlatform({
        title: "⚠️ Error en Lazo de Oro",
        body: `${path}: ${message.slice(0, 140)}`,
        url: "/admin/registro",
      });
    }
  } catch {
    // Recording must never make things worse.
  }
};
