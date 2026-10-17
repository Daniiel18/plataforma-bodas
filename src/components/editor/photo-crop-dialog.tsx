"use client";

import { MinusIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";

import { FramedPhoto } from "@/components/invitation/framed-photo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MediaImage } from "@/lib/media";
import { CENTERED, fitZoom, MAX_ZOOM, photoAspect, placePhoto, storableCrop, type PhotoCrop } from "@/lib/photo-crop";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo: MediaImage;
  /** Shape of the frame the photo is shown in (width / height). */
  frame: number;
  /** Backgrounds always fill the screen, so they cannot zoom out. */
  fill?: boolean;
  title?: string;
  /** Saves the framing (null = centered and filling); returns whether it worked. */
  onSave: (crop: PhotoCrop | null) => Promise<boolean> | boolean;
};

/** "Ajustar foto": drag to move, slider, wheel or two fingers to zoom. */
export function PhotoCropDialog({ open, onOpenChange, title = "Ajustar foto", ...props }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Arrastra la foto para moverla. Acerca o aleja con la barra o con dos dedos.
          </DialogDescription>
        </DialogHeader>
        {open && <Cropper {...props} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Cropper({
  photo,
  frame,
  fill = false,
  onSave,
  onDone,
}: Omit<Props, "open" | "onOpenChange" | "title"> & { onDone: () => void }) {
  const ratio = photoAspect(photo);
  const floor = fill ? 1 : 0;
  const normalize = (crop: PhotoCrop) => placePhoto(ratio, frame, crop, floor).crop;

  const [crop, setCrop] = useState<PhotoCrop>(() => normalize(photo.crop ?? CENTERED));
  const [saving, setSaving] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<number | null>(null);

  const minZoom = Math.max(fitZoom(ratio, frame), floor);
  const canShowAll = !fill && minZoom < 0.999;

  // Moves the photo by a drag of (dx, dy) screen pixels.
  const pan = (dx: number, dy: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    setCrop((current) => {
      const place = placePhoto(ratio, frame, current, floor);
      return normalize({
        ...place.crop,
        x: place.crop.x - dx / (place.width * rect.width),
        y: place.crop.y - dy / (place.height * rect.height),
      });
    });
  };
  const zoomBy = (factor: number) => setCrop((current) => normalize({ ...current, zoom: current.zoom * factor }));

  // The wheel zooms instead of scrolling the page (React's wheel listener is passive).
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setCrop(
        (current) =>
          placePhoto(ratio, frame, { ...current, zoom: current.zoom * Math.exp(-event.deltaY * 0.0015) }, floor).crop,
      );
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [ratio, frame, floor]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    if (pointers.current.size === 1) {
      pan(point.x - previous.x, point.y - previous.y);
      return;
    }
    const [a, b] = [...pointers.current.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch.current) zoomBy(distance / pinch.current);
    pinch.current = distance;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const save = async () => {
    setSaving(true);
    const ok = await onSave(storableCrop(crop));
    setSaving(false);
    if (ok) onDone();
  };

  return (
    <div className="grid gap-4">
      <div
        ref={box}
        className="relative mx-auto cursor-grab touch-none overflow-hidden rounded-lg bg-muted select-none active:cursor-grabbing"
        style={{ aspectRatio: frame, width: `min(100%, 320px, calc(52vh * ${frame}))` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <FramedPhoto photo={{ ...photo, crop }} frame={frame} alt="" width={320} />
        {/* Thirds, to line up faces and horizons. */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden>
          {Array.from({ length: 9 }, (_, cell) => (
            <span
              key={cell}
              className="border-white/50 [&:not(:nth-child(3n))]:border-r [&:nth-child(-n+6)]:border-b"
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" aria-label="Alejar" onClick={() => zoomBy(1 / 1.15)}>
          <MinusIcon />
        </Button>
        <input
          type="range"
          aria-label="Zoom"
          min={minZoom}
          max={MAX_ZOOM}
          step={0.01}
          value={crop.zoom}
          onChange={(e) => setCrop((current) => normalize({ ...current, zoom: Number(e.target.value) }))}
          className="h-2 w-full cursor-pointer accent-primary"
        />
        <Button type="button" variant="ghost" size="icon" aria-label="Acercar" onClick={() => zoomBy(1.15)}>
          <PlusIcon />
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {canShowAll && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCrop(normalize({ ...CENTERED, zoom: 0 }))}
          >
            Foto completa
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => setCrop(normalize({ ...crop, zoom: 1 }))}>
          Rellenar el marco
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setCrop(normalize(CENTERED))}>
          <RotateCcwIcon /> Centrar
        </Button>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone} disabled={saving}>
          Cancelar
        </Button>
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </div>
  );
}
