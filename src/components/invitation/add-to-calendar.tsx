"use client";

import { CalendarPlusIcon } from "lucide-react";

import type { Bi } from "@/lib/sections";

import { T } from "./lang";
import { useDevice } from "./use-device";
import { pick, useLang } from "./use-lang";

type Props = {
  slug: string;
  title: Bi;
  startsAt: string;
  location: string;
};

const compactUtc = (iso: string) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/**
 * "Añadir al calendario" en un solo toque, según el dispositivo del invitado:
 * iPhone/Mac abren el .ics en Calendario, Android abre Google Calendar y el resto
 * descarga el .ics (Outlook, Calendario de Windows…).
 */
export function AddToCalendar({ slug, title, startsAt, location }: Props) {
  const lang = useLang();
  const device = useDevice();

  let href = `/${slug}/calendario.ics?lang=${lang}`;
  if (device === "android") {
    const when = compactUtc(startsAt);
    const google = new URL("https://calendar.google.com/calendar/render");
    google.searchParams.set("action", "TEMPLATE");
    google.searchParams.set("text", pick(lang, title.es, title.en));
    google.searchParams.set("dates", `${when}/${when}`);
    if (location) google.searchParams.set("location", location);
    google.searchParams.set("details", window.location.href.split("#")[0]);
    href = google.toString();
  }

  return (
    <a
      href={href}
      // En otra pestaña para que la invitación (y la música) sigan abiertas.
      target={device === "android" ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm underline decoration-[var(--inv-line)] underline-offset-4"
    >
      <CalendarPlusIcon className="size-4" aria-hidden />
      <T es="Añadir al calendario" en="Add to calendar" />
    </a>
  );
}
