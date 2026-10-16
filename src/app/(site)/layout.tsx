import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { LangScript, T } from "@/components/invitation/lang";
import { SiteLanguageToggle } from "@/components/site/site-language-toggle";
import { BRAND, CONTACT_EMAIL } from "@/lib/site";

/** Shell of the platform pages: landing, legal pages. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="site flex flex-1 flex-col" data-lang-root suppressHydrationWarning>
      <LangScript />
      <header className="sticky top-0 z-40 border-b border-[var(--site-line)]/70 bg-[var(--site-bg)]/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" aria-label={BRAND} className="text-base">
            <Logo markClassName="size-8" />
          </Link>
          <nav className="flex items-center gap-1 text-sm sm:gap-2">
            <Link
              href="/demo"
              className="hidden rounded-full px-3 py-2 text-[var(--site-ink-soft)] hover:text-[var(--site-ink)] sm:inline-flex"
            >
              <T es="Ver demo" en="See demo" />
            </Link>
            <Link
              href="/entrar"
              className="rounded-full px-3 py-2 text-[var(--site-ink-soft)] hover:text-[var(--site-ink)]"
            >
              <T es="Entrar" en="Sign in" />
            </Link>
            <SiteLanguageToggle />
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t border-[var(--site-line)] bg-[var(--site-paper)]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="grid content-start gap-3">
            <Logo />
            <p className="max-w-xs text-sm text-[var(--site-ink-soft)]">
              <T
                es="La web de tu boda, hecha con cariño y gratis para siempre."
                en="Your wedding website, made with love and free forever."
              />
            </p>
          </div>
          <nav className="grid content-start gap-2 text-sm">
            <p className="font-medium">
              <T es="Producto" en="Product" />
            </p>
            <Link href="/crear" className="text-[var(--site-ink-soft)] hover:text-[var(--site-ink)]">
              <T es="Crear mi invitación" en="Create my invitation" />
            </Link>
            <Link href="/demo" className="text-[var(--site-ink-soft)] hover:text-[var(--site-ink)]">
              <T es="Ver demo" en="See demo" />
            </Link>
            <Link href="/panel" className="text-[var(--site-ink-soft)] hover:text-[var(--site-ink)]">
              <T es="Panel de los novios" en="Couple's dashboard" />
            </Link>
          </nav>
          <nav className="grid content-start gap-2 text-sm">
            <p className="font-medium">Legal</p>
            <Link href="/privacidad" className="text-[var(--site-ink-soft)] hover:text-[var(--site-ink)]">
              <T es="Privacidad" en="Privacy" />
            </Link>
            <Link href="/terminos" className="text-[var(--site-ink-soft)] hover:text-[var(--site-ink)]">
              <T es="Términos" en="Terms" />
            </Link>
            {CONTACT_EMAIL && (
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--site-ink-soft)] hover:text-[var(--site-ink)]">
                {CONTACT_EMAIL}
              </a>
            )}
          </nav>
        </div>
        <p className="border-t border-[var(--site-line)] px-4 py-5 text-center text-xs text-[var(--site-ink-soft)]">
          © 2026 {BRAND}
        </p>
      </footer>
    </div>
  );
}
