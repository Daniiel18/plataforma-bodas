import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Product funnel events (landing → builder → publish), without cookies: the
 * browser sends a random id it keeps in localStorage. Stored with the
 * approximate country and device type only.
 */

const EVENTS = [
  "landing_view",
  "demo_view",
  "builder_start",
  "builder_step",
  "builder_review",
  "publish_click",
  "save_click",
] as const;

const short = z.string().trim().max(100);
const eventSchema = z.object({
  name: z.enum(EVENTS),
  anonymousId: z.uuid(),
  path: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  utm: z.object({ source: short, medium: short, campaign: short }).partial().optional(),
  properties: z
    .record(z.string().max(40), z.union([short, z.number(), z.boolean()]))
    .refine((value) => Object.keys(value).length <= 10)
    .optional(),
});

const BOT = /bot|crawler|spider|crawling|preview|headless|lighthouse/i;

function deviceOf(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

function referrerHost(referrer: string | undefined, ownHost: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname;
    return host && host !== ownHost ? host : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (BOT.test(userAgent)) return new NextResponse(null, { status: 204 });

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid event" }, { status: 400 });
  const event = parsed.data;

  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase();
  const { error } = await createAdminClient()
    .from("analytics_events")
    .insert({
      name: event.name,
      anonymous_id: event.anonymousId,
      path: event.path ?? null,
      referrer_host: referrerHost(event.referrer, request.nextUrl.hostname),
      utm_source: event.utm?.source || null,
      utm_medium: event.utm?.medium || null,
      utm_campaign: event.utm?.campaign || null,
      country: country && /^[A-Z]{2}$/.test(country) ? country : null,
      device: deviceOf(userAgent),
      properties: event.properties ?? {},
    });
  if (error) return NextResponse.json({ error: "not stored" }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
