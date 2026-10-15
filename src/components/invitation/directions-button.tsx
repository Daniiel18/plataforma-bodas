"use client";

import { NavigationIcon } from "lucide-react";
import { useRef } from "react";

import { T } from "./lang";
import { useDevice } from "./use-device";

/**
 * Single "Get directions" button. On Android the system asks which app to use
 * (Google Maps, Waze…). iPhone has no such chooser, so we show our own with
 * Apple Maps, Google Maps and Waze. Computers open Google Maps directly.
 */
export function DirectionsButton({ query }: { query: string }) {
  const device = useDevice();
  const sheet = useRef<HTMLDialogElement>(null);
  if (!query) return null;

  const q = encodeURIComponent(query);
  const googleMaps = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
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
      { label: "Waze", href: `https://waze.com/ul?q=${q}&navigate=yes`, newTab: true },
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
      href={device === "android" ? `geo:0,0?q=${q}` : googleMaps}
      target={device === "android" ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="inv-button"
    >
      {label}
    </a>
  );
}
