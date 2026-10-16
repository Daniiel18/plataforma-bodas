import "server-only";

import { z } from "zod";

/**
 * Address search for the venue map, with OpenStreetMap's Nominatim (free, no
 * key). It runs on the server so every request carries an identifying
 * User-Agent, as Nominatim's usage policy asks, and only on demand. Requests
 * are spaced at least one second apart per server instance (the policy's
 * limit).
 */

const NOMINATIM = "https://nominatim.openstreetmap.org";
const headers = {
  "User-Agent": `LazoDeOro/1.0 (+${process.env.VAPID_SUBJECT ?? "https://github.com/Daniiel18/plataforma-bodas"})`,
  "Accept-Language": "es",
};

import type { GeocodeResult } from "./geocode-types";

export type { GeocodeResult };

type Place = { lat: string; lon: string; display_name: string };

let nextSlot = 0;
async function politeFetch(url: string) {
  const wait = nextSlot - Date.now();
  nextSlot = Math.max(Date.now(), nextSlot) + 1100;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  return fetch(url, { headers, signal: AbortSignal.timeout(8000) });
}

export async function searchAddress(query: string): Promise<GeocodeResult> {
  const parsed = z.string().trim().min(3).max(200).safeParse(query);
  if (!parsed.success) return { ok: false, error: "Escribe la dirección para buscarla en el mapa" };

  try {
    const response = await politeFetch(
      `${NOMINATIM}/search?format=jsonv2&limit=1&q=${encodeURIComponent(parsed.data)}`,
    );
    if (!response.ok) return { ok: false, error: "El buscador de mapas no respondió. Inténtalo en un momento." };
    const [place] = (await response.json()) as Place[];
    if (!place)
      return { ok: false, error: "No encontramos esa dirección. Prueba con más detalles o ubica el punto a mano." };
    return { ok: true, lat: Number(place.lat), lng: Number(place.lon), label: place.display_name };
  } catch {
    return { ok: false, error: "El buscador de mapas no respondió. Inténtalo en un momento." };
  }
}

/** The address of a point on the map, so the couple can reuse it as the written address. */
export async function addressOf(lat: number, lng: number): Promise<GeocodeResult> {
  const parsed = z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .safeParse({ lat, lng });
  if (!parsed.success) return { ok: false, error: "Punto no válido" };

  try {
    const response = await politeFetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=18&lat=${lat}&lon=${lng}`);
    if (!response.ok) return { ok: false, error: "No se pudo leer la dirección de ese punto" };
    const place = (await response.json()) as Partial<Place>;
    if (!place.display_name) return { ok: false, error: "No se pudo leer la dirección de ese punto" };
    return { ok: true, lat, lng, label: place.display_name };
  } catch {
    return { ok: false, error: "No se pudo leer la dirección de ese punto" };
  }
}
