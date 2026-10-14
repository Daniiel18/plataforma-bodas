"use server";

import { z } from "zod";

import { getAdminContext, READ_ONLY_RESULT } from "@/lib/admin";
import { refreshInvitation } from "@/lib/admin-invitation";
import { translateEsToEn } from "@/lib/translate";
import type { ActionResult } from "@/lib/types";

const zelleSchema = z.object({
  holder_name: z.string().trim().max(80, "Nombre muy largo"),
  handle: z
    .string()
    .trim()
    .max(80)
    .refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || /^[+\d][\d\s().-]{6,}$/.test(v), {
      message: "Escribe el correo o el teléfono registrado en Zelle",
    }),
  note: z.string().trim().max(300, "Máximo 300 caracteres"),
  is_visible: z.boolean(),
});

export async function saveZelle(input: z.input<typeof zelleSchema>): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  const parsed = zelleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;

  const { data: current } = await supabase
    .from("gift_methods")
    .select("note, note_en")
    .eq("wedding_id", wedding.id)
    .eq("type", "zelle")
    .single();

  // Solo se traduce la nota si cambió.
  let noteEn: string | null = current?.note === v.note ? (current?.note_en ?? null) : null;
  if (v.note && current?.note !== v.note) [noteEn] = await translateEsToEn([v.note]);

  const { error } = await supabase
    .from("gift_methods")
    .update({
      holder_name: v.holder_name || null,
      handle: v.handle || null,
      note: v.note || null,
      note_en: v.note ? noteEn : null,
      is_visible: v.is_visible,
    })
    .eq("wedding_id", wedding.id)
    .eq("type", "zelle");
  if (error) return { ok: false, error: "No se pudieron guardar los datos de Zelle" };

  refreshInvitation(wedding.slug);
  return { ok: true, message: "Datos de Zelle guardados" };
}
