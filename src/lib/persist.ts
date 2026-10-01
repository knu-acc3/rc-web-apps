"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * State that survives reloads (localStorage). The server and the first client render use `initial`, the saved
 * value is restored right after mount (no hydration mismatch). Storage errors are ignored: the tool keeps working.
 * `clear()` forgets the saved value and returns to `initial` ("Delete all data").
 */
export function usePersistentState<T>(key: string, initial: T, valid: (v: unknown) => v is T): [T, (v: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);
  const initialRef = useRef(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const v: unknown = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only available after mount
        if (valid(v)) setValue(v);
      }
    } catch {
      // storage unavailable
    }
    loaded.current = true;
    // `valid` is a stable type guard; re-reading on every render is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage unavailable
    }
  }, [key, value]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // storage unavailable
    }
    setValue(initialRef.current);
  }, [key]);

  return [value, setValue, clear];
}
