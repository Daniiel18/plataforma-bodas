"use client";

import "@/components/invitation/invitation.css";

import { MusicIcon } from "lucide-react";

import { EnvelopePreview, SectionPreview } from "@/components/invitation/section-preview";
import { ThemePreview } from "@/components/invitation/theme-preview";
import type { BuilderDraft, StepKey } from "@/lib/builder/draft";
import { findTrack } from "@/lib/music-library";
import { buildSectionView, type InvitationData, type ViewContext } from "@/lib/section-view";
import { parseContent, type SectionType } from "@/lib/sections";
import { getTemplate } from "@/lib/templates";

const STEP_SECTION: Partial<Record<StepKey, SectionType>> = {
  fecha: "celebration",
  padres: "parents",
  celebracion: "celebration",
  lugar: "location",
  programa: "program",
  vestimenta: "dress_code",
  fotos: "gallery",
  regalos: "gifts",
  confirmaciones: "rsvp",
};

const EMPTY: Partial<Record<StepKey, string>> = {
  fecha: "Elijan la fecha para ver la cuenta regresiva y el calendario.",
  padres: "Escriban al menos un nombre para ver esta sección.",
  lugar: "Escriban el lugar o la dirección para ver el mapa.",
  programa: "Agreguen al menos una actividad con su hora.",
  vestimenta: "Escriban la descripción para ver esta sección.",
  fotos: "Añadan fotos para ver el carrusel en 3D.",
  regalos: "Activen una forma de regalo y escriban sus datos para ver la caja de regalo.",
};

/** How the current step looks with the chosen template. */
export function StepPreview({
  step,
  draft,
  data,
  ctx,
}: {
  step: StepKey;
  draft: BuilderDraft;
  data: InvitationData;
  ctx: ViewContext;
}) {
  if (step === "plantilla") {
    const template = getTemplate(draft.appearance.template);
    return (
      <ThemePreview
        template={template}
        background={data.background.key}
        accent={data.accent}
        couple={`${first(data.couple.partner1)} & ${first(data.couple.partner2)}`}
        cover={data.cover}
        backgroundPhoto={data.background.photo}
        veil={data.background.veil}
        size="large"
        className="mx-auto w-full max-w-xs rounded-xl border"
      />
    );
  }

  if (step === "nombres" || step === "portada") {
    const intro = data.intro;
    const heroView = buildSectionView("hero", draft.sections.hero.content, draft.translations.hero ?? {}, ctx);
    return (
      <div className="grid gap-3">
        {intro && (
          <SectionPreview data={data} className="rounded-xl border">
            <EnvelopePreview data={data} title={intro.title} subtitle={intro.subtitle} button={intro.button} />
          </SectionPreview>
        )}
        {step === "portada" && heroView && <SectionPreview data={data} view={heroView} className="rounded-xl border" />}
      </div>
    );
  }

  if (step === "musica") {
    const music = parseContent("music", draft.sections.music.content);
    const track = findTrack(music.track);
    const ready = Boolean(track || draft.media.audio);
    return (
      <SectionPreview data={data} className="rounded-xl border">
        <div className="grid justify-items-center gap-3 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[var(--inv-accent)] text-[var(--inv-on-strong)] shadow-lg">
            <MusicIcon className="size-6" />
          </span>
          <p className="inv-heading text-lg">
            {track ? track.title.es : draft.media.audio ? "Su canción está lista" : "Aún sin canción"}
          </p>
          <p className="max-w-xs text-sm text-[var(--inv-ink-soft)]">
            {ready
              ? music.autoplay_on_open
                ? "Empezará a sonar cuando el invitado abra el sobre, con un botón para pausarla."
                : "El invitado la pone con el botón de música."
              : "Elijan una canción de la lista o suban la suya."}
          </p>
        </div>
      </SectionPreview>
    );
  }

  const type = STEP_SECTION[step];
  if (!type) return null;
  if (!draft.sections[type].visible) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Esta sección no se mostrará.
      </p>
    );
  }
  const view = buildSectionView(type, draft.sections[type].content, draft.translations[type] ?? {}, ctx);
  return view ? (
    <SectionPreview data={data} view={view} className="rounded-xl border" />
  ) : (
    <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      {EMPTY[step] ?? "Completen el formulario para ver esta sección."}
    </p>
  );
}

const first = (name: string) => name.trim().split(/\s+/)[0] || name;
