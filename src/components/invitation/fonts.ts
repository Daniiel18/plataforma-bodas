import { Allura, Cinzel, Great_Vibes, Parisienne, Pinyon_Script, Playfair_Display } from "next/font/google";

/**
 * Template fonts. Each one exposes a CSS variable and the template picks which
 * to use; the browser only downloads the fonts the invitation displays.
 */
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-great-vibes" });
const pinyon = Pinyon_Script({ weight: "400", subsets: ["latin"], variable: "--font-pinyon", preload: false });
const parisienne = Parisienne({ weight: "400", subsets: ["latin"], variable: "--font-parisienne", preload: false });
const allura = Allura({ weight: "400", subsets: ["latin"], variable: "--font-allura", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", preload: false });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", preload: false });

/** Classes that define every font variable; they go on the invitation root. */
export const invitationFonts = [greatVibes, pinyon, parisienne, allura, playfair, cinzel]
  .map((font) => font.variable)
  .join(" ");
