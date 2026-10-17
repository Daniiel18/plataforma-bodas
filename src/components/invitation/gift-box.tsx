"use client";

import { CheckIcon, CopyIcon, DownloadIcon, ExternalLinkIcon, SendIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { GIFT_LABELS, type GiftView } from "@/lib/gifts";

import { T, TB } from "./lang";
import { pick, useLang } from "./use-lang";

/** Animated gift box: tapping it reveals every way to send a gift. */
export function GiftBox({ methods }: { methods: GiftView[] }) {
  const [open, setOpen] = useState(false);
  const lang = useLang();

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
        <div className="inv-reveal grid w-full max-w-xs gap-4">
          {methods.map((method) => (
            <div
              key={method.kind}
              className="grid justify-items-center gap-3 rounded-2xl bg-[var(--inv-paper)] p-5 ring-1 ring-[var(--inv-line)]"
            >
              <p
                className={`text-xs font-semibold tracking-[0.3em] uppercase ${method.kind === "zelle" ? "text-[var(--inv-zelle)]" : "text-[var(--inv-accent)]"}`}
              >
                <TB text={GIFT_LABELS[method.kind]} />
              </p>
              <MethodDetails method={method} />
              {method.note && (
                <p className="text-center text-sm whitespace-pre-line text-[var(--inv-ink-soft)]">
                  <TB text={method.note} />
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MethodDetails({ method }: { method: GiftView }) {
  switch (method.kind) {
    case "zelle":
      return <ZelleDetails zelle={method} />;
    case "paypal":
      return (
        <>
          <a href={method.link} target="_blank" rel="noopener noreferrer" className="inv-button w-full">
            <SendIcon className="size-4" aria-hidden />
            <T es="Enviar con PayPal" en="Send with PayPal" />
          </a>
          <CopyValue value={method.link.replace(/^https:\/\//, "")} />
        </>
      );
    case "bank":
      return (
        <dl className="grid w-full gap-2 text-left text-sm">
          {method.bank && <Row label={{ es: "Banco", en: "Bank" }} value={method.bank} />}
          {method.holderName && <Row label={{ es: "Titular", en: "Account holder" }} value={method.holderName} />}
          {method.accountType && (
            <Row label={{ es: "Tipo de cuenta", en: "Account type" }} value={method.accountType} />
          )}
          {method.account && (
            <Row label={{ es: "Número de cuenta", en: "Account number" }} value={method.account} copy />
          )}
          {method.routing && (
            <Row label={{ es: "Ruta / CLABE / IBAN", en: "Routing / CLABE / IBAN" }} value={method.routing} copy />
          )}
        </dl>
      );
    case "registry":
      return (
        <div className="grid w-full gap-2">
          {method.links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="inv-button w-full">
              <ExternalLinkIcon className="size-4" aria-hidden />
              {link.store || <T es="Ver mesa de regalos" en="See the registry" />}
            </a>
          ))}
        </div>
      );
  }
}

function Row({ label, value, copy }: { label: { es: string; en: string }; value: string; copy?: boolean }) {
  return (
    <div className="grid gap-0.5 rounded-xl bg-[var(--inv-card)] px-3 py-2">
      <dt className="text-[0.7rem] tracking-[0.15em] text-[var(--inv-ink-soft)] uppercase">
        <TB text={label} />
      </dt>
      <dd className="flex items-center justify-between gap-2 font-medium break-all">
        <span className={copy ? "font-mono" : undefined}>{value}</span>
        {copy && <CopyButton value={value} />}
      </dd>
    </div>
  );
}

function useCopy(value: string) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard permission: the value stays visible to copy by hand.
    }
  };
  return { copied, copy };
}

function CopyButton({ value }: { value: string }) {
  const { copied, copy } = useCopy(value);
  const lang = useLang();
  return (
    <button type="button" onClick={copy} className="shrink-0 rounded-full p-1.5 hover:bg-[var(--inv-paper)]">
      {copied ? <CheckIcon className="size-4" aria-hidden /> : <CopyIcon className="size-4" aria-hidden />}
      <span className="sr-only">{copied ? pick(lang, "¡Copiado!", "Copied!") : pick(lang, "Copiar", "Copy")}</span>
    </button>
  );
}

/** A value with a copy button, e.g. the Zelle email or the PayPal.me link. */
function CopyValue({ value }: { value: string }) {
  const { copied, copy } = useCopy(value);
  const lang = useLang();
  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-2 rounded-full bg-[var(--inv-card)] px-4 py-2 text-sm"
      >
        <span className="font-mono break-all">{value}</span>
        {copied ? (
          <CheckIcon className="size-4 shrink-0" aria-hidden />
        ) : (
          <CopyIcon className="size-4 shrink-0" aria-hidden />
        )}
        <span className="sr-only">{pick(lang, "Copiar", "Copy")}</span>
      </button>
      {copied && (
        <p className="text-xs text-[var(--inv-ink-soft)]" role="status">
          <T es="¡Copiado!" en="Copied!" />
        </p>
      )}
    </>
  );
}

function ZelleDetails({ zelle }: { zelle: Extract<GiftView, { kind: "zelle" }> }) {
  const [qrFile, setQrFile] = useState<File | null>(null);
  const lang = useLang();

  // Fetched as soon as the box opens, so saving it later is instant: iPhone
  // only allows the share sheet straight from a tap.
  useEffect(() => {
    if (!zelle.qr) return;
    let active = true;
    fetch(zelle.qr.url)
      .then((response) => response.blob())
      .then((blob) => {
        if (active) setQrFile(new File([blob], "zelle-qr.png", { type: blob.type || "image/png" }));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [zelle.qr]);

  /** Phones get the share sheet ("Save image"); computers download the file. */
  const saveQr = async () => {
    if (!qrFile) return;
    if (navigator.canShare?.({ files: [qrFile] })) {
      try {
        await navigator.share({ files: [qrFile] });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(qrFile);
    const link = Object.assign(document.createElement("a"), { href: url, download: qrFile.name });
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
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
      {(zelle.link || zelle.qr) && (
        <div className="grid w-full gap-2">
          {zelle.link && (
            <a href={zelle.link} target="_blank" rel="noopener noreferrer" className="inv-button">
              <SendIcon className="size-4" aria-hidden />
              <T es="Enviar con Zelle" en="Send with Zelle" />
            </a>
          )}
          {zelle.qr && (
            <button type="button" onClick={saveQr} disabled={!qrFile} className="inv-button inv-button-ghost">
              <DownloadIcon className="size-4" aria-hidden />
              <T es="Guardar QR" en="Save QR code" />
            </button>
          )}
        </div>
      )}
      {zelle.holderName && <p className="text-lg font-medium">{zelle.holderName}</p>}
      {zelle.handle && <CopyValue value={zelle.handle} />}
    </>
  );
}
