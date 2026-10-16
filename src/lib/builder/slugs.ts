import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Whether a link is free and, if not, the first free variant
 * (maria-y-juan-2 … -9). Needs a client that sees every wedding.
 */
export async function findSlug(
  admin: SupabaseClient,
  slug: string,
): Promise<{ available: boolean; suggestion: string | null } | null> {
  const candidates = [slug, ...Array.from({ length: 8 }, (_, i) => `${slug.slice(0, 57)}-${i + 2}`)];
  const { data, error } = await admin.from("weddings").select("slug").in("slug", candidates);
  if (error) return null;
  const taken = new Set((data ?? []).map((row: { slug: string }) => row.slug));
  return {
    available: !taken.has(slug),
    suggestion: candidates.find((c) => !taken.has(c)) ?? null,
  };
}
