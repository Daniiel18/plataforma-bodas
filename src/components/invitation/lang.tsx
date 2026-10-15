import type { ReactNode } from "react";

import type { Bi } from "@/lib/sections";

/**
 * Bilingual text: both versions are rendered and CSS shows the active
 * language, so switching is instant and never interrupts the music.
 */
export function T({ es, en }: { es: ReactNode; en: ReactNode }) {
  return (
    <>
      <span className="l-es" lang="es">
        {es}
      </span>
      <span className="l-en" lang="en">
        {en}
      </span>
    </>
  );
}

export function TB({ text }: { text: Bi }) {
  return <T es={text.es} en={text.en} />;
}

/**
 * Must be the first child of the `.invitation` container: it picks the
 * language before the browser paints (saved preference, otherwise the phone's
 * language: Spanish for Spanish phones, English for everything else).
 */
export function LangScript() {
  const code = `(function(){try{var el=document.currentScript.parentElement;var saved=localStorage.getItem("inv-lang");var lang;if(saved==="es"||saved==="en"){lang=saved}else{var nav=((navigator.languages&&navigator.languages[0])||navigator.language||"es").toLowerCase();lang=nav.indexOf("es")===0?"es":"en"}el.setAttribute("data-lang",lang);document.documentElement.lang=lang}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
