"use client";

import { useEffect, useRef } from "react";

/**
 * Global single-key shortcuts (Space, R, L …) that are ignored while typing in a
 * field or when a button/link has focus (Space would click it natively).
 */
export function useKeys(map: Record<string, () => void>, enabled = true): void {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A|SUMMARY)$/.test(t.tagName))) return;
      const key = e.code === "Space" ? " " : e.key.toLowerCase();
      // Russian layout: R → К, L → Д
      const alias: Record<string, string> = { к: "r", д: "l", а: "f" };
      const fn = ref.current[key] ?? ref.current[alias[key] ?? ""];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
