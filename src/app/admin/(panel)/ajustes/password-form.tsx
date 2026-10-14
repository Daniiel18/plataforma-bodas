"use client";

import { useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/types";

import { updatePassword } from "../../actions";
import { FormMessage } from "../../form-message";
import { useFormAction } from "../../use-form-action";

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, onSubmit, pending] = useFormAction(async (prev: ActionResult | null, formData: FormData) => {
    const result = await updatePassword(prev, formData);
    if (result.ok) {
      toast.success(result.message);
      formRef.current?.reset();
      return null;
    }
    return result;
  }, null);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm">Repite la contraseña</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <FormMessage state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
