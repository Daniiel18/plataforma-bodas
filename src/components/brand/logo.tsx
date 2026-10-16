import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * The Lazo de Oro bow: two loops, a knot and two ribbon tails in a soft gold
 * gradient. Original artwork, also used for the app icon.
 */
export function LazoMark({ className, title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  const gold = `lazo-gold-${id}`;
  const shade = `lazo-shade-${id}`;

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F1DDA6" />
          <stop offset="0.5" stopColor="#CDA75F" />
          <stop offset="1" stopColor="#9C7637" />
        </linearGradient>
        <linearGradient id={shade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B88E48" />
          <stop offset="1" stopColor="#8A6630" />
        </linearGradient>
      </defs>
      {/* Tails */}
      <path
        d="M29.5 31c-3.2 6.6-7.4 13.8-12.6 21.6l6.1-.9 2.6 5.6c3.6-8.4 6.3-16.6 7.6-25.3z"
        fill={`url(#${shade})`}
      />
      <path
        d="M34.5 31c3.2 6.6 7.4 13.8 12.6 21.6l-6.1-.9-2.6 5.6c-3.6-8.4-6.3-16.6-7.6-25.3z"
        fill={`url(#${gold})`}
      />
      {/* Loops */}
      <path
        d="M32 28.5C26.4 19.6 15.8 13.6 10.2 17.4 5.6 20.6 8.4 30.4 16.6 32.1c5.6 1.2 11.4-.6 15.4-3.6z"
        fill={`url(#${gold})`}
      />
      <path
        d="M32 28.5c5.6-8.9 16.2-14.9 21.8-11.1 4.6 3.2 1.8 13-6.4 14.7-5.6 1.2-11.4-.6-15.4-3.6z"
        fill={`url(#${gold})`}
      />
      {/* Inner folds */}
      <path
        d="M30.6 27.9c-4.7-5.4-11.4-8.8-15.6-7.2"
        fill="none"
        stroke="#9C7637"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M33.4 27.9c4.7-5.4 11.4-8.8 15.6-7.2"
        fill="none"
        stroke="#9C7637"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Knot */}
      <rect x="28.2" y="23.6" width="7.6" height="9.6" rx="3.4" fill={`url(#${shade})`} />
      <rect x="29.4" y="24.6" width="2.2" height="7.4" rx="1.1" fill="#F6E7BF" opacity="0.5" />
    </svg>
  );
}

/** Bow plus the "Lazo de Oro" wordmark. */
export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LazoMark className={cn("size-9 shrink-0", markClassName)} />
      <span className="font-brand text-[1.65em] leading-none text-[var(--site-ink)]">Lazo de Oro</span>
    </span>
  );
}
