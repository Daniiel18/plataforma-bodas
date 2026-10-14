import type { NextRequest } from "next/server";

import { buildIcs } from "@/lib/ics";
import { getPublicInvitation } from "@/lib/invitation";

/** Archivo de calendario: en iPhone abre "Añadir al calendario" directamente. */
export async function GET(request: NextRequest, { params }: RouteContext<"/[slug]/calendario.ics">) {
  const { slug } = await params;
  const data = await getPublicInvitation(slug);
  if (!data?.event) return new Response("No encontrado", { status: 404 });

  const lang = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "es";
  const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;
  const couple = `${first(data.couple.partner1)} & ${first(data.couple.partner2)}`;
  const summary = lang === "en" ? `${couple}'s wedding` : `Boda de ${couple}`;

  const body = buildIcs({
    uid: `${slug}@plataforma-bodas`,
    summary,
    startsAt: data.event.startsAt,
    stampedAt: data.updatedAt,
    location: data.location ? [data.location.venue, data.location.address].filter(Boolean).join(", ") : undefined,
    url: new URL(`/${slug}`, request.nextUrl.origin).toString(),
    reminder: "-P1D",
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="boda-${slug}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
