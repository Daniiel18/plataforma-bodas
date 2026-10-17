"use server";

import { getAdminContext, READ_ONLY_RESULT } from "@/lib/admin";
import { refreshInvitation } from "@/lib/admin-invitation";
import { giftsSchema, giftsToRows, type GiftKind, type Gifts } from "@/lib/gifts";
import { translateEsToEn } from "@/lib/translate";
import type { ActionResult } from "@/lib/types";

export async function saveGifts(input: Gifts): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  const parsed = giftsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { data: current } = await supabase
    .from("gift_methods")
    .select("type, note, note_en")
    .eq("wedding_id", wedding.id);
  const saved = new Map((current ?? []).map((row) => [row.type as GiftKind, row]));

  // Notes are only translated when they changed.
  const rows = giftsToRows(parsed.data);
  const changed = rows.filter((row) => row.note && row.note !== saved.get(row.type)?.note);
  const translated = changed.length ? await translateEsToEn(changed.map((row) => row.note!)) : [];
  const notesEn = new Map(changed.map((row, i) => [row.type, translated[i] ?? null]));

  const { error } = await supabase.from("gift_methods").upsert(
    rows.map((row) => ({
      ...row,
      wedding_id: wedding.id,
      note_en: !row.note
        ? null
        : notesEn.has(row.type)
          ? notesEn.get(row.type)
          : (saved.get(row.type)?.note_en ?? null),
    })),
    { onConflict: "wedding_id,type" },
  );
  if (error) return { ok: false, error: "No se pudieron guardar las formas de regalo" };

  refreshInvitation(wedding.slug);
  return { ok: true, message: "Formas de regalo guardadas" };
}
