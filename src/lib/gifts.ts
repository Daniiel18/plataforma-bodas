import { z } from "zod";

import type { MediaImage } from "./media";
import type { Bi } from "./sections";
import { zelleLink } from "./zelle";

/**
 * Ways guests can send a gift. Each couple turns on the ones they want; the
 * builder, the dashboard and the invitation share this model. Stored as one
 * gift_methods row per method (method-specific fields in `details`).
 */

export const GIFT_KINDS = ["zelle", "paypal", "bank", "registry"] as const;
export type GiftKind = (typeof GIFT_KINDS)[number];

export const GIFT_LABELS: Record<GiftKind, Bi> = {
  zelle: { es: "Zelle", en: "Zelle" },
  paypal: { es: "PayPal", en: "PayPal" },
  bank: { es: "Transferencia bancaria", en: "Bank transfer" },
  registry: { es: "Mesa de regalos", en: "Gift registry" },
};

const text = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);

const zelleHandle = text(120).refine(
  (v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || /^[+\d][\d\s().-]{6,}$/.test(v),
  "Escribe el correo o el teléfono registrado en Zelle",
);

export const giftsSchema = z.object({
  zelle: z.object({ enabled: z.boolean(), holderName: text(80), handle: zelleHandle, note: text(300) }),
  paypal: z.object({
    enabled: z.boolean(),
    user: text(120).refine((v) => v === "" || paypalLink(v) !== null, "Escribe tu usuario de PayPal.me"),
    note: text(300),
  }),
  bank: z.object({
    enabled: z.boolean(),
    holderName: text(80),
    bank: text(80),
    account: text(60),
    accountType: text(40),
    routing: text(60),
    note: text(300),
  }),
  registry: z.object({
    enabled: z.boolean(),
    links: z.array(z.object({ store: text(60), url: text(500) })).max(3, "Máximo 3 enlaces"),
    note: text(300),
  }),
});

export type Gifts = z.output<typeof giftsSchema>;

export function emptyGifts(): Gifts {
  return {
    zelle: { enabled: false, holderName: "", handle: "", note: "" },
    paypal: { enabled: false, user: "", note: "" },
    bank: { enabled: false, holderName: "", bank: "", account: "", accountType: "", routing: "", note: "" },
    registry: { enabled: false, links: [], note: "" },
  };
}

/** "paypal.me/ana", "https://www.paypal.me/ana/" or "ana" → https://paypal.me/ana */
export function paypalLink(value: string): string | null {
  const v = value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "");
  const match = /^(?:paypal\.me\/)?([A-Za-z0-9._-]{2,40})\/?$/i.exec(v);
  return match ? `https://paypal.me/${match[1]}` : null;
}

/** Store links typed without "https://" still work; anything else is dropped. */
export function registryUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// Database rows
// ---------------------------------------------------------------------

export type GiftRow = {
  type: GiftKind;
  holder_name: string | null;
  handle: string | null;
  note: string | null;
  note_en?: string | null;
  details: Record<string, unknown> | null;
  is_visible: boolean;
  position?: number;
  qr_media_id?: string | null;
};

const orNull = (v: string) => v || null;

/** The rows to save (one per method; turned-off ones are kept, hidden). */
export function giftsToRows(gifts: Gifts): Omit<GiftRow, "note_en" | "qr_media_id">[] {
  const { zelle, paypal, bank, registry } = gifts;
  return [
    {
      type: "zelle",
      holder_name: orNull(zelle.holderName),
      handle: orNull(zelle.handle),
      note: orNull(zelle.note),
      details: {},
      is_visible: zelle.enabled,
      position: 0,
    },
    {
      type: "paypal",
      holder_name: null,
      handle: orNull(paypal.user),
      note: orNull(paypal.note),
      details: {},
      is_visible: paypal.enabled,
      position: 1,
    },
    {
      type: "bank",
      holder_name: orNull(bank.holderName),
      handle: null,
      note: orNull(bank.note),
      details: { bank: bank.bank, account: bank.account, accountType: bank.accountType, routing: bank.routing },
      is_visible: bank.enabled,
      position: 2,
    },
    {
      type: "registry",
      holder_name: null,
      handle: null,
      note: orNull(registry.note),
      details: { links: registry.links.filter((l) => l.url.trim()) },
      is_visible: registry.enabled,
      position: 3,
    },
  ];
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function rowsToGifts(rows: GiftRow[]): Gifts {
  const gifts = emptyGifts();
  for (const row of rows) {
    const d = row.details ?? {};
    if (row.type === "zelle") {
      gifts.zelle = {
        enabled: row.is_visible,
        holderName: row.holder_name ?? "",
        handle: row.handle ?? "",
        note: row.note ?? "",
      };
    } else if (row.type === "paypal") {
      gifts.paypal = { enabled: row.is_visible, user: row.handle ?? "", note: row.note ?? "" };
    } else if (row.type === "bank") {
      gifts.bank = {
        enabled: row.is_visible,
        holderName: row.holder_name ?? "",
        bank: str(d.bank),
        account: str(d.account),
        accountType: str(d.accountType),
        routing: str(d.routing),
        note: row.note ?? "",
      };
    } else if (row.type === "registry") {
      const links = Array.isArray(d.links) ? d.links : [];
      gifts.registry = {
        enabled: row.is_visible,
        links: links.slice(0, 3).map((l: Record<string, unknown>) => ({ store: str(l.store), url: str(l.url) })),
        note: row.note ?? "",
      };
    }
  }
  return gifts;
}

// ---------------------------------------------------------------------
// What the invitation shows
// ---------------------------------------------------------------------

export type GiftView =
  | { kind: "zelle"; holderName: string; handle: string; note: Bi | null; qr: MediaImage | null; link: string | null }
  | { kind: "paypal"; link: string; note: Bi | null }
  | {
      kind: "bank";
      holderName: string;
      bank: string;
      account: string;
      accountType: string;
      routing: string;
      note: Bi | null;
    }
  | { kind: "registry"; links: { store: string; url: string }[]; note: Bi | null };

/** The methods that are on and complete enough to use, in display order. */
export function giftViews(
  gifts: Gifts,
  { qr, notesEn = {} }: { qr: MediaImage | null; notesEn?: Partial<Record<GiftKind, string | null>> },
): GiftView[] {
  const note = (kind: GiftKind, es: string): Bi | null =>
    es.trim() ? { es: es.trim(), en: notesEn[kind]?.trim() || es.trim() } : null;
  const views: GiftView[] = [];
  const { zelle, paypal, bank, registry } = gifts;

  if (zelle.enabled && (zelle.handle || qr)) {
    views.push({
      kind: "zelle",
      holderName: zelle.holderName,
      handle: zelle.handle,
      note: note("zelle", zelle.note),
      qr,
      link: zelle.handle ? zelleLink(zelle.holderName, zelle.handle) : null,
    });
  }
  const paypalUrl = paypal.enabled ? paypalLink(paypal.user) : null;
  if (paypalUrl) views.push({ kind: "paypal", link: paypalUrl, note: note("paypal", paypal.note) });
  if (bank.enabled && (bank.account || bank.routing)) {
    views.push({ kind: "bank", ...bank, note: note("bank", bank.note) });
  }
  const links = registry.enabled
    ? registry.links.flatMap((l) => {
        const url = registryUrl(l.url);
        return url ? [{ store: l.store.trim(), url }] : [];
      })
    : [];
  if (links.length) views.push({ kind: "registry", links, note: note("registry", registry.note) });
  return views;
}
