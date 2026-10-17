/** Where a couple may land after signing in (never another site). */
const ALLOWED = ["/panel", "/admin", "/crear/publicar"];

export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/panel";
  return ALLOWED.some((path) => next === path || next.startsWith(`${path}/`) || next.startsWith(`${path}?`))
    ? next
    : "/panel";
}
