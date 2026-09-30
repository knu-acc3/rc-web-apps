'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Manages an object URL for a Blob or File with guaranteed cleanup on change or unmount.
 * Prevents memory leaks in image/PDF rendering workflows.
 */
export function useBlobUrl(source: Blob | File | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!source) {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
        previousUrlRef.current = null;
      }
      return;
    }

    try {
      const newUrl = URL.createObjectURL(source);
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
      previousUrlRef.current = newUrl;
      queueMicrotask(() => {
        setUrl(newUrl);
      });
    } catch {
      // ignore creation failure
    }

    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
        previousUrlRef.current = null;
      }
    };
  }, [source]);

  return source ? url : null;
}

/**
 * Helper to safely revoke an array or set of object URLs.
 */
export function revokeObjectUrls(urls: Iterable<string | { url: string } | null | undefined>): void {
  if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') return;
  for (const item of urls) {
    if (!item) continue;
    const targetUrl = typeof item === 'string' ? item : item.url;
    if (targetUrl && targetUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(targetUrl);
      } catch {
        // ignore errors on already revoked URLs
      }
    }
  }
}
