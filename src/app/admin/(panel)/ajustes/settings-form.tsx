"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { COMMON_TIME_ZONES } from "@/lib/dates";
import type { ShareDetails } from "@/lib/share";
import type { ActionResult } from "@/lib/types";

import { FormMessage } from "../../form-message";
import { useFormAction } from "../../use-form-action";
import { ShareInvitationButton, ShareInvitationDialog } from "../share-invitation";
import { updateWeddingSettings } from "./actions";

type Props = {
  wedding: {
    slug: string;
    partner1_name: string;
    partner2_name: string;
    event_local: string;
    timezone: string;
    deadline_local: string;
    max_companions: number;
    is_published: boolean;
  };
  share: ShareDetails;
};

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SettingsForm({ wedding, share }: Props) {
  const [deadlineEnabled, setDeadlineEnabled] = useState(Boolean(wedding.deadline_local));
  const [published, setPublished] = useState(wedding.is_published);
  const [savedPublished, setSavedPublished] = useState(wedding.is_published);
  const [celebrate, setCelebrate] = useState(false);
  const [state, onSubmit, pending] = useFormAction(async (prev: ActionResult | null, formData: FormData) => {
    const result = await updateWeddingSettings(prev, formData);
    if (result.ok) {
      toast.success(result.message);
      // Just published: offer to share it right away.
      const nowPublished = formData.get("is_published") === "on";
      if (nowPublished && !savedPublished) setCelebrate(true);
      setSavedPublished(nowPublished);
      return null;
    }
    return result;
  }, null);

  const timeZones =
    !wedding.timezone || COMMON_TIME_ZONES.some((tz) => tz.value === wedding.timezone)
      ? COMMON_TIME_ZONES
      : [{ value: wedding.timezone, label: wedding.timezone }, ...COMMON_TIME_ZONES];

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="partner1_name">Novio(a) 1</Label>
          <Input id="partner1_name" name="partner1_name" defaultValue={wedding.partner1_name} required maxLength={80} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="partner2_name">Novio(a) 2</Label>
          <Input id="partner2_name" name="partner2_name" defaultValue={wedding.partner2_name} required maxLength={80} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="event_local">Fecha y hora de la boda</Label>
          <Input id="event_local" name="event_local" type="datetime-local" defaultValue={wedding.event_local} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="timezone">Zona horaria del lugar</Label>
          <select id="timezone" name="timezone" defaultValue={wedding.timezone} className={selectClass}>
            <option value="">Elige la zona horaria…</option>
            {timeZones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Separator />

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="deadline_enabled">Fecha límite para confirmar</Label>
            <p className="text-sm text-muted-foreground">
              Después de esta fecha nadie puede responder ni cambiar su respuesta.
            </p>
          </div>
          <Switch
            id="deadline_enabled"
            name="deadline_enabled"
            checked={deadlineEnabled}
            onCheckedChange={setDeadlineEnabled}
          />
        </div>
        {deadlineEnabled && (
          <Input
            name="deadline_local"
            type="datetime-local"
            defaultValue={wedding.deadline_local}
            required
            aria-label="Fecha límite"
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="max_companions">Máximo de acompañantes por respuesta</Label>
          <Input
            id="max_companions"
            name="max_companions"
            type="number"
            min={0}
            max={50}
            defaultValue={wedding.max_companions}
            required
          />
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="is_published">Invitación publicada</Label>
          <p className="text-sm text-muted-foreground">
            Mientras esté apagado, los invitados no pueden ver la invitación (/{wedding.slug}).
          </p>
        </div>
        <Switch id="is_published" name="is_published" checked={published} onCheckedChange={setPublished} />
      </div>
      {savedPublished && published && (
        <div className="justify-self-start">
          <ShareInvitationButton slug={wedding.slug} details={share} variant="outline" />
        </div>
      )}
      <ShareInvitationDialog
        slug={wedding.slug}
        details={share}
        open={celebrate}
        onOpenChange={setCelebrate}
        justPublished
      />

      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Guardando…" : "Guardar ajustes"}
      </Button>
    </form>
  );
}
