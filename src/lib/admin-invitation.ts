import "server-only";

import { updateTag } from "next/cache";

import { invitationTag } from "@/lib/invitation";

/** Tras cualquier cambio del panel, la invitación pública se regenera al instante. */
export function refreshInvitation(slug: string) {
  updateTag(invitationTag(slug));
}
