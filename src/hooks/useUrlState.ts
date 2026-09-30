'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Compresses an arbitrary string into a base64url string using native Deflate CompressionStream.
 */
export async function deflateCompress(text: string): Promise<string> {
  if (typeof CompressionStream === 'undefined') {
    return encodeURIComponent(text);
  }
  try {
    const stream = new Blob([new TextEncoder().encode(text)])
      .stream()
      .pipeThrough(new CompressionStream('deflate'));
    const compressedBuffer = await new Response(stream).arrayBuffer();
    const bytes = new Uint8Array(compressedBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // Base64url safe
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return encodeURIComponent(text);
  }
}

/**
 * Decompresses a base64url string back to text using native Deflate DecompressionStream.
 */
export async function deflateDecompress(compressed: string): Promise<string> {
  if (typeof DecompressionStream === 'undefined') {
    return decodeURIComponent(compressed);
  }
  try {
    let base64 = compressed.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream('deflate'));
    return await new Response(stream).text();
  } catch {
    try {
      return decodeURIComponent(compressed);
    } catch {
      return '';
    }
  }
}

export interface UseUrlStateOptions<T> {
  defaultValues: T;
  /** Keys that should be compressed into URL hash (#data=...) instead of query parameters */
  hashKeys?: (keyof T)[];
  debounceMs?: number;
}

export function useUrlState<T extends Record<string, unknown>>({
  defaultValues,
  hashKeys = [],
  debounceMs = 300,
}: UseUrlStateOptions<T>) {
  const [state, setStateInternal] = useState<T>(defaultValues);
  const [isLoaded, setIsLoaded] = useState(false);
  const stateRef = useRef<T>(state);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
  });

  const defaultValuesRef = useRef(defaultValues);
  const hashKeysRef = useRef(hashKeys);

  // Hydrate from URL on mount
  useEffect(() => {
    let cancelled = false;
    const initialDefaults = defaultValuesRef.current;
    const initialHashKeys = hashKeysRef.current;

    async function loadFromUrl() {
      if (typeof window === 'undefined') return;

      const result: Record<string, unknown> = { ...initialDefaults };
      const searchParams = new URLSearchParams(window.location.search);

      // 1. Read query parameters
      for (const [key, defVal] of Object.entries(initialDefaults)) {
        if (initialHashKeys.includes(key as keyof T)) continue;
        if (searchParams.has(key)) {
          const val = searchParams.get(key)!;
          if (typeof defVal === 'number') {
            const num = Number(val);
            if (!Number.isNaN(num)) result[key] = num;
          } else if (typeof defVal === 'boolean') {
            result[key] = val === '1' || val === 'true';
          } else {
            result[key] = val;
          }
        }
      }

      // 2. Read hash parameters (#data=...)
      const hash = window.location.hash;
      const dataMatch = hash.match(/#data=([^&]+)/);
      if (dataMatch) {
        try {
          const decompressed = await deflateDecompress(dataMatch[1]);
          if (decompressed) {
            const parsed = JSON.parse(decompressed) as Record<string, unknown>;
            for (const key of initialHashKeys) {
              if (parsed[key as string] !== undefined) {
                result[key as string] = parsed[key as string];
              }
            }
          }
        } catch {
          // ignore invalid hash
        }
      }

      if (!cancelled) {
        setStateInternal(result as T);
        setIsLoaded(true);
      }
    }

    loadFromUrl();

    return () => {
      cancelled = true;
    };
  }, []);

  // Update URL on state change
  const setState = useCallback(
    (update: Partial<T> | ((prev: T) => T)) => {
      setStateInternal((prev) => {
        const next = typeof update === 'function' ? update(prev) : { ...prev, ...update };
        stateRef.current = next;

        if (typeof window !== 'undefined') {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(async () => {
            const url = new URL(window.location.href);

            // 1. Search params for non-hash keys
            for (const [key, val] of Object.entries(next)) {
              if (hashKeys.includes(key as keyof T)) continue;
              const def = defaultValues[key];
              if (val !== def && val !== undefined && val !== null && val !== '') {
                url.searchParams.set(key, String(val));
              } else {
                url.searchParams.delete(key);
              }
            }

            // 2. Hash for large text/code keys
            const hashPayload: Record<string, unknown> = {};
            let hasHashData = false;
            for (const key of hashKeys) {
              const val = next[key];
              const def = defaultValues[key];
              if (val !== def && val !== undefined && val !== '') {
                hashPayload[key as string] = val;
                hasHashData = true;
              }
            }

            if (hasHashData) {
              const compressed = await deflateCompress(JSON.stringify(hashPayload));
              url.hash = `data=${compressed}`;
            } else {
              url.hash = '';
            }

            window.history.replaceState(null, '', url.pathname + url.search + url.hash);
          }, debounceMs);
        }

        return next;
      });
    },
    [defaultValues, hashKeys, debounceMs],
  );

  const getShareableUrl = useCallback(async (): Promise<string> => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  }, []);

  return {
    state,
    setState,
    isLoaded,
    getShareableUrl,
  };
}
