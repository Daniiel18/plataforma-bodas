"use client";

import "@/components/invitation/invitation.css";

import { EyeIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { AppearanceFields, type Appearance } from "@/components/editor/appearance-fields";
import { ThemePreview } from "@/components/invitation/theme-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTemplate } from "@/lib/templates";

import { mediaImage, type MediaImage } from "@/lib/media";
import { FRAME } from "@/lib/photo-crop";

import { SingleMediaField, type CurrentMedia } from "../single-media-field";
import { saveAppearance } from "./actions";

type Props = {
  weddingId: string;
  couple: string;
  initial: Appearance;
  cover: MediaImage | null;
  backgroundPhoto: CurrentMedia;
};

export function AppearanceEditor({ weddingId, couple, initial, cover, backgroundPhoto }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  const template = getTemplate(value.template);
  const background = value.background ?? template.background;
  const photo = backgroundPhoto ? mediaImage(backgroundPhoto.url, backgroundPhoto) : null;
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

  const previewProps = { accent: value.accent, couple, cover, backgroundPhoto: photo, veil: value.veil };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <AppearanceFields
          value={value}
          onChange={set}
          couple={couple}
          cover={cover}
          photo={photo}
          photoField={
            <SingleMediaField
              weddingId={weddingId}
              kind="background"
              current={backgroundPhoto}
              emptyLabel="Subir foto de fondo"
              hint="Llena toda la pantalla. Con «Ajustar» eligen qué parte se ve detrás de la invitación."
              frame={FRAME.background}
              fill
            />
          }
        />
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
              <Link href="/panel/vista-previa">
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
