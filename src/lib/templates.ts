import type { CSSProperties } from "react";

import type { BackgroundKey } from "./backgrounds";

/**
 * Template catalog. Each template is plain data: colors, fonts, ornaments and
 * shapes. The invitation turns them into CSS variables and `data-*` attributes
 * (see invitation.css), so a new template is one more entry in this list, with
 * no CSS of its own.
 */

export type ScriptFont = "great-vibes" | "pinyon" | "parisienne" | "allura" | "serif-italic";
export type HeadingFont = "cormorant" | "playfair" | "cinzel";
export type OrnamentSet =
  "dried-flowers" | "roses" | "baby-breath" | "eucalyptus" | "pampas" | "art-deco" | "laurel" | "satin" | "none";
export type PhotoFrame = "polaroid" | "arch" | "oval" | "circle" | "deco" | "plain";
export type CardStyle = "soft" | "outline" | "gold" | "veil";
export type Collection = "clasica" | "romantica" | "minimal" | "botanica" | "glam" | "boho" | "noche";

type Colors = Record<
  "bg" | "paper" | "card" | "cardStrong" | "ink" | "inkSoft" | "onStrong" | "accent" | "gold" | "line",
  string
>;
type OrnamentColors = Record<"petal" | "petalAlt" | "leaf" | "leafAlt" | "stem" | "center", string>;

export type Template = {
  key: string;
  name: string;
  description: string;
  collection: Collection;
  colors: Colors;
  /** Flower and leaf colors; Champagne Clásico's are used when missing. */
  ornamentColors?: OrnamentColors;
  shadow?: string;
  tone?: "dark";
  script: ScriptFont;
  heading: HeadingFont;
  ornaments: OrnamentSet;
  frame: PhotoFrame;
  card: CardStyle;
  button: "pill" | "square";
  names: "ink" | "foil";
  /** Recommended background (the couple can pick another). */
  background: Exclude<BackgroundKey, "foto">;
};

export const COLLECTIONS: { key: Collection; label: string }[] = [
  { key: "clasica", label: "Clásicas" },
  { key: "romantica", label: "Románticas" },
  { key: "glam", label: "Glamour" },
  { key: "minimal", label: "Minimalistas" },
  { key: "botanica", label: "Botánicas" },
  { key: "boho", label: "Boho" },
  { key: "noche", label: "De noche" },
];

