import "server-only";

import { updateTag } from "next/cache";

import { invitationTag } from "@/lib/invitation";

/** After any dashboard change, the public invitation is regenerated instantly. */
export function refreshInvitation(slug: string) {
  updateTag(invitationTag(slug));
}
