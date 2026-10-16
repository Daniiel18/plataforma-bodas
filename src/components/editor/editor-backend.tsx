"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { GeocodeResult } from "@/lib/geocode-types";
import type { SectionType } from "@/lib/sections";

export type SaveResult = { ok: true; message?: string; pending?: number } | { ok: false; error: string };

/**
 * What the section forms need from the place they live in. The dashboard saves
 * to the database; the builder keeps every edit in the browser as it is typed.
 */
export type EditorBackend = {
  /** Saves a section and shows a "Guardar" button. Without it, edits are kept as they are typed. */
  saveSection?: (type: SectionType, data: unknown) => Promise<SaveResult>;
  /** Venue search for the map. */
  geocode: {
    search: (query: string) => Promise<GeocodeResult>;
    reverse: (lat: number, lng: number) => Promise<GeocodeResult>;
  };
  /** Cover photo field shown next to the hero form. */
  coverField: ReactNode;
  /** Where the couple changes what a form only mentions. */
  hints: { names: string; date: string; rsvpSettings: string };
};

const EditorBackendContext = createContext<EditorBackend | null>(null);

export function EditorBackendProvider({ value, children }: { value: EditorBackend; children: ReactNode }) {
  return <EditorBackendContext.Provider value={value}>{children}</EditorBackendContext.Provider>;
}

export function useEditorBackend(): EditorBackend {
  const backend = useContext(EditorBackendContext);
  if (!backend) throw new Error("Section forms need an EditorBackendProvider");
  return backend;
}
