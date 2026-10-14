"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { saveSection, setSectionVisible } from "../contenido/actions";

export function MusicSettings({ autoplayOnOpen, visible }: { autoplayOnOpen: boolean; visible: boolean }) {
  const [autoplay, setAutoplay] = useState(autoplayOnOpen);
  const [enabled, setEnabled] = useState(visible);
  const [pending, startTransition] = useTransition();

  const update = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, rollback: () => void) =>
    startTransition(async () => {
      const result = await fn();
      if (result.ok) toast.success(result.message ?? "Guardado");
      else {
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
                () => saveSection("music", { autoplay_on_open: value }),
                () => setAutoplay(!value),
              );
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
