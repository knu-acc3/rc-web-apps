import { useSyncExternalStore } from "react";

const noop = () => () => {};
const browser12h = () => {
  try {
    const c = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hourCycle;
    return c === "h11" || c === "h12";
  } catch {
    return false;
  }
};

/**
 * Whether the browser shows times as "7:00 AM": native time fields follow the browser's locale, not the page's, and
 * the extra "AM" needs room. False on the server and before hydration.
 */
export const useBrowser12h = (): boolean => useSyncExternalStore(noop, browser12h, () => false);
