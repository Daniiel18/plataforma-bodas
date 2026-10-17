import type { CSSProperties } from "react";

import {
  appliedContrast,
  photoBackdropStyle,
  type BackgroundKey,
  type PhotoVeil,
  type TextContrast,
} from "@/lib/backgrounds";
import type { MediaImage } from "@/lib/media";
import { FRAME } from "@/lib/photo-crop";
import { themeAttributes, themeStyle, type Template } from "@/lib/templates";
import { cn } from "@/lib/utils";

import { Ornament } from "./decorations";
import { FramedPhoto } from "./framed-photo";
import { invitationFonts } from "./fonts";

type Props = {
  template: Template;
  background: BackgroundKey;
  accent: string | null;
  couple: string;
  /** The wedding's cover photo (a template gradient when there is none). */
  cover?: MediaImage | null;
  /** Background photo, for the "Tu foto" background. */
  backgroundPhoto?: MediaImage | null;
  veil?: PhotoVeil;
  contrast?: TextContrast;
  size?: "card" | "large";
  className?: string;
};

const SIZES = {
  card: {
    root: "inv-mini px-4 py-6",
    names: "text-[1.7rem]",
    photo: "w-20 p-1.5 pb-4",
    sprig: "-top-5 -left-5 w-14",
    flowers: "-bottom-5 -left-6 w-12",
    card: "mt-4 px-3 py-3",
    cardText: "text-xs",
    button: "mt-4",
  },
  large: {
    root: "inv-mini inv-mini-lg px-6 py-9",
    names: "text-[2.6rem]",
    photo: "w-36 p-2.5 pb-8",
    sprig: "-top-6 -left-6 w-20",
    flowers: "-bottom-8 -left-10 w-20",
    card: "mt-7 px-4 py-4",
    cardText: "text-base",
    button: "mt-6",
  },
};

/** Scaled-down invitation with a template and a background applied. */
export function ThemePreview({
  template,
  background,
  accent,
  couple,
  cover = null,
  backgroundPhoto = null,
  veil = "medio",
  contrast = "auto",
  size = "card",
  className,
}: Props) {
  const s = SIZES[size];
  const style = {
    ...themeStyle(template, accent),
    ...(background === "foto" ? photoBackdropStyle(backgroundPhoto, veil) : {}),
    minHeight: 0,
  } as CSSProperties;

  return (
    <div
      className={cn(`invitation ${invitationFonts} relative overflow-hidden text-center`, s.root, className)}
      style={style}
      {...themeAttributes(template, background)}
      data-contrast={appliedContrast(contrast, background, veil)}
    >
      <div className="inv-backdrop inv-backdrop-contained" aria-hidden />
      <Ornament
        set={template.ornaments}
        variant="secondary"
        className={cn("pointer-events-none absolute rotate-[-20deg] opacity-70", s.sprig)}
      />
      <p className="inv-heading text-[var(--inv-ink-soft)]">La boda de</p>
      <p className={cn("inv-script mt-1 leading-tight text-[var(--inv-accent)]", s.names)}>
        <span className="inv-names">{couple}</span>
      </p>
      <div
        className={cn(
          "inv-polaroid relative mx-auto mt-3 rotate-[-2deg] bg-[var(--inv-paper)] shadow-[var(--inv-shadow)]",
          s.photo,
        )}
      >
        <span className="inv-polaroid-tape absolute -top-1.5 left-1/2 h-3 w-1/2 -translate-x-1/2 rotate-[3deg]" />
        <div className="inv-polaroid-photo relative aspect-[4/5] overflow-hidden bg-[linear-gradient(160deg,var(--inv-card),var(--inv-card-strong))]">
          {cover && <FramedPhoto photo={cover} frame={FRAME.cover} alt="" width={160} />}
        </div>
        <Ornament set={template.ornaments} className={cn("pointer-events-none absolute rotate-[-12deg]", s.flowers)} />
      </div>
      <div className={cn("inv-card", s.card)}>
        <p className="inv-heading">Programa del día</p>
        <p className={cn("mt-1", s.cardText)}>3:00 PM · Ceremonia</p>
      </div>
      <span className={cn("inv-button", s.button)}>Confirmar asistencia</span>
    </div>
  );
}

/** Just the background, for picking it in the dashboard. */
export function BackgroundSwatch({
  template,
  background,
  backgroundPhoto = null,
  veil = "medio",
  className,
}: {
  template: Template;
  background: BackgroundKey;
  backgroundPhoto?: MediaImage | null;
  veil?: PhotoVeil;
  className?: string;
}) {
  const style = {
    ...themeStyle(template, null),
    ...(background === "foto" ? photoBackdropStyle(backgroundPhoto, veil) : {}),
    minHeight: 0,
  } as CSSProperties;
  return (
    <div
      className={cn(`invitation ${invitationFonts} relative grid place-items-center overflow-hidden`, className)}
      style={style}
      {...themeAttributes(template, background)}
    >
      <div className="inv-backdrop inv-backdrop-contained" aria-hidden />
      <span className="inv-script text-2xl text-[var(--inv-accent)]">Aa</span>
    </div>
  );
}
