"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** SSR-safe media query (false on the server and during hydration). */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** SSR-safe one-off browser feature detection (false on the server). */
export function useFeature(test: () => boolean): boolean {
  return useSyncExternalStore(noop, test, () => false);
}
