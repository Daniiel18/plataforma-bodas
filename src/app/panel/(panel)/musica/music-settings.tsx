"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { MusicLibraryPicker } from "@/components/editor/music-library-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { TrackKey } from "@/lib/music-library";
import type { SectionContent } from "@/lib/sections";

import { saveSection, setSectionVisible } from "../contenido/actions";

/** The song (library or their own) and how it plays. */
export function MusicLibraryCard({ content, hasOwnSong }: { content: SectionContent<"music">; hasOwnSong: boolean }) {
  const router = useRouter();
  const [track, setTrack] = useState<TrackKey | null>(content.track);
  const [pending, startTransition] = useTransition();

  const choose = (next: TrackKey | null) => {
    const previous = track;
    setTrack(next);
    startTransition(async () => {
      const result = await saveSection("music", { ...content, track: next });
      if (result.ok) {
        toast.success(next ? "Canción elegida" : "Sonará su propia canción");
        router.refresh();
      } else {
        toast.error(result.error);
        setTrack(previous);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Elegir una canción</CardTitle>
        <CardDescription>
          Grabaciones instrumentales de uso libre. Toquen ▶ para escucharlas y elijan una.
          {!hasOwnSong && !track && " Mientras no elijan ninguna, la invitación no tiene música."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MusicLibraryPicker value={track} onChange={choose} hasOwnSong={hasOwnSong} disabled={pending} />
      </CardContent>
    </Card>
  );
}

export function MusicSettings({ content, visible }: { content: SectionContent<"music">; visible: boolean }) {
  const router = useRouter();
  const autoplayOnOpen = content.autoplay_on_open;
  const [autoplay, setAutoplay] = useState(autoplayOnOpen);
  const [enabled, setEnabled] = useState(visible);
  const [pending, startTransition] = useTransition();

  const update = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, rollback: () => void) =>
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(result.message ?? "Guardado");
        router.refresh();
      } else {
        toast.error(result.error);
        rollback();
      }
    });

  return (
    <Card>
      <CardContent className="grid gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="music-enabled">Música en la invitación</Label>
            <p className="text-sm text-muted-foreground">Muestra el botón flotante para reproducir o pausar.</p>
          </div>
          <Switch
            id="music-enabled"
            checked={enabled}
            disabled={pending}
            onCheckedChange={(value) => {
              setEnabled(value);
              update(
                () => setSectionVisible("music", value),
                () => setEnabled(!value),
              );
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="music-autoplay">Empezar al abrir el sobre</Label>
            <p className="text-sm text-muted-foreground">
              Los celulares no permiten música automática sin un toque: el sobre es ese toque.
            </p>
          </div>
          <Switch
            id="music-autoplay"
            checked={autoplay}
            disabled={pending}
            onCheckedChange={(value) => {
              setAutoplay(value);
              update(
                () => saveSection("music", { ...content, autoplay_on_open: value }),
                () => setAutoplay(!value),
              );
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
