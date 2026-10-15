"use client";

import { useSyncExternalStore } from "react";

export type Device = "apple" | "android" | "other" | null;

const noopSubscribe = () => () => {};

function detect(): Device {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(ua)) return "apple";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

/** The guest's device type (null during server rendering). */
export function useDevice(): Device {
  return useSyncExternalStore(noopSubscribe, detect, () => null);
}
