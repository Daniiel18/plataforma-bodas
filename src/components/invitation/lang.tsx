import type { ReactNode } from "react";

import type { Bi } from "@/lib/sections";

/**
 * Texto bilingüe: se renderizan ambas versiones y el CSS muestra la del
 * idioma activo. Así cambiar de idioma es instantáneo y no corta la música.
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
 * Debe ser el primer hijo del contenedor `.invitation`: decide el idioma
 * antes de que el navegador pinte (preferencia guardada o idioma del
 * celular; español si el celular está en español, inglés en cualquier otro).
 */
export function LangScript() {
  const code = `(function(){try{var el=document.currentScript.parentElement;var saved=localStorage.getItem("inv-lang");var lang;if(saved==="es"||saved==="en"){lang=saved}else{var nav=((navigator.languages&&navigator.languages[0])||navigator.language||"es").toLowerCase();lang=nav.indexOf("es")===0?"es":"en"}el.setAttribute("data-lang",lang);document.documentElement.lang=lang}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
