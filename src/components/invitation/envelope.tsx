"use client";

import { useEffect, useState } from "react";

import type { Bi } from "@/lib/sections";

import { TB } from "./lang";
import { useMusic } from "./music";
import { pick, useLang } from "./use-lang";

type Props = {
  title: Bi;
  subtitle: Bi | null;
  button: Bi;
  couple: { partner1: string; partner2: string };
  dateLabel: Bi | null;
  autoplayMusic: boolean;
};

/** Opening screen with the envelope. Opening it starts the music. */
export function Envelope({ title, subtitle, button, couple, dateLabel, autoplayMusic }: Props) {
  const [state, setState] = useState<"closed" | "open" | "gone">("closed");
  const music = useMusic();
  const lang = useLang();

  useEffect(() => {
    if (state === "gone") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [state]);

  if (state === "gone") return null;

  const open = () => {
    if (state !== "closed") return;
    if (autoplayMusic) music.play();
    setState("open");
    setTimeout(() => setState("gone"), 1400);
  };

  const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;
  const initials = `${first(couple.partner1)[0] ?? ""}${first(couple.partner2)[0] ?? ""}`;

  return (
    <div
      className="inv-envelope-overlay"
      data-state={state}
      role="dialog"
      aria-modal="true"
      aria-label={pick(lang, title.es, title.en)}
    >
      <div className="inv-backdrop" aria-hidden />
      <div className="flex flex-col items-center gap-8 text-center">
        <div>
          <p className="inv-script text-5xl leading-tight text-[var(--inv-accent)] md:text-6xl">
            {first(couple.partner1)}
            <span className="mx-2 align-middle text-3xl">&amp;</span>
            {first(couple.partner2)}
          </p>
          <p className="mt-2 text-lg text-[var(--inv-ink-soft)]">❦</p>
          {dateLabel && (
            <p className="text-lg tracking-wide text-[var(--inv-ink-soft)]">
              <TB text={dateLabel} />
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={open}
          className="inv-envelope group"
          aria-label={pick(lang, button.es, button.en)}
        >
          <span className="inv-envelope-body" />
          <span className="inv-envelope-letter grid place-items-center p-4">
            <span className="inv-script text-3xl text-[var(--inv-accent)]">
              {first(couple.partner1)} &amp; {first(couple.partner2)}
            </span>
          </span>
          <span className="inv-envelope-pocket" />
          <span className="inv-envelope-flap" />
          <span className="inv-seal inv-script text-xl transition group-hover:scale-105">{initials}</span>
        </button>

        <div className="grid gap-3">
          <p className="text-xl italic">
            <TB text={title} />
          </p>
          {subtitle && (
            <p className="text-[var(--inv-ink-soft)]">
              <TB text={subtitle} />
            </p>
          )}
          <button type="button" onClick={open} className="inv-button mx-auto">
            <TB text={button} />
          </button>
        </div>
      </div>
    </div>
  );
}
