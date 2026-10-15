"use client";

import { CheckIcon, CopyIcon, HeartIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";

import {
  changeAttendance,
  getMyRsvp,
  submitRsvp,
  submitWish,
  type MyRsvp,
  type RsvpErrorCode,
} from "@/app/[slug]/rsvp-actions";
import type { Bi } from "@/lib/sections";

import { T, TB } from "./lang";
import { pick, useLang } from "./use-lang";

type Props = {
  slug: string;
  maxCompanions: number;
  deadline: string | null;
  deadlineLabel: Bi | null;
  closed: Bi;
  /** En la vista previa del panel el formulario se muestra pero no envía. */
  preview?: boolean;
};

type View =
  { kind: "loading" } | { kind: "form" } | { kind: "closed" } | { kind: "answered"; rsvp: MyRsvp; token: string };

const ERRORS: Record<RsvpErrorCode, Bi> = {
  INVITATION_NOT_FOUND: {
    es: "Esta invitación no está disponible por ahora.",
    en: "This invitation isn't available right now.",
  },
  RSVP_CLOSED: { es: "El plazo para confirmar ya terminó.", en: "The deadline to confirm has passed." },
  RATE_LIMITED: {
    es: "Demasiados intentos seguidos. Espera unos minutos.",
    en: "Too many attempts. Please wait a few minutes.",
  },
  TOO_MANY_COMPANIONS: { es: "Hay más acompañantes de los permitidos.", en: "There are more guests than allowed." },
  INVALID_COMPANIONS: { es: "Revisa los acompañantes.", en: "Please check your guests." },
  RSVP_NOT_FOUND: {
    es: "No encontramos tu respuesta. Vuelve a confirmar.",
    en: "We couldn't find your answer. Please confirm again.",
  },
  NO_CHANGE: { es: "Tu respuesta ya estaba así.", en: "Your answer was already set that way." },
  WISH_EXISTS: { es: "Ya nos enviaste tu deseo. ¡Gracias!", en: "You already sent us your wish. Thank you!" },
  INVALID: {
    es: "Revisa los datos: cada nombre debe tener al menos 2 letras.",
    en: "Please check the form: each name needs at least 2 letters.",
  },
  UNAVAILABLE: {
    es: "No pudimos guardar tu respuesta. Inténtalo de nuevo.",
    en: "We couldn't save your answer. Please try again.",
  },
};

const storageKey = (slug: string) => `inv-rsvp:${slug}`;
const storage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Navegación privada: queda el enlace personal.
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // nada que limpiar
    }
  },
};

const isPastDeadline = (deadline: string | null) => Boolean(deadline && Date.now() > Date.parse(deadline));
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
const validName = (name: string) => name.trim().length >= 2;

const inputClass =
  "w-full rounded-xl bg-[var(--inv-paper)] px-4 py-3 text-base ring-1 ring-[var(--inv-line)] outline-none placeholder:text-[var(--inv-ink-soft)]/70 focus:ring-2 focus:ring-[var(--inv-gold)]";

export function RsvpForm(props: Props) {
  const { slug, deadline, preview } = props;
  const [view, setView] = useState<View>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    const key = storageKey(slug);

    const load = async () => {
      // Enlace personal: /slug?respuesta=TOKEN → se guarda y se limpia de la URL.
      const url = new URL(window.location.href);
      const fromLink = url.searchParams.get("respuesta");
      if (fromLink) {
        storage.set(key, fromLink);
        url.searchParams.delete("respuesta");
        window.history.replaceState(window.history.state, "", url);
      }

      const token = fromLink ?? storage.get(key);
      if (token && !preview) {
        const result = await getMyRsvp(slug, token);
        if (!active) return;
        if (result.ok && result.rsvp) {
          setView({ kind: "answered", rsvp: result.rsvp, token });
          return;
        }
        if (result.ok) storage.remove(key);
      }
      if (active) setView(isPastDeadline(deadline) ? { kind: "closed" } : { kind: "form" });
    };

    void load();
    return () => {
      active = false;
    };
  }, [slug, deadline, preview]);

  const resetIdentity = () => {
    storage.remove(storageKey(slug));
    setView(isPastDeadline(deadline) ? { kind: "closed" } : { kind: "form" });
  };

  switch (view.kind) {
    case "loading":
      return <div className="mx-auto h-40 max-w-sm animate-pulse rounded-2xl bg-[var(--inv-card)]" aria-busy="true" />;
    case "closed":
      return (
        <p className="mx-auto max-w-sm rounded-2xl bg-[var(--inv-card)] px-5 py-6 whitespace-pre-line">
          <TB text={props.closed} />
        </p>
      );
    case "form":
      return (
        <NewRsvpForm
          {...props}
          onAnswered={(rsvp, token) => {
            storage.set(storageKey(slug), token);
            setView({ kind: "answered", rsvp, token });
          }}
        />
      );
    case "answered":
      return (
        <AnsweredView
          {...props}
          rsvp={view.rsvp}
          token={view.token}
          onUpdate={(rsvp) => setView({ ...view, rsvp })}
          onReset={resetIdentity}
        />
      );
  }
}

