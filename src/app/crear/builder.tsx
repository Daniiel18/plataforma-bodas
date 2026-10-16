"use client";

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { Logo } from "@/components/brand/logo";
import { EditorBackendProvider, type EditorBackend } from "@/components/editor/editor-backend";
import { PhoneFrame } from "@/components/site/phone-frame";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { track } from "@/lib/analytics";
import { missingForPublish, STEPS, type BuilderDraft } from "@/lib/builder/draft";
import { draftMediaIds, draftToInvitation } from "@/lib/builder/invitation";
import { removeLocalMedia, useLocalMediaUrls } from "@/lib/builder/media";
import { useBuilder } from "@/lib/builder/store";
import { cn } from "@/lib/utils";

import { searchVenue, venueAddressAt } from "./actions";
import { LocalMediaField } from "./local-media-field";
import { ReviewStep } from "./review-step";
import { StepPreview } from "./step-preview";
import { StepFields } from "./steps";

const STEP_INTRO: Record<(typeof STEPS)[number]["key"], string> = {
  nombres: "Empecemos por lo más importante. Todo se guarda en este dispositivo; no necesitan cuenta para diseñar.",
  fecha: "La cuenta regresiva, el calendario y «Añadir al calendario» salen de aquí.",
  plantilla: "Elijan el diseño, el fondo y, si quieren, un color. Podrán cambiarlos cuando quieran.",
  portada: "Así empieza su invitación.",
  padres: "Opcional: los nombres de sus padres o padrinos.",
  celebracion: "Un mensaje junto a la fecha y la cuenta regresiva.",
  lugar: "El salón o la iglesia. Pueden marcar la entrada exacta en el mapa.",
  programa: "Los momentos del día, con su hora.",
  vestimenta: "Cómo les gustaría que vinieran vestidos.",
  fotos: "Un carrusel en 3D con sus fotos favoritas.",
  musica: "Una canción para acompañar la invitación.",
  regalos: "Si quieren, una caja de regalo con su Zelle.",
  confirmaciones: "Cómo les confirmarán sus invitados.",
  revisar: "Revisen su invitación, elijan su enlace y publíquenla.",
};

const subscribe = () => () => {};

/** The step-by-step builder; renders only in the browser, where the draft lives. */
export function Builder() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const template = useSearchParams().get("plantilla");
  const draft = useBuilder((s) => s.draft);
  const start = useBuilder((s) => s.start);

  useEffect(() => {
    if (!mounted) return;
    const isNew = !useBuilder.getState().draft;
    start(template);
    if (isNew) track("builder_start", template ? { template } : undefined);
  }, [mounted, start, template]);

  if (!mounted || !draft)
    return <div className="flex flex-1 items-center justify-center p-10 text-muted-foreground">Cargando…</div>;
  return <Wizard draft={draft} />;
}

