'use client';

import { useEffect, useState, type ComponentType } from 'react';

type ProviderModules = {
  PwaManager: ComponentType;
};

export function DeferredClientProviders() {
  const [providers, setProviders] = useState<ProviderModules | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void import('./PwaManager').then((pwa) => {
        if (cancelled) return;
        setProviders({ PwaManager: pwa.PwaManager });
      });
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!providers) return null;
  const PwaManager = providers.PwaManager;
  return <PwaManager />;
}
