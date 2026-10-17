import { HeartIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { T } from "@/components/invitation/lang";
import { Button } from "@/components/ui/button";
import { DONATE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Apóyanos",
  description: "Lazo de Oro es gratis para todas las parejas gracias a las donaciones voluntarias.",
  alternates: { canonical: "/donar" },
};

/** Voluntary donations: everything stays free and nothing is unlocked by donating. */
export default function DonatePage() {
  return (
    <article className="mx-auto grid w-full max-w-2xl justify-items-center gap-6 px-4 py-16 text-center md:py-24">
      <span className="grid size-16 place-items-center rounded-full bg-[var(--site-champagne)]">
        <HeartIcon className="size-7 fill-[var(--site-gold)] text-[var(--site-gold)]" />
      </span>
      <h1 className="font-heading text-4xl font-medium sm:text-5xl">
        <T es="Hecho con cariño, gratis para siempre" en="Made with love, free forever" />
      </h1>
      <p className="leading-relaxed text-[var(--site-ink-soft)]">
        <T
          es="Lazo de Oro es gratis para todas las parejas: sin planes, sin funciones de pago y sin anuncios. Si su invitación les ayudó, una donación voluntaria nos ayuda a mantenerla en línea y a seguir mejorándola. Donar no desbloquea nada: todo ya es suyo."
          en="Lazo de Oro is free for every couple: no plans, no paid features and no ads. If your invitation helped you, a voluntary donation helps us keep it online and keep improving it. Donating unlocks nothing: everything is already yours."
        />
      </p>
      {DONATE_URL ? (
        <Button asChild size="lg" className="h-12 px-8">
          <a href={DONATE_URL} target="_blank" rel="noopener">
            <HeartIcon /> <T es="Donar con PayPal" en="Donate with PayPal" />
          </a>
        </Button>
      ) : (
        <p className="text-sm text-[var(--site-ink-soft)]">
          <T es="Muy pronto podrán apoyarnos aquí." en="You'll be able to support us here very soon." />
        </p>
      )}
      <Link href="/crear" className="text-sm text-[var(--site-ink-soft)] underline-offset-4 hover:underline">
        <T es="Crear mi invitación" en="Create my invitation" />
      </Link>
    </article>
  );
}
