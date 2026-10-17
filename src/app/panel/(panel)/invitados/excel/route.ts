import ExcelJS from "exceljs";

import { getAdminContext } from "@/lib/admin";
import { displayZone, formatShortDateTime } from "@/lib/dates";
import { companionsOf, type RsvpWithDetails } from "@/lib/types";

type Row = Omit<RsvpWithDetails, "wishes"> & {
  wishes:
    | { message: string; locale: string; created_at: string; is_hidden: boolean }
    | { message: string; locale: string; created_at: string; is_hidden: boolean }[]
    | null;
};

/** Bold header, frozen first row, filters and sensible widths. */
function styleSheet(sheet: ExcelJS.Worksheet, widths: number[]) {
  sheet.columns.forEach((column, i) => {
    column.width = widths[i] ?? 18;
  });
  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3EBDD" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  if (sheet.rowCount > 1) {
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
  }
}

/** Downloads the guest list as an Excel workbook: summary, one row per person, and the wishes. */
export async function GET() {
  const { supabase, wedding } = await getAdminContext();
  const { data, error } = await supabase
    .from("rsvps")
    .select("*, rsvp_companions(id, full_name, position), wishes(message, locale, created_at, is_hidden)")
    .eq("wedding_id", wedding.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });
  if (error) return new Response("No se pudo exportar", { status: 500 });

  const rows = (data ?? []) as Row[];
  const zone = displayZone(wedding.timezone);
  const when = (date: string) => formatShortDateTime(date, zone);
  const wishOf = (r: Row) => (Array.isArray(r.wishes) ? r.wishes[0] : r.wishes) ?? null;

  const book = new ExcelJS.Workbook();
  book.creator = "Lazo de Oro";
  book.created = new Date();

  // Summary
  const attending = rows.filter((r) => r.attending);
  const companions = attending.reduce((sum, r) => sum + companionsOf(r), 0);
  const summary = book.addWorksheet("Resumen");
  summary.addRow(["Dato", "Total"]);
  summary.addRows([
    ["Personas que asistirán", attending.length + companions],
    ["Respuestas que asisten", attending.length],
    ["Acompañantes", companions],
    ["Respuestas que no asisten", rows.length - attending.length],
    ["Respuestas en total", rows.length],
    ["Deseos", rows.filter((r) => wishOf(r)).length],
    ["Descargado", when(new Date().toISOString())],
  ]);
  styleSheet(summary, [30, 22]);

  // One row per person
  const guests = book.addWorksheet("Invitados");
  guests.addRow(["Nombre", "Tipo", "Grupo de", "Asiste", "Personas del grupo", "Fecha de respuesta", "Nota"]);
  for (const r of rows) {
    const people = r.attending ? 1 + companionsOf(r) : 0;
    const answer = r.attending ? "Sí" : "No";
    guests.addRow([r.full_name, "Titular", r.full_name, answer, people, when(r.updated_at), r.admin_note ?? ""]);
    for (const c of [...r.rsvp_companions].sort((a, b) => a.position - b.position)) {
      guests.addRow([c.full_name, "Acompañante", r.full_name, answer, "", "", ""]);
    }
    // Weddings that only count companions: one row per person, without a name.
    if (r.attending && !r.rsvp_companions.length) {
      for (let i = 0; i < (r.companions_count ?? 0); i++) {
        guests.addRow(["(sin nombre)", "Acompañante", r.full_name, answer, "", "", ""]);
      }
    }
  }
  styleSheet(guests, [30, 14, 30, 8, 18, 22, 30]);

  // Wishes
  const wishes = book.addWorksheet("Deseos");
  wishes.addRow(["De", "Deseo", "Idioma", "Fecha", "En la invitación"]);
  for (const r of rows) {
    const wish = wishOf(r);
    if (!wish) continue;
    wishes.addRow([
      r.full_name,
      wish.message,
      wish.locale === "en" ? "Inglés" : "Español",
      when(wish.created_at),
      wedding.guestbook_public && !wish.is_hidden ? "Sí" : "No",
    ]);
  }
  styleSheet(wishes, [28, 70, 10, 22, 16]);
  wishes.getColumn(2).alignment = { wrapText: true, vertical: "top" };

  const buffer = await book.xlsx.writeBuffer();
  const fileName = `invitados-${wedding.slug}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
