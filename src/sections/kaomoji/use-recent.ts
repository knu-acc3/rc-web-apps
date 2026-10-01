"use client";

import { useSyncExternalStore } from "react";

/**
 * "Recently copied" kaomoji, kept in localStorage (per browser, never sent anywhere).
 * Exposed as an external store: the server snapshot is empty, so SSR and hydration match,
 * and the list appears right after hydration. Falls back to memory when storage is blocked.
 */
const KEY = "kaomoji:recent:v1";
const RECENT_MAX = 16;
const EMPTY: readonly string[] = [];
const listeners = new Set<() => void>();
let current: readonly string[] | null = null;

function load(): readonly string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, RECENT_MAX) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function save(list: readonly string[]) {
  current = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage unavailable (private mode, quota) — keep the in-memory list
  }
  listeners.forEach((l) => l());
}

function onStorage(e: StorageEvent) {
  if (e.key !== KEY) return;
  current = load();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): readonly string[] {
  if (current === null) current = load();
  return current;
}

const getServerSnapshot = () => EMPTY;

export function addRecent(k: string) {
  save([k, ...getSnapshot().filter((x) => x !== k)].slice(0, RECENT_MAX));
}

export function clearRecent() {
  save(EMPTY);
}

export function useRecentKaomoji(): readonly string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
