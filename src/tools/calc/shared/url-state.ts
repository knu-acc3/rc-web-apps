"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Calculator state mirrored in the URL query (?a=15&b=200) so results can be shared.
 *
 * - SSR-safe: the server (and the hydration pass) render `defaults`; after hydration
 *   the values from the current URL are applied via useSyncExternalStore (no setState in effects).
 * - Values are plain strings (the raw input text), so "1 000,5" survives a round trip.
 * - Values equal to the default are removed from the URL; unrelated params (utm…) are kept.
 * - URL writes are debounced (history.replaceState), never pushState — no history spam.
 * - Never put secrets or personal data here (budget/diary-like data → useStored in storage.ts).
 */

const EVT = "calckit:url";

function subscribe(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener(EVT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(EVT, cb);
  };
}
const clientSnap = () => window.location.search;
const serverSnap = () => null;

interface QueryOptions<K extends string> {
  /** Allowed values for enum-like keys (mode, unit…); anything else in the URL falls back to the default. */
  enums?: Partial<Record<K, readonly string[]>>;
  /** Longest value written to / read from the URL (default 1500 chars). Longer values stay local. */
  maxLength?: number;
}

interface QueryApi<K extends string> {
  /** Current values (defaults ← URL ← user edits). */
  v: Record<K, string>;
  /** Merge a patch into the state (and, debounced, into the URL). */
  set: (patch: Partial<Record<K, string>>) => void;
  /** Back to defaults; our keys are removed from the URL. */
  reset: () => void;
  /** Absolute URL of the current state (call in event handlers only). */
  shareUrl: () => string;
}

function queryPairs<K extends string>(keys: K[], v: Record<K, string>, defaults: Record<K, string>, max: number): [K, string][] {
  const out: [K, string][] = [];
  for (const k of keys) {
    const val = v[k];
    if (val === defaults[k] || val.length > max) continue;
    out.push([k, val]);
  }
  return out;
}

function mergedUrl(keys: string[], pairs: [string, string][]): string {
  const p = new URLSearchParams(window.location.search);
  for (const k of keys) p.delete(k);
  for (const [k, val] of pairs) p.set(k, val);
  const qs = p.toString();
  return `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
}

export function useQueryState<K extends string>(defaults: Record<K, string>, opts: QueryOptions<K> = {}): QueryApi<K> {
  const max = opts.maxLength ?? 1500;
  const search = useSyncExternalStore(subscribe, clientSnap, serverSnap);
  const [edits, setEdits] = useState<Partial<Record<K, string>> | null>(null);
  const keys = Object.keys(defaults) as K[];

  const fromUrl: Partial<Record<K, string>> = {};
  if (search) {
    const p = new URLSearchParams(search);
    for (const k of keys) {
      const raw = p.get(k);
      if (raw === null || raw.length > max) continue;
      const allowed = opts.enums?.[k];
      if (allowed && !allowed.includes(raw)) continue;
      fromUrl[k] = raw;
    }
  }
  const v = { ...defaults, ...fromUrl, ...(edits ?? {}) } as Record<K, string>;

  // Serialized target query for our keys; only written after the user changed something.
  const pairs = queryPairs(keys, v, defaults, max);
  const target = edits ? JSON.stringify(pairs) : null;
  const keyList = keys.join("\n");

  useEffect(() => {
    if (target === null) return;
    const t = setTimeout(() => {
      try {
        window.history.replaceState(null, "", mergedUrl(keyList.split("\n"), JSON.parse(target) as [string, string][]));
      } catch {
        // Some browsers throttle history updates; the state is still kept in memory.
      }
    }, 400);
    return () => clearTimeout(t);
  }, [target, keyList]);

  const set = (patch: Partial<Record<K, string>>) => setEdits((e) => ({ ...(e ?? {}), ...patch }));
  const reset = () => setEdits({ ...defaults });
  const shareUrl = () => `${window.location.origin}${mergedUrl(keys, pairs)}`;

  return { v, set, reset, shareUrl };
}
