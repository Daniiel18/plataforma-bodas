"use client";

import {
  CheckIcon,
  CopyIcon,
  MailIcon,
  MessageCircleIcon,
  MessageSquareTextIcon,
  SendIcon,
  Share2Icon,
  type LucideIcon,
} from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";

import { useDevice } from "@/components/invitation/use-device";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { invitationMessage, shareLinks, type ShareDetails } from "@/lib/share";

type Props = {
  slug: string;
  details: ShareDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown right after publishing: celebratory title. */
  justPublished?: boolean;
};

const noopSubscribe = () => () => {};
const useOrigin = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
const isPhone = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

/** Link, ready-made invitation message and one-tap buttons for each messaging app. */
export function ShareInvitationDialog({ slug, details, open, onOpenChange, justPublished = false }: Props) {
  const origin = useOrigin();
  const device = useDevice();
  const url = `${origin}/${slug}`;
  const [english, setEnglish] = useState(false);
  const [edited, setEdited] = useState<string | null>(null);
  const message = edited ?? invitationMessage(details, url, { english });
  const subject = `Invitación a la boda de ${details.partner1} y ${details.partner2}`;
  const links = shareLinks(message, url, subject, device ?? "other");
  const phone = device !== null && isPhone();
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const apps: { label: string; href: string; color: string; icon: ReactNode; newTab?: boolean; hidden?: boolean }[] = [
    { label: "Mensajes", href: links.messages, color: "#34C759", icon: <Glyph icon={MessageSquareTextIcon} /> },
    {
      label: "WhatsApp",
      href: links.whatsapp,
      color: "#25D366",
      icon: <Glyph icon={MessageCircleIcon} />,
      newTab: true,
    },
    {
      label: "Messenger",
      href: links.messenger,
      color: "#0084FF",
      icon: <Glyph icon={MessageCircleIcon} />,
      hidden: !phone,
    },
    { label: "Telegram", href: links.telegram, color: "#2AABEE", icon: <Glyph icon={SendIcon} />, newTab: true },
    {
      label: "Facebook",
      href: links.facebook,
      color: "#1877F2",
      icon: <span className="font-sans text-2xl leading-none font-bold">f</span>,
      newTab: true,
    },
    { label: "Correo", href: links.email, color: "#6B7280", icon: <Glyph icon={MailIcon} /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium">
            {justPublished ? "¡Tu invitación ya está publicada! 🎉" : "Compartir la invitación"}
          </DialogTitle>
          <DialogDescription>
            Envíala por la app que prefieras: el mensaje ya va listo y el enlace muestra tu foto de portada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="share-link">Enlace de la invitación</Label>
            <div className="flex gap-2">
              <Input id="share-link" value={url} readOnly onFocus={(e) => e.currentTarget.select()} />
              <CopyButton text={url} label="Copiar enlace" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {apps
              .filter((app) => !app.hidden)
              .map((app) => (
                <a
                  key={app.label}
                  href={app.href}
                  target={app.newTab ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="grid justify-items-center gap-1.5 rounded-xl p-2 text-xs transition hover:bg-accent"
                >
                  <span
                    className="grid size-12 place-items-center rounded-full text-white shadow-sm"
                    style={{ background: app.color }}
                  >
                    {app.icon}
                  </span>
                  {app.label}
                </a>
              ))}
            {canShare && (
              <button
                type="button"
                onClick={() => navigator.share({ title: subject, text: message }).catch(() => {})}
                className="grid justify-items-center gap-1.5 rounded-xl p-2 text-xs transition hover:bg-accent"
              >
                <span className="grid size-12 place-items-center rounded-full bg-muted text-foreground shadow-sm">
                  <Share2Icon className="size-5" />
                </span>
                Más…
              </button>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="share-message">Mensaje</Label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Incluir en inglés
                <Switch
                  checked={english}
                  onCheckedChange={(value) => {
                    setEnglish(value);
                    setEdited(null);
                  }}
                />
              </label>
            </div>
            <Textarea
              id="share-message"
              value={message}
              onChange={(e) => setEdited(e.target.value)}
              className="min-h-48 text-sm"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Puedes editarlo antes de enviarlo.</p>
              <CopyButton text={message} label="Copiar mensaje" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Glyph({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="size-5" />;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // No clipboard permission: the text can still be selected by hand.
        }
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "¡Copiado!" : label}
    </Button>
  );
}

/** "Compartir invitación" button that opens the dialog. */
export function ShareInvitationButton({
  slug,
  details,
  variant = "default",
}: {
  slug: string;
  details: ShareDetails;
  variant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant={variant} onClick={() => setOpen(true)}>
        <Share2Icon /> Compartir invitación
      </Button>
      <ShareInvitationDialog slug={slug} details={details} open={open} onOpenChange={setOpen} />
    </>
  );
}
