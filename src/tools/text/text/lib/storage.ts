"use client";

/**
 * localStorage as an external store for useSyncExternalStore: every write
 * notifies subscribers in this tab, and the `storage` event keeps other tabs
 * in sync. When storage is unavailable or full, values live in memory for the
 * session and `lastWriteFailed()` reports it.
 */
import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
const memory = new Map<string, string | null>();
let failed = false;

function emit() {
  for (const l of listeners) l();
}

export function subscribeStorage(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || !memory.has(e.key)) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function readKey(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeKey(key: string, value: string | null): boolean {
  let ok = true;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    memory.delete(key);
  } catch {
    ok = false;
    memory.set(key, value);
  }
  failed = !ok;
  emit();
  return ok;
}

export function lastWriteFailed(): boolean {
  return failed;
}

/** Reactive string value of a localStorage key (null on the server and when absent). */
export function useStoredString(key: string): string | null {
  return useSyncExternalStore(
    subscribeStorage,
    () => readKey(key),
    () => null,
  );
}

