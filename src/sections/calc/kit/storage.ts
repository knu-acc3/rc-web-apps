"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Small JSON value in localStorage, shared by all components using the same key
 * (and synced across tabs). SSR-safe: renders `fallback` on the server and during
 * hydration. Every access is wrapped in try/catch (private mode, blocked storage).
 */

const EVT = "calckit:storage";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVT, cb);
  };
}

/** In-memory fallback when localStorage is unavailable, so the UI still works for this page view. */
const memory = new Map<string, string | null>();

function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function useStored<T>(key: string, fallback: T, validate: (x: unknown) => x is T): [T, (next: T | null) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const value = useMemo(() => {
    if (raw === null) return fallback;
    try {
      const x: unknown = JSON.parse(raw);
      return validate(x) ? x : fallback;
    } catch {
      return fallback;
    }
    // fallback/validate are expected to be module-level constants
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);
  const set = useCallback(
    (next: T | null) => {
      const raw = next === null ? null : JSON.stringify(next);
      try {
        if (raw === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, raw);
        memory.delete(key);
      } catch {
        memory.set(key, raw);
      }
      window.dispatchEvent(new Event(EVT));
    },
    [key],
  );
  return [value, set];
}