export const TEMPLATES = [
  {
    key: "champagne-clasico",
    name: "Champagne Clásico",
    description: "Papel texturizado, flores secas, foto polaroid y letra manuscrita.",
    collection: "clasica",
    colors: {
      bg: "#f6efe6",
      paper: "#fbf7f1",
      card: "#efe5d7",
      cardStrong: "#7a6758",
      ink: "#4a3f37",
      inkSoft: "#7d6e62",
      onStrong: "#fbf7f1",
      accent: "#6f5b4e",
      gold: "#c5a572",
      line: "#dccdb8",
    },
    script: "great-vibes",
    heading: "cormorant",
    ornaments: "dried-flowers",
    frame: "polaroid",
    card: "soft",
    button: "pill",
    names: "ink",
    background: "papel",
  },
  {
    key: "champagne-marfil",
    name: "Champagne & Marfil",
    description: "Marfil y champagne con rosas blancas, marco ovalado y brillo de satén.",
    collection: "romantica",
    colors: {
      bg: "#fbf7f0",
      paper: "#fffdf8",
      card: "#f3ebdd",
      cardStrong: "#8a7560",
      ink: "#4b4036",
      inkSoft: "#8a7d70",
      onStrong: "#fffdf8",
      accent: "#a2814f",
      gold: "#d1b47c",
      line: "#e7ddcc",
    },
    ornamentColors: {
      petal: "#fbf6ec",
      petalAlt: "#e6d6ba",
      leaf: "#bfc4a6",
      leafAlt: "#d6d9c3",
      stem: "#a38f6c",
      center: "#cdb58a",
    },
    script: "pinyon",
    heading: "cormorant",
    ornaments: "roses",
    frame: "oval",
    card: "soft",
    button: "pill",
    names: "foil",
    background: "seda",
  },
  {
    key: "beige-romantico",
    name: "Beige Romántico",
    description: "Beige suave con rosas melocotón, sello de lacre y fondo de acuarela.",
    collection: "romantica",
    colors: {
      bg: "#f6ede5",
      paper: "#fdf8f3",
      card: "#f0e2d7",
      cardStrong: "#8c6f62",
      ink: "#4d3b33",
      inkSoft: "#8f776b",
      onStrong: "#fdf8f3",
      accent: "#a07867",
      gold: "#caa77a",
      line: "#e5d2c4",
    },
    ornamentColors: {
      petal: "#f3d9cb",
      petalAlt: "#e7bfab",
      leaf: "#bcbd9f",
      leafAlt: "#d3d4bd",
      stem: "#a8917a",
      center: "#c99a83",
    },
    script: "parisienne",
    heading: "cormorant",
    ornaments: "roses",
    frame: "polaroid",
    card: "soft",
    button: "pill",
    names: "ink",
    background: "acuarela",
  },
  {
    key: "dorado-elegante",
    name: "Dorado Elegante",
    description: "Champagne con detalles dorados, marcos en arco y nombres en dorado.",
    collection: "glam",
    colors: {
      bg: "#f4ead9",
      paper: "#fbf5ea",
      card: "#efe2c9",
      cardStrong: "#5b4630",
      ink: "#3e3122",
      inkSoft: "#7d6a52",
      onStrong: "#fbf5ea",
      accent: "#8e6f3e",
      gold: "#c9a24d",
      line: "#d9c39a",
    },
    ornamentColors: {
      petal: "#e6cf98",
      petalAlt: "#f1e2bd",
      leaf: "#dcc79a",
      leafAlt: "#ead9b2",
      stem: "#b08a3e",
      center: "#9c7a37",
    },
    script: "great-vibes",
    heading: "cormorant",
    ornaments: "dried-flowers",
    frame: "arch",
    card: "gold",
    button: "pill",
    names: "foil",
    background: "papel",
  },
  {
    key: "satin-champagne",
    name: "Satín Champagne",
    description: "Lazos de satén, paniculata y nombres en dorado sobre seda.",
    collection: "glam",
    colors: {
      bg: "#f2e8da",
      paper: "#faf4ea",
      card: "#ebdcc6",
      cardStrong: "#6e5940",
      ink: "#45372a",
      inkSoft: "#85725e",
      onStrong: "#faf4ea",
      accent: "#9a7b4f",
      gold: "#c8a46a",
      line: "#ddc9a9",
    },
    ornamentColors: {
      petal: "#e9d6b4",
      petalAlt: "#f6ecdb",
      leaf: "#cfc3a6",
      leafAlt: "#e2d8c2",
      stem: "#b39770",
      center: "#d9c39b",
    },
    script: "allura",
    heading: "cormorant",
    ornaments: "satin",
    frame: "deco",
    card: "gold",
    button: "pill",
    names: "foil",
    background: "seda",
  },
  {
    key: "art-deco",
    name: "Art Déco Champagne",
    description: "Geometría dorada de los años 20, letras romanas y marcos dobles.",
    collection: "glam",
    colors: {
      bg: "#f3ebdd",
      paper: "#faf5ec",
      card: "#ede1cd",
      cardStrong: "#2f2a24",
      ink: "#2f2a24",
      inkSoft: "#6f6556",
      onStrong: "#f3e6cc",
      accent: "#957438",
      gold: "#c3a05a",
      line: "#d3bd90",
    },
    ornamentColors: {
      petal: "#e8d6ac",
      petalAlt: "#f3e7cc",
      leaf: "#d9c49a",
      leafAlt: "#eadcbc",
      stem: "#b08f4f",
      center: "#9b7a3e",
    },
    script: "pinyon",
    heading: "cinzel",
    ornaments: "art-deco",
    frame: "deco",
    card: "gold",
    button: "square",
    names: "foil",
    background: "art-deco",
  },
  {
    key: "luz-de-velas",
    name: "Luz de Velas",
    description: "La calidez de una boda al atardecer: destellos dorados y paniculata.",
    collection: "romantica",
    colors: {
      bg: "#f0e5d4",
      paper: "#f9f1e4",
      card: "#e9d9c1",
      cardStrong: "#5a4632",
      ink: "#3f3123",
      inkSoft: "#806b55",
      onStrong: "#f9f1e4",
      accent: "#9c7643",
      gold: "#d4ae6a",
      line: "#dec7a0",
    },
    ornamentColors: {
      petal: "#fbf5ea",
      petalAlt: "#efe3cd",
      leaf: "#cdbf9f",
      leafAlt: "#ded3b9",
      stem: "#b4996f",
      center: "#d9b97c",
    },
    script: "great-vibes",
    heading: "cormorant",
    ornaments: "baby-breath",
    frame: "circle",
    card: "soft",
    button: "pill",
    names: "foil",
    background: "destellos",
  },
  {
    key: "beige-minimal",
    name: "Beige Minimal",
    description: "Limpio y moderno: mucho espacio en blanco, líneas finas y sin flores.",
    collection: "minimal",
    colors: {
      bg: "#f8f5f0",
      paper: "#fffdf9",
      card: "#f1ebe2",
      cardStrong: "#3d3833",
      ink: "#2f2a26",
      inkSoft: "#7a7068",
      onStrong: "#fffdf9",
      accent: "#3d3833",
      gold: "#b9a58a",
      line: "#ddd3c5",
    },
    shadow: "none",
    script: "serif-italic",
    heading: "cormorant",
    ornaments: "none",
    frame: "plain",
    card: "outline",
    button: "square",
    names: "ink",
    background: "liso",
  },
  {
    key: "blanco-oro",
    name: "Blanco y Oro",
    description: "Blanco puro, laurel dorado y tipografía editorial.",
    collection: "minimal",
    colors: {
      bg: "#fdfcf9",
      paper: "#ffffff",
      card: "#f6f2ea",
      cardStrong: "#3a342c",
      ink: "#2d2924",
      inkSoft: "#7d756a",
      onStrong: "#fdfaf3",
      accent: "#a9884c",
      gold: "#cfae6b",
      line: "#ece4d5",
    },
    ornamentColors: {
      petal: "#f3e6c6",
      petalAlt: "#faf3e2",
      leaf: "#e3cf9f",
      leafAlt: "#f0e3c3",
      stem: "#c4a15c",
      center: "#b89350",
    },
    shadow: "0 18px 40px -28px rgb(60 50 35 / 0.35)",
    script: "pinyon",
    heading: "playfair",
    ornaments: "laurel",
    frame: "circle",
    card: "outline",
    button: "square",
    names: "foil",
    background: "rayas",
  },
  {
    key: "jardin-salvia",
    name: "Jardín de Salvia",
    description: "Marfil y verde salvia con eucalipto y marcos en arco.",
    collection: "botanica",
    colors: {
      bg: "#f4f3eb",
      paper: "#fbfbf6",
      card: "#e6e8dc",
      cardStrong: "#5f6b55",
      ink: "#3d4136",
      inkSoft: "#737a69",
      onStrong: "#fbfbf6",
      accent: "#66755a",
      gold: "#c2a878",
      line: "#d6d9c7",
    },
    ornamentColors: {
      petal: "#f5f2e6",
      petalAlt: "#e9e3cf",
      leaf: "#b6c2a6",
      leafAlt: "#ccd5bf",
      stem: "#8b977c",
      center: "#c2a878",
    },
    script: "great-vibes",
    heading: "cormorant",
    ornaments: "eucalyptus",
    frame: "arch",
    card: "soft",
    button: "pill",
    names: "ink",
    background: "botanico",
  },
  {
    key: "rosa-empolvado",
    name: "Rosa Empolvado",
    description: "Rosa empolvado y champagne con rosas y fondo de encaje.",
    collection: "romantica",
    colors: {
      bg: "#f7ece8",
      paper: "#fdf8f6",
      card: "#f1dfd9",
      cardStrong: "#8a5f5b",
      ink: "#4f3634",
      inkSoft: "#93726e",
      onStrong: "#fdf8f6",
      accent: "#a46c67",
      gold: "#cfa982",
      line: "#ead2cb",
    },
    ornamentColors: {
      petal: "#f3d3cd",
      petalAlt: "#e6aea6",
      leaf: "#bdc2a8",
      leafAlt: "#d3d7c1",
      stem: "#ad8e86",
      center: "#c98d86",
    },
    script: "parisienne",
    heading: "cormorant",
    ornaments: "roses",
    frame: "oval",
    card: "soft",
    button: "pill",
    names: "ink",
    background: "encaje",
  },
  {
    key: "pampa-rustica",
    name: "Pampa Rústica",
    description: "Estilo boho: plumas de pampa, tonos arena y textura de lino.",
    collection: "boho",
    colors: {
      bg: "#f2e9dc",
      paper: "#faf4ea",
      card: "#eadcc8",
      cardStrong: "#7a5c45",
      ink: "#4a3828",
      inkSoft: "#87705a",
      onStrong: "#faf4ea",
      accent: "#a0705a",
      gold: "#c9a77c",
      line: "#ddc9ae",
    },
    ornamentColors: {
      petal: "#d6bd96",
      petalAlt: "#e3cfae",
      leaf: "#cbb89a",
      leafAlt: "#ddcdb3",
      stem: "#a88b68",
      center: "#b68f66",
    },
    script: "allura",
    heading: "cormorant",
    ornaments: "pampas",
    frame: "polaroid",
    card: "soft",
    button: "pill",
    names: "ink",
    background: "lino",
  },
  {
    key: "borgona-champagne",
    name: "Borgoña & Champagne",
    description: "Champagne con rosas color vino y estampado de damasco.",
    collection: "clasica",
    colors: {
      bg: "#f4ece2",
      paper: "#fbf6ef",
      card: "#ecdfd0",
      cardStrong: "#6b2d38",
      ink: "#3e2a2a",
      inkSoft: "#7f6461",
      onStrong: "#fbf1ea",
      accent: "#7b2f3e",
      gold: "#c6a15e",
      line: "#dccbb6",
    },
    ornamentColors: {
      petal: "#9c4656",
      petalAlt: "#c26e7c",
      leaf: "#a9ae8f",
      leafAlt: "#c3c6ae",
      stem: "#8a7a62",
      center: "#5e2230",
    },
    script: "great-vibes",
    heading: "cormorant",
    ornaments: "roses",
    frame: "arch",
    card: "soft",
    button: "pill",
    names: "ink",
    background: "damasco",
  },
  {
    key: "noche-champagne",
    name: "Noche Champagne",
    description: "Moka profundo con dorado champagne, para bodas de noche.",
    collection: "noche",
    colors: {
      bg: "#221c18",
      paper: "#2b241f",
      card: "#332a24",
      cardStrong: "#cdb07e",
      ink: "#f1e6d4",
      inkSoft: "#bcab93",
      onStrong: "#221c18",
      accent: "#d8b77c",
      gold: "#c9a56a",
      line: "#4a3f35",
    },
    ornamentColors: {
      petal: "#e3cfa4",
      petalAlt: "#bfa678",
      leaf: "#a58f68",
      leafAlt: "#c2ab80",
      stem: "#b39463",
      center: "#e8d3a6",
    },
    shadow: "0 20px 44px -26px rgb(0 0 0 / 0.75)",
    tone: "dark",
    script: "pinyon",
    heading: "cormorant",
    ornaments: "laurel",
    frame: "arch",
    card: "veil",
    button: "pill",
    names: "foil",
    background: "destellos",
  },
] as const satisfies readonly Template[];

