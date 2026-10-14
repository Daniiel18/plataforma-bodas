"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_TEXT, type SectionContent } from "@/lib/sections";

import { saveSection } from "../contenido/actions";
import { saveZelle } from "./actions";

type ZelleValues = { holder_name: string; handle: string; note: string; is_visible: boolean };

export function ZelleForm({ initial }: { initial: ZelleValues }) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof ZelleValues>(key: K, value: ZelleValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await saveZelle(values);
          if (result.ok) toast.success(result.message);
          else toast.error(result.error);
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="holder_name">Nombre del titular</Label>
        <Input
          id="holder_name"
          value={values.holder_name}
          onChange={(e) => set("holder_name", e.target.value)}
          maxLength={80}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="handle">Correo o teléfono de Zelle</Label>
        <Input
          id="handle"
          value={values.handle}
          onChange={(e) => set("handle", e.target.value)}
          placeholder="nombre@correo.com o +1 555 123 4567"
          maxLength={80}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="note">Nota (opcional)</Label>
        <Textarea
          id="note"
          value={values.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="Por ejemplo: Escribe tu nombre en el concepto 💛"
          maxLength={300}
          rows={3}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="zelle-visible">Mostrar regalos en la invitación</Label>
          <p className="text-sm text-muted-foreground">Necesita el QR o el correo/teléfono.</p>
        </div>
        <Switch id="zelle-visible" checked={values.is_visible} onCheckedChange={(v) => set("is_visible", v)} />
      </div>
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Guardando…" : "Guardar datos"}
      </Button>
    </form>
  );
}

export function GiftsTextForm({ initial }: { initial: SectionContent<"gifts"> }) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await saveSection("gifts", values);
          if (result.ok) toast.success(result.message);
          else toast.error(result.error);
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="gifts-title">Título</Label>
        <Input
          id="gifts-title"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          placeholder={DEFAULT_TEXT.gifts.title.es}
          maxLength={120}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="gifts-message">Mensaje</Label>
        <Input
          id="gifts-message"
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          placeholder={DEFAULT_TEXT.gifts.message.es}
          maxLength={300}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar textos"}
      </Button>
    </form>
  );
}
