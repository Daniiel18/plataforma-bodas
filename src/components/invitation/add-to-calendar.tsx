"use client";

import { CalendarPlusIcon } from "lucide-react";
import { useState } from "react";

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

/** "Añadir al calendario": iPhone (.ics), Android/Google y Outlook. */
export function AddToCalendar({ slug, title, startsAt, location }: Props) {
  const [open, setOpen] = useState(false);
  const lang = useLang();
  const device = useDevice();

  const summary = pick(lang, title.es, title.en);
  const pageUrl = typeof window === "undefined" ? "" : window.location.href.split("#")[0];
  const when = compactUtc(startsAt);

  const google = new URL("https://calendar.google.com/calendar/render");
  google.searchParams.set("action", "TEMPLATE");
  google.searchParams.set("text", summary);
  google.searchParams.set("dates", `${when}/${when}`);
  if (location) google.searchParams.set("location", location);
  if (pageUrl) google.searchParams.set("details", pageUrl);

  const outlook = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  outlook.searchParams.set("path", "/calendar/action/compose");
  outlook.searchParams.set("rru", "addevent");
  outlook.searchParams.set("subject", summary);
  outlook.searchParams.set("startdt", new Date(startsAt).toISOString());
  outlook.searchParams.set("enddt", new Date(startsAt).toISOString());
  if (location) outlook.searchParams.set("location", location);
  if (pageUrl) outlook.searchParams.set("body", pageUrl);

  const options = [
    { key: "apple", href: `/${slug}/calendario.ics?lang=${lang}`, es: "iPhone / Apple", en: "iPhone / Apple" },
    { key: "android", href: google.toString(), es: "Android / Google", en: "Android / Google" },
    { key: "other", href: outlook.toString(), es: "Outlook", en: "Outlook" },
  ];
  // Primero la opción del dispositivo del invitado.
  const ordered = device ? [...options].sort((a, b) => Number(b.key === device) - Number(a.key === device)) : options;

  return (
    <div className="grid justify-items-center gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 text-sm underline decoration-[var(--inv-line)] underline-offset-4"
      >
        <CalendarPlusIcon className="size-4" aria-hidden />
        <T es="Añadir al calendario" en="Add to calendar" />
      </button>
      {open && (
        <div className="grid w-full max-w-xs gap-2">
          {ordered.map((option) => (
            <a
              key={option.key}
              href={option.href}
              target={option.key === "apple" ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="inv-button inv-button-ghost text-xs"
            >
              <T es={option.es} en={option.en} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
