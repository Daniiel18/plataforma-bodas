"use client";

import { NavigationIcon } from "lucide-react";

import { T } from "./lang";
import { useDevice } from "./use-device";

/** "Cómo llegar": Google Maps y Waze para todos, Apple Maps en iPhone/Mac. */
export function MapButtons({ query }: { query: string }) {
  const device = useDevice();
  const q = encodeURIComponent(query);

  const links = [
    device === "apple" && { label: "Apple Maps", href: `https://maps.apple.com/?daddr=${q}` },
    { label: "Google Maps", href: `https://www.google.com/maps/dir/?api=1&destination=${q}` },
    { label: "Waze", href: `https://waze.com/ul?q=${q}&navigate=yes` },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div className="grid gap-3">
      <p className="flex items-center justify-center gap-2 text-sm font-semibold tracking-[0.15em] uppercase">
        <NavigationIcon className="size-4" aria-hidden />
        <T es="Cómo llegar" en="Get directions" />
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inv-button inv-button-ghost px-4 text-xs tracking-normal normal-case"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
