"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Read a browser-only primitive value (navigator/screen/feature detection)
 * without touching globals during the server render. The server snapshot is
 * used for SSR and hydration, the real value right after.
 */
export function useClientValue<T extends string | number | boolean | null>(get: () => T, server: T): T {
  return useSyncExternalStore(noopSubscribe, get, () => server);
}

/* ───────────── localStorage-backed values ───────────── */

const listeners = new Set<() => void>();

function subscribeStore(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage may be disabled (private mode, quota) — the value just isn't kept
  }
  for (const l of listeners) l();
}

/** A string kept in localStorage (null on the server and when absent). */
export function useStored(key: string): string | null {
  return useSyncExternalStore(
    subscribeStore,
    () => readStored(key),
    () => null,
  );
}

/** A number kept in localStorage. */
export function useStoredNumber(key: string): number | null {
  const raw = useStored(key);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
