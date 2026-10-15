"use client";

import { useSyncExternalStore } from "react";

import { T } from "./lang";

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}

const nowInSeconds = () => Math.floor(Date.now() / 1000);

const UNITS = [
  { key: "d", es: "días", en: "days" },
  { key: "h", es: "horas", en: "hours" },
  { key: "m", es: "minutos", en: "minutes" },
  { key: "s", es: "segundos", en: "seconds" },
] as const;

/** Exact countdown, computed on the guest's phone every second. */
export function Countdown({ target }: { target: string }) {
  const now = useSyncExternalStore(subscribe, nowInSeconds, () => null);
  const targetSeconds = Math.floor(Date.parse(target) / 1000);
  const remaining = now === null ? null : Math.max(0, targetSeconds - now);

  if (remaining === 0) {
    return (
      <p className="inv-script text-4xl text-[var(--inv-accent)]">
        <T es="¡Hoy es el gran día!" en="Today is the big day!" />
      </p>
    );
  }

  const values =
    remaining === null
      ? null
      : {
          d: Math.floor(remaining / 86400),
          h: Math.floor((remaining % 86400) / 3600),
          m: Math.floor((remaining % 3600) / 60),
          s: remaining % 60,
        };

  return (
    <div className="grid grid-cols-4 gap-2" role="timer" aria-live="off">
      {UNITS.map((unit) => (
        <div key={unit.key} className="rounded-xl bg-[var(--inv-paper)]/80 px-1 py-3 ring-1 ring-[var(--inv-line)]">
          <p className="text-3xl font-medium tabular-nums">
            {values ? String(values[unit.key]).padStart(unit.key === "d" ? 1 : 2, "0") : "–"}
          </p>
          <p className="text-[0.7rem] tracking-[0.18em] text-[var(--inv-ink-soft)] uppercase">
            <T es={unit.es} en={unit.en} />
          </p>
        </div>
      ))}
    </div>
  );
}
