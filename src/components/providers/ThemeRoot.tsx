'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/src/components/ui/tooltip';
import type { ReactNode } from 'react';

// Suppress React 19 development-only false positive warning for next-themes SSR inline script tag
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Encountered a script tag while rendering React component')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeRoot({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.dataset.appHydrated = 'true';
    return () => {
      delete document.documentElement.dataset.appHydrated;
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={150}>
        {children}
        {mounted ? <Toaster position="bottom-center" richColors closeButton /> : null}
      </TooltipProvider>
    </ThemeProvider>
  );
}
