"use server";

import { createHash, randomBytes } from "node:crypto";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";

import { invitationTag } from "@/lib/invitation";
import { notifyCouple } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Public actions of the attendance form. Guests have no account: they are
 * identified by a secret token stored on their phone and in their personal
 * link. Only its hash is stored in the database.
 */

const ERROR_CODES = [
  "INVITATION_NOT_FOUND",
  "RSVP_CLOSED",
  "RATE_LIMITED",
  "TOO_MANY_COMPANIONS",
  "INVALID_COMPANIONS",
  "RSVP_NOT_FOUND",
  "NO_CHANGE",
] as const;

export type RsvpErrorCode = (typeof ERROR_CODES)[number] | "INVALID" | "UNAVAILABLE";
type Failure = { ok: false; code: RsvpErrorCode };

export type MyRsvp = {
  fullName: string;
  attending: boolean;
  companions: string[];
  /** People coming with the guest (named or only counted). */
  companionsCount: number;
  hasWish: boolean;
  canChange: boolean;
};

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .max(80);
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{20,64}$/);
const nameSchema = z.string().trim().min(2).max(120);
const localeSchema = z.enum(["es", "en"]);

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function failureFrom(error: { message?: string } | null): Failure {
  const message = error?.message ?? "";
  const code = ERROR_CODES.find((c) => message.includes(c));
  if (!code) console.error("RSVP:", message);
  return { ok: false, code: code ?? "UNAVAILABLE" };
}

/** Anonymous fingerprint of the connection (to throttle mass submissions). */
async function connectionHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "";
  return ip
    ? createHash("sha256")
        .update(`${process.env.IP_HASH_SALT ?? ""}:${ip}`)
        .digest("hex")
        .slice(0, 32)
    : null;
}

function admin() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

const submitSchema = z
  .object({
    slug: slugSchema,
    fullName: nameSchema,
    attending: z.boolean(),
    companions: z.array(nameSchema).max(50),
    /** Weddings that only count companions send the number instead of names. */
    companionsCount: z.number().int().min(0).max(50).optional(),
    wish: z.string().trim().max(1000),
    locale: localeSchema,
    website: z.string().max(0), // honeypot field: people never see it
  })
  .refine((v) => v.attending || (v.companions.length === 0 && !v.companionsCount));

/** Saves the answer and the optional wish together, then sends the couple a single notification. */
export async function submitRsvp(input: z.input<typeof submitSchema>): Promise<{ ok: true; token: string } | Failure> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID" };
  const v = parsed.data;

  const db = admin();
  if (!db) return { ok: false, code: "UNAVAILABLE" };

  const token = randomBytes(24).toString("base64url");
  const ipHash = await connectionHash();
  const { data, error } = await db
    .rpc("rsvp_reply", {
      p_slug: v.slug,
      p_full_name: v.fullName,
      p_attending: v.attending,
      p_companions: v.companions,
      p_companions_count: v.companionsCount ?? null,
      p_wish: v.wish || null,
      p_locale: v.locale,
      p_token_hash: hashToken(token),
      p_ip_hash: ipHash,
    })
    .single<{ rsvp_id: string; wedding_id: string }>();
  if (error || !data) return failureFrom(error);

  // With a public guestbook, the new wish shows on the invitation.
  if (v.wish) revalidateTag(invitationTag(v.slug), "max");

  after(() =>
    notifyCouple(data.wedding_id, {
      kind: "rsvp",
      name: v.fullName,
      attending: v.attending,
      companions: v.companions,
      companionsCount: v.companionsCount ?? v.companions.length,
      wish: v.wish || null,
    }),
  );
  return { ok: true, token };
}

export async function getMyRsvp(slug: string, token: string): Promise<{ ok: true; rsvp: MyRsvp | null } | Failure> {
  if (!slugSchema.safeParse(slug).success || !tokenSchema.safeParse(token).success) return { ok: true, rsvp: null };
  const db = admin();
  if (!db) return { ok: false, code: "UNAVAILABLE" };

  const { data, error } = await db.rpc("rsvp_status", { p_slug: slug, p_token_hash: hashToken(token) }).maybeSingle<{
    full_name: string;
    attending: boolean;
    companions: string[];
    companions_count: number | null;
    has_wish: boolean;
    can_change: boolean;
  }>();
  if (error) return failureFrom(error);
  if (!data) return { ok: true, rsvp: null };

  return {
    ok: true,
    rsvp: {
      fullName: data.full_name,
      attending: data.attending,
      companions: data.companions ?? [],
      companionsCount: data.companions_count ?? data.companions?.length ?? 0,
      hasWish: data.has_wish,
      canChange: data.can_change,
    },
  };
}

const changeSchema = z
  .object({
    slug: slugSchema,
    token: tokenSchema,
    attending: z.boolean(),
    companions: z.array(nameSchema).max(50),
    companionsCount: z.number().int().min(0).max(50).optional(),
  })
  .refine((v) => v.attending || (v.companions.length === 0 && !v.companionsCount));

export async function changeAttendance(input: z.input<typeof changeSchema>): Promise<{ ok: true } | Failure> {
  const parsed = changeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID" };
  const v = parsed.data;
  const db = admin();
  if (!db) return { ok: false, code: "UNAVAILABLE" };

  const { data, error } = await db
    .rpc("rsvp_change", {
      p_slug: v.slug,
      p_token_hash: hashToken(v.token),
      p_attending: v.attending,
      p_companions: v.companions,
      p_companions_count: v.companionsCount ?? null,
    })
    .single<{ rsvp_id: string; wedding_id: string; full_name: string }>();
  if (error || !data) return failureFrom(error);

  after(() =>
    notifyCouple(data.wedding_id, {
      kind: "change",
      name: data.full_name,
      attending: v.attending,
      companions: v.companions,
      companionsCount: v.companionsCount ?? v.companions.length,
    }),
  );
  return { ok: true };
}
