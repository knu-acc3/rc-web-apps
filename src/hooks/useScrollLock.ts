'use client';

import { useEffect } from 'react';

export function useScrollLock(lock: boolean = true) {
  useEffect(() => {
    if (!lock || typeof document === 'undefined') return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [lock]);
}
