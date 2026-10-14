"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/types";

import { FormMessage } from "../../form-message";
import { useFormAction } from "../../use-form-action";
import { createManualRsvp } from "./actions";

export function ManualRsvpDialog({ maxCompanions }: { maxCompanions: number }) {
  const [open, setOpen] = useState(false);
  const [attending, setAttending] = useState(true);
  const [companions, setCompanions] = useState<number[]>([]);
  const [state, onSubmit, pending] = useFormAction(async (prev: ActionResult | null, formData: FormData) => {
    const result = await createManualRsvp(prev, formData);
    if (result.ok) {
      toast.success(result.message);
      setOpen(false);
      setCompanions([]);
      setAttending(true);
      return null;
    }
    return result;
  }, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon /> Agregar respuesta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar respuesta</DialogTitle>
          <DialogDescription>Para invitados que confirmaron por teléfono o en persona.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input id="full_name" name="full_name" required minLength={2} maxLength={120} />
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">¿Asiste?</legend>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="attending"
                  value="si"
                  checked={attending}
                  onChange={() => setAttending(true)}
                />
                Sí
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="attending"
                  value="no"
                  checked={!attending}
                  onChange={() => setAttending(false)}
                />
                No
              </label>
            </div>
          </fieldset>

          {attending && (
            <div className="grid gap-2">
              <Label>
                Acompañantes ({companions.length}/{maxCompanions})
              </Label>
              {companions.map((key, index) => (
                <div key={key} className="flex gap-2">
                  <Input
                    name="companion"
                    placeholder={`Nombre del acompañante ${index + 1}`}
                    required
                    minLength={2}
                    maxLength={120}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Quitar acompañante"
                    onClick={() => setCompanions((list) => list.filter((k) => k !== key))}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
              {companions.length < maxCompanions && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-self-start"
                  onClick={() => setCompanions((list) => [...list, Date.now()])}
                >
                  <PlusIcon /> Agregar acompañante
                </Button>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="note">Nota (opcional)</Label>
            <Input id="note" name="note" maxLength={500} />
          </div>

          <FormMessage state={state} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
