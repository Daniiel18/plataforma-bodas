"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { GiftMethodsFields } from "@/components/editor/gift-methods-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Gifts } from "@/lib/gifts";
import { DEFAULT_TEXT, type SectionContent } from "@/lib/sections";

import { saveSection, setSectionVisible } from "../contenido/actions";
import { saveGifts } from "./actions";

/** Shows or hides the whole gifts section of the invitation. */
export function GiftsVisibleSwitch({ initial }: { initial: boolean }) {
  const [visible, setVisible] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4 text-sm">
      <span className="grid gap-0.5">
        <span className="font-medium">Mostrar regalos en la invitación</span>
        <span className="text-muted-foreground">Apágalo si prefieren no hablar de regalos.</span>
      </span>
      <Switch
        checked={visible}
        disabled={pending}
        onCheckedChange={(next) => {
          setVisible(next);
          startTransition(async () => {
            const result = await setSectionVisible("gifts", next);
            if (result.ok) toast.success(result.message);
            else {
              setVisible(!next);
              toast.error(result.error);
            }
          });
        }}
      />
    </label>
  );
}

/** Every gift method with its switch; saved together. */
export function GiftMethodsForm({ initial, qrField }: { initial: Gifts; qrField: ReactNode }) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await saveGifts(values);
          if (result.ok) toast.success(result.message);
          else toast.error(result.error);
        });
      }}
    >
      <GiftMethodsFields value={values} onChange={setValues} qrField={qrField} />
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Guardando…" : "Guardar formas de regalo"}
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
