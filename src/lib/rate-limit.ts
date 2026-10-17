import "server-only";

import { createHash } from "node:crypto";

import { headers } from "next/headers";

/**
 * Sliding-window limit per hashed IP and bucket, kept in memory per server
 * instance. Enough to stop casual abuse of the public helpers (no account).
 */

const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

export async function allowRequest(bucket: string, max: number): Promise<boolean> {
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