export type TemplateKey = (typeof TEMPLATES)[number]["key"];

export const DEFAULT_TEMPLATE: TemplateKey = "champagne-clasico";

/** Optional accent colors (buttons and names). */
export const ACCENTS = [
  { value: "#6f5b4e", label: "Moka" },
  { value: "#8e6f3e", label: "Dorado" },
  { value: "#7d8b6a", label: "Salvia" },
  { value: "#6b7c93", label: "Azul polvo" },
  { value: "#7b3f4a", label: "Vino" },
  { value: "#a0644a", label: "Terracota" },
] as const;

export type AccentValue = (typeof ACCENTS)[number]["value"];

export function resolveTemplate(key: string | null | undefined): TemplateKey {
  return TEMPLATES.some((t) => t.key === key) ? (key as TemplateKey) : DEFAULT_TEMPLATE;
}

export function getTemplate(key: string | null | undefined): Template {
  const resolved = resolveTemplate(key);
  return TEMPLATES.find((t) => t.key === resolved)!;
}

/** Dark templates keep their own gold: accents are meant for light backgrounds. */
export function acceptsAccent(template: Template): boolean {
  return template.tone !== "dark";
}

export function resolveAccent(overrides: unknown): AccentValue | null {
  const accent = (overrides as { accent?: unknown } | null)?.accent;
  return ACCENTS.some((a) => a.value === accent) ? (accent as AccentValue) : null;
}

