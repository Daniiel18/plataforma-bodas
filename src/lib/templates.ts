/**
 * Plantillas de la invitación. Cada una es una clase CSS (`tpl-<key>`)
 * que redefine colores, tipografía y decoraciones en invitation.css.
 */
export const TEMPLATES = [
  {
    key: "champagne-clasico",
    name: "Champagne Clásico",
    description: "Papel texturizado, flores secas, foto polaroid y letra manuscrita.",
    swatches: ["#f6efe6", "#efe5d7", "#7a6758", "#c5a572"],
  },
  {
    key: "beige-minimal",
    name: "Beige Minimal",
    description: "Limpio y moderno: mucho espacio en blanco, líneas finas y sin flores.",
    swatches: ["#f8f5f0", "#f1ebe2", "#3d3833", "#b9a58a"],
  },
  {
    key: "dorado-elegante",
    name: "Dorado Elegante",
    description: "Champagne con detalles dorados, marcos en arco y nombres en dorado.",
    swatches: ["#f4ead9", "#efe2c9", "#5b4630", "#c9a24d"],
  },
] as const;

export type TemplateKey = (typeof TEMPLATES)[number]["key"];

export const DEFAULT_TEMPLATE: TemplateKey = "champagne-clasico";

/** Colores de acento opcionales (botones y nombres). */
export const ACCENTS = [
  { value: "#6f5b4e", label: "Moka" },
  { value: "#8e6f3e", label: "Dorado" },
  { value: "#7d8b6a", label: "Salvia" },
  { value: "#6b7c93", label: "Azul polvo" },
  { value: "#7b3f4a", label: "Vino" },
  { value: "#a0644a", label: "Terracota" },
] as const;

export function resolveTemplate(key: string | null | undefined): TemplateKey {
  return TEMPLATES.some((t) => t.key === key) ? (key as TemplateKey) : DEFAULT_TEMPLATE;
}

export function resolveAccent(overrides: unknown): string | null {
  const accent = (overrides as { accent?: unknown } | null)?.accent;
  return ACCENTS.some((a) => a.value === accent) ? (accent as string) : null;
}
