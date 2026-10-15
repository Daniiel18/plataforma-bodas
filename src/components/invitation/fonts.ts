import { Allura, Cinzel, Great_Vibes, Parisienne, Pinyon_Script, Playfair_Display } from "next/font/google";

/**
 * Tipografías de las plantillas. Cada una expone una variable CSS y la plantilla
 * elige cuál usar; el navegador solo descarga las que la invitación muestra.
 */
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-great-vibes" });
const pinyon = Pinyon_Script({ weight: "400", subsets: ["latin"], variable: "--font-pinyon", preload: false });
const parisienne = Parisienne({ weight: "400", subsets: ["latin"], variable: "--font-parisienne", preload: false });
const allura = Allura({ weight: "400", subsets: ["latin"], variable: "--font-allura", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", preload: false });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", preload: false });

/** Clases que definen todas las variables de fuente; van en la raíz de la invitación. */
export const invitationFonts = [greatVibes, pinyon, parisienne, allura, playfair, cinzel]
  .map((font) => font.variable)
  .join(" ");
