'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'rc_calibrated_ppi';
const DEFAULT_PPI = 96;

export function useScreenPpi() {
  const [ppi, setPpiState] = useState<number>(DEFAULT_PPI);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val > 30 && val < 1000) {
          queueMicrotask(() => {
            setPpiState(val);
            setIsCalibrated(true);
          });
        }
      }
    } catch {
      // localStorage may fail in private mode
    }
  }, []);

  const setPpi = useCallback((newPpi: number) => {
    setPpiState(newPpi);
    setIsCalibrated(newPpi !== DEFAULT_PPI);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newPpi.toString());
      }
    } catch {
      // ignore
    }
  }, []);

  return { ppi, setPpi, isCalibrated };
}
