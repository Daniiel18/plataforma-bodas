import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { InvitationView } from "@/components/invitation/invitation-view";
import { getAdminContext } from "@/lib/admin";
import { loadInvitation } from "@/lib/invitation";

export const metadata: Metadata = { title: "Vista previa", robots: { index: false, follow: false } };

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="grid flex-1 place-items-center text-3xl text-muted-foreground">❦</div>}>
      <Preview />
    </Suspense>
  );
}

/** The invitation exactly as guests will see it, even before it is published. */
async function Preview() {
  const { supabase, wedding } = await getAdminContext();
  const data = await loadInvitation(supabase, wedding);

  return (
    <>
      <div className="fixed top-3 left-3 z-[75] flex items-center gap-2 rounded-full bg-[#3f352e]/90 py-1.5 pr-4 pl-2 text-xs text-white shadow-lg backdrop-blur">
        <Link href="/admin" className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 hover:bg-white/25">
          <ArrowLeftIcon className="size-3.5" /> Panel
        </Link>
        Vista previa · {wedding.is_published ? "publicada" : "sin publicar"}
      </div>
      <InvitationView data={data} preview />
    </>
  );
}
