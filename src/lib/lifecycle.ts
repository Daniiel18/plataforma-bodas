/**
 * Wedding lifecycle rules (applied every day by /api/cron/lifecycle):
 * - active → read-only 30 days after the event: the invitation stays up,
 *   replies close and the dashboard stops saving changes;
 * - archived 12 months after the event (warned 30 days before): the
 *   invitation is taken down and its photos and music are deleted; the
 *   couple can still sign in and download their guest list;
 * - drafts never published are deleted 30 days after they were created
 *   (warned 7 days before).
 */

export const READ_ONLY_AFTER_DAYS = 30;
export const ARCHIVE_AFTER_MONTHS = 12;
export const ARCHIVE_NOTICE_DAYS = 30;
export const DRAFT_TTL_DAYS = 30;
export const DRAFT_NOTICE_DAYS = 7;

const DAY = 24 * 60 * 60 * 1000;

export type LifecycleWedding = {
  status: "draft" | "active" | "read_only" | "archived" | "suspended";
  event_starts_at: string | null;
  created_at: string;
  published_at: string | null;
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
};

/** When each step happens for a wedding (null when it does not apply). */
export function lifecycleDates(w: LifecycleWedding) {
  const event = w.event_starts_at ? new Date(w.event_starts_at) : null;
  const neverPublished = w.status === "draft" && !w.published_at;
  return {
    readOnlyAt: event ? new Date(event.getTime() + READ_ONLY_AFTER_DAYS * DAY) : null,
    archiveAt: event ? addMonths(event, ARCHIVE_AFTER_MONTHS) : null,
    draftDeleteAt: neverPublished ? new Date(new Date(w.created_at).getTime() + DRAFT_TTL_DAYS * DAY) : null,
  };
}

/** Thresholds for the daily job: anything at or before them is due. */
export function lifecycleCutoffs(now: Date) {
  return {
    readOnly: new Date(now.getTime() - READ_ONLY_AFTER_DAYS * DAY),
    archive: addMonths(now, -ARCHIVE_AFTER_MONTHS),
    archiveNotice: new Date(addMonths(now, -ARCHIVE_AFTER_MONTHS).getTime() + ARCHIVE_NOTICE_DAYS * DAY),
    draftDelete: new Date(now.getTime() - DRAFT_TTL_DAYS * DAY),
    draftNotice: new Date(now.getTime() - (DRAFT_TTL_DAYS - DRAFT_NOTICE_DAYS) * DAY),
  };
}

export type LifecycleNotice = { tone: "info" | "warning"; title: string; text: string };

const longDate = (date: Date) =>
  new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" }).format(date);

/** What the dashboard tells the couple about their wedding's lifecycle, if anything. */
export function lifecycleNotice(w: LifecycleWedding, now = new Date()): LifecycleNotice | null {
  const { archiveAt, draftDeleteAt } = lifecycleDates(w);

  if (w.status === "archived") {
    return {
      tone: "info",
      title: "Su boda está archivada",
      text: "La invitación ya no se ve y se borraron las fotos y la música. Pueden descargar su lista de invitados en Invitados.",
    };
  }
  if (w.status === "suspended") {
    return {
      tone: "warning",
      title: "Su invitación está suspendida",
      text: "Escríbannos a lazosdeooroo@gmail.com si creen que es un error.",
    };
  }
  if (draftDeleteAt && now.getTime() >= draftDeleteAt.getTime() - DRAFT_NOTICE_DAYS * DAY) {
    return {
      tone: "warning",
      title: "Su borrador se borrará pronto",
      text: `Si no publican su invitación, se borrará el ${longDate(draftDeleteAt)}. Publíquenla en Ajustes para conservarla.`,
    };
  }
  if (archiveAt && (w.status === "active" || w.status === "read_only")) {
    if (now.getTime() >= archiveAt.getTime() - ARCHIVE_NOTICE_DAYS * DAY) {
      return {
        tone: "warning",
        title: "Su boda se archivará pronto",
        text: `El ${longDate(archiveAt)} la invitación dejará de verse y se borrarán las fotos y la música. Descarguen lo que quieran conservar.`,
      };
    }
    if (w.status === "read_only") {
      return {
        tone: "info",
        title: "Su boda ya pasó: modo solo lectura",
        text: `La invitación sigue en línea hasta el ${longDate(archiveAt)}. Ya no se reciben respuestas ni se guardan cambios.`,
      };
    }
  }
  return null;
}
