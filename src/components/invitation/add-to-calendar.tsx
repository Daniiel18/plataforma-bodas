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
 * One-tap "Add to calendar" that adapts to the guest's device: iPhone and Mac
 * open the .ics in Calendar, Android opens Google Calendar and everything else
 * downloads the .ics (Outlook, Windows Calendar…).
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
      // New tab, so the invitation (and its music) stays open.
      target={device === "android" ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm underline decoration-[var(--inv-line)] underline-offset-4"
    >
      <CalendarPlusIcon className="size-4" aria-hidden />
      <T es="Añadir al calendario" en="Add to calendar" />
    </a>
  );
}
