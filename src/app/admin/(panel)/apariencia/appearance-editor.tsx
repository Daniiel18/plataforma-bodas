"use client";

import "@/components/invitation/invitation.css";

import { CheckIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition, type CSSProperties } from "react";
import { toast } from "sonner";

import { DriedFlowers } from "@/components/invitation/decorations";
import { scriptFont } from "@/components/invitation/fonts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCENTS, TEMPLATES, type TemplateKey } from "@/lib/templates";
import { cn } from "@/lib/utils";

import { saveAppearance } from "./actions";

type Props = { template: TemplateKey; accent: string | null; couple: string };

export function AppearanceEditor({ template: initialTemplate, accent: initialAccent, couple }: Props) {
  const [template, setTemplate] = useState(initialTemplate);
  const [accent, setAccent] = useState(initialAccent);
  const [pending, startTransition] = useTransition();
  const dirty = template !== initialTemplate || accent !== initialAccent;

  const save = () =>
    startTransition(async () => {
      const result = await saveAppearance(template, accent);
      if (result.ok) toast.success(result.message);
      else toast.error(result.error);
    });

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-3" role="radiogroup" aria-label="Plantilla">
        {TEMPLATES.map((t) => (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={template === t.key}
            onClick={() => setTemplate(t.key)}
            className={cn(
              "grid overflow-hidden rounded-xl border bg-card text-left transition hover:shadow-md",
              template === t.key && "ring-2 ring-primary",
            )}
          >
            <MiniInvitation templateKey={t.key} accent={accent} couple={couple} />
            <div className="grid gap-1 border-t p-4">
              <p className="flex items-center gap-2 font-medium">
                {t.name}
                {template === t.key && <CheckIcon className="size-4 text-primary" />}
              </p>
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <div className="mt-2 flex gap-1.5">
                {t.swatches.map((c) => (
                  <span key={c} className="size-5 rounded-full border" style={{ background: c }} />
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Color de acento (opcional)</CardTitle>
          <CardDescription>
            Cambia el color de los botones y de los nombres. Si no eliges, se usa el del estilo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <SwatchButton selected={accent === null} onClick={() => setAccent(null)} label="Del estilo">
            <span className="text-[10px] leading-none text-muted-foreground">Aa</span>
          </SwatchButton>
          {ACCENTS.map((a) => (
            <SwatchButton
              key={a.value}
              selected={accent === a.value}
              onClick={() => setAccent(a.value)}
              label={a.label}
            >
              <span className="size-full rounded-full" style={{ background: a.value }} />
            </SwatchButton>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={save} disabled={pending || !dirty}>
          {pending ? "Guardando…" : "Guardar apariencia"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/vista-previa">
            <EyeIcon /> Ver invitación completa
          </Link>
        </Button>
      </div>
    </div>
  );
}

function SwatchButton({
  selected,
  onClick,
  label,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="grid justify-items-center gap-1.5 text-xs"
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-full border-2 p-1",
          selected ? "border-primary" : "border-transparent",
        )}
      >
        {children}
      </span>
      {label}
    </button>
  );
}

/** Muestra reducida de la invitación con la plantilla aplicada. */
function MiniInvitation({
  templateKey,
  accent,
  couple,
}: {
  templateKey: TemplateKey;
  accent: string | null;
  couple: string;
}) {
  return (
    <div
      className={`invitation tpl-${templateKey} ${scriptFont.variable} relative overflow-hidden px-5 py-6 text-center`}
      style={{ minHeight: 0, ...(accent ? ({ "--inv-accent": accent } as CSSProperties) : {}) }}
    >
      <DriedFlowers className="pointer-events-none absolute -top-6 -right-4 w-14 rotate-[20deg] opacity-80" />
      <p className="inv-heading text-[0.6rem] text-[var(--inv-ink-soft)]">La boda de</p>
      <p className="inv-script mt-1 text-3xl text-[var(--inv-accent)]">
        <span className="inv-names">{couple}</span>
      </p>
      <div className="inv-polaroid mx-auto mt-3 w-20 rotate-[-2deg] bg-[var(--inv-paper)] p-1.5 pb-4 shadow-[var(--inv-shadow)]">
        <div className="inv-polaroid-photo aspect-[4/5] bg-[linear-gradient(160deg,var(--inv-card),var(--inv-card-strong))]" />
      </div>
      <div className="inv-card mt-4 px-3 py-3">
        <p className="inv-heading text-[0.55rem]">Programa del día</p>
        <p className="mt-1 text-sm">3:00 PM · Ceremonia</p>
      </div>
      <span className="inv-button mt-4 min-h-0 px-4 py-1.5 text-[0.6rem]">Confirmar asistencia</span>
    </div>
  );
}
