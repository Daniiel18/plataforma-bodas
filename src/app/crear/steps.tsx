"use client";

import { useCallback, type ReactNode } from "react";

import { AppearanceFields } from "@/components/editor/appearance-fields";
import { GiftMethodsFields } from "@/components/editor/gift-methods-fields";
import { SectionForm } from "@/components/editor/section-forms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { BuilderDraft, StepKey } from "@/lib/builder/draft";
import { useLocalMediaUrls } from "@/lib/builder/media";
import { useBuilder } from "@/lib/builder/store";
import { COMMON_TIME_ZONES } from "@/lib/dates";
import { DEFAULT_TEXT, parseContent, type SectionContent, type SectionType } from "@/lib/sections";

import { LocalGallery } from "./local-gallery";
import { LocalMediaField } from "./local-media-field";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** The form of each step (the review step lives in review-step.tsx). */
export function StepFields({ step, draft }: { step: Exclude<StepKey, "revisar">; draft: BuilderDraft }) {
  switch (step) {
    case "nombres":
      return <NamesStep draft={draft} />;
    case "fecha":
      return <DateStep draft={draft} />;
    case "plantilla":
      return <AppearanceStep draft={draft} />;
    case "portada":
      return (
        <div className="grid gap-8">
          <Block title="El sobre" text="Es lo primero que ven sus invitados: un sobre que se abre con un toque.">
            <DraftSection type="intro" draft={draft} />
          </Block>
          <Block title="La portada" text="Sus nombres con una foto tipo polaroid.">
            <DraftSection type="hero" draft={draft} />
          </Block>
        </div>
      );
    case "padres":
      return <DraftSection type="parents" draft={draft} toggle />;
    case "celebracion":
      return <DraftSection type="celebration" draft={draft} />;
    case "lugar":
      return <DraftSection type="location" draft={draft} toggle />;
    case "programa":
      return <DraftSection type="program" draft={draft} toggle />;
    case "vestimenta":
      return <DraftSection type="dress_code" draft={draft} toggle />;
    case "fotos":
      return (
        <ToggleSection type="gallery" draft={draft}>
          <LocalGallery />
        </ToggleSection>
      );
    case "musica":
      return <MusicStep draft={draft} />;
    case "regalos":
      return <GiftsStep draft={draft} />;
    case "confirmaciones":
      return <RsvpStep draft={draft} />;
  }
}

function Block({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <div>
        <h3 className="font-heading text-xl">{title}</h3>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      {children}
    </section>
  );
}

/** "Mostrar esta sección" switch above a step. */
function ToggleSection({ type, draft, children }: { type: SectionType; draft: BuilderDraft; children: ReactNode }) {
  const setVisible = useBuilder((s) => s.setSectionVisible);
  const visible = draft.sections[type].visible;
  return (
    <div className="grid gap-5">
      <label className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
        Mostrar esta sección en la invitación
        <Switch checked={visible} onCheckedChange={(v) => setVisible(type, v)} />
      </label>
      <div className={visible ? undefined : "pointer-events-none opacity-50"} inert={!visible}>
        {children}
      </div>
    </div>
  );
}

/** A section form that writes straight into the draft as the couple types. */
function DraftSection({ type, draft, toggle }: { type: SectionType; draft: BuilderDraft; toggle?: boolean }) {
  const setSection = useBuilder((s) => s.setSection);
  const onDraft = useCallback((content: unknown) => setSection(type, content), [type, setSection]);
  const form = (
    <SectionForm
      key={type}
      type={type}
      content={parseContent(type, draft.sections[type].content) as SectionContent<SectionType>}
      onDraft={onDraft}
    />
  );
  return toggle ? (
    <ToggleSection type={type} draft={draft}>
      {form}
    </ToggleSection>
  ) : (
    form
  );
}

function NamesStep({ draft }: { draft: BuilderDraft }) {
  const setCouple = useBuilder((s) => s.setCouple);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="partner1">Novio(a) 1</Label>
        <Input
          id="partner1"
          autoFocus
          value={draft.couple.partner1}
          onChange={(e) => setCouple({ partner1: e.target.value })}
          placeholder="Ej.: María Fernanda López"
          maxLength={80}
          autoComplete="off"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="partner2">Novio(a) 2</Label>
        <Input
          id="partner2"
          value={draft.couple.partner2}
          onChange={(e) => setCouple({ partner2: e.target.value })}
          placeholder="Ej.: Juan Carlos Pérez"
          maxLength={80}
          autoComplete="off"
        />
      </div>
      <p className="text-sm text-muted-foreground sm:col-span-2">
        En la invitación se destacan sus primeros nombres. Podrán cambiarlos cuando quieran.
      </p>
    </div>
  );
}

