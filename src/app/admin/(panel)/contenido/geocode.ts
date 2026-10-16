"use server";

import { getAdminContext } from "@/lib/admin";
import { addressOf, searchAddress, type GeocodeResult } from "@/lib/geocode";

/** Venue search from the dashboard (signed-in couples only). */
export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  await getAdminContext();
  return searchAddress(query);
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  await getAdminContext();
  return addressOf(lat, lng);
}
