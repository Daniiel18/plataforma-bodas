import { CalendarHeartIcon, ChevronDownIcon, PenLineIcon, SendIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LazoMark } from "@/components/brand/logo";
import { T } from "@/components/invitation/lang";
import { FAQ } from "@/components/site/faq";
import { TrackView } from "@/components/site/track-view";
import { BRAND, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: `${BRAND} · Invitaciones de boda digitales gratis`,
    description: "Diseña gratis la web de tu boda y recibe las confirmaciones de tus invitados en tu teléfono.",
    url: "/",
    siteName: BRAND,
    locale: "es_US",
    type: "website",
  },
};

const STEPS = [
  {
    icon: PenLineIcon,
    title: { es: "Diseña gratis", en: "Design it for free" },
    text: {
      es: "Elige una plantilla, escribe sus nombres y la fecha, y añade fotos, música y lugar. Sin cuenta: se guarda en tu dispositivo.",
      en: "Pick a template, add your names and date, then photos, music and the venue. No account needed: it is saved on your device.",
    },
  },
  {
    icon: SendIcon,
    title: { es: "Publica y comparte", en: "Publish and share" },
    text: {
      es: "Entra con Google o tu correo, elige tu enlace y envíalo por WhatsApp, iMessage o redes con un mensaje listo.",
      en: "Sign in with Google or your email, choose your link and send it by WhatsApp, iMessage or social media with a ready-made message.",
    },
  },
  {
    icon: CalendarHeartIcon,
    title: { es: "Recibe confirmaciones", en: "Get the replies" },
    text: {
      es: "Mira en tu panel quién viene, con cuántos acompañantes y los deseos que les dejan, en tiempo real.",
      en: "See in your dashboard who is coming, with how many companions, and the wishes they leave you, in real time.",
    },
  },
];

