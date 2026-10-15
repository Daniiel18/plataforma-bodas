"use client";

import type { CSSProperties, ReactNode } from "react";

import { veilStrength } from "@/lib/backgrounds";
import type { InvitationData, SectionView } from "@/lib/section-view";
import type { Bi } from "@/lib/sections";
import { getTemplate, themeAttributes, themeStyle } from "@/lib/templates";
import { cn } from "@/lib/utils";

import { invitationFonts } from "./fonts";
import { renderSection } from "./invitation-view";

/**
 * One section of the invitation, drawn with the couple's template, background
 * and fonts, for the dashboard's content editor.
 */
export function SectionPreview({
  data,
  view,
  children,
  className,
}: {
  data: InvitationData;
  /** The section to draw; `children` is used instead when absent (e.g. the envelope). */
  view?: SectionView | null;
  children?: ReactNode;
  className?: string;
}) {
  const template = getTemplate(data.template);
  const { photo, veil } = data.background;
  const style = {
    ...themeStyle(template, data.accent),
    ...(photo ? { "--inv-bg-photo": `url("${photo}")`, "--inv-veil": veilStrength(veil) } : {}),
    minHeight: 0,
  } as CSSProperties;

  return (
    <div
      className={cn(`invitation ${invitationFonts} relative overflow-hidden`, className)}
      style={style}
      {...themeAttributes(template, data.background.key)}
    >
      <div className="inv-backdrop inv-backdrop-contained" aria-hidden />
      {view ? renderSection(view, data, true) : children}
    </div>
  );
}

/** Static version of the opening envelope (the real one covers the whole screen). */
export function EnvelopePreview({
  data,
  title,
  subtitle,
  button,
}: {
  data: InvitationData;
  title: Bi;
  subtitle: Bi | null;
  button: Bi;
}) {
  const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;
  const p1 = first(data.couple.partner1);
  const p2 = first(data.couple.partner2);

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-10 text-center">
      <p className="inv-script text-4xl leading-tight text-[var(--inv-accent)]">
        {p1}
        <span className="mx-2 align-middle text-2xl">&amp;</span>
        {p2}
      </p>
      <span className="inv-envelope pointer-events-none !w-64" aria-hidden>
        <span className="inv-envelope-body" />
        <span className="inv-envelope-pocket" />
        <span className="inv-envelope-flap" />
        <span className="inv-seal inv-script text-lg">
          {p1[0]}
          {p2[0]}
        </span>
      </span>
      <div className="grid gap-2">
        <p className="text-lg italic">{title.es}</p>
        {subtitle && <p className="text-[var(--inv-ink-soft)]">{subtitle.es}</p>}
        <span className="inv-button mx-auto">{button.es}</span>
      </div>
    </div>
  );
}
