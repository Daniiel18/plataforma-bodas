"use client";

import { LanguagesIcon } from "lucide-react";

import { setLang, useLang } from "./use-lang";

export function LanguageToggle() {
  const lang = useLang();
  const next = lang === "es" ? "en" : "es";

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
      className="fixed top-4 right-4 z-[70] flex items-center gap-1.5 rounded-full bg-[var(--inv-paper)]/90 px-3 py-1.5 text-xs font-semibold tracking-[0.15em] text-[var(--inv-accent)] shadow-md ring-1 ring-[var(--inv-line)] backdrop-blur"
    >
      <LanguagesIcon className="size-3.5" aria-hidden />
      {next.toUpperCase()}
    </button>
  );
}
