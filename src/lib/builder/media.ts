"use client";

import { createStore, del, get, set, type UseStore } from "idb-keyval";
import { useEffect, useState } from "react";

import type { MediaKind } from "@/lib/media";
import { prepareAudio, prepareImage } from "@/lib/media-prepare";

import type { LocalMedia } from "./draft";

/**
 * Photos and music of the builder, kept in the browser's IndexedDB until the
 * couple publishes (localStorage is far too small for them).
 */

let db: UseStore | null = null;
const store = () => (db ??= createStore("lazodoro", "media"));

/** Compresses the file like the dashboard does and keeps it on the device. */
export async function saveLocalMedia(file: File, kind: MediaKind): Promise<LocalMedia> {
  const prepared = kind === "audio" ? await prepareAudio(file) : await prepareImage(file, kind);
  const id = crypto.randomUUID();
  await set(id, prepared.blob, store());
  return { id, mime: prepared.mime, width: prepared.width, height: prepared.height };
}

export async function removeLocalMedia(id: string) {
  urls.delete(id);
  await del(id, store());
}

export async function readLocalMedia(id: string): Promise<Blob | undefined> {
  return get<Blob>(id, store());
}

/** Object URLs stay valid for the whole visit, so each file is read once. */
const urls = new Map<string, string>();

/** URLs of the given files (missing ones are simply left out). */
export function useLocalMediaUrls(ids: string[]): Record<string, string> {
  const key = ids.join(",");
  const [resolved, setResolved] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next: Record<string, string> = {};
      for (const id of key ? key.split(",") : []) {
        let url = urls.get(id);
        if (!url) {
          const blob = await readLocalMedia(id).catch(() => undefined);
          if (!blob) continue;
          url = URL.createObjectURL(blob);
          urls.set(id, url);
        }
        next[id] = url;
      }
      if (!cancelled) setResolved(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return resolved;
}
