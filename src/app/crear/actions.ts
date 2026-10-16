"use server";

import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { slugProblem } from "@/lib/builder/draft";
import { addressOf, searchAddress, type GeocodeResult } from "@/lib/geocode";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server helpers of the builder, used before the couple has an account. Both
 * are read-only and rate limited per connection.
 */

const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

/** Sliding-window limit per hashed IP, per server instance. */
async function allow(bucket: string, max: number): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const key = `${bucket}:${createHash("sha256")
    .update(`${process.env.IP_HASH_SALT ?? ""}:${ip}`)
    .digest("hex")}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) return false;
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}

const BUSY: GeocodeResult = { ok: false, error: "Demasiadas búsquedas seguidas. Espera unos minutos." };

export async function searchVenue(query: string): Promise<GeocodeResult> {
  if (!(await allow("geo", 30))) return BUSY;
  return searchAddress(query);
}

export async function venueAddressAt(lat: number, lng: number): Promise<GeocodeResult> {
  if (!(await allow("geo", 30))) return BUSY;
  return addressOf(lat, lng);
}

export type SlugCheck =
  | { status: "available" }
  | { status: "taken"; suggestion: string | null }
  | { status: "invalid"; problem: NonNullable<ReturnType<typeof slugProblem>> }
  | { status: "error" };

/** Whether a link is free; when taken, proposes the first free variant (maria-y-juan-2…). */
export async function checkSlug(slug: string): Promise<SlugCheck> {
  const problem = slugProblem(slug);
  if (problem) return { status: "invalid", problem };
  if (!(await allow("slug", 60))) return { status: "error" };

  const candidates = [slug, ...Array.from({ length: 8 }, (_, i) => `${slug.slice(0, 57)}-${i + 2}`)];
  const { data, error } = await createAdminClient().from("weddings").select("slug").in("slug", candidates);
  if (error) return { status: "error" };
  const taken = new Set((data ?? []).map((row: { slug: string }) => row.slug));
  if (!taken.has(slug)) return { status: "available" };
  return { status: "taken", suggestion: candidates.find((c) => !taken.has(c)) ?? null };
}