const SCRIPT_FONT: Record<ScriptFont, string> = {
  "great-vibes": "var(--font-great-vibes)",
  pinyon: "var(--font-pinyon)",
  parisienne: "var(--font-parisienne)",
  allura: "var(--font-allura)",
  "serif-italic": "var(--font-serif)",
};

const HEADING_FONT: Record<HeadingFont, string> = {
  cormorant: "var(--font-serif)",
  playfair: "var(--font-playfair)",
  cinzel: "var(--font-cinzel)",
};

/** The template's CSS variables (plus the chosen accent, when the template allows it). */
export function themeStyle(template: Template, accent: string | null): CSSProperties {
  const c = template.colors;
  const vars: Record<string, string> = {
    "--inv-bg": c.bg,
    "--inv-paper": c.paper,
    "--inv-card": c.card,
    "--inv-card-strong": c.cardStrong,
    "--inv-ink": c.ink,
    "--inv-ink-soft": c.inkSoft,
    "--inv-on-strong": c.onStrong,
    "--inv-accent": (acceptsAccent(template) && accent) || c.accent,
    "--inv-gold": c.gold,
    "--inv-line": c.line,
    "--inv-font-script": SCRIPT_FONT[template.script],
    "--inv-font-heading": HEADING_FONT[template.heading],
  };
  if (template.shadow) vars["--inv-shadow"] = template.shadow;
  const o = template.ornamentColors;
  if (o) {
    vars["--inv-orn-petal"] = o.petal;
    vars["--inv-orn-petal-alt"] = o.petalAlt;
    vars["--inv-orn-leaf"] = o.leaf;
    vars["--inv-orn-leaf-alt"] = o.leafAlt;
    vars["--inv-orn-stem"] = o.stem;
    vars["--inv-orn-center"] = o.center;
  }
  return vars as CSSProperties;
}

/** `data-*` attributes that enable the shape variants in invitation.css. */
export function themeAttributes(template: Template, background: BackgroundKey) {
  return {
    "data-bg": background,
    "data-card": template.card,
    "data-frame": template.frame,
    "data-button": template.button,
    "data-names": template.names,
    "data-heading": template.heading,
    "data-script": template.script === "serif-italic" ? "italic" : "script",
    "data-ornaments": template.ornaments,
    "data-tone": template.tone ?? "light",
  } as const;
}
