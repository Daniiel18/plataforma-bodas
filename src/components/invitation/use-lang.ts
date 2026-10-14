"use client";

import { useSyncExternalStore } from "react";

export type Lang = "es" | "en";

const EVENT = "inv-lang-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function getSnapshot(): Lang {
  return document.querySelector(".invitation")?.getAttribute("data-lang") === "en" ? "en" : "es";
}

/** Idioma activo de la invitación (para atributos como alt o aria-label). */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getSnapshot, () => "es");
}

export function setLang(lang: Lang) {
  document.querySelector(".invitation")?.setAttribute("data-lang", lang);
  document.documentElement.lang = lang;
  try {
    localStorage.setItem("inv-lang", lang);
  } catch {
    // Navegación privada: el cambio aplica solo a esta visita.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Elige el texto del idioma activo. */
export function pick<T>(lang: Lang, es: T, en: T) {
  return lang === "en" ? en : es;
}
