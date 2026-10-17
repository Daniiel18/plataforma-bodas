"use client";

import { BanIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";

import { deleteWedding, reactivateWedding, suspendWedding } from "../../actions";

/** Suspend (with a reason) or reactivate a wedding. */
export function SuspendControls({ weddingId, suspended }: { weddingId: string; suspended: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        setReason("");
      } else toast.error(result.error);
    });

  if (suspended) {
    return (
      <Button variant="outline" disabled={pending} onClick={() => run(() => reactivateWedding(weddingId))}>
        <RotateCcwIcon /> Reactivar
      </Button>
    );
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <BanIcon /> Suspender
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspender esta boda</DialogTitle>
            <DialogDescription>
              La invitación deja de verse y la pareja no puede editarla; recibe un aviso. Puedes reactivarla cuando
              quieras. El motivo queda en la auditoría.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (por ejemplo: contenido ofensivo)"
            maxLength={300}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pending || reason.trim().length < 3}
              onClick={() => run(() => suspendWedding(weddingId, reason))}
            >
              Suspender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Deletes the wedding for good, after typing its link. */
export function DeleteWedding({ weddingId, slug }: { weddingId: string; slug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const result = await deleteWedding(weddingId, typed);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      router.push("/admin/bodas");
    });

  return (
    <>
      <Button variant="outline" className="text-destructive" onClick={() => setOpen(true)}>
        <Trash2Icon /> Eliminar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar esta boda para siempre</DialogTitle>
            <DialogDescription>
              Se borran la invitación, sus fotos y música, las respuestas, los deseos y el vínculo con su cuenta. No se
              puede deshacer. Para confirmar, escribe su enlace: <strong>{slug}</strong>
            </DialogDescription>
          </DialogHeader>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={slug} autoComplete="off" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={pending || typed.trim() !== slug} onClick={remove}>
              {pending ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
