"use server";

import { z } from "zod";

import { getAdminContext, READ_ONLY_RESULT } from "@/lib/admin";
import { refreshInvitation } from "@/lib/admin-invitation";
import {
  collectTexts,
  SECTION_TYPES,
  sectionSchemas,
  syncTranslations,
  type SectionType,
  type Translations,
} from "@/lib/sections";
import { translateEsToEn } from "@/lib/translate";
import type { ActionResult } from "@/lib/types";

const typeSchema = z.enum(SECTION_TYPES);

/** Secciones que se pueden reordenar (el sobre siempre va primero y la música no ocupa lugar). */
const ORDERABLE: SectionType[] = SECTION_TYPES.filter((t) => t !== "intro" && t !== "music");

export async function saveSection(type: SectionType, data: unknown): Promise<ActionResult & { pending?: number }> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  const parsedType = typeSchema.safeParse(type);
  if (!parsedType.success) return { ok: false, error: "Sección no válida" };

  const parsed = sectionSchemas[parsedType.data].safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { data: current, error: readError } = await supabase
    .from("sections")
    .select("content_en")
    .eq("wedding_id", wedding.id)
    .eq("type", type)
    .single<{ content_en: Translations | null }>();
  if (readError) return { ok: false, error: "No se encontró la sección" };

  const { translations, pending } = await syncTranslations(
    type,
    parsed.data,
    current.content_en ?? {},
    translateEsToEn,
  );

  const { error } = await supabase
    .from("sections")
    .update({ content: parsed.data, content_en: translations })
    .eq("wedding_id", wedding.id)
    .eq("type", type);
  if (error) return { ok: false, error: "No se pudo guardar" };

  refreshInvitation(wedding.slug);
  return {
    ok: true,
    pending,
    message: pending
      ? `Guardado. ${pending} texto(s) quedaron sin traducir por ahora; en inglés se mostrarán en español.`
      : "Guardado y traducido al inglés",
  };
}

export async function setSectionVisible(type: SectionType, visible: boolean): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  if (!typeSchema.safeParse(type).success) return { ok: false, error: "Sección no válida" };

  const { error } = await supabase
    .from("sections")
    .update({ is_visible: visible })
    .eq("wedding_id", wedding.id)
    .eq("type", type);
  if (error) return { ok: false, error: "No se pudo actualizar" };

  refreshInvitation(wedding.slug);
  return { ok: true, message: visible ? "Sección visible en la invitación" : "Sección oculta" };
}

export async function moveSection(type: SectionType, direction: -1 | 1): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  if (!ORDERABLE.includes(type)) return { ok: false, error: "Esta sección no se puede mover" };

  const { data: rows, error } = await supabase
    .from("sections")
    .select("type, position")
    .eq("wedding_id", wedding.id)
    .in("type", ORDERABLE)
    .order("position");
  if (error || !rows) return { ok: false, error: "No se pudo leer el orden" };

  const order = rows.map((r) => r.type as SectionType);
  const from = order.indexOf(type);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= order.length) return { ok: true };
  [order[from], order[to]] = [order[to], order[from]];

  // Posiciones desde 1 (el sobre ocupa la 0).
  const results = await Promise.all(
    order.map((t, i) =>
      supabase
        .from("sections")
        .update({ position: i + 1 })
        .eq("wedding_id", wedding.id)
        .eq("type", t),
    ),
  );
  if (results.some((r) => r.error)) return { ok: false, error: "No se pudo reordenar" };

  refreshInvitation(wedding.slug);
  return { ok: true };
}

/** Corrección manual de un texto en inglés. Se respeta hasta que cambie el español. */
export async function saveTranslation(type: SectionType, path: string, english: string): Promise<ActionResult> {
  const { supabase, wedding, readOnly } = await getAdminContext();
  if (readOnly) return READ_ONLY_RESULT;
  if (!typeSchema.safeParse(type).success) return { ok: false, error: "Sección no válida" };
  const en = z.string().trim().min(1, "Escribe el texto en inglés").max(1000).safeParse(english);
  if (!en.success) return { ok: false, error: en.error.issues[0].message };

  const { data: row, error: readError } = await supabase
    .from("sections")
    .select("content, content_en")
    .eq("wedding_id", wedding.id)
    .eq("type", type)
    .single<{ content: unknown; content_en: Translations | null }>();
  if (readError) return { ok: false, error: "No se encontró la sección" };

  const source = collectTexts(type, row.content).find((t) => t.path === path);
  if (!source) return { ok: false, error: "Ese texto ya no existe; recarga la página" };

  const translations = { ...(row.content_en ?? {}), [path]: { src: source.text, en: en.data, manual: true } };
  const { error } = await supabase
    .from("sections")
    .update({ content_en: translations })
    .eq("wedding_id", wedding.id)
    .eq("type", type);
  if (error) return { ok: false, error: "No se pudo guardar la traducción" };

  refreshInvitation(wedding.slug);
  return { ok: true, message: "Traducción guardada" };
}
