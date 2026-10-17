"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GIFT_KINDS, GIFT_LABELS, paypalLink, registryUrl, type GiftKind, type Gifts } from "@/lib/gifts";
import { cn } from "@/lib/utils";

const DESCRIPTIONS: Record<GiftKind, string> = {
  zelle: "Para invitados en EE. UU.: QR y botón que abre Zelle con ustedes como destinatarios.",
  paypal: "Un botón que abre su PayPal.me para enviar dinero desde cualquier país.",
  bank: "Los datos de su cuenta, con botones para copiarlos.",
  registry: "Enlaces a su lista de regalos (Amazon, Liverpool, El Palacio de Hierro…).",
};

type Props = {
  value: Gifts;
  onChange: (next: Gifts) => void;
  /** Zelle QR upload (stored on the device in the builder, in Storage in the dashboard). */
  qrField: ReactNode;
};

/** Each gift method with its on/off switch and fields; shared by the builder and the dashboard. */
export function GiftMethodsFields({ value, onChange, qrField }: Props) {
  const set = <K extends GiftKind>(kind: K, patch: Partial<Gifts[K]>) =>
    onChange({ ...value, [kind]: { ...value[kind], ...patch } });

  return (
    <div className="grid gap-3">
      {GIFT_KINDS.map((kind) => (
        <div key={kind} className={cn("rounded-xl border", value[kind].enabled && "border-primary/50 bg-accent/20")}>
          <label className="flex cursor-pointer items-start justify-between gap-3 p-4">
            <span className="grid gap-0.5">
              <span className="font-medium">{GIFT_LABELS[kind].es}</span>
              <span className="text-xs text-muted-foreground">{DESCRIPTIONS[kind]}</span>
            </span>
            <Switch
              checked={value[kind].enabled}
              onCheckedChange={(enabled) => set(kind, { enabled })}
              aria-label={`Activar ${GIFT_LABELS[kind].es}`}
            />
          </label>
          {value[kind].enabled && (
            <div className="grid gap-4 border-t p-4">
              {kind === "zelle" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      id="zelle-holder"
                      label="Nombre en Zelle"
                      value={value.zelle.holderName}
                      onChange={(holderName) => set("zelle", { holderName })}
                      max={80}
                    />
                    <Field
                      id="zelle-handle"
                      label="Correo o teléfono de Zelle"
                      value={value.zelle.handle}
                      onChange={(handle) => set("zelle", { handle })}
                      max={120}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Código QR de Zelle (opcional)</Label>
                    {qrField}
                  </div>
                </>
              )}
              {kind === "paypal" && (
                <Field
                  id="paypal-user"
                  label="Su usuario de PayPal.me"
                  value={value.paypal.user}
                  onChange={(user) => set("paypal", { user })}
                  placeholder="paypal.me/anayluis"
                  hint={
                    value.paypal.user && !paypalLink(value.paypal.user)
                      ? "Escriban solo el usuario, por ejemplo: anayluis"
                      : value.paypal.user
                        ? `El botón abrirá ${paypalLink(value.paypal.user)}`
                        : "Lo encuentran en la app de PayPal → Recibir → Compartir mi enlace."
                  }
                  max={120}
                />
              )}
              {kind === "bank" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="bank-name"
                    label="Banco"
                    value={value.bank.bank}
                    onChange={(bank) => set("bank", { bank })}
                    max={80}
                  />
                  <Field
                    id="bank-holder"
                    label="Titular de la cuenta"
                    value={value.bank.holderName}
                    onChange={(holderName) => set("bank", { holderName })}
                    max={80}
                  />
                  <Field
                    id="bank-type"
                    label="Tipo de cuenta (opcional)"
                    value={value.bank.accountType}
                    onChange={(accountType) => set("bank", { accountType })}
                    placeholder="Ahorros, corriente…"
                    max={40}
                  />
                  <Field
                    id="bank-account"
                    label="Número de cuenta"
                    value={value.bank.account}
                    onChange={(account) => set("bank", { account })}
                    max={60}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      id="bank-routing"
                      label="Número de ruta, CLABE o IBAN (opcional)"
                      value={value.bank.routing}
                      onChange={(routing) => set("bank", { routing })}
                      max={60}
                    />
                  </div>
                </div>
              )}
              {kind === "registry" && (
                <div className="grid gap-3">
                  {value.registry.links.map((link, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                      <Field
                        id={`registry-store-${index}`}
                        label="Tienda"
                        value={link.store}
                        placeholder="Amazon"
                        onChange={(store) =>
                          set("registry", {
                            links: value.registry.links.map((l, i) => (i === index ? { ...l, store } : l)),
                          })
                        }
                        max={60}
                      />
                      <Field
                        id={`registry-url-${index}`}
                        label="Enlace de su lista"
                        value={link.url}
                        placeholder="amazon.com/wedding/…"
                        hint={link.url && !registryUrl(link.url) ? "Ese enlace no parece válido." : undefined}
                        onChange={(url) =>
                          set("registry", {
                            links: value.registry.links.map((l, i) => (i === index ? { ...l, url } : l)),
                          })
                        }
                        max={500}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Quitar enlace"
                        onClick={() => set("registry", { links: value.registry.links.filter((_, i) => i !== index) })}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  ))}
                  {value.registry.links.length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-self-start"
                      onClick={() => set("registry", { links: [...value.registry.links, { store: "", url: "" }] })}
                    >
                      <PlusIcon /> Agregar enlace
                    </Button>
                  )}
                </div>
              )}
              <Field
                id={`${kind}-note`}
                label="Nota (opcional)"
                value={value[kind].note}
                onChange={(note) => set(kind, { note } as Partial<Gifts[typeof kind]>)}
                placeholder={kind === "bank" ? "Ej.: en el concepto escriban su nombre" : undefined}
                max={300}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  max: number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {/* The couple's own details: keep browsers and password managers from filling in saved cards. */}
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={max}
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        data-bwignore
        data-form-type="other"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
