"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { deleteAccount, setAccountTest } from "../actions";

/** Moves an account between "real" and "test" (test accounts stay out of the numbers). */
export function TestToggle({ accountId, isTest }: { accountId: string; isTest: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setAccountTest(accountId, !isTest);
          if (result.ok) toast.success(result.message);
          else toast.error(result.error);
        })
      }
    >
      {isTest ? "Marcar como real" : "Marcar como prueba"}
    </Button>
  );
}

/** Deletes an account after typing its email. */
export function DeleteAccount({ accountId, email }: { accountId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const result = await deleteAccount(accountId, typed);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
      } else toast.error(result.error);
    });

  return (
    <>
      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setOpen(true)}>
        Eliminar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar esta cuenta</DialogTitle>
            <DialogDescription>
              Se borra su acceso y su perfil. No se puede deshacer. Para confirmar, escribe su correo:{" "}
              <strong>{email}</strong>
            </DialogDescription>
          </DialogHeader>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={email} autoComplete="off" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pending || typed.trim().toLowerCase() !== email.toLowerCase()}
              onClick={remove}
            >
              {pending ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
