"use client";

import { ArchiveIcon, ArchiveRestoreIcon, CheckIcon, EllipsisVerticalIcon, NotebookPenIcon, XIcon } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/types";

import { saveNote, setArchived, setAttendance } from "./actions";

type Props = { rsvp: { id: string; attending: boolean; isArchived: boolean; note: string } };

export function RsvpActions({ rsvp }: Props) {
  const [pending, startTransition] = useTransition();
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(rsvp.note);

  const run = (action: () => Promise<ActionResult>, after?: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
        after?.();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={pending} aria-label="Acciones">
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {rsvp.attending ? (
            <DropdownMenuItem onSelect={() => run(() => setAttendance(rsvp.id, false))}>
              <XIcon /> Marcar que no asiste
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => run(() => setAttendance(rsvp.id, true))}>
              <CheckIcon /> Marcar que asiste
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setNoteOpen(true)}>
            <NotebookPenIcon /> {rsvp.note ? "Editar nota" : "Agregar nota"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {rsvp.isArchived ? (
            <DropdownMenuItem onSelect={() => run(() => setArchived(rsvp.id, false))}>
              <ArchiveRestoreIcon /> Restaurar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => run(() => setArchived(rsvp.id, true))}>
              <ArchiveIcon /> Archivar (p. ej. duplicado)
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nota privada</DialogTitle>
            <DialogDescription>Solo la ven ustedes en el panel.</DialogDescription>
          </DialogHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={4} />
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() =>
                run(
                  () => saveNote(rsvp.id, note),
                  () => setNoteOpen(false),
                )
              }
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
