"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/clipboard";

/** Copy text and remember which item was copied for 1.5 s (for a quiet "copied" tick). */
export function useCopyFlash<K>() {
  const [copied, setCopied] = useState<K | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = useCallback(async (key: K, text: string) => {
    if (!text || !(await copyText(text))) return;
    setCopied(key);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1500);
  }, []);
  return [copied, copy] as const;
}
