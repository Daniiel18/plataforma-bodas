"use client";

import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, Trash2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { removeLocalMedia, saveLocalMedia, useLocalMediaUrls } from "@/lib/builder/media";
import { useBuilder } from "@/lib/builder/store";
import { MEDIA_LIMITS } from "@/lib/media";
import { DEFAULT_TEXT, GALLERY_STYLES, parseContent } from "@/lib/sections";
import { cn } from "@/lib/utils";

/** The builder's photo gallery: photos kept on this device, order and 3D style. */
export function LocalGallery() {
  const photos = useBuilder((s) => s.draft?.media.gallery ?? []);
  const raw = useBuilder((s) => s.draft?.sections.gallery.content);
  const setGallery = useBuilder((s) => s.setGallery);
  const setSection = useBuilder((s) => s.setSection);
  const settings = parseContent("gallery", raw);
  const urls = useLocalMediaUrls(photos.map((p) => p.id));
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const remaining = MEDIA_LIMITS.gallery - photos.length;

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list);
    if (files.length > remaining) toast.warning(`Puedes añadir ${remaining} foto(s) más; se usarán las primeras.`);
    setBusy(true);
    const added = [];
    for (const file of files.slice(0, remaining)) {
      try {
        added.push(await saveLocalMedia(file, "gallery"));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo preparar una foto");
      }
    }
    setGallery([...useBuilder.getState().draft!.media.gallery, ...added]);
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  const move = (index: number, delta: -1 | 1) => {
    const next = [...photos];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setGallery(next);
  };

  const remove = async (id: string) => {
    await removeLocalMedia(id);
    setGallery(useBuilder.getState().draft!.media.gallery.filter((p) => p.id !== id));
  };

  return (
    <div className="grid gap-5">
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <div key={photo.id} className="group relative aspect-[4/5] overflow-hidden rounded-lg border bg-muted">
            {urls[photo.id] && (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL
              <img src={urls[photo.id]} alt="" className="size-full object-cover" />
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/45 p-1">
              <button
                type="button"
                aria-label="Mover antes"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="rounded p-1 text-white disabled:opacity-30"
              >
                <ArrowLeftIcon className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Quitar foto"
                onClick={() => remove(photo.id)}
                className="rounded p-1 text-white"
              >
                <Trash2Icon className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Mover después"
                disabled={index === photos.length - 1}
                onClick={() => move(index, 1)}
                className="rounded p-1 text-white disabled:opacity-30"
              >
                <ArrowRightIcon className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="grid aspect-[4/5] place-items-center gap-1 rounded-lg border-2 border-dashed p-2 text-center text-xs text-muted-foreground hover:bg-accent/40"
          >
            <ImagePlusIcon className="size-6" />
            {busy ? "Preparando…" : "Añadir fotos"}
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {photos.length} de {MEDIA_LIMITS.gallery} fotos. Se comprimen en tu teléfono y se suben al publicar.
      </p>

      <div className="grid gap-2">
        <Label htmlFor="gallery-title">Título</Label>
        <Input
          id="gallery-title"
          value={settings.title}
          placeholder={DEFAULT_TEXT.gallery.title.es}
          maxLength={120}
          onChange={(e) => setSection("gallery", { ...settings, title: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label>Estilo del carrusel</Label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Estilo del carrusel">
          {GALLERY_STYLES.map((style) => (
            <button
              key={style.value}
              type="button"
              role="radio"
              aria-checked={settings.style === style.value}
              onClick={() => setSection("gallery", { ...settings, style: style.value })}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition",
                settings.style === style.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent",
              )}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
        Pasar las fotos solas
        <Switch
          checked={settings.autoplay}
          onCheckedChange={(autoplay) => setSection("gallery", { ...settings, autoplay })}
        />
      </label>

      {photos.length > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => input.current?.click()}
          disabled={busy || remaining <= 0}
        >
          <ImagePlusIcon /> Añadir más fotos
        </Button>
      )}
    </div>
  );
}
