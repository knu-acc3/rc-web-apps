"use client";

import { useSyncExternalStore } from "react";

/**
 * One shared ticker for every clock on the page, aligned to second boundaries.
 * Server snapshot is null: SSR renders a neutral placeholder and the real time
 * appears after hydration (never a fake "now" in the HTML).
 */
type Listener = () => void;
const listeners = new Set<Listener>();
let timer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l();
}
function schedule() {
  timer = setTimeout(() => {
    emit();
    schedule();
  }, 1000 - (Date.now() % 1000) + 4);
}
function onVisible() {
  if (document.visibilityState === "visible") emit();
}
function subscribe(l: Listener) {
  listeners.add(l);
  if (listeners.size === 1) {
    schedule();
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(l);
    if (listeners.size === 0) {
      if (timer) clearTimeout(timer);
      timer = null;
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

const secondSnapshot = () => Math.floor(Date.now() / 1000) * 1000;
const minuteSnapshot = () => Math.floor(Date.now() / 60000) * 60000;
const nullSnapshot = () => null;

/** Current time in ms, floored to the second; null during SSR/hydration. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, secondSnapshot, nullSnapshot);
}

/** Current time floored to the minute (re-renders once a minute). */
export function useMinute(): number | null {
  return useSyncExternalStore(subscribe, minuteSnapshot, nullSnapshot);
}

const noop = () => () => {};
const localZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

/** The visitor's IANA zone (client only; null on the server). */
export function useLocalZone(): string | null {
  return useSyncExternalStore(noop, localZone, nullSnapshot);
}

/** true after hydration. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** Legacy ids some engines still return → current IANA names (for display and matching). */
export const MODERN_ZONE: Record<string, string> = {
  "Europe/Kiev": "Europe/Kyiv",
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Rangoon": "Asia/Yangon",
  "America/Godthab": "America/Nuuk",
  "America/Indianapolis": "America/Indiana/Indianapolis",
  "America/Louisville": "America/Kentucky/Louisville",
  "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
  "America/Cordoba": "America/Argentina/Cordoba",
  "America/Mendoza": "America/Argentina/Mendoza",
  "Atlantic/Faeroe": "Atlantic/Faroe",
  "Pacific/Ponape": "Pacific/Pohnpei",
  "Pacific/Truk": "Pacific/Chuuk",
  "Pacific/Enderbury": "Pacific/Kanton",
  "Africa/Asmera": "Africa/Asmara",
};
export const modernZone = (tz: string): string => MODERN_ZONE[tz] ?? tz;
