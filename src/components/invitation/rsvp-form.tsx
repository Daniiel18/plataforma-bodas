"use client";

import { ArrowLeftIcon, CheckIcon, CopyIcon, HeartIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";

import { changeAttendance, getMyRsvp, submitRsvp, type MyRsvp, type RsvpErrorCode } from "@/app/[slug]/rsvp-actions";
import type { Bi } from "@/lib/sections";

import { T, TB } from "./lang";
import { pick, useLang } from "./use-lang";

type Props = {
  slug: string;
  maxCompanions: number;
  /** "count": only how many people come with each guest. */
  companionsMode: "names" | "count";
  deadline: string | null;
  deadlineLabel: Bi | null;
  closed: Bi;
  /** In the dashboard preview the form is shown but never submits. */
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
      // Private browsing: the personal link still works.
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // nothing to clean up
    }
  },
};

const isPastDeadline = (deadline: string | null) => Boolean(deadline && Date.now() > Date.parse(deadline));
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
const validName = (name: string) => name.trim().length >= 2;

const inputClass =
  "w-full rounded-xl bg-[var(--inv-paper)] px-4 py-3 text-base ring-1 ring-[var(--inv-line)] outline-none placeholder:text-[var(--inv-ink-soft)] focus:ring-2 focus:ring-[var(--inv-gold)]";

