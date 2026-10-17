"use server";

import { slugProblem } from "@/lib/builder/draft";
import { findSlug } from "@/lib/builder/slugs";
import { addressOf, searchAddress, type GeocodeResult } from "@/lib/geocode";
import { allowRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server helpers of the builder, used before the couple has an account. Both
 * are read-only and rate limited per connection.
 */

const BUSY: GeocodeResult = { ok: false, error: "Demasiadas búsquedas seguidas. Espera unos minutos." };

export async function searchVenue(query: string): Promise<GeocodeResult> {
  if (!(await allowRequest("geo", 30))) return BUSY;
  return searchAddress(query);
}

export async function venueAddressAt(lat: number, lng: number): Promise<GeocodeResult> {
  if (!(await allowRequest("geo", 30))) return BUSY;
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
  if (!(await allowRequest("slug", 60))) return { status: "error" };

  const result = await findSlug(createAdminClient(), slug);
  if (!result) return { status: "error" };
  if (result.available) return { status: "available" };
  return { status: "taken", suggestion: result.suggestion };
}
