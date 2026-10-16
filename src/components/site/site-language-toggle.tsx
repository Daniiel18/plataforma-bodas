"use client";

import { LanguagesIcon } from "lucide-react";

import { setLang, useLang } from "@/components/invitation/use-lang";

/** ES / EN switch of the platform site (same preference as the invitations). */
export function SiteLanguageToggle() {
  const lang = useLang();
  const next = lang === "es" ? "en" : "es";

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
      className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold tracking-[0.15em] text-[var(--site-gold-deep)] ring-1 ring-[var(--site-line)] transition hover:bg-[var(--site-champagne)]"
    >
      <LanguagesIcon className="size-3.5" aria-hidden />
      {next.toUpperCase()}
    </button>
  );
}