function Wizard({ draft }: { draft: BuilderDraft }) {
  const step = useBuilder((s) => s.step);
  const goTo = useBuilder((s) => s.goTo);
  const current = STEPS[step];
  const urls = useLocalMediaUrls(draftMediaIds(draft));
  const { data, ctx } = useMemo(() => draftToInvitation(draft, urls), [draft, urls]);
  const top = useRef<HTMLDivElement>(null);

  const required = "required" in current && current.required;
  const blocked = required && missingForPublish(draft).includes(current.key);
  const last = step === STEPS.length - 1;

  useEffect(() => {
    track(current.key === "revisar" ? "builder_review" : "builder_step", { step: current.key });
    top.current?.scrollIntoView({ block: "start" });
  }, [current.key]);

  const backend = useMemo<EditorBackend>(
    () => ({
      geocode: { search: searchVenue, reverse: venueAddressAt },
      coverField: (
        <LocalMediaField slot="cover" emptyLabel="Subir foto de portada" hint="Se muestra como una foto polaroid." />
      ),
      hints: {
        names: "Sus nombres se cambian en el paso 1.",
        date: "La fecha se elige en el paso 2.",
        rsvpSettings: "La fecha límite y los acompañantes se eligen arriba.",
      },
    }),
    [],
  );

  return (
    <div ref={top} className="site flex flex-1 flex-col" data-lang-root>
      <header className="sticky top-0 z-40 border-b border-[var(--site-line)]/70 bg-[var(--site-bg)]/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" aria-label="Lazo de Oro" className="text-sm">
            <Logo markClassName="size-7" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-[var(--site-ink-soft)]">
            <span className="hidden items-center gap-1 sm:flex">
              <CheckIcon className="size-3.5" /> Guardado en este dispositivo
            </span>
            <StartOver />
          </div>
        </div>
        <div className="h-1 bg-[var(--site-line)]/60">
          <div
            className="h-full bg-[var(--site-gold)] transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <EditorBackendProvider value={backend}>
        <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-10">
          <div className="grid min-w-0 content-start gap-6">
            <div className="grid gap-1">
              <p className="text-xs font-semibold tracking-[0.25em] text-[var(--site-gold-deep)] uppercase">
                Paso {step + 1} de {STEPS.length}
              </p>
              <h1 className="font-heading text-3xl font-medium sm:text-4xl">{current.title}</h1>
              <p className="text-[var(--site-ink-soft)]">{STEP_INTRO[current.key]}</p>
            </div>

            <div className="rounded-2xl border border-[var(--site-line)] bg-[var(--site-paper)] p-4 sm:p-6">
              {current.key === "revisar" ? (
                <ReviewStep draft={draft} />
              ) : (
                <StepFields key={current.key} step={current.key} draft={draft} />
              )}
            </div>

            <nav className="flex items-center justify-between gap-2">
              <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0}>
                <ArrowLeftIcon /> Atrás
              </Button>
              {!last && (
                <div className="flex items-center gap-2">
                  {!required && (
                    <Button variant="ghost" onClick={() => goTo(step + 1)} className="text-[var(--site-ink-soft)]">
                      Omitir por ahora
                    </Button>
                  )}
                  <Button onClick={() => goTo(step + 1)} disabled={blocked}>
                    {step === STEPS.length - 2 ? "Revisar" : "Siguiente"} <ArrowRightIcon />
                  </Button>
                </div>
              )}
            </nav>
            <StepDots step={step} onPick={goTo} />
          </div>

          <aside className="grid content-start gap-3 lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-semibold tracking-[0.25em] text-[var(--site-ink-soft)] uppercase">Así se verá</p>
            {current.key === "revisar" ? (
              <PhonePreview />
            ) : (
              <StepPreview step={current.key} draft={draft} data={data} ctx={ctx} />
            )}
          </aside>
        </div>
      </EditorBackendProvider>
    </div>
  );
}

/** Small dots to jump to any step. */
function StepDots({ step, onPick }: { step: number; onPick: (step: number) => void }) {
  return (
    <ol className="flex flex-wrap justify-center gap-1.5" aria-label="Pasos">
      {STEPS.map((s, index) => (
        <li key={s.key}>
          <button
            type="button"
            onClick={() => onPick(index)}
            aria-label={`Paso ${index + 1}: ${s.title}`}
            aria-current={index === step ? "step" : undefined}
            title={s.title}
            className={cn(
              "block size-2.5 rounded-full transition",
              index === step
                ? "w-6 bg-[var(--site-gold-deep)]"
                : index < step
                  ? "bg-[var(--site-gold)]"
                  : "bg-[var(--site-line)]",
            )}
          />
        </li>
      ))}
    </ol>
  );
}

/** The whole invitation, with envelope and music, in a phone frame. */
function PhonePreview() {
  return <PhoneFrame src="/crear/vista-previa" title="Vista previa de la invitación" width={300} />;
}

function StartOver() {
  const [open, setOpen] = useState(false);
  const reset = useBuilder((s) => s.reset);
  const restart = async () => {
    const draft = useBuilder.getState().draft;
    if (draft) await Promise.all(draftMediaIds(draft).map((id) => removeLocalMedia(id).catch(() => undefined)));
    reset();
    setOpen(false);
  };
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-xs">
        <RotateCcwIcon /> Empezar de nuevo
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Empezar de nuevo?</DialogTitle>
            <DialogDescription>
              Se borrará lo que han diseñado en este dispositivo, incluidas las fotos y la música.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={restart}>
              Sí, empezar de nuevo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
