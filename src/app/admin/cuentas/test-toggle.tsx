"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { setAccountTest } from "../actions";

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
