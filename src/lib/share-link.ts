import { useEffect, useRef, useSyncExternalStore } from "react";

/*
 * Links that carry a tool's setup: a timer length in the query (?t=10m), a list of options in the fragment
 * (#w=Аня%0AБорис). Lists go in the fragment: it never reaches the server, so what people type stays between them.
 */

const noop = () => () => {};

/** Absolute link to this page with `extra` (a "?…" query and/or "#…" fragment) instead of the current ones. */
export function linkHere(extra: { query?: Record<string, string>; hash?: string }): string {
  const q = new URLSearchParams(extra.query ?? {}).toString();
  return `${location.origin}${location.pathname}${q ? `?${q}` : ""}${extra.hash ?? ""}`;
}

/** `#key=line1%0Aline2` for a list; the list is cut to fit a link most apps accept. */
export function listHash(key: string, items: readonly string[], maxChars = 6000): string {
  let out = "";
  for (const it of items) {
    const next = out ? `${out}%0A${encodeURIComponent(it)}` : encodeURIComponent(it);
    if (next.length > maxChars) break;
    out = next;
  }
  return `#${key}=${out}`;
}

/** The list from `#key=…`, trimmed and capped; null when the link has none. */
export function readListHash(key: string, maxItems: number, maxLen: number): string[] | null {
  const m = new RegExp(`^#${key}=(.*)$`).exec(location.hash);
  if (!m) return null;
  try {
    const items = decodeURIComponent(m[1])
      .split("\n")
      .map((s) => s.trim().slice(0, maxLen))
      .filter(Boolean)
      .slice(0, maxItems);
    return items.length ? items : null;
  } catch {
    return null;
  }
}

/** A query parameter of the current page; null on the server and during hydration. */
export function useQueryParam(key: string): string | null {
  return useSyncExternalStore(
    noop,
    () => new URLSearchParams(location.search).get(key),
    () => null,
  );
}

/** Loads a list shared as `#key=…` once after mount (the fragment is browser-only). */
export function useSharedList(key: string, maxItems: number, maxLen: number, onLoad: (items: string[]) => void): void {
  const load = useRef(onLoad);
  useEffect(() => {
    const items = readListHash(key, maxItems, maxLen);
    if (items) load.current(items);
  }, [key, maxItems, maxLen]);
}
