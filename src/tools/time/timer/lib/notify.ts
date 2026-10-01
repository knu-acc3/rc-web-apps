"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/* ───────────── browser notifications (permission on demand) ───────────── */

function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Ask for permission (call from a click). Resolves true when granted. */
export async function requestNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/** Show a notification when allowed; only useful when the page is not visible. */
export function notify(title: string, body: string, onlyWhenHidden = true): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  if (onlyWhenHidden && document.visibilityState === "visible") return;
  try {
    const n = new Notification(title, { body, tag: "timer", requireInteraction: false });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // Android Chrome requires a service worker for notifications — silently skip
  }
}

/* ───────────── document.title while a timer runs ───────────── */

/** Prefix the tab title with `text` while it is non-null; restores the original title. */
export function useTitle(text: string | null): void {
  const original = useRef<string | null>(null);
  useEffect(() => {
    if (text === null) {
      if (original.current !== null) {
        document.title = original.current;
        original.current = null;
      }
      return;
    }
    if (original.current === null) original.current = document.title;
    document.title = `${text} · ${original.current}`;
  }, [text]);
  useEffect(
    () => () => {
      if (original.current !== null) document.title = original.current;
    },
    [],
  );
}

/* ───────────── a ticker that also works in background tabs ───────────── */

/**
 * Calls `onTick` on every animation frame while the tab is visible and at least
 * every `bgMs` in the background (browsers throttle timers there), plus immediately
 * when the tab becomes visible again. Values must be derived from timestamps,
 * never accumulated per tick.
 */
export function useTicker(active: boolean, onTick: () => void, bgMs = 500): void {
  const cb = useRef(onTick);
  useEffect(() => {
    cb.current = onTick;
  });
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const frame = () => {
      cb.current();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const iv = setInterval(() => {
      if (document.visibilityState !== "visible") cb.current();
    }, bgMs);
    const onVis = () => cb.current();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [active, bgMs]);
}

/** Hydration-safe "is the Notification API available". */
const noop = () => () => {};
export function useNotificationsSupported(): boolean {
  return useSyncExternalStore(noop, notificationsSupported, () => false);
}
