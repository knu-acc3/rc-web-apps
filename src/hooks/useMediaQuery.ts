'use client';

import { useSyncExternalStore, useCallback } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mediaQueryList = window.matchMedia(query);
      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', callback);
        return () => mediaQueryList.removeEventListener('change', callback);
      } else if (mediaQueryList.addListener) {
        mediaQueryList.addListener(callback);
        return () => mediaQueryList.removeListener(callback);
      }
      return () => {};
    },
    [query]
  );

  const getSnapshot = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
