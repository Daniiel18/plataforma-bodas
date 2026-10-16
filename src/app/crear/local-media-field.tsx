"use client";

import { MusicIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { LocalMedia } from "@/lib/builder/draft";
import { removeLocalMedia, saveLocalMedia, useLocalMediaUrls } from "@/lib/builder/media";
import { useBuilder } from "@/lib/builder/store";

type Slot = "cover" | "audio" | "qr" | "background";

const ACCEPT: Record<Slot, string> = {
  cover: "image/*",
  qr: "image/*",
  background: "image/*",
  audio: "audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a",
};

/** One photo, QR or song kept on this device (the builder's version of the dashboard field). */
export function LocalMediaField({ slot, emptyLabel, hint }: { slot: Slot; emptyLabel: string; hint?: string }) {
  const current = useBuilder((s) => s.draft?.media[slot] ?? null);
  const setMedia = useBuilder((s) => s.setMedia);
  const urls = useLocalMediaUrls(current ? [current.id] : []);
  const url = current ? urls[current.id] : undefined;
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const media: LocalMedia = await saveLocalMedia(file, slot);
      if (current) await removeLocalMedia(current.id);
      setMedia(slot, media);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el archivo");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async () => {
    if (!current) return;
    await removeLocalMedia(current.id);
    setMedia(slot, null);
  };

  return (
    <div className="grid gap-3">
      <input ref={input} type="file" accept={ACCEPT[slot]} hidden onChange={(e) => onFile(e.target.files?.[0])} />

      {current && url ? (
        slot === "audio" ? (
          <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
            <MusicIcon className="size-5 shrink-0 text-muted-foreground" />
            <audio controls preload="metadata" src={url} className="h-10 w-full" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL, nothing to optimize
          <img
            src={url}
            alt=""
            className={
              slot === "qr"
                ? "aspect-square w-48 rounded-xl border bg-white object-contain p-2"
                : "aspect-[4/5] w-56 rounded-xl border object-cover"
            }
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="grid place-items-center gap-2 rounded-xl border-2 border-dashed p-8 text-sm text-muted-foreground hover:bg-accent/40"
        >
          <UploadIcon className="size-6" />
          {busy ? "Preparando…" : emptyLabel}
        </button>
      )}

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {current && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => input.current?.click()} disabled={busy}>
            <UploadIcon /> {busy ? "Preparando…" : "Cambiar"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={busy}>
            <Trash2Icon /> Quitar
          </Button>
        </div>
      )}
    </div>
  );
}
