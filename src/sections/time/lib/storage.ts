"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * JSON value persisted in localStorage, hydration-safe: the server (and the
 * hydration pass) see `fallback`; the stored value appears right after.
 * Storage failures (private mode, quota) degrade to in-memory state.
 */
const memo = new Map<string, string | null>();
const subs = new Map<string, Set<() => void>>();

function read(key: string): string | null {
  if (!memo.has(key)) {
    let v: string | null = null;
    try {
      v = localStorage.getItem(key);
    } catch {
      v = null;
    }
    memo.set(key, v);
  }
  return memo.get(key) ?? null;
}

function write(key: string, v: string | null) {
  memo.set(key, v);
  try {
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, v);
  } catch {
    // ignore
  }
  for (const f of subs.get(key) ?? []) f();
}

export function useStoredJson<T>(key: string, fallback: T, validate: (v: unknown) => v is T): [T, (v: T | null) => void] {
  const subscribe = useCallback(
    (f: () => void) => {
      let set = subs.get(key);
      if (!set) subs.set(key, (set = new Set()));
      set.add(f);
      return () => set!.delete(f);
    },
    [key],
  );
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const value = useMemo(() => {
    if (raw === null) return fallback;
    try {
      const v: unknown = JSON.parse(raw);
      return validate(v) ? v : fallback;
    } catch {
      return fallback;
    }
  }, [raw, fallback, validate]);
  const set = useCallback((v: T | null) => write(key, v === null ? null : JSON.stringify(v)), [key]);
  return [value, set];
}