export default function Home() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q.es,
      acceptedAnswer: { "@type": "Answer", text: a.es },
    })),
  };
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: BRAND,
    url: SITE_URL,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    inLanguage: ["es", "en"],
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([siteJsonLd, faqJsonLd]) }}
      />
      <TrackView name="landing_view" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_80%_10%,var(--site-champagne),transparent_70%)]"
        />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-12 pb-16 md:grid-cols-[1.1fr_0.9fr] md:pt-20 md:pb-24">
          <div className="grid gap-6 text-center md:text-left">
            <p className="text-xs font-semibold tracking-[0.3em] text-[var(--site-gold-deep)] uppercase">
              <T es="Gratis · Sin cuenta para empezar" en="Free · No account to start" />
            </p>
            <h1 className="font-heading text-4xl leading-[1.1] font-medium text-balance sm:text-5xl md:text-6xl">
              <T
                es={
                  <>
                    La web de su boda, <em className="text-[var(--site-gold-deep)]">lista en minutos</em>
                  </>
                }
                en={
                  <>
                    Your wedding website, <em className="text-[var(--site-gold-deep)]">ready in minutes</em>
                  </>
                }
              />
            </h1>
            <p className="mx-auto max-w-xl text-lg text-pretty text-[var(--site-ink-soft)] md:mx-0">
              <T
                es="Invitación elegante con confirmación de asistencia, cuenta regresiva, fotos en 3D, música, mapa y regalos. Sus invitados la abren en el teléfono, en español o inglés."
                en="An elegant invitation with replies, countdown, 3D photos, music, map and gifts. Your guests open it on their phone, in Spanish or English."
              />
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link
                href="/crear"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--site-ink)] px-8 text-base font-medium text-[var(--site-paper)] shadow-[var(--site-gold)]/20 shadow-lg transition hover:bg-[var(--site-gold-deep)]"
              >
                <T es="Crea la tuya gratis" en="Create yours for free" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-12 items-center justify-center rounded-full px-6 text-base text-[var(--site-ink)] ring-1 ring-[var(--site-line)] transition hover:bg-[var(--site-paper)]"
              >
                <T es="Ver una invitación real" en="See a real invitation" />
              </Link>
            </div>
          </div>

          <PhoneDemo />
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-[var(--site-line)] bg-[var(--site-paper)]">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:py-20">
          <div className="grid gap-2 text-center">
            <p className="text-xs font-semibold tracking-[0.3em] text-[var(--site-gold-deep)] uppercase">
              <T es="Cómo funciona" en="How it works" />
            </p>
            <h2 className="font-heading text-3xl font-medium sm:text-4xl">
              <T es="Tres pasos y listo" en="Three steps and you're done" />
            </h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title.es}
                className="grid content-start gap-3 rounded-2xl border border-[var(--site-line)] bg-[var(--site-bg)] p-6"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[var(--site-champagne)] text-[var(--site-gold-deep)]">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-heading text-sm tracking-[0.2em] text-[var(--site-ink-soft)] uppercase">
                    <T es={`Paso ${index + 1}`} en={`Step ${index + 1}`} />
                  </span>
                </span>
                <h3 className="font-heading text-2xl font-medium">
                  <T es={step.title.es} en={step.title.en} />
                </h3>
                <p className="text-[var(--site-ink-soft)]">
                  <T es={step.text.es} en={step.text.en} />
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto grid w-full max-w-3xl gap-8 px-4 py-16 md:py-20">
        <div className="grid gap-2 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-[var(--site-gold-deep)] uppercase">
            <T es="Preguntas frecuentes" en="FAQ" />
          </p>
          <h2 className="font-heading text-3xl font-medium sm:text-4xl">
            <T es="Lo que nos preguntan" en="What couples ask us" />
          </h2>
        </div>
        <div className="grid gap-3">
          {FAQ.map(({ q, a }) => (
            <details
              key={q.es}
              className="group rounded-2xl border border-[var(--site-line)] bg-[var(--site-paper)] px-5 py-4 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                <T es={q.es} en={q.en} />
                <ChevronDownIcon
                  className="size-4 shrink-0 text-[var(--site-gold-deep)] transition group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="pt-3 text-[var(--site-ink-soft)]">
                <T es={a.es} en={a.en} />
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="px-4 pb-20">
        <div className="mx-auto grid w-full max-w-4xl justify-items-center gap-5 rounded-3xl bg-[var(--site-champagne)] px-6 py-14 text-center">
          <LazoMark className="size-14" />
          <h2 className="font-heading text-3xl font-medium text-balance sm:text-4xl">
            <T es="Empiecen hoy, es gratis" en="Start today, it's free" />
          </h2>
          <p className="max-w-lg text-[var(--site-ink-soft)]">
            <T
              es="Diseñen su invitación en pocos minutos y publíquenla cuando estén listos."
              en="Design your invitation in a few minutes and publish it when you're ready."
            />
          </p>
          <Link
            href="/crear"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--site-ink)] px-8 text-base font-medium text-[var(--site-paper)] transition hover:bg-[var(--site-gold-deep)]"
          >
            <T es="Crear mi invitación" en="Create my invitation" />
          </Link>
        </div>
      </section>
    </>
  );
}

/** A real invitation (the demo) running inside a phone frame. */
function PhoneDemo() {
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="relative rounded-[2.75rem] bg-[#2b241f] p-2.5 shadow-[var(--site-gold)]/30 shadow-2xl ring-1 ring-black/10">
        <div
          aria-hidden
          className="absolute top-3.5 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#2b241f]"
        />
        <iframe
          src="/demo"
          title="Demo de invitación · Invitation demo"
          loading="lazy"
          className="block aspect-[9/19] w-full rounded-[2.2rem] bg-[var(--site-paper)]"
        />
      </div>
      <p className="mt-4 text-center text-sm text-[var(--site-ink-soft)]">
        <T es="Tócala: es una invitación de verdad." en="Tap it: it's a real invitation." />
      </p>
    </div>
  );
}
