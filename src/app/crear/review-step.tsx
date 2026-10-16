"use client";

import { AlertCircleIcon, CheckCircle2Icon, ExternalLinkIcon, PencilIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";
import {
  missingForPublish,
  normalizeSlugInput,
  sectionsWithExamples,
  slugProblem,
  STEPS,
  type BuilderDraft,
  type StepKey,
} from "@/lib/builder/draft";
import { useBuilder } from "@/lib/builder/store";
import type { SectionType } from "@/lib/sections";
import { SITE_URL } from "@/lib/site";

import { checkSlug, type SlugCheck } from "./actions";

const SECTION_STEP: Partial<Record<SectionType, StepKey>> = {
  intro: "portada",
  celebration: "celebracion",
  dress_code: "vestimenta",
  program: "programa",
};

const SLUG_PROBLEM: Record<NonNullable<ReturnType<typeof slugProblem>>, string> = {
  short: "Usa entre 3 y 60 caracteres.",
  format: "Solo letras sin acentos, números y guiones.",
  reserved: "Ese enlace está reservado. Prueba con sus nombres.",
};

const stepIndex = (key: StepKey) => STEPS.findIndex((s) => s.key === key);
const stepTitle = (key: StepKey) => STEPS[stepIndex(key)].title;

/** Last step: what is missing, the invitation's link and "Publicar". */
export function ReviewStep({ draft }: { draft: BuilderDraft }) {
  const router = useRouter();
  const goTo = useBuilder((s) => s.goTo);
  const setSlug = useBuilder((s) => s.setSlug);
  const missing = missingForPublish(draft);
  const examples = sectionsWithExamples(draft);
  const [check, setCheck] = useState<SlugCheck | null>(null);
  const host = SITE_URL.replace(/^https?:\/\//, "");

  // Ask the server whether the link is free, a moment after the couple stops typing.
  useEffect(() => {
    if (!draft.slug) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setCheck(null);
      void checkSlug(draft.slug).then((result) => {
        if (!cancelled) setCheck(result);
      });
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft.slug]);

  const slugError = draft.slug ? slugProblem(draft.slug) : "short";
  const ready = missing.length === 0 && !slugError && check?.status === "available";

  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <h3 className="font-heading text-xl">Antes de publicar</h3>
        <ul className="grid gap-2 text-sm">
          {missing.map((key) => (
            <ChecklistItem key={key} tone="error" onEdit={() => goTo(stepIndex(key))}>
              Falta completar «{stepTitle(key)}».
            </ChecklistItem>
          ))}
          {examples.map((type) => (
            <ChecklistItem key={type} tone="warning" onEdit={() => goTo(stepIndex(SECTION_STEP[type]!))}>
              «{stepTitle(SECTION_STEP[type]!)}» todavía tiene el texto de ejemplo.
            </ChecklistItem>
          ))}
          {missing.length === 0 && examples.length === 0 && (
            <ChecklistItem tone="ok">Todo listo. Podrán seguir cambiándola después de publicar.</ChecklistItem>
          )}
        </ul>
      </section>

      <section className="grid gap-2">
        <h3 className="font-heading text-xl">Su enlace</h3>
        <div className="flex items-center overflow-hidden rounded-md border bg-muted/40 focus-within:ring-[3px] focus-within:ring-ring/50">
          <span className="shrink-0 pl-3 text-sm text-muted-foreground">{host}/</span>
          <Input
            aria-label="Enlace de la invitación"
            value={draft.slug}
            onChange={(e) => setSlug(normalizeSlugInput(e.target.value))}
            maxLength={60}
            className="border-0 bg-transparent pl-0.5 shadow-none focus-visible:ring-0"
          />
        </div>
        <p className="text-sm">
          {slugError ? (
            <span className="text-destructive">{SLUG_PROBLEM[slugError]}</span>
          ) : !check ? (
            <span className="text-muted-foreground">Comprobando…</span>
          ) : check.status === "available" ? (
            <span className="text-success">✓ Disponible</span>
          ) : check.status === "taken" ? (
            <span className="text-destructive">
              Ya está en uso.{" "}
              {check.suggestion && (
                <button type="button" className="underline" onClick={() => setSlug(check.suggestion!)}>
                  Usar {check.suggestion}
                </button>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">No pudimos comprobarlo ahora; lo revisaremos al publicar.</span>
          )}
        </p>
      </section>

      <section className="grid gap-3">
        <Button
          size="lg"
          className="h-12 text-base"
          disabled={!ready}
          onClick={() => {
            track("publish_click");
            router.push("/crear/publicar");
          }}
        >
          <SparklesIcon /> Publicar mi invitación
        </Button>
        <Button variant="outline" asChild>
          <a href="/crear/vista-previa" target="_blank" rel="noopener">
            <ExternalLinkIcon /> Ver en pantalla completa
          </a>
        </Button>
        <p className="text-xs text-muted-foreground">
          Su invitación está guardada en este dispositivo. Para publicarla les pediremos entrar con Google o con un
          código que les enviamos por correo.
        </p>
      </section>
    </div>
  );
}

function ChecklistItem({
  tone,
  onEdit,
  children,
}: {
  tone: "error" | "warning" | "ok";
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  const Icon = tone === "ok" ? CheckCircle2Icon : AlertCircleIcon;
  const color = tone === "error" ? "text-destructive" : tone === "warning" ? "text-amber-600" : "text-success";
  return (
    <li className="flex items-start gap-2 rounded-lg border p-3">
      <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} />
      <span className="flex-1">{children}</span>
      {onEdit && (
        <button type="button" onClick={onEdit} className="flex items-center gap-1 text-xs font-medium underline">
          <PencilIcon className="size-3" /> Editar
        </button>
      )}
    </li>
  );
}
