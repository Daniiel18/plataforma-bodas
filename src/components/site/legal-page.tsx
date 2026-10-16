import { T } from "@/components/invitation/lang";
import type { Bi } from "@/lib/sections";
import { CONTACT_EMAIL } from "@/lib/site";

export type LegalSection = { title: Bi; paragraphs: Bi[]; list?: Bi[] };

/** Long-form bilingual page (privacy, terms). */
export function LegalPage({ title, updated, sections }: { title: Bi; updated: Bi; sections: LegalSection[] }) {
  return (
    <article className="mx-auto grid w-full max-w-3xl gap-8 px-4 py-12 md:py-16">
      <header className="grid gap-2">
        <h1 className="font-heading text-4xl font-medium sm:text-5xl">
          <T es={title.es} en={title.en} />
        </h1>
        <p className="text-sm text-[var(--site-ink-soft)]">
          <T es={updated.es} en={updated.en} />
        </p>
      </header>
      {sections.map((section) => (
        <section key={section.title.es} className="grid gap-3">
          <h2 className="font-heading text-2xl font-medium">
            <T es={section.title.es} en={section.title.en} />
          </h2>
          {section.paragraphs.map((p) => (
            <p key={p.es} className="leading-relaxed text-[var(--site-ink-soft)]">
              <T es={p.es} en={p.en} />
            </p>
          ))}
          {section.list && (
            <ul className="grid list-disc gap-2 pl-5 leading-relaxed text-[var(--site-ink-soft)]">
              {section.list.map((item) => (
                <li key={item.es}>
                  <T es={item.es} en={item.en} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <section className="grid gap-3">
        <h2 className="font-heading text-2xl font-medium">
          <T es="Contacto" en="Contact" />
        </h2>
        <p className="leading-relaxed text-[var(--site-ink-soft)]">
          {CONTACT_EMAIL ? (
            <>
              <T es="Escríbenos a " en="Write to us at " />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--site-gold-deep)] underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>
              .
            </>
          ) : (
            <T
              es="Muy pronto publicaremos aquí nuestro correo de contacto."
              en="Our contact email will be published here very soon."
            />
          )}
        </p>
      </section>
    </article>
  );
}
