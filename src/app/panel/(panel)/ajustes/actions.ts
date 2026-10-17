"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { getAdminContext, READ_ONLY_RESULT } from "@/lib/admin";
import { refreshInvitation } from "@/lib/admin-invitation";
import { announcePublished } from "@/lib/platform-admin";
import { isValidTimeZone, zonedInputToDate } from "@/lib/dates";
import type { ActionResult } from "@/lib/types";

const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Fecha u hora inválida");

const settingsSchema = z
  .object({
    partner1_name: z.string().trim().min(1, "Escribe el primer nombre").max(80),
    partner2_name: z.string().trim().min(1, "Escribe el segundo nombre").max(80),
    event_local: z.union([z.literal(""), localDateTime]),
    timezone: z.union([z.literal(""), z.string().refine(isValidTimeZone, "Zona horaria inválida")]),
    deadline_enabled: z.boolean(),
    deadline_local: z.string(),
    max_companions: z.coerce.number().int().min(0, "Mínimo 0").max(50, "Máximo 50"),
    companions_mode: z.enum(["names", "count"]),
    guestbook_public: z.boolean(),
    is_published: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.deadline_enabled && !localDateTime.safeParse(v.deadline_local).success) {
      ctx.addIssue({ code: "custom", message: "Elige la fecha límite para confirmar" });
    }
    if ((v.event_local || v.deadline_enabled) && !v.timezone) {
      ctx.addIssue({ code: "custom", message: "Elige la zona horaria del lugar de la boda" });
    }
  });

export async function updateWeddingSettings(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase, wedding, readOnly, userId } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;

  const parsed = settingsSchema.safeParse({
    partner1_name: formData.get("partner1_name"),
    partner2_name: formData.get("partner2_name"),
    event_local: formData.get("event_local"),
    timezone: formData.get("timezone"),
    deadline_enabled: formData.get("deadline_enabled") === "on",
    deadline_local: formData.get("deadline_local") ?? "",
    max_companions: formData.get("max_companions"),
    companions_mode: formData.get("companions_mode") ?? "names",
    guestbook_public: formData.get("guestbook_public") === "on",
    is_published: formData.get("is_published") === "on",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const v = parsed.data;
  const eventStartsAt = v.event_local ? zonedInputToDate(v.event_local, v.timezone) : null;
  const deadline = v.deadline_enabled ? zonedInputToDate(v.deadline_local, v.timezone) : null;
  if (deadline && eventStartsAt && deadline > eventStartsAt) {
    return { ok: false, error: "La fecha límite debe ser antes de la boda" };
  }

  const { error } = await supabase
    .from("weddings")
    .update({
      partner1_name: v.partner1_name,
      partner2_name: v.partner2_name,
      event_starts_at: eventStartsAt?.toISOString() ?? null,
      timezone: v.timezone || null,
      rsvp_deadline: deadline?.toISOString() ?? null,
      max_companions: v.max_companions,
      companions_mode: v.companions_mode,
      guestbook_public: v.guestbook_public,
      is_published: v.is_published,
    })
    .eq("id", wedding.id);
  if (error) return { ok: false, error: "No se pudieron guardar los ajustes" };
  if (v.is_published && !wedding.published_at) after(() => announcePublished(wedding, userId));

  refreshInvitation(wedding.slug);
  revalidatePath("/panel", "layout");
  return { ok: true, message: "Ajustes guardados" };
}
