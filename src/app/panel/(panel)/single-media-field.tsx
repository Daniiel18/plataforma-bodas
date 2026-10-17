"use client";

import { CropIcon, MusicIcon, Trash2Icon, UploadIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PhotoCropDialog } from "@/components/editor/photo-crop-dialog";
import { FramedPhoto } from "@/components/invitation/framed-photo";
import { Button } from "@/components/ui/button";
import { mediaImage } from "@/lib/media";
import { deleteMedia, setMediaCrop } from "@/lib/media-actions";
import { useMediaUpload } from "@/lib/media-upload";

export type CurrentMedia = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  crop?: unknown;
} | null;

type Props = {
  weddingId: string;
  kind: "cover" | "qr" | "audio" | "background";
  current: CurrentMedia;
  emptyLabel: string;
  hint?: string;
  /** Photos shown in a frame (cover, background) can be adjusted to it. */
  frame?: number;
  /** The frame must stay filled (backgrounds). */
  fill?: boolean;
};

const ACCEPT = {
  cover: "image/*",
  qr: "image/*",
  background: "image/*",
  audio: "audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a",
};

/** Upload, replace or remove a single file (cover, QR, song or background). */
export function SingleMediaField({ weddingId, kind, current, emptyLabel, hint, frame, fill }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const { busy, uploadMany } = useMediaUpload(weddingId);
  const [removing, setRemoving] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const image = current && frame ? mediaImage(current.url, current) : null;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const { uploaded, error } = await uploadMany([file], kind);
    if (uploaded) toast.success(current ? "Archivo reemplazado" : "Archivo subido");
    if (error) toast.error(error);
    if (input.current) input.current.value = "";
    router.refresh();
  };

  const remove = async () => {
    if (!current) return;
    setRemoving(true);
    const result = await deleteMedia(current.id);
    setRemoving(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
    router.refresh();
  };

  return (
    <div className="grid gap-3">
      <input ref={input} type="file" accept={ACCEPT[kind]} hidden onChange={(e) => onFile(e.target.files?.[0])} />

      {current ? (
        kind === "audio" ? (
          <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
            <MusicIcon className="size-5 shrink-0 text-muted-foreground" />
            <audio controls preload="none" src={current.url} className="h-10 w-full" />
          </div>
        ) : image && frame ? (
          <button
            type="button"
            onClick={() => setAdjusting(true)}
            className={`relative overflow-hidden rounded-xl border bg-muted ${frame < 0.6 ? "w-36" : "w-56"}`}
            style={{ aspectRatio: frame }}
            aria-label="Ajustar foto"
          >
            <FramedPhoto photo={image} frame={frame} alt="" width={224} />
          </button>
        ) : (
          <div
            className={`relative overflow-hidden rounded-xl border bg-muted ${kind === "qr" ? "aspect-square w-48 bg-white" : "aspect-[4/5] w-56"}`}
          >
            <Image
              src={current.url}
              alt=""
              fill
              sizes="224px"
              className={kind === "qr" ? "object-contain p-2" : "object-cover"}
            />
          </div>
        )
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="grid place-items-center gap-2 rounded-xl border-2 border-dashed p-8 text-sm text-muted-foreground hover:bg-accent/40"
        >
          <UploadIcon className="size-6" />
          {busy ? "Subiendo…" : emptyLabel}
        </button>
      )}

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {current && (
        <div className="flex flex-wrap gap-2">
          {image && (
            <Button type="button" size="sm" onClick={() => setAdjusting(true)} disabled={busy}>
              <CropIcon /> Ajustar
            </Button>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={() => input.current?.click()} disabled={busy}>
            <UploadIcon /> {busy ? "Subiendo…" : "Cambiar"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={removing || busy}>
            <Trash2Icon /> Quitar
          </Button>
        </div>
      )}

      {image && frame && current && (
        <PhotoCropDialog
          open={adjusting}
          onOpenChange={setAdjusting}
          photo={image}
          frame={frame}
          fill={fill}
          title={kind === "background" ? "Ajustar foto de fondo" : "Ajustar foto de portada"}
          onSave={async (crop) => {
            const result = await setMediaCrop(current.id, crop);
            if (!result.ok) {
              toast.error(result.error);
              return false;
            }
            toast.success(result.message);
            router.refresh();
            return true;
          }}
        />
      )}
    </div>
  );
}
