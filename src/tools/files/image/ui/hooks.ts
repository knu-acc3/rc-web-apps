"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { acquireEngine, releaseEngine, type Engine } from "../lib/client";

/** Shared worker engine for the component's lifetime (released on unmount). */
export function useEngine(): () => Engine {
  const ref = useRef<Engine | null>(null);
  useEffect(() => {
    ref.current = acquireEngine();
    return () => {
      ref.current = null;
      releaseEngine();
    };
  }, []);
  return useCallback(() => {
    if (!ref.current) throw new Error("Engine not ready");
    return ref.current;
  }, []);
}

/** Object URLs owned by a component — all revoked on unmount. */
export function useObjectUrls() {
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const set = urls.current;
    return () => {
      for (const u of set) URL.revokeObjectURL(u);
      set.clear();
    };
  }, []);
  const make = useCallback((blob: Blob) => {
    const u = URL.createObjectURL(blob);
    urls.current.add(u);
    return u;
  }, []);
  const revoke = useCallback((u?: string | null) => {
    if (!u || !urls.current.has(u)) return;
    URL.revokeObjectURL(u);
    urls.current.delete(u);
  }, []);
  return { make, revoke };
}

/** Value that follows `value` after `ms` of inactivity. */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Keep an ImageBitmap in state and close the previous one / on unmount. */
export function useBitmap(): [ImageBitmap | null, (b: ImageBitmap | null) => void] {
  const [bmp, setBmp] = useState<ImageBitmap | null>(null);
  const cur = useRef<ImageBitmap | null>(null);
  const set = useCallback((b: ImageBitmap | null) => {
    if (cur.current && cur.current !== b) cur.current.close();
    cur.current = b;
    setBmp(b);
  }, []);
  useEffect(
    () => () => {
      cur.current?.close();
      cur.current = null;
    },
    [],
  );
  return [bmp, set];
}
