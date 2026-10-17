"use client";

import { CheckCheckIcon, EyeIcon, EyeOffIcon, MailIcon, MailOpenIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { markAllWishesRead, setWishHidden, setWishRead } from "./actions";

/** Hides a wish from the invitation's guestbook, or shows it again. */
export function WishVisibilityToggle({ wishId, hidden }: { wishId: string; hidden: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={hidden ? "outline" : "secondary"}
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setWishHidden(wishId, !hidden);
          if (result.ok) toast.success(result.message);
          else toast.error(result.error);
        })
      }
    >
      {hidden ? <EyeIcon /> : <EyeOffIcon />}
      {hidden ? "Mostrar en la invitación" : "Ocultar de la invitación"}
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
