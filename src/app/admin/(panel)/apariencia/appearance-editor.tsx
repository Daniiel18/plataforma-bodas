"use client";

import "@/components/invitation/invitation.css";

import { CheckIcon, EyeIcon, ImageUpIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { BackgroundSwatch, ThemePreview } from "@/components/invitation/theme-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BACKGROUNDS, PHOTO_VEILS, type BackgroundKey, type PhotoVeil } from "@/lib/backgrounds";
import {
  ACCENTS,
  acceptsAccent,
  COLLECTIONS,
  getTemplate,
  TEMPLATES,
  type AccentValue,
  type Collection,
  type TemplateKey,
} from "@/lib/templates";
import { cn } from "@/lib/utils";

import { SingleMediaField, type CurrentMedia } from "../single-media-field";
import { saveAppearance } from "./actions";

type Appearance = {
  template: TemplateKey;
  accent: AccentValue | null;
  /** null = el fondo recomendado de la plantilla. */
  background: BackgroundKey | null;
  veil: PhotoVeil;
};

type Props = {
  weddingId: string;
  couple: string;
  initial: Appearance;
  cover: string | null;
  backgroundPhoto: CurrentMedia;
};

export function AppearanceEditor({ weddingId, couple, initial, cover, backgroundPhoto }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [collection, setCollection] = useState<Collection | "todas">("todas");
  const [pending, startTransition] = useTransition();

  const template = getTemplate(value.template);
  const background = value.background ?? template.background;
  const photo = backgroundPhoto?.url ?? null;
  const missingPhoto = background === "foto" && !photo;
  const dirty = JSON.stringify(value) !== JSON.stringify(initial);
  const set = (patch: Partial<Appearance>) => setValue((v) => ({ ...v, ...patch }));

  const save = () =>
    startTransition(async () => {
      const result = await saveAppearance(value);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else toast.error(result.error);
    });

  const visibleTemplates = TEMPLATES.filter((t) => collection === "todas" || t.collection === collection);
  const previewProps = { accent: value.accent, couple, cover, backgroundPhoto: photo, veil: value.veil };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid min-w-0 content-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Plantilla</CardTitle>
            <CardDescription>
              {TEMPLATES.length} diseños con su tipografía, adornos y marco de foto. Cada uno trae un fondo recomendado
              que puedes cambiar abajo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estilo">
              <FilterChip active={collection === "todas"} onClick={() => setCollection("todas")}>
                Todas
              </FilterChip>
              {COLLECTIONS.filter((c) => TEMPLATES.some((t) => t.collection === c.key)).map((c) => (
                <FilterChip key={c.key} active={collection === c.key} onClick={() => setCollection(c.key)}>
                  {c.label}
                </FilterChip>
              ))}
            </div>

            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              role="radiogroup"
              aria-label="Plantilla"
            >
              {visibleTemplates.map((t) => {
                const selected = value.template === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set({ template: t.key })}
                    className={cn(
                      "grid content-start overflow-hidden rounded-xl border bg-card text-left transition hover:shadow-md",
                      selected && "ring-2 ring-primary",
                    )}
                  >
                    <ThemePreview
                      template={t}
                      background={value.background && value.background !== "foto" ? value.background : t.background}
                      {...previewProps}
                      accent={acceptsAccent(t) ? value.accent : null}
                    />
                    <div className="grid gap-1 border-t p-3">
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        {t.name}
                        {selected && <CheckIcon className="size-4 shrink-0 text-primary" />}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                      <div className="mt-1 flex gap-1">
                        {[t.colors.bg, t.colors.card, t.colors.cardStrong, t.colors.gold].map((c) => (
                          <span key={c} className="size-4 rounded-full border" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fondo de la página</CardTitle>
            <CardDescription>
              Se pinta con los colores de la plantilla, así que cualquier combinación queda bien. También puedes usar
              una foto tuya.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5" role="radiogroup" aria-label="Fondo">
              <BackgroundOption
                selected={value.background === null}
                onClick={() => set({ background: null })}
                label="De la plantilla"
                hint={BACKGROUNDS.find((b) => b.key === template.background)?.name}
              >
                <BackgroundSwatch template={template} background={template.background} className="h-20" />
              </BackgroundOption>
              {BACKGROUNDS.map((b) => (
                <BackgroundOption
                  key={b.key}
                  selected={value.background === b.key}
                  onClick={() => set({ background: b.key })}
                  label={b.name}
                >
                  {b.key === "foto" && !photo ? (
                    <div className="grid h-20 place-items-center bg-muted text-muted-foreground">
                      <ImageUpIcon className="size-6" />
                    </div>
                  ) : (
                    <BackgroundSwatch
                      template={template}
                      background={b.key}
                      backgroundPhoto={photo}
                      veil={value.veil}
                      className="h-20"
                    />
                  )}
                </BackgroundOption>
              ))}
            </div>

            {background === "foto" && (
              <div className="grid gap-5 rounded-xl border bg-muted/30 p-4 sm:grid-cols-[auto_1fr]">
                <SingleMediaField
                  weddingId={weddingId}
                  kind="background"
                  current={backgroundPhoto}
                  emptyLabel="Subir foto de fondo"
                  hint="Una foto horizontal o vertical; se recorta para llenar la pantalla."
                />
                <div className="grid content-start gap-2">
                  <p className="text-sm font-medium">¿Cuánto se ve la foto?</p>
                  <p className="text-xs text-muted-foreground">
                    Encima va un velo del color de la plantilla para que los textos se lean bien.
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="Visibilidad de la foto">
                    {PHOTO_VEILS.map((v) => (
                      <FilterChip key={v.key} active={value.veil === v.key} onClick={() => set({ veil: v.key })}>
                        {v.label}
                      </FilterChip>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Color de acento (opcional)</CardTitle>
            <CardDescription>
              {acceptsAccent(template)
                ? "Cambia el color de los botones y de los nombres. Si no eliges, se usa el de la plantilla."
                : "Esta plantilla es oscura y usa su propio dorado, así que el acento no se aplica."}
            </CardDescription>
          </CardHeader>
          <CardContent
            className={cn("flex flex-wrap gap-3", !acceptsAccent(template) && "pointer-events-none opacity-40")}
          >
            <SwatchButton
              selected={value.accent === null}
              onClick={() => set({ accent: null })}
              label="De la plantilla"
            >
              <span className="text-[10px] leading-none text-muted-foreground">Aa</span>
            </SwatchButton>
            {ACCENTS.map((a) => (
              <SwatchButton
                key={a.value}
                selected={value.accent === a.value}
                onClick={() => set({ accent: a.value })}
                label={a.label}
              >
                <span className="size-full rounded-full" style={{ background: a.value }} />
              </SwatchButton>
            ))}
          </CardContent>
        </Card>
      </div>

      <aside className="order-first lg:order-none">
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Así se verá <Badge variant="secondary">{template.name}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ThemePreview
              template={template}
              background={missingPhoto ? template.background : background}
              size="large"
              {...previewProps}
              className="mx-auto w-full max-w-xs rounded-xl border"
            />
            <Button variant="outline" asChild>
              <Link href="/admin/vista-previa">
                <EyeIcon /> Ver invitación completa
              </Link>
            </Button>
          </CardContent>
        </Card>
      </aside>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 lg:col-span-2">
        {(dirty || missingPhoto) && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
            <p className="text-sm text-muted-foreground">
              {missingPhoto ? "Sube una foto para usar el fondo «Tu foto»." : "Tienes cambios sin guardar."}
            </p>
            <Button onClick={save} disabled={pending || !dirty || missingPhoto}>
              {pending ? "Guardando…" : "Guardar apariencia"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function BackgroundOption({
  selected,
  onClick,
  label,
  hint,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "grid content-start overflow-hidden rounded-xl border bg-card text-left transition hover:shadow-md",
        selected && "ring-2 ring-primary",
      )}
    >
      {children}
      <span className="grid gap-0.5 border-t px-2 py-1.5">
        <span className="flex items-center gap-1 text-xs font-medium">
          {label}
          {selected && <CheckIcon className="size-3.5 shrink-0 text-primary" />}
        </span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </span>
    </button>
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
  children: ReactNode;
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
