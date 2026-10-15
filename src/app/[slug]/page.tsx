import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InvitationView } from "@/components/invitation/invitation-view";
import { getPublicInvitation, getPublishedSlugs } from "@/lib/invitation";

/**
 * Published invitations are prerendered at build time; any other slug renders
 * on its first visit and is then served from the cache. Cache Components needs
 * at least one param, so "demo" stands in when nothing is published yet.
 */
export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return (slugs.length ? slugs : ["demo"]).map((slug) => ({ slug }));
}

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

export default async function InvitationPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const data = await getPublicInvitation(slug);
  // Checked before anything streams, so unknown or unpublished slugs get a real 404.
  if (!data) notFound();
  return <InvitationView data={data} />;
}
