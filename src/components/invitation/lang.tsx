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

export { LangScript } from "./lang-script";
