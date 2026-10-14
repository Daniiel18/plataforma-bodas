import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { InvitationView } from "@/components/invitation/invitation-view";
import { getPublicInvitation } from "@/lib/invitation";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicInvitation(slug);
  if (!data) return { title: "Invitación" };

  const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;
  const title = `${first(data.couple.partner1)} & ${first(data.couple.partner2)}`;
  return {
    title,
    description: "Te invitamos a nuestra boda · You're invited to our wedding",
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description: "Te invitamos a nuestra boda",
      images: data.cover ? [{ url: data.cover.url, width: data.cover.width, height: data.cover.height }] : [],
    },
  };
}

export default function InvitationPage({ params }: PageProps<"/[slug]">) {
  return (
    <Suspense fallback={<InvitationFallback />}>
      <Invitation params={params} />
    </Suspense>
  );
}

async function Invitation({ params }: Pick<PageProps<"/[slug]">, "params">) {
  const { slug } = await params;
  const data = await getPublicInvitation(slug);
  if (!data) notFound();
  return <InvitationView data={data} />;
}

function InvitationFallback() {
  return (
    <div className="grid flex-1 place-items-center bg-[#f6efe6] text-3xl text-[#a88e6c]" aria-busy="true">
      ❦
    </div>
  );
}
