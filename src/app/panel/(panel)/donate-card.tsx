"use client";

import { HeartIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

const KEY = "lazodoro-donate-dismissed";
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const dismissed = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
};

/** A gentle, dismissible invitation to support the platform (shown once the invitation is live). */
export function DonateCard() {
  // Hidden on the server and until the device says it was not dismissed.
  const hidden = useSyncExternalStore(subscribe, dismissed, () => true);
  if (hidden) return null;

  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Without storage it simply shows again next time.
    }
    listeners.forEach((listener) => listener());
  };

  return (
    <div className="relative mb-6 flex items-start gap-3 rounded-xl border bg-accent/30 p-4 pr-10 text-sm">
      <HeartIcon className="mt-0.5 size-4 shrink-0 fill-primary text-primary" />
      <p>
        Lazo de Oro es gratis y sin anuncios. Si su invitación les está gustando,{" "}
        <Link href="/donar" className="font-medium underline underline-offset-4">
          pueden apoyarnos con una donación
        </Link>
        . ♡
      </p>
      <button
        type="button"
        onClick={close}
        className="absolute top-3 right-3 rounded p-1 text-muted-foreground hover:bg-accent"
        aria-label="Cerrar"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
