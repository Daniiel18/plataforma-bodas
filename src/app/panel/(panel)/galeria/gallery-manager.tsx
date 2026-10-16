"use client";

import "@/components/invitation/invitation.css";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeOffIcon, GripVerticalIcon, ImagePlusIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Gallery3D } from "@/components/invitation/gallery-3d";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MEDIA_LIMITS } from "@/lib/media";
import { DEFAULT_TEXT, GALLERY_STYLES, type GalleryStyle, type SectionContent } from "@/lib/sections";
import { cn } from "@/lib/utils";

import { saveSection } from "../contenido/actions";
import { deleteMedia, reorderGallery, updateCaption } from "@/lib/media-actions";
import { useMediaUpload } from "@/lib/media-upload";

type AdminPhoto = { id: string; url: string; width: number; height: number; caption: string };

type Props = {
  weddingId: string;
  photos: AdminPhoto[];
  settings: SectionContent<"gallery">;
  visible: boolean;
};

export function GalleryManager({ weddingId, photos: initialPhotos, settings, visible }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [style, setStyle] = useState<GalleryStyle>(settings.style);
  const [autoplay, setAutoplay] = useState(settings.autoplay);
  const [title, setTitle] = useState(settings.title);
  const [saving, startSaving] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const { busy, uploadMany } = useMediaUpload(weddingId);

  const remaining = MEDIA_LIMITS.gallery - photos.length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list);
    if (files.length > remaining) {
      toast.warning(`Solo puedes subir ${remaining} foto(s) más. Se subirán las primeras ${remaining}.`);
    }
    const { uploaded, error } = await uploadMany(files.slice(0, remaining), "gallery");
    if (uploaded) toast.success(`${uploaded} foto(s) subida(s)`);
    if (error) toast.error(error);
    if (fileInput.current) fileInput.current.value = "";
    router.refresh();
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = photos.findIndex((p) => p.id === active.id);
    const to = photos.findIndex((p) => p.id === over.id);
    const next = arrayMove(photos, from, to);
    setPhotos(next);
    reorderGallery(next.map((p) => p.id)).then((r) => {
      if (!r.ok) toast.error(r.error);
    });
  };

  const removePhoto = (id: string) => {
    setPhotos((list) => list.filter((p) => p.id !== id));
    deleteMedia(id).then((r) => {
      if (r.ok) toast.success("Foto eliminada");
      else {
        toast.error(r.error);
        router.refresh();
      }
    });
  };

  const saveSettings = () =>
    startSaving(async () => {
      const result = await saveSection("gallery", { title, style, autoplay });
      if (result.ok) toast.success(result.message);
      else toast.error(result.error);
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>
              Fotos ({photos.length}/{MEDIA_LIMITS.gallery})
            </CardTitle>
            <CardDescription>Las fotos se comprimen automáticamente para que carguen rápido.</CardDescription>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
          <Button onClick={() => fileInput.current?.click()} disabled={busy || remaining <= 0}>
            <ImagePlusIcon /> {busy ? "Subiendo…" : remaining > 0 ? "Subir fotos" : "Límite alcanzado"}
          </Button>
        </CardHeader>
        <CardContent>
          {!visible && (
            <p className="mb-4 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              <EyeOffIcon className="size-4" /> La galería está oculta. Actívala en Contenido.
            </p>
          )}
          {photos.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="grid w-full place-items-center gap-2 rounded-xl border-2 border-dashed p-10 text-sm text-muted-foreground hover:bg-accent/40"
            >
              <ImagePlusIcon className="size-8" />
              Sube sus fotos favoritas (puedes elegir varias a la vez)
            </button>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {photos.map((photo, index) => (
                    <SortablePhoto key={photo.id} photo={photo} index={index} onRemove={removePhoto} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Card className="self-start">
        <CardHeader>
          <CardTitle>Estilo del carrusel</CardTitle>
          <CardDescription>Así se verá en la invitación. Puedes probar cada estilo antes de guardar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Estilo del carrusel">
            {GALLERY_STYLES.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={style === option.value}
                onClick={() => setStyle(option.value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent",
                  style === option.value && "border-primary bg-primary text-primary-foreground hover:bg-primary",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="invitation overflow-hidden rounded-xl py-2" style={{ minHeight: 0 }}>
            {photos.length ? (
              <Gallery3D
                key={`${style}-${photos.length}`}
                photos={photos.map((p) => ({ ...p, caption: p.caption ? { es: p.caption, en: p.caption } : null }))}
                style={style}
                autoplay={autoplay}
              />
            ) : (
              <p className="p-10 text-center text-sm text-[var(--inv-ink-soft)]">
                Sube fotos para ver la vista previa.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="autoplay">Avanzar solas</Label>
            <Switch id="autoplay" checked={autoplay} onCheckedChange={setAutoplay} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gallery-title">Título de la sección</Label>
            <Input
              id="gallery-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={DEFAULT_TEXT.gallery.title.es}
              maxLength={120}
            />
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? "Guardando…" : "Guardar estilo"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SortablePhoto({
  photo,
  index,
  onRemove,
}: {
  photo: AdminPhoto;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  const [caption, setCaption] = useState(photo.caption);
  const [confirming, setConfirming] = useState(false);

  const saveCaption = () => {
    if (caption.trim() === photo.caption.trim()) return;
    updateCaption(photo.id, caption).then((r) => (r.ok ? toast.success(r.message) : toast.error(r.error)));
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("grid gap-2 rounded-xl border bg-card p-2", isDragging && "z-10 shadow-xl ring-2 ring-ring")}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
        <Image src={photo.url} alt="" fill sizes="200px" className="object-cover" />
        <span className="absolute top-1.5 left-1.5 rounded-full bg-black/55 px-2 text-xs text-white">{index + 1}</span>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute top-1.5 right-1.5 grid size-8 cursor-grab touch-none place-items-center rounded-full bg-white/85 text-foreground shadow active:cursor-grabbing"
          aria-label={`Mover foto ${index + 1}`}
        >
          <GripVerticalIcon className="size-4" />
        </button>
      </div>
      <Input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        onBlur={saveCaption}
        placeholder="Texto (opcional)"
        maxLength={140}
        className="h-8 text-xs"
      />
      {confirming ? (
        <div className="flex gap-1">
          <Button size="sm" variant="destructive" className="flex-1" onClick={() => onRemove(photo.id)}>
            Borrar
          </Button>
          <Button size="sm" variant="ghost" className="flex-1" onClick={() => setConfirming(false)}>
            No
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setConfirming(true)}>
          <Trash2Icon /> Quitar
        </Button>
      )}
    </li>
  );
}
