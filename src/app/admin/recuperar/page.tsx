"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { requestPasswordReset } from "../actions";
import { AuthCard } from "../auth-card";
import { FormMessage } from "../form-message";
import { useFormAction } from "../use-form-action";

export default function RecoverPasswordPage() {
  const [state, onSubmit, pending] = useFormAction(requestPasswordReset, null);

  return (
    <AuthCard
      title="Recuperar acceso"
      description="Te enviaremos un enlace para crear una nueva contraseña."
      footer={
        <Link href="/admin/login" className="text-muted-foreground underline-offset-4 hover:underline">
          Volver a entrar
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Correo de la cuenta</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <FormMessage state={state} />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Enviando…" : "Enviar enlace"}
        </Button>
      </form>
    </AuthCard>
  );
}
