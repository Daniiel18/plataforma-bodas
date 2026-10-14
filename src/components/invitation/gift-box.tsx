"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import type { ZelleInfo } from "@/lib/invitation";

import { T, TB } from "./lang";
import { pick, useLang } from "./use-lang";

/** Caja de regalos animada: al tocarla muestra el QR y los datos de Zelle. */
export function GiftBox({ zelle }: { zelle: ZelleInfo }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const lang = useLang();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(zelle.handle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el dato queda visible para copiarlo a mano.
    }
  };

  return (
    <div className="grid justify-items-center gap-5">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label={pick(lang, "Abrir caja de regalos", "Open gift box")}
        className="grid gap-3"
      >
        <span className="inv-giftbox" data-open={open}>
          <span className="inv-giftbox-base" />
          <span className="inv-giftbox-ribbon-v" />
          <span className="inv-giftbox-lid" />
          <svg className="inv-giftbox-bow" width="44" height="26" viewBox="0 0 44 26" aria-hidden>
            <path d="M22 22C16 10 6 4 3 9s7 12 19 13Zm0 0c6-12 16-18 19-13S34 21 22 22Z" fill="currentColor" />
          </svg>
          {["-left-3 top-6", "-right-2 top-2", "right-0 bottom-4", "-left-1 bottom-1"].map((pos, i) => (
            <span
              key={pos}
              className={`inv-sparkle absolute ${pos} text-[var(--inv-gold)]`}
              style={{ animationDelay: `${i * 0.5}s` }}
              aria-hidden
            >
              ✦
            </span>
          ))}
        </span>
        {!open && (
          <span className="text-sm tracking-[0.15em] text-[var(--inv-ink-soft)] uppercase">
            <T es="Toca para abrir" en="Tap to open" />
          </span>
        )}
      </button>

      {open && (
        <div className="inv-reveal grid w-full max-w-xs justify-items-center gap-3 rounded-2xl bg-[var(--inv-paper)] p-5 ring-1 ring-[var(--inv-line)]">
          <p className="text-xs font-semibold tracking-[0.3em] text-[#6d1ed4] uppercase">Zelle</p>
          {zelle.qr && (
            <Image
              src={zelle.qr.url}
              alt={pick(lang, "Código QR de Zelle", "Zelle QR code")}
              width={zelle.qr.width}
              height={zelle.qr.height}
              sizes="220px"
              className="h-auto w-52 rounded-lg bg-white p-2"
            />
          )}
          {zelle.holderName && <p className="text-lg font-medium">{zelle.holderName}</p>}
          {zelle.handle && (
            <button
              type="button"
              onClick={copy}
              className="flex items-center gap-2 rounded-full bg-[var(--inv-card)] px-4 py-2 text-sm"
            >
              <span className="font-mono">{zelle.handle}</span>
              {copied ? <CheckIcon className="size-4" aria-hidden /> : <CopyIcon className="size-4" aria-hidden />}
              <span className="sr-only">{pick(lang, "Copiar", "Copy")}</span>
            </button>
          )}
          {copied && (
            <p className="text-xs text-[var(--inv-ink-soft)]" role="status">
              <T es="¡Copiado!" en="Copied!" />
            </p>
          )}
          {zelle.note && (
            <p className="text-center text-sm whitespace-pre-line text-[var(--inv-ink-soft)]">
              <TB text={zelle.note} />
            </p>
          )}
        </div>
      )}
    </div>
  );
}
