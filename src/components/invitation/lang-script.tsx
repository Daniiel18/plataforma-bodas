"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Sets `data-lang` on the container: the saved preference, otherwise the
 * phone's language (Spanish for Spanish phones, English for everything else).
 * Self-contained, because it is also serialized into an inline script.
 */
function applyLanguage(el: HTMLElement) {
  try {
    const saved = localStorage.getItem("inv-lang");
    let lang = saved;
    if (lang !== "es" && lang !== "en") {
      const nav = ((navigator.languages && navigator.languages[0]) || navigator.language || "es").toLowerCase();
      lang = nav.indexOf("es") === 0 ? "es" : "en";
    }
    el.setAttribute("data-lang", lang);
    document.documentElement.lang = lang;
  } catch {
    // Private browsing without storage: Spanish stays.
  }
}

const SCRIPT = `(${applyLanguage.toString()})(document.currentScript.parentElement)`;

const subscribe = () => () => {};

/**
 * Must be the first child of the `[data-lang-root]` container, so the language
 * is set before the browser paints. Server-rendered pages get an inline
 * script; pages drawn only in the browser (the builder's preview) apply the
 * same choice from an effect.
 */
export function LangScript() {
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = marker.current?.parentElement;
    if (inBrowser && el && !el.hasAttribute("data-lang")) applyLanguage(el);
  }, [inBrowser]);

  if (inBrowser) return <span ref={marker} hidden />;
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
