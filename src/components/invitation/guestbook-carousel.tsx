"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { GuestbookEntry } from "@/lib/section-view";

import { pick, useLang } from "./use-lang";

const INTERVAL = 6500;

/** The guests' wishes, one at a time: they change by themselves, with arrows, dots and swipe. */
export function GuestbookCarousel({ entries }: { entries: GuestbookEntry[] }) {
  const lang = useLang();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  const count = entries.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearTimeout(timer);
  }, [index, count, paused]);

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  return (
    <div
      className="grid gap-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touch.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        setPaused(false);
        if (start === null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
      aria-roledescription="carousel"
    >
      <div className="relative grid">
        {entries.map((entry, i) => (
          <figure
            key={i}
            className="inv-card col-start-1 row-start-1 grid content-center px-6 py-6 text-center transition-all duration-700 ease-out motion-reduce:transition-none"
            style={{
              opacity: i === index ? 1 : 0,
              transform: i === index ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
              pointerEvents: i === index ? "auto" : "none",
            }}
            aria-hidden={i !== index}
          >
            <blockquote className="text-lg leading-relaxed whitespace-pre-line">“{entry.message}”</blockquote>
            <figcaption className="mt-3 text-sm text-[var(--inv-ink-soft)]">— {entry.author}</figcaption>
          </figure>
        ))}
      </div>

      {count > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            className="grid size-9 place-items-center rounded-full ring-1 ring-[var(--inv-line)]"
            aria-label={pick(lang, "Deseo anterior", "Previous wish")}
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {entries.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-[var(--inv-accent)]" : "w-2 bg-[var(--inv-line)]"}`}
                aria-label={pick(lang, `Deseo ${i + 1} de ${count}`, `Wish ${i + 1} of ${count}`)}
                aria-current={i === index}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            className="grid size-9 place-items-center rounded-full ring-1 ring-[var(--inv-line)]"
            aria-label={pick(lang, "Deseo siguiente", "Next wish")}
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
