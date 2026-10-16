import { zonedInputToDate } from "@/lib/dates";
import type { MediaImage } from "@/lib/media";
import { assembleInvitation, type InvitationData, type ViewContext } from "@/lib/section-view";
import { SECTION_TYPES } from "@/lib/sections";
import { zelleLink } from "@/lib/zelle";

import type { BuilderDraft, LocalMedia } from "./draft";

const PREVIEW_SLUG = "vista-previa";

/** Instant of a local date and time in the wedding's zone, or null while incomplete. */
export function draftStartsAt(draft: Pick<BuilderDraft, "event">): string | null {
  const { date, time, timeZone } = draft.event;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  try {
    return zonedInputToDate(`${date}T${time}`, timeZone).toISOString();
  } catch {
    return null;
  }
}

/** End of the reply deadline day in the wedding's zone. */
export function draftDeadline(draft: Pick<BuilderDraft, "event" | "rsvp">): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.rsvp.deadline)) return null;
  try {
    return zonedInputToDate(`${draft.rsvp.deadline}T23:59`, draft.event.timeZone).toISOString();
  } catch {
    return null;
  }
}

/**
 * The invitation as it will look once published, from the browser draft and
 * the object URLs of its local files.
 */
export function draftToInvitation(
  draft: BuilderDraft,
  urls: Record<string, string>,
): { data: InvitationData; ctx: ViewContext } {
  const image = (media: LocalMedia | null): MediaImage | null =>
    media && urls[media.id] ? { url: urls[media.id], width: media.width ?? 1200, height: media.height ?? 1600 } : null;
  const startsAt = draftStartsAt(draft);
  const { holderName, handle, note } = draft.gift;
  const qr = image(draft.media.qr);
  const name = (n: string, fallback: string) => n.trim() || fallback;

  return assembleInvitation({
    slug: draft.slug || PREVIEW_SLUG,
    updatedAt: draft.startedAt,
    templateKey: draft.appearance.template,
    themeOverrides: draft.appearance,
    backgroundPhoto: image(draft.media.background)?.url ?? null,
    couple: { partner1: name(draft.couple.partner1, "Nombre"), partner2: name(draft.couple.partner2, "Nombre") },
    event: startsAt ? { startsAt, timeZone: draft.event.timeZone } : null,
    rsvp: { deadline: draftDeadline(draft), timeZone: draft.event.timeZone, maxCompanions: draft.rsvp.maxCompanions },
    sections: SECTION_TYPES.map((type) => ({
      type,
      visible: draft.sections[type].visible,
      content: draft.sections[type].content,
      translations: draft.translations[type] ?? {},
    })),
    cover: image(draft.media.cover),
    photos: draft.media.gallery.flatMap((media) => {
      const img = image(media);
      return img ? [{ ...img, id: media.id, caption: null }] : [];
    }),
    audioUrl: draft.media.audio ? (urls[draft.media.audio.id] ?? null) : null,
    zelle:
      handle.trim() || qr
        ? {
            holderName: holderName.trim(),
            handle: handle.trim(),
            note: note.trim() ? { es: note.trim(), en: note.trim() } : null,
            qr,
            link: handle.trim() ? zelleLink(holderName, handle) : null,
          }
        : null,
  });
}

/** Ids of every local file of the draft (to resolve their URLs). */
export function draftMediaIds(draft: BuilderDraft): string[] {
  const { cover, gallery, audio, qr, background } = draft.media;
  return [cover, audio, qr, background, ...gallery].filter((m): m is LocalMedia => m !== null).map((m) => m.id);
}