export function RsvpForm(props: Props) {
  const { slug, deadline, preview } = props;
  const [view, setView] = useState<View>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    const key = storageKey(slug);

    const load = async () => {
      // Personal link: /slug?respuesta=TOKEN → stored, then removed from the URL.
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
// Step 1: name, attendance and companions · Step 2: optional wish.
// Everything is sent together, so the couple gets a single notification.
// ---------------------------------------------------------------------

function NewRsvpForm({
  slug,
  maxCompanions,
  companionsMode,
  deadline,
  deadlineLabel,
  preview,
  onAnswered,
}: Props & { onAnswered: (rsvp: MyRsvp, token: string) => void }) {
  const lang = useLang();
  const [step, setStep] = useState<"details" | "wish">("details");
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [companions, setCompanions] = useState<string[]>([]);
  const [wish, setWish] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<RsvpErrorCode | null>(null);
  const [pending, startTransition] = useTransition();
  const byCount = companionsMode === "count";

  const next = (event: FormEvent) => {
    event.preventDefault();
    if (!validName(name) || attending === null || (attending && !byCount && !companions.every(validName))) {
      setError("INVALID");
      return;
    }
    setError(null);
    setStep("wish");
  };

  const send = (withWish: boolean) => {
    if (preview || attending === null) return;
    startTransition(async () => {
      const list = attending && !byCount ? companions.map((c) => c.trim()) : [];
      const count = attending ? companions.length : 0;
      const message = withWish ? wish.trim() : "";
      const result = await submitRsvp({
        slug,
        fullName: name.trim(),
        attending,
        companions: list,
        companionsCount: byCount ? count : undefined,
        wish: message,
        locale: lang,
        website,
      });
      if (!result.ok) {
        setError(result.code);
        return;
      }
      onAnswered(
        {
          fullName: name.trim(),
          attending,
          companions: list,
          companionsCount: count,
          hasWish: Boolean(message),
          canChange: !isPastDeadline(deadline),
        },
        result.token,
      );
    });
  };

  const stepLabel = (
    <p className="text-center text-xs tracking-[0.2em] text-[var(--inv-ink-soft)] uppercase">
      <T es={`Paso ${step === "details" ? 1 : 2} de 2`} en={`Step ${step === "details" ? 1 : 2} of 2`} />
    </p>
  );

  if (step === "wish") {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(true);
        }}
        className="mx-auto grid max-w-sm gap-5 text-left"
        noValidate
      >
        {stepLabel}
        <label className="grid gap-2">
          <span className="text-center text-sm font-semibold tracking-[0.12em] uppercase">
            <T es="¿Quieres dejarles un deseo?" en="Would you like to leave them a wish?" />
          </span>
          <span className="text-center text-sm text-[var(--inv-ink-soft)]">
            <T es="Opcional · solo lo leerán los novios" en="Optional · only the couple will read it" />
          </span>
          <textarea
            className={`${inputClass} min-h-32 resize-y`}
            value={wish}
            onChange={(e) => setWish(e.target.value)}
            maxLength={1000}
            placeholder={pick(
              lang,
              "Escribe tus buenos deseos para los novios…",
              "Write your best wishes for the couple…",
            )}
          />
        </label>

        {error && <ErrorText code={error} />}
        {preview && <PreviewNotice />}

        <button type="submit" className="inv-button" disabled={pending || preview}>
          {pending ? <T es="Enviando…" en="Sending…" /> : <T es="Enviar mi respuesta" en="Send my answer" />}
        </button>
        {wish.trim() && (
          <button
            type="button"
            className="inv-button inv-button-ghost"
            disabled={pending || preview}
            onClick={() => send(false)}
          >
            <T es="Enviar sin deseo" en="Send without a wish" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setStep("details")}
          disabled={pending}
          className="mx-auto flex items-center gap-1.5 text-sm text-[var(--inv-ink-soft)] underline underline-offset-4"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden />
          <T es="Volver" en="Back" />
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={next} className="mx-auto grid max-w-sm gap-5 text-left" noValidate>
      {stepLabel}
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

      {attending && (
        <CompanionFields companions={companions} onChange={setCompanions} max={maxCompanions} byCount={byCount} />
      )}

      {/* Honeypot field for bots: hidden from people. */}
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
      {preview && <PreviewNotice />}

      <button type="submit" className="inv-button">
        <T es="Continuar" en="Continue" />
      </button>
    </form>
  );
}

function PreviewNotice() {
  return (
    <p className="rounded-xl bg-[var(--inv-card)] px-4 py-3 text-center text-sm">
      Vista previa: el formulario se activa cuando publiques la invitación.
    </p>
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
  byCount = false,
}: {
  companions: string[];
  onChange: (list: string[]) => void;
  max: number;
  /** Only the number of companions, without their names. */
  byCount?: boolean;
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
          {byCount ? (
            <T es="¿Cuántos vienen contigo?" en="How many are coming with you?" />
          ) : (
            <T es="Acompañantes" en="Guests coming with you" />
          )}
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
      {!byCount &&
        companions.map((value, i) => (
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
// After answering: thanks, personal link and changing the answer
// ---------------------------------------------------------------------

function AnsweredView({
  slug,
  maxCompanions,
  companionsMode,
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
            ) : rsvp.companionsCount > 0 ? (
              <T
                es={`Te esperamos con ${rsvp.companionsCount} ${rsvp.companionsCount === 1 ? "acompañante" : "acompañantes"}.`}
                en={`We'll see you there with ${rsvp.companionsCount} ${rsvp.companionsCount === 1 ? "guest" : "guests"}.`}
              />
            ) : (
              <T es="¡Te esperamos!" en="We can't wait to see you!" />
            )
          ) : (
            <T es="Te vamos a extrañar." en="We'll miss you." />
          )}
        </p>
      </div>

      {rsvp.hasWish && (
        <p className="text-sm text-[var(--inv-ink-soft)]">
          <T es="Tu deseo ya les llegó a los novios ♡" en="Your wish has been delivered ♡" />
        </p>
      )}

      <PersonalLink slug={slug} token={token} />

      {rsvp.canChange ? (
        <ChangeAnswer
          slug={slug}
          token={token}
          rsvp={rsvp}
          maxCompanions={maxCompanions}
          companionsMode={companionsMode}
          onChanged={onUpdate}
        />
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
            // No clipboard permission: the link can be selected by hand.
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
  companionsMode,
  onChanged,
}: {
  slug: string;
  token: string;
  rsvp: MyRsvp;
  maxCompanions: number;
  companionsMode: "names" | "count";
  onChanged: (rsvp: MyRsvp) => void;
}) {
  const byCount = companionsMode === "count";
  const [editing, setEditing] = useState(false);
  const [companions, setCompanions] = useState<string[]>([]);
  const [error, setError] = useState<RsvpErrorCode | null>(null);
  const [pending, startTransition] = useTransition();
  const toAttending = !rsvp.attending;

  const confirm = () => {
    if (toAttending && !byCount && !companions.every(validName)) {
      setError("INVALID");
      return;
    }
    startTransition(async () => {
      const list = toAttending && !byCount ? companions.map((c) => c.trim()) : [];
      const count = toAttending ? companions.length : 0;
      const result = await changeAttendance({
        slug,
        token,
        attending: toAttending,
        companions: list,
        companionsCount: byCount ? count : undefined,
      });
      if (!result.ok) {
        setError(result.code);
        return;
      }
      setEditing(false);
      setError(null);
      onChanged({ ...rsvp, attending: toAttending, companions: list, companionsCount: count });
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
        <CompanionFields companions={companions} onChange={setCompanions} max={maxCompanions} byCount={byCount} />
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
