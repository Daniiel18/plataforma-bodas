import "@/components/invitation/invitation.css";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LazoMark } from "@/components/brand/logo";
import { InvitationView } from "@/components/invitation/invitation-view";
import { T } from "@/components/invitation/lang";
import { TrackView } from "@/components/site/track-view";
import { getPublicInvitation } from "@/lib/invitation";
import { BRAND } from "@/lib/site";
import { getTemplate, resolveTemplate, TEMPLATES } from "@/lib/templates";

/** The fictional demo wedding every template demo is built from. */
const DEMO_SLUG = "demo";

/** Hides the demo bar when the page runs inside the landing page's phone. */
const EMBED_SCRIPT = `try{if(window.self!==window.top)document.documentElement.setAttribute("data-embedded","")}catch(e){}`;

/** SEO metadata of a template demo (the plain /demo uses the demo's own template). */
export function demoMetadata(templateKey: string | null): Metadata {
  const template = templateKey ? getTemplate(templateKey) : null;
  const title = template
    ? `Plantilla ${template.name}: invitación de boda digital gratis`
    : "Demo: invitación de boda digital gratis";
  const description = template
    ? `${template.description} Mira una invitación real con la plantilla ${template.name} y crea la tuya gratis, con confirmación de asistencia, música, fotos en 3D y mapa.`
    : "Mira una invitación de boda digital real: sobre animado, cuenta regresiva, fotos en 3D, música, mapa, regalos y confirmación de asistencia. Crea la tuya gratis.";
  const path = template ? `/demo/${template.key}` : "/demo";
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} · ${BRAND}`, description, url: path, siteName: BRAND, type: "website" },
  };
}

/** The demo invitation, optionally redrawn with another template, plus the call-to-action bar. */
export async function DemoPage({ templateKey }: { templateKey: string | null }) {
  const demo = await getPublicInvitation(DEMO_SLUG);
  if (!demo) notFound();

  const template = getTemplate(templateKey ?? demo.template);
  const data = templateKey
    ? {
        ...demo,
        template: resolveTemplate(template.key),
        accent: null,
        background: { key: template.background, photo: null, veil: demo.background.veil },
      }
    : demo;

  return (
    <div className="demo-page flex flex-1 flex-col">
      <script dangerouslySetInnerHTML={{ __html: EMBED_SCRIPT }} />
      <InvitationView data={data} />
      <DemoBar current={template.key} />
      <TrackView name="demo_view" template={template.key} />
    </div>
  );
}

function DemoBar({ current }: { current: string }) {
  const template = getTemplate(current);
  return (
    <div className="demo-bar fixed inset-x-0 bottom-0 z-[75] border-t border-[var(--site-line)] bg-[var(--site-paper)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-2.5">
        <Link href="/" aria-label={BRAND} className="shrink-0">
          <LazoMark className="size-8" />
        </Link>
        <details className="group relative min-w-0 flex-1">
          <summary className="cursor-pointer list-none truncate text-sm [&::-webkit-details-marker]:hidden">
            <span className="block text-[0.65rem] tracking-[0.2em] text-[var(--site-ink-soft)] uppercase">
              <span className="l-es">Plantilla</span>
              <span className="l-en">Template</span> ▾
            </span>
            <span className="font-medium">{template.name}</span>
          </summary>
          <nav className="absolute bottom-full left-0 mb-3 grid max-h-[60vh] w-64 overflow-y-auto rounded-2xl border border-[var(--site-line)] bg-[var(--site-paper)] p-2 shadow-xl">
            {TEMPLATES.map((t) => (
              <Link
                key={t.key}
                href={`/demo/${t.key}`}
                aria-current={t.key === current ? "page" : undefined}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-[var(--site-champagne)] aria-[current=page]:font-semibold"
              >
                <span
                  aria-hidden
                  className="size-4 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{ background: `linear-gradient(135deg, ${t.colors.bg}, ${t.colors.accent})` }}
                />
                {t.name}
              </Link>
            ))}
          </nav>
        </details>
        <Link
          href={`/crear?plantilla=${template.key}`}
          className="inline-flex h-11 shrink-0 items-center rounded-full bg-[var(--site-ink)] px-5 text-sm font-medium text-[var(--site-paper)] transition hover:bg-[var(--site-gold-deep)]"
        >
          <T es="Crea la tuya" en="Create yours" />
        </Link>
      </div>
    </div>
  );
}
