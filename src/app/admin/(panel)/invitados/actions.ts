"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminContext, READ_ONLY_RESULT } from "@/lib/admin";
import type { ActionResult } from "@/lib/types";

const idSchema = z.uuid();

function done(message: string): ActionResult {
  revalidatePath("/admin", "layout");
  return { ok: true, message };
}

export async function setAttendance(rsvpId: string, attending: boolean): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  if (!idSchema.safeParse(rsvpId).success) return { ok: false, error: "Respuesta no válida" };

  const { error } = await supabase.from("rsvps").update({ attending }).eq("id", rsvpId).eq("wedding_id", wedding.id);
  if (error) return { ok: false, error: "No se pudo actualizar la respuesta" };
  return done(attending ? "Marcado como que asiste" : "Marcado como que no asiste");
}

export async function setArchived(rsvpId: string, archived: boolean): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  if (!idSchema.safeParse(rsvpId).success) return { ok: false, error: "Respuesta no válida" };

  const { error } = await supabase
    .from("rsvps")
    .update({ is_archived: archived })
    .eq("id", rsvpId)
    .eq("wedding_id", wedding.id);
  if (error) return { ok: false, error: "No se pudo actualizar la respuesta" };
  return done(archived ? "Respuesta archivada (ya no cuenta en los totales)" : "Respuesta restaurada");
}

export async function saveNote(rsvpId: string, note: string): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  if (!idSchema.safeParse(rsvpId).success) return { ok: false, error: "Respuesta no válida" };
  const parsed = z.string().trim().max(500, "La nota es muy larga").safeParse(note);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from("rsvps")
    .update({ admin_note: parsed.data || null })
    .eq("id", rsvpId)
    .eq("wedding_id", wedding.id);
  if (error) return { ok: false, error: "No se pudo guardar la nota" };
  return done("Nota guardada");
}

const nameSchema = z.string().trim().min(2, "Cada nombre debe tener al menos 2 letras").max(120);

const manualRsvpSchema = z.object({
  full_name: nameSchema,
  attending: z.enum(["si", "no"]),
  companions: z.array(nameSchema),
  note: z.string().trim().max(500),
});

/** Para respuestas que llegan por teléfono o en persona. */
export async function createManualRsvp(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  const parsed = manualRsvpSchema.safeParse({
    full_name: formData.get("full_name"),
    attending: formData.get("attending"),
    companions: formData
      .getAll("companion")
      .map(String)
      .filter((name) => name.trim() !== ""),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const attending = parsed.data.attending === "si";
  const companions = attending ? parsed.data.companions : [];
  if (companions.length > wedding.max_companions) {
    return { ok: false, error: `Máximo ${wedding.max_companions} acompañantes por respuesta` };
  }

  const { data: rsvp, error } = await supabase
    .from("rsvps")
    .insert({
      wedding_id: wedding.id,
      full_name: parsed.data.full_name,
      attending,
      admin_note: parsed.data.note || "Agregada desde el panel",
    })
    .select("id")
    .single();
  if (error || !rsvp) return { ok: false, error: "No se pudo guardar la respuesta" };

  if (companions.length) {
    const { error: companionsError } = await supabase
      .from("rsvp_companions")
      .insert(companions.map((full_name, position) => ({ rsvp_id: rsvp.id, full_name, position })));
    if (companionsError) {
      await supabase.from("rsvps").delete().eq("id", rsvp.id);
      return { ok: false, error: "No se pudieron guardar los acompañantes" };
    }
  }

  return done("Respuesta agregada");
}
