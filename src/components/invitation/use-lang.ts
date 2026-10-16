"use client";

import { useSyncExternalStore } from "react";

export type Lang = "es" | "en";

const EVENT = "inv-lang-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

/** The element whose `data-lang` drives the page: the invitation or the platform site. */
const root = () => document.querySelector("[data-lang-root]");

function getSnapshot(): Lang {
  return root()?.getAttribute("data-lang") === "en" ? "en" : "es";
}

/** The page's active language (for attributes such as alt or aria-label). */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getSnapshot, () => "es");
}

export function setLang(lang: Lang) {
  root()?.setAttribute("data-lang", lang);
  document.documentElement.lang = lang;
  try {
    localStorage.setItem("inv-lang", lang);
  } catch {
    // Private browsing: the change only applies to this visit.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Picks the text for the active language. */
export function pick<T>(lang: Lang, es: T, en: T) {
  return lang === "en" ? en : es;
}
