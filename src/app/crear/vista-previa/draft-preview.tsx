"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { InvitationView } from "@/components/invitation/invitation-view";
import { draftMediaIds, draftToInvitation } from "@/lib/builder/invitation";
import { useLocalMediaUrls } from "@/lib/builder/media";
import { useBuilder } from "@/lib/builder/store";
import type { BuilderDraft } from "@/lib/builder/draft";

const subscribe = () => () => {};

export function DraftPreview() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const draft = useBuilder((s) => s.draft);
  if (!mounted) return null;
  if (!draft)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
        <p>Todavía no hay una invitación en este dispositivo.</p>
        <Link href="/crear" className="underline">
          Crear mi invitación
        </Link>
      </div>
    );
  return <Preview draft={draft} />;
}

function Preview({ draft }: { draft: BuilderDraft }) {
  const urls = useLocalMediaUrls(draftMediaIds(draft));
  const { data } = useMemo(() => draftToInvitation(draft, urls), [draft, urls]);
  return <InvitationView data={data} preview />;
}
