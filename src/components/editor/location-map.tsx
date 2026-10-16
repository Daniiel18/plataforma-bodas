"use client";

import "leaflet/dist/leaflet.css";

import type { Map as LeafletMap, Marker } from "leaflet";
import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Coords } from "@/lib/section-view";

import { useEditorBackend } from "./editor-backend";

/** OpenStreetMap tiles: free and keyless; swap the URL here for another provider. */
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
/** Before anything is pinned the map shows the Americas. */
const OVERVIEW = { lat: 20, lng: -80, zoom: 3 };

const round = (value: number) => Math.round(value * 1e6) / 1e6;

/** Teardrop pin in the dashboard's primary color. */
const PIN =
  '<span style="display:block;width:30px;height:30px;border:3px solid #fff;border-radius:50% 50% 50% 0;' +
  'background:var(--primary);box-shadow:0 4px 10px rgb(0 0 0 / .35);transform:translateY(2px) rotate(-45deg)"></span>';

type Props = {
  address: string;
  value: Coords | null;
  onChange: (coords: Coords | null) => void;
  /** Replaces the written address with the one of the pinned point. */
  onUseAddress: (address: string) => void;
};

/**
 * Venue picker: search the written address, then drag the pin (or tap the map)
 * to the exact entrance. Guests' map and directions use this point.
 */
export function LocationMap({ address, value, onChange, onUseAddress }: Props) {
  const { geocode } = useEditorBackend();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const initial = useRef(value);
  const placePin = useRef<(coords: Coords, focus: boolean) => void>(() => {});
  const handlers = useRef({ onChange, lookUp: (() => {}) as (coords: Coords) => void });
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();

  const lookUp = (coords: Coords) => {
    setSuggestion(null);
    void geocode.reverse(coords.lat, coords.lng).then((result) => {
      if (result.ok) setSuggestion(result.label);
    });
  };

  // The Leaflet callbacks below are created once; they read the latest props from here.
  useEffect(() => {
    handlers.current = { onChange, lookUp };
  });

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !container.current || map.current) return;
      const start = initial.current;
      const m = L.map(container.current, { scrollWheelZoom: false }).setView(
        start ? [start.lat, start.lng] : [OVERVIEW.lat, OVERVIEW.lng],
        start ? 16 : OVERVIEW.zoom,
      );
      L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(m);
      const icon = L.divIcon({ className: "", html: PIN, iconSize: [30, 42], iconAnchor: [15, 42] });

      const pick = (coords: Coords) => {
        const point = { lat: round(coords.lat), lng: round(coords.lng) };
        handlers.current.onChange(point);
        handlers.current.lookUp(point);
      };

      placePin.current = (coords, focus) => {
        if (!marker.current) {
          marker.current = L.marker([coords.lat, coords.lng], { draggable: true, icon, autoPan: true }).addTo(m);
          marker.current.on("dragend", () => {
            const { lat, lng } = marker.current!.getLatLng();
            pick({ lat, lng });
          });
        } else {
          marker.current.setLatLng([coords.lat, coords.lng]);
        }
        if (focus) m.setView([coords.lat, coords.lng], 17);
      };

      if (start) placePin.current(start, false);
      m.on("click", (event) => {
        placePin.current(event.latlng, false);
        pick(event.latlng);
      });
      map.current = m;
    });

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  const search = () =>
    startSearch(async () => {
      const result = await geocode.search(address);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const point = { lat: round(result.lat), lng: round(result.lng) };
      placePin.current(point, true);
      onChange(point);
      setSuggestion(null);
      toast.success("Encontrada. Si hace falta, arrastra el punto a la entrada exacta.");
    });

  const clear = () => {
    marker.current?.remove();
    marker.current = null;
    setSuggestion(null);
    onChange(null);
    map.current?.setView([OVERVIEW.lat, OVERVIEW.lng], OVERVIEW.zoom);
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Punto exacto en el mapa (opcional)</Label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={search} disabled={searching || !address.trim()}>
            <SearchIcon /> {searching ? "Buscando…" : "Buscar la dirección"}
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" onClick={clear}>
              <XIcon /> Quitar punto
            </Button>
          )}
        </div>
      </div>
      {/* `isolate` keeps Leaflet's layers below the dashboard's menus and dialogs. */}
      <div ref={container} className="isolate h-72 w-full overflow-hidden rounded-xl border bg-muted" />
      <p className="text-xs text-muted-foreground">
        {value
          ? "Arrastra el punto o toca el mapa para moverlo: el mapa y «Cómo llegar» de la invitación llevarán a este punto exacto."
          : "Busca la dirección o toca el mapa para marcar el lugar exacto. Sin punto, se usa la dirección escrita."}
      </p>
      {suggestion && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
          <span className="min-w-0 flex-1">
            Dirección de ese punto: <span className="text-foreground">{suggestion}</span>
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              onUseAddress(suggestion.slice(0, 200));
              setSuggestion(null);
            }}
          >
            Usar como dirección
          </Button>
        </div>
      )}
    </div>
  );
}
