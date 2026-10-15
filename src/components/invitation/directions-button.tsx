"use client";

import { NavigationIcon } from "lucide-react";
import { useRef } from "react";

import { T } from "./lang";
import { useDevice } from "./use-device";

/**
 * "Cómo llegar" con un solo botón. En Android el sistema pregunta con qué app abrirlo
 * (Google Maps, Waze…). iPhone no tiene ese selector, así que mostramos uno propio con
 * Apple Maps, Google Maps y Waze. En computadoras se abre Google Maps directamente.
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
    // Apple Maps siempre está instalado; las otras van en otra pestaña por si la app no lo está.
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
      // geo: hace que Android muestre su selector de apps de mapas.
      href={device === "android" ? `geo:0,0?q=${q}` : googleMaps}
      target={device === "android" ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="inv-button"
    >
      {label}
    </a>
  );
}
