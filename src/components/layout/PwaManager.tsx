'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { siteConfig } from '@/src/config/site.config';

const VISIT_COUNT_KEY = 'ut_pwa_visit_count';
const PROMPT_DISMISSED_KEY = 'ut_pwa_install_prompt_dismissed';
const PROMPT_DELAY_MS = 30_000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // PWA prompts should not break when storage is blocked.
  }
}

function consumeSessionFlag(key: string): boolean {
  try {
    if (!window.sessionStorage.getItem(key)) return false;
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function writeSessionFlag(key: string): void {
  try {
    window.sessionStorage.setItem(key, '1');
  } catch {
    // A blocked session store should not prevent the worker update itself.
  }
}

export function PwaManager() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateVisible, setUpdateVisible] = useState(false);

  useEffect(() => {
    // A development service worker caches dev chunk URLs and can make
    // hot-reloaded pages run stale code. In development, actively unregister
    // any existing service workers and clear cache storage.
    if (process.env.NODE_ENV !== 'production') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    let promptTimer: number | null = null;

    const registerServiceWorker = () => {
      if (!('serviceWorker' in navigator)) return;

      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          const showUpdate = () => {
            if (registration.waiting) {
              setUpdateRegistration(registration);
              setUpdateVisible(true);
            }
          };

          showUpdate();
          registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            if (!worker) return;
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateRegistration(registration);
                setUpdateVisible(true);
              }
            });
          });
        })
        .catch(() => {});
    };

    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker, { once: true });
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (isStandaloneMode() || readStorage(PROMPT_DISMISSED_KEY)) return;

      const visits = Number(readStorage(VISIT_COUNT_KEY) || '0') + 1;
      writeStorage(VISIT_COUNT_KEY, String(visits));
      setInstallEvent(event as BeforeInstallPromptEvent);

      if (visits >= 3) {
        promptTimer = window.setTimeout(() => {
          if (!isStandaloneMode() && !readStorage(PROMPT_DISMISSED_KEY)) {
            setVisible(true);
          }
        }, PROMPT_DELAY_MS);
      }
    };

    const onControllerChange = () => {
      // A first-time worker calls clients.claim(), which also emits
      // controllerchange. Reload only after the user explicitly accepts an
      // update, never during the first visit.
      if (!consumeSessionFlag('ut_pwa_update_requested')) return;
      window.location.reload();
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange);
    return () => {
      window.removeEventListener('load', registerServiceWorker);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
      if (promptTimer) window.clearTimeout(promptTimer);
    };
  }, []);

  const dismiss = () => {
    writeStorage(PROMPT_DISMISSED_KEY, '1');
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) {
      dismiss();
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice.catch(() => ({ outcome: 'dismissed' as const, platform: '' }));
    if (choice.outcome === 'accepted') {
      writeStorage(PROMPT_DISMISSED_KEY, '1');
    }
    setVisible(false);
  };

  const applyUpdate = () => {
    writeSessionFlag('ut_pwa_update_requested');
    updateRegistration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    setUpdateVisible(false);
  };

  if (updateVisible && updateRegistration?.waiting) {
    return (
      <div
        role="status"
        className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm shadow-[var(--shadow-floating)] lg:bottom-4"
      >
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[var(--color-text)]">{isEn ? 'Update ready' : 'Обновление готово'}</p>
          <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn ? 'Refresh once to use the newest cached version.' : 'Обновите один раз, чтобы включить новую кешированную версию.'}
          </p>
        </div>
          <button type="button" className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold" onClick={applyUpdate}>
          {isEn ? 'Update' : 'Обновить'}
          </button>
        <button
          type="button"
          className="rounded-md p-1.5 text-[var(--color-text-muted)]"
          onClick={() => setUpdateVisible(false)}
          aria-label={isEn ? 'Dismiss update prompt' : 'Скрыть обновление'}
        >
          ×
        </button>
      </div>
    );
  }

  if (!visible || !installEvent) return null;

  return (
    <div
      role="dialog"
      aria-label={isEn ? `Install ${siteConfig.brandName}` : `Установить ${siteConfig.brandName}`}
      className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm shadow-[var(--shadow-floating)] lg:bottom-4"
    >
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[var(--color-text)]">{isEn ? `Install ${siteConfig.brandName}` : `Установить ${siteConfig.brandName}`}</p>
        <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
          {isEn ? 'Open faster and keep recently used pages available offline.' : 'Быстрее открывать и держать недавно открытые страницы доступными офлайн.'}
        </p>
      </div>
      <button type="button" className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold" onClick={install}>
        {isEn ? 'Install' : 'Установить'}
      </button>
      <button type="button" className="rounded-md p-1.5 text-[var(--color-text-muted)]" onClick={dismiss} aria-label={isEn ? 'Dismiss install prompt' : 'Скрыть установку'}>×</button>
    </div>
  );
}
