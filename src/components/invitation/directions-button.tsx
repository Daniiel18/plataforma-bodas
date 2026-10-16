"use client";

import { NavigationIcon } from "lucide-react";
import { useRef } from "react";

import type { Coords } from "@/lib/section-view";

import { T } from "./lang";
import { useDevice } from "./use-device";

/**
 * Single "Get directions" button. On Android the system asks which app to use
 * (Google Maps, Waze…). iPhone has no such chooser, so we show our own with
 * Apple Maps, Google Maps and Waze. Computers open Google Maps directly. When
 * the couple pinned the venue on the map, every app gets the exact spot.
 */
export function DirectionsButton({ query, coords, venue }: { query: string; coords: Coords | null; venue: string }) {
  const device = useDevice();
  const sheet = useRef<HTMLDialogElement>(null);
  if (!query && !coords) return null;

  const point = coords ? `${coords.lat},${coords.lng}` : null;
  const q = encodeURIComponent(point ?? query);
  const googleMaps = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  const waze = point ? `https://waze.com/ul?ll=${q}&navigate=yes` : `https://waze.com/ul?q=${q}&navigate=yes`;
  const geo = point ? `geo:${point}?q=${point}(${encodeURIComponent(venue || query)})` : `geo:0,0?q=${q}`;
  const label = (
    <>
      <NavigationIcon className="size-4" aria-hidden />
      <T es="Cómo llegar" en="Get directions" />
    </>
  );

  if (device === "apple") {
    const close = () => sheet.current?.close();
    // Apple Maps is always installed; the others open in a new tab in case the app is not.
    const apps = [
      { label: "Apple Maps", href: `https://maps.apple.com/?daddr=${q}`, newTab: false },
      { label: "Google Maps", href: googleMaps, newTab: true },
      { label: "Waze", href: waze, newTab: true },
    ];
    return (
      <>
        <button type="button" onClick={() => sheet.current?.showModal()} className="inv-button">
          {label}
        </button>
        <dialog
          ref={sheet}
          aria-labelledby="directions-sheet-title"
          className="inv-sheet"
          onClick={(event) => event.target === event.currentTarget && close()}
        >
          <div className="inv-sheet-group">
            <p id="directions-sheet-title" className="inv-sheet-title">
              <T es="Abrir con" en="Open with" />
            </p>
            {apps.map((app) => (
              <a
                key={app.label}
                href={app.href}
                target={app.newTab ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={close}
                className="inv-sheet-option"
              >
                {app.label}
              </a>
            ))}
          </div>
          <button type="button" onClick={close} className="inv-sheet-group inv-sheet-option font-semibold">
            <T es="Cancelar" en="Cancel" />
          </button>
        </dialog>
      </>
    );
  }

  return (
    <a
      // geo: makes Android show its map app chooser.
      href={device === "android" ? geo : googleMaps}
      target={device === "android" ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="inv-button"
    >
      {label}
    </a>
  );
}
