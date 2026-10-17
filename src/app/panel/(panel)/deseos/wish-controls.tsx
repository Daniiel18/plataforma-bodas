"use client";

import { CheckCheckIcon, EyeIcon, EyeOffIcon, MailIcon, MailOpenIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { markAllWishesRead, setWishApproved, setWishRead } from "./actions";

/** Approve a wish for the invitation's guestbook, or take it back. */
export function WishApproveToggle({ wishId, approved }: { wishId: string; approved: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={approved ? "secondary" : "outline"}
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setWishApproved(wishId, !approved);
          if (result.ok) toast.success(result.message);
          else toast.error(result.error);
        })
      }
    >
      {approved ? <EyeOffIcon /> : <EyeIcon />}
      {approved ? "Quitar de la invitación" : "Mostrar en la invitación"}
    </Button>
  );
}

export function WishReadToggle({ wishId, isRead }: { wishId: string; isRead: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setWishRead(wishId, !isRead);
          if (!result.ok) toast.error(result.error);
        })
      }
    >
      {isRead ? <MailIcon /> : <MailOpenIcon />}
      {isRead ? "Marcar sin leer" : "Marcar leído"}
    </Button>
  );
}

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markAllWishesRead();
          if (result.ok) toast.success(result.message);
          else toast.error(result.error);
        })
      }
    >
      <CheckCheckIcon /> Marcar todos como leídos
    </Button>
  );
}