function DateStep({ draft }: { draft: BuilderDraft }) {
  const setEvent = useBuilder((s) => s.setEvent);
  const zones = COMMON_TIME_ZONES.some((tz) => tz.value === draft.event.timeZone)
    ? COMMON_TIME_ZONES
    : [
        { value: draft.event.timeZone, label: draft.event.timeZone.split("/").pop()!.replace(/_/g, " ") },
        ...COMMON_TIME_ZONES,
      ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="event-date">Fecha de la boda</Label>
        <Input
          id="event-date"
          type="date"
          value={draft.event.date}
          onChange={(e) => setEvent({ date: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="event-time">Hora de la ceremonia</Label>
        <Input
          id="event-time"
          type="time"
          value={draft.event.time}
          onChange={(e) => setEvent({ time: e.target.value })}
        />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="event-zone">Zona horaria del lugar</Label>
        <select
          id="event-zone"
          value={draft.event.timeZone}
          onChange={(e) => setEvent({ timeZone: e.target.value })}
          className={selectClass}
        >
          {zones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          La cuenta regresiva y «Añadir al calendario» usan esta zona, estén donde estén sus invitados.
        </p>
      </div>
    </div>
  );
}

function AppearanceStep({ draft }: { draft: BuilderDraft }) {
  const setAppearance = useBuilder((s) => s.setAppearance);
  const { cover, background } = draft.media;
  const urls = useLocalMediaUrls([cover, background].flatMap((m) => (m ? [m.id] : [])));
  const couple = `${draft.couple.partner1.trim().split(/\s+/)[0] || "Nombre"} & ${draft.couple.partner2.trim().split(/\s+/)[0] || "Nombre"}`;
  return (
    <AppearanceFields
      value={draft.appearance}
      onChange={setAppearance}
      couple={couple}
      cover={cover ? (urls[cover.id] ?? null) : null}
      photo={background ? (urls[background.id] ?? null) : null}
      photoField={
        <LocalMediaField
          slot="background"
          emptyLabel="Subir foto de fondo"
          hint="Una foto horizontal o vertical; se recorta para llenar la pantalla."
        />
      }
    />
  );
}

function MusicStep({ draft }: { draft: BuilderDraft }) {
  const setSection = useBuilder((s) => s.setSection);
  const music = parseContent("music", draft.sections.music.content);
  return (
    <ToggleSection type="music" draft={draft}>
      <div className="grid gap-4">
        <LocalMediaField
          slot="audio"
          emptyLabel="Elegir su canción (MP3 o M4A)"
          hint="Hasta 15 MB. Suena cuando el invitado abre el sobre y tiene botón para pausarla."
        />
        <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          Empezar a sonar al abrir el sobre
          <Switch
            checked={music.autoplay_on_open}
            onCheckedChange={(autoplay_on_open) => setSection("music", { autoplay_on_open })}
          />
        </label>
      </div>
    </ToggleSection>
  );
}

function GiftsStep({ draft }: { draft: BuilderDraft }) {
  const setGifts = useBuilder((s) => s.setGifts);
  const setSection = useBuilder((s) => s.setSection);
  const gifts = parseContent("gifts", draft.sections.gifts.content);
  return (
    <ToggleSection type="gifts" draft={draft}>
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Una caja de regalo que se abre y muestra las formas de enviarles un regalo. Activen las que quieran. El dinero
          va de sus invitados a ustedes; Lazo de Oro no interviene.
        </p>
        <div className="grid gap-2">
          <Label htmlFor="gift-message">Mensaje</Label>
          <Textarea
            id="gift-message"
            rows={3}
            value={gifts.message}
            placeholder={DEFAULT_TEXT.gifts.message.es}
            maxLength={300}
            onChange={(e) => setSection("gifts", { ...gifts, message: e.target.value })}
          />
        </div>
        <GiftMethodsFields
          value={draft.gifts}
          onChange={setGifts}
          qrField={<LocalMediaField slot="qr" emptyLabel="Subir el QR de su app de Zelle" />}
        />
      </div>
    </ToggleSection>
  );
}

function RsvpStep({ draft }: { draft: BuilderDraft }) {
  const setRsvp = useBuilder((s) => s.setRsvp);
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="rsvp-deadline">Fecha límite para confirmar (opcional)</Label>
          <Input
            id="rsvp-deadline"
            type="date"
            value={draft.rsvp.deadline}
            onChange={(e) => setRsvp({ deadline: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rsvp-max">Máximo de acompañantes por invitado</Label>
          <Input
            id="rsvp-max"
            type="number"
            min={0}
            max={10}
            value={draft.rsvp.maxCompanions}
            onChange={(e) => setRsvp({ maxCompanions: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>¿Qué piden de los acompañantes?</Label>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Acompañantes">
          {(
            [
              ["names", "El nombre de cada uno", "Ideal para el catering y la lista de la entrada."],
              ["count", "Solo cuántos vienen", "Más rápido para el invitado."],
            ] as const
          ).map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={draft.rsvp.companionsMode === value}
              onClick={() => setRsvp({ companionsMode: value })}
              className="grid gap-0.5 rounded-lg border p-3 text-left text-sm transition aria-checked:border-primary aria-checked:bg-accent/50"
            >
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
        <span>
          Mostrar los deseos en la invitación
          <span className="block text-xs text-muted-foreground">
            Si lo apagan, solo ustedes los leen. Podrán ocultar cualquier mensaje.
          </span>
        </span>
        <Switch
          checked={draft.rsvp.guestbookPublic}
          onCheckedChange={(guestbookPublic) => setRsvp({ guestbookPublic })}
        />
      </label>
      <DraftSection type="rsvp" draft={draft} />
    </div>
  );
}
