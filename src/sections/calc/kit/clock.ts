"use client";

import { useSyncExternalStore } from "react";

/**
 * Clock hooks that are SSR-safe: they return null on the server and during
 * hydration, then the real value on the client (no Date.now() during render,
 * no setState in effects).
 */

const noop = () => () => {};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local calendar date as "YYYY-MM-DD". */
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const todaySnap = () => isoDate(new Date());

/** Today's local date "YYYY-MM-DD" (null on the server). Does not tick. */
export function useToday(): string | null {
  return useSyncExternalStore(noop, todaySnap, () => null);
}

function subscribeMinute(cb: () => void) {
  const id = window.setInterval(cb, 15_000);
  return () => window.clearInterval(id);
}
const minuteSnap = () => Math.floor(Date.now() / 60_000);

/**
 * Current time rounded down to the minute, as a Unix timestamp in minutes
 * (null on the server). Re-renders when the minute changes.
 */
export function useMinuteClock(): number | null {
  return useSyncExternalStore(subscribeMinute, minuteSnap, () => null);
}
