"use client";

import type { AuthError } from "@supabase/supabase-js";
import { ArrowLeftIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { T } from "@/components/invitation/lang";
import { pick, useLang } from "@/components/invitation/use-lang";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

import { rememberEmailLanguage } from "./actions";
import { GoogleButton } from "./google-button";

const RESEND_SECONDS = 60;

type Problem = { es: string; en: string };

function describe(error: AuthError, step: "email" | "code" | "google"): Problem {
  const text = `${error.status ?? ""} ${error.code ?? ""} ${error.message}`.toLowerCase();
  if (text.includes("429") || text.includes("rate")) {
    return {
      es: "Ya te enviamos un código hace muy poco. Espera un minuto e inténtalo de nuevo.",
      en: "We just sent you a code. Wait a minute and try again.",
    };
  }
  if (step === "google") {
    return {
      es: "Entrar con Google no está disponible ahora. Usa tu correo.",
      en: "Signing in with Google is not available right now. Use your email.",
    };
  }
  if (step === "code") {
    return {
      es: "El código no es correcto o ya venció. Revísalo o pide uno nuevo.",
      en: "That code is wrong or has expired. Check it or ask for a new one.",
    };
  }
  return {
    es: "No pudimos enviar el código. Revisa el correo e inténtalo de nuevo.",
    en: "We couldn't send the code. Check the email address and try again.",
  };
}

/** Google, or a one-time code by email (the same email also has a sign-in button). */
export function SignIn({ next, linkError }: { next: string; linkError: boolean }) {
  const lang = useLang();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [problem, setProblem] = useState<Problem | null>(
    linkError
      ? {
          es: "El enlace expiró o ya se usó. Pide un código nuevo.",
          en: "That link has expired or was already used. Ask for a new code.",
        }
      : null,
  );
  const [pending, startTransition] = useTransition();
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const callback = () => `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;

  /** Google's button signed the couple in on this page: exchange the token for a session. */
  const googleToken = (token: string, nonce: string) =>
    startTransition(async () => {
      setProblem(null);
      const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token, nonce });
      if (error) {
        setProblem(describe(error, "google"));
        return;
      }
      window.location.assign(next);
    });

  /** Fallback when Google's button cannot load: the classic redirect. */
  const googleRedirect = () =>
    startTransition(async () => {
      setProblem(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback() },
      });
      if (error) setProblem(describe(error, "google"));
    });

  const sendCode = () =>
    startTransition(async () => {
      setProblem(null);
      // The email is sent in the language this page is shown in.
      await rememberEmailLanguage(email.trim(), lang).catch(() => undefined);
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true, emailRedirectTo: callback(), data: { locale: lang } },
      });
      if (error) {
        setProblem(describe(error, "email"));
        return;
      }
      setStep("code");
      setCode("");
      setWait(RESEND_SECONDS);
    });

  const verify = () =>
    startTransition(async () => {
      setProblem(null);
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
      if (error) {
        setProblem(describe(error, "code"));
        return;
      }
      // Full navigation so the server sees the new session cookies.
      window.location.assign(next);
    });

  const publishing = next.startsWith("/crear/publicar");

  return (
    <div className="mx-auto grid w-full max-w-md gap-6 px-4 py-12 md:py-20">
      <div className="grid gap-2 text-center">
        <h1 className="font-heading text-4xl font-medium">
          {publishing ? (
            <T es="Un paso más para publicar" en="One more step to publish" />
          ) : (
            <T es="Entra a tu panel" en="Sign in to your dashboard" />
          )}
        </h1>
        <p className="text-[var(--site-ink-soft)]">
          {publishing ? (
            <T
              es="Entra para guardar su invitación y recibir las confirmaciones. Es gratis."
              en="Sign in to save your invitation and receive your guests' replies. It's free."
            />
          ) : (
            <T es="Con Google o con un código que te enviamos por correo." en="With Google or a code we email you." />
          )}
        </p>
      </div>

      <div className="grid gap-5 rounded-2xl border border-[var(--site-line)] bg-[var(--site-paper)] p-6 shadow-sm">
        {step === "email" ? (
          <>
            <GoogleButton
              lang={lang}
              onToken={googleToken}
              fallback={
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12 bg-white"
                  onClick={googleRedirect}
                  disabled={pending}
                >
                  <GoogleLogo /> <T es="Continuar con Google" en="Continue with Google" />
                </Button>
              }
            />

            <div className="flex items-center gap-3 text-xs text-[var(--site-ink-soft)] uppercase">
              <span className="h-px flex-1 bg-[var(--site-line)]" />
              <T es="o con tu correo" en="or with your email" />
              <span className="h-px flex-1 bg-[var(--site-line)]" />
            </div>

            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                sendCode();
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="email">
                  <T es="Correo" en="Email" />
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={pick(lang, "tu@correo.com", "you@email.com")}
                />
              </div>
              <Button type="submit" size="lg" className="h-12" disabled={pending || !email.includes("@")}>
                <MailIcon />
                {pending ? <T es="Enviando…" en="Sending…" /> : <T es="Enviarme un código" en="Email me a code" />}
              </Button>
            </form>
          </>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              verify();
            }}
          >
            <p className="text-sm text-[var(--site-ink-soft)]">
              <T es="Te enviamos un código a " en="We sent a code to " />
              <strong className="text-[var(--site-ink)]">{email}</strong>.{" "}
              <T es="Escríbelo aquí o toca el botón del correo." en="Type it here or tap the button in the email." />
            </p>
            <div className="grid gap-2">
              <Label htmlFor="code">
                <T es="Código" en="Code" />
              </Label>
              <Input
                id="code"
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,8}"
                maxLength={8}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="h-12 text-center text-2xl tracking-[0.4em]"
              />
            </div>
            <Button type="submit" size="lg" className="h-12" disabled={pending || code.length < 6}>
              {pending ? <T es="Entrando…" en="Signing in…" /> : <T es="Entrar" en="Sign in" />}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                type="button"
                className="flex items-center gap-1 text-[var(--site-ink-soft)] hover:text-[var(--site-ink)]"
                onClick={() => {
                  setStep("email");
                  setProblem(null);
                }}
              >
                <ArrowLeftIcon className="size-4" /> <T es="Usar otro correo" en="Use another email" />
              </button>
              <button
                type="button"
                className="text-[var(--site-gold-deep)] underline-offset-4 hover:underline disabled:text-[var(--site-ink-soft)] disabled:no-underline"
                disabled={wait > 0 || pending}
                onClick={sendCode}
              >
                {wait > 0 ? (
                  <T es={`Reenviar en ${wait} s`} en={`Resend in ${wait}s`} />
                ) : (
                  <T es="Reenviar código" en="Resend code" />
                )}
              </button>
            </div>
          </form>
        )}

        {problem && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <T es={problem.es} en={problem.en} />
          </p>
        )}
      </div>

      <p className="text-center text-xs text-[var(--site-ink-soft)]">
        <T es="Al continuar aceptas los " en="By continuing you accept the " />
        <Link href="/terminos" className="underline underline-offset-2">
          <T es="Términos" en="Terms" />
        </Link>
        <T es=" y la " en=" and the " />
        <Link href="/privacidad" className="underline underline-offset-2">
          <T es="Política de privacidad" en="Privacy policy" />
        </Link>
        .
      </p>
      <p className="text-center text-xs">
        <Link
          href={`/panel/login?next=${encodeURIComponent(next)}`}
          className="text-[var(--site-ink-soft)] underline-offset-4 hover:underline"
        >
          <T es="Entrar con contraseña" en="Sign in with a password" />
        </Link>
      </p>
    </div>
  );
}

/** Google's "G", as its sign-in branding guidelines ask. */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
