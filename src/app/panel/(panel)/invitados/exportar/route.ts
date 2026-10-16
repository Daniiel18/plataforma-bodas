import { getAdminContext } from "@/lib/admin";
import { displayZone, formatShortDateTime } from "@/lib/dates";
import type { RsvpWithDetails } from "@/lib/types";

type ExportRow = Omit<RsvpWithDetails, "wishes"> & {
  wishes: { message: string } | { message: string }[] | null;
};

const csvCell = (value: string | number) => {
  const text = String(value);
  // Keeps Excel from interpreting the text as a formula.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** Downloads a CSV with one row per person (guests and companions). */
export async function GET() {
  const { supabase, wedding } = await getAdminContext();

  const { data, error } = await supabase
    .from("rsvps")
    .select("*, rsvp_companions(id, full_name, position), wishes(message)")
    .eq("wedding_id", wedding.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });
  if (error) return new Response("No se pudo exportar", { status: 500 });

  const header = ["Nombre", "Tipo", "Grupo de", "Asiste", "Fecha de respuesta", "Deseo", "Nota"];
  const lines = [header.map(csvCell).join(",")];

  for (const r of (data ?? []) as ExportRow[]) {
    const wish = Array.isArray(r.wishes) ? r.wishes[0] : r.wishes;
    const date = formatShortDateTime(r.updated_at, displayZone(wedding.timezone));
    const attending = r.attending ? "Sí" : "No";
    lines.push(
      [r.full_name, "Titular", r.full_name, attending, date, wish?.message ?? "", r.admin_note ?? ""]
        .map(csvCell)
        .join(","),
    );
    for (const c of [...r.rsvp_companions].sort((a, b) => a.position - b.position)) {
      lines.push([c.full_name, "Acompañante", r.full_name, attending, date, "", ""].map(csvCell).join(","));
    }
  }

  const fileName = `invitados-${wedding.slug}-${new Date().toISOString().slice(0, 10)}.csv`;
  // BOM so Excel reads accents and ñ correctly.
  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