// ---------------------------------------------------------------------
// Paso 1 y 2: nombre, asistencia y acompañantes
// ---------------------------------------------------------------------

function NewRsvpForm({
  slug,
  maxCompanions,
  deadline,
  deadlineLabel,
  preview,
  onAnswered,
}: Props & { onAnswered: (rsvp: MyRsvp, token: string) => void }) {
  const lang = useLang();
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [companions, setCompanions] = useState<string[]>([]);
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<RsvpErrorCode | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (preview) return;
    if (!validName(name) || attending === null || (attending && !companions.every(validName))) {
      setError("INVALID");
      return;
    }
    setError(null);
    startTransition(async () => {
      const list = attending ? companions.map((c) => c.trim()) : [];
      const result = await submitRsvp({
        slug,
        fullName: name.trim(),
        attending,
        companions: list,
        locale: lang,
        website,
      });
      if (!result.ok) {
        setError(result.code);
        return;
      }
      onAnswered(
        { fullName: name.trim(), attending, companions: list, hasWish: false, canChange: !isPastDeadline(deadline) },
        result.token,
      );
    });
  };

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-sm gap-5 text-left" noValidate>
      {deadlineLabel && (
        <p className="text-center text-sm text-[var(--inv-ink-soft)]">
          <T es={<>Por favor, confirma antes del {deadlineLabel.es}</>} en={<>Please reply by {deadlineLabel.en}</>} />
        </p>
      )}

      <label className="grid gap-2">
        <span className="text-sm font-semibold tracking-[0.12em] uppercase">
          <T es="Tu nombre completo" en="Your full name" />
        </span>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={120}
          required
          placeholder={pick(lang, "Nombre y apellido", "First and last name")}
        />
      </label>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-semibold tracking-[0.12em] uppercase">
          <T es="¿Nos acompañarás?" en="Will you be there?" />
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <Choice selected={attending === true} onSelect={() => setAttending(true)}>
            <T es="Sí, asistiré" en="Yes, I'll be there" />
          </Choice>
          <Choice
            selected={attending === false}
            onSelect={() => {
              setAttending(false);
              setCompanions([]);
            }}
          >
            <T es="No podré asistir" en="Sorry, I can't make it" />
          </Choice>
        </div>
      </fieldset>

      {attending && <CompanionFields companions={companions} onChange={setCompanions} max={maxCompanions} />}

      {/* Campo trampa para robots: oculto a las personas. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {error && <ErrorText code={error} />}
      {preview && (
        <p className="rounded-xl bg-[var(--inv-card)] px-4 py-3 text-center text-sm">
          Vista previa: el formulario se activa cuando publiques la invitación.
        </p>
      )}

      <button type="submit" className="inv-button" disabled={pending || preview}>
        {pending ? <T es="Enviando…" en="Sending…" /> : <T es="Enviar mi respuesta" en="Send my answer" />}
      </button>
    </form>
  );
}

function Choice({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`rounded-2xl px-3 py-4 text-center text-base transition ${
        selected
          ? "bg-[var(--inv-accent)] text-[var(--inv-on-strong)] shadow-md"
          : "bg-[var(--inv-paper)] ring-1 ring-[var(--inv-line)] hover:ring-[var(--inv-gold)]"
      }`}
    >
      {children}
    </button>
  );
}

function CompanionFields({
  companions,
  onChange,
  max,
}: {
  companions: string[];
  onChange: (list: string[]) => void;
  max: number;
}) {
  const lang = useLang();
  const count = companions.length;
  const setCount = (next: number) => {
    const n = Math.max(0, Math.min(max, next));
    onChange(n > count ? [...companions, ...Array.from({ length: n - count }, () => "")] : companions.slice(0, n));
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold tracking-[0.12em] uppercase">
          <T es="Acompañantes" en="Guests coming with you" />
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCount(count - 1)}
            disabled={count === 0}
            className="grid size-9 place-items-center rounded-full ring-1 ring-[var(--inv-line)] disabled:opacity-40"
            aria-label={pick(lang, "Quitar acompañante", "Remove guest")}
          >
            <MinusIcon className="size-4" />
          </button>
          <span className="w-5 text-center text-lg tabular-nums" aria-live="polite">
            {count}
          </span>
          <button
            type="button"
            onClick={() => setCount(count + 1)}
            disabled={count >= max}
            className="grid size-9 place-items-center rounded-full ring-1 ring-[var(--inv-line)] disabled:opacity-40"
            aria-label={pick(lang, "Agregar acompañante", "Add guest")}
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
      </div>
      {companions.map((value, i) => (
        <input
          key={i}
          className={inputClass}
          value={value}
          onChange={(e) => onChange(companions.map((c, j) => (j === i ? e.target.value : c)))}
          maxLength={120}
          required
          placeholder={pick(lang, `Nombre del acompañante ${i + 1}`, `Guest ${i + 1} full name`)}
        />
      ))}
      {count >= max && (
        <p className="text-xs text-[var(--inv-ink-soft)]">
          <T es={`Máximo ${max} acompañantes por respuesta.`} en={`Up to ${max} guests per reply.`} />
        </p>
      )}
    </div>
  );
}

function ErrorText({ code }: { code: RsvpErrorCode }) {
  return (
    <p
      role="alert"
      className="rounded-xl bg-[var(--inv-danger)]/10 px-4 py-3 text-center text-sm text-[var(--inv-danger)]"
    >
      <TB text={ERRORS[code]} />
    </p>
  );
}

// ---------------------------------------------------------------------
// Paso 3: gracias, deseo, enlace personal y cambio de respuesta
// ---------------------------------------------------------------------

function AnsweredView({
  slug,
  maxCompanions,
  rsvp,
  token,
  onUpdate,
  onReset,
}: Props & { rsvp: MyRsvp; token: string; onUpdate: (rsvp: MyRsvp) => void; onReset: () => void }) {
  const name = firstName(rsvp.fullName);

  return (
    <div className="mx-auto grid max-w-sm gap-6">
      <div className="grid gap-2 rounded-2xl bg-[var(--inv-card)] px-5 py-6">
        <HeartIcon className="mx-auto size-6 fill-[var(--inv-gold)] text-[var(--inv-gold)]" aria-hidden />
        <p className="inv-script text-4xl text-[var(--inv-accent)]">
          {rsvp.attending ? (
            <T es={`¡Gracias, ${name}!`} en={`Thank you, ${name}!`} />
          ) : (
            <T es={`Gracias por avisarnos, ${name}`} en={`Thanks for letting us know, ${name}`} />
          )}
        </p>
        <p>
          {rsvp.attending ? (
            rsvp.companions.length ? (
              <T
                es={`Te esperamos junto a ${rsvp.companions.join(", ")}.`}
                en={`We'll see you there with ${rsvp.companions.join(", ")}.`}
              />
            ) : (
              <T es="¡Te esperamos!" en="We can't wait to see you!" />
            )
          ) : (
            <T es="Te vamos a extrañar." en="We'll miss you." />
          )}
        </p>
      </div>

      {rsvp.hasWish ? (
        <p className="text-sm text-[var(--inv-ink-soft)]">
          <T es="Tu deseo ya les llegó a los novios ♡" en="Your wish has been delivered ♡" />
        </p>
      ) : (
        <WishBox slug={slug} token={token} onSent={() => onUpdate({ ...rsvp, hasWish: true })} />
      )}

      <PersonalLink slug={slug} token={token} />

      {rsvp.canChange ? (
        <ChangeAnswer slug={slug} token={token} rsvp={rsvp} maxCompanions={maxCompanions} onChanged={onUpdate} />
      ) : (
        <p className="text-xs text-[var(--inv-ink-soft)]">
          <T es="El plazo para cambiar tu respuesta ya terminó." en="The deadline to change your answer has passed." />
        </p>
      )}

      <button
        type="button"
        onClick={onReset}
        className="text-xs text-[var(--inv-ink-soft)] underline underline-offset-4"
      >
        <T es={`¿No eres ${name}? Responder como otra persona`} en={`Not ${name}? Reply as someone else`} />
      </button>
    </div>
  );
}

function WishBox({ slug, token, onSent }: { slug: string; token: string; onSent: () => void }) {
  const lang = useLang();
  const [message, setMessage] = useState("");
  const [skipped, setSkipped] = useState(false);
  const [error, setError] = useState<RsvpErrorCode | null>(null);
  const [pending, startTransition] = useTransition();

  if (skipped) {
    return (
      <button type="button" onClick={() => setSkipped(false)} className="text-sm underline underline-offset-4">
        <T es="Dejar un deseo a los novios" en="Leave a wish for the couple" />
      </button>
    );
  }

  return (
    <form
      className="grid gap-3 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        if (!message.trim()) return;
        startTransition(async () => {
          const result = await submitWish({ slug, token, message, locale: lang });
          if (result.ok || result.code === "WISH_EXISTS") onSent();
          else setError(result.code);
        });
      }}
    >
      <label className="grid gap-2">
        <span className="text-center text-sm font-semibold tracking-[0.12em] uppercase">
          <T es="Déjales un deseo (opcional)" en="Leave them a wish (optional)" />
        </span>
        <textarea
          className={`${inputClass} min-h-28 resize-y`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          placeholder={pick(
            lang,
            "Escribe tus buenos deseos para los novios…",
            "Write your best wishes for the couple…",
          )}
        />
      </label>
      <p className="text-xs text-[var(--inv-ink-soft)]">
        <T
          es="Solo lo leerán los novios. Puedes enviar un único deseo."
          en="Only the couple will read it. You can send one wish."
        />
      </p>
      {error && <ErrorText code={error} />}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="inv-button inv-button-ghost" onClick={() => setSkipped(true)}>
          <T es="Omitir" en="Skip" />
        </button>
        <button type="submit" className="inv-button" disabled={pending || !message.trim()}>
          {pending ? <T es="Enviando…" en="Sending…" /> : <T es="Enviar deseo" en="Send wish" />}
        </button>
      </div>
    </form>
  );
}

function PersonalLink({ slug, token }: { slug: string; token: string }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/${slug}?respuesta=${token}`;

  return (
    <div className="grid gap-2 rounded-2xl px-4 py-4 ring-1 ring-[var(--inv-line)]">
      <p className="text-sm">
        <T
          es="Guarda este enlace: con él puedes cambiar tu respuesta desde otro celular."
          en="Save this link: you can use it to change your answer from another phone."
        />
      </p>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // Sin permiso de portapapeles: el enlace se puede seleccionar a mano.
          }
        }}
        className="flex items-center justify-center gap-2 rounded-full bg-[var(--inv-card)] px-4 py-2 text-sm"
      >
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
        {copied ? <T es="¡Enlace copiado!" en="Link copied!" /> : <T es="Copiar mi enlace" en="Copy my link" />}
      </button>
    </div>
  );
}

function ChangeAnswer({
  slug,
  token,
  rsvp,
  maxCompanions,
  onChanged,
}: {
  slug: string;
  token: string;
  rsvp: MyRsvp;
  maxCompanions: number;
  onChanged: (rsvp: MyRsvp) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [companions, setCompanions] = useState<string[]>([]);
  const [error, setError] = useState<RsvpErrorCode | null>(null);
  const [pending, startTransition] = useTransition();
  const toAttending = !rsvp.attending;

  const confirm = () => {
    if (toAttending && !companions.every(validName)) {
      setError("INVALID");
      return;
    }
    startTransition(async () => {
      const list = toAttending ? companions.map((c) => c.trim()) : [];
      const result = await changeAttendance({ slug, token, attending: toAttending, companions: list });
      if (!result.ok) {
        setError(result.code);
        return;
      }
      setEditing(false);
      setError(null);
      onChanged({ ...rsvp, attending: toAttending, companions: list });
    });
  };

  if (!editing) {
    return (
      <button type="button" className="inv-button inv-button-ghost" onClick={() => setEditing(true)}>
        {toAttending ? (
          <T es="Cambiar a: sí asistiré" en="Change to: I'll be there" />
        ) : (
          <T es="Cambiar a: no podré asistir" en="Change to: I can't make it" />
        )}
      </button>
    );
  }

  return (
    <div className="grid gap-4 rounded-2xl bg-[var(--inv-card)] px-4 py-5 text-left">
      {toAttending ? (
        <CompanionFields companions={companions} onChange={setCompanions} max={maxCompanions} />
      ) : (
        <p className="text-center text-sm">
          <T
            es="¿Seguro que no podrás asistir? Si tenías acompañantes, también se quitarán."
            en="Are you sure you can't make it? Any guests coming with you will be removed too."
          />
        </p>
      )}
      {error && <ErrorText code={error} />}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="inv-button inv-button-ghost" onClick={() => setEditing(false)}>
          <T es="Cancelar" en="Cancel" />
        </button>
        <button type="button" className="inv-button" disabled={pending} onClick={confirm}>
          {pending ? <T es="Guardando…" en="Saving…" /> : <T es="Confirmar cambio" en="Confirm change" />}
        </button>
      </div>
    </div>
  );
}
