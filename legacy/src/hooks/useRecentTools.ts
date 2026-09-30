import { useCallback, useMemo, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'ut_recent_tools';
const CHANGE_EVENT = 'ut_recent_tools_changed';
const MAX_RECENT = 8;
const EMPTY_SNAPSHOT = '[]';
let memorySlugs: string[] = [];
let storageFallbackActive = false;

function sanitizeSlugs(value: unknown): string[] {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))).slice(0, MAX_RECENT)
    : [];
}

function getSnapshot(): string {
  if (storageFallbackActive) return JSON.stringify(memorySlugs);
  try {
    return localStorage.getItem(STORAGE_KEY) || EMPTY_SNAPSHOT;
  } catch {
    storageFallbackActive = true;
    return JSON.stringify(memorySlugs);
  }
}

function readRecentTools(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return memorySlugs;
    memorySlugs = sanitizeSlugs(JSON.parse(stored));
    return memorySlugs;
  } catch {
    return memorySlugs;
  }
}

export function useRecentTools() {
  const snapshot = useSyncExternalStore(
    (onChange) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY) onChange();
      };
      window.addEventListener('storage', onStorage);
      window.addEventListener(CHANGE_EVENT, onChange);
      return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(CHANGE_EVENT, onChange);
      };
    },
    getSnapshot,
    () => EMPTY_SNAPSHOT,
  );

  const recentSlugs = useMemo(() => {
    try {
      return sanitizeSlugs(JSON.parse(snapshot));
    } catch {
      return memorySlugs;
    }
  }, [snapshot]);

  const addRecentTool = useCallback((slug: string) => {
    const current = readRecentTools();
    const filtered = current.filter(s => s !== slug);
    const updated = [slug, ...filtered].slice(0, MAX_RECENT);
    memorySlugs = updated;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      storageFallbackActive = false;
    } catch {
      storageFallbackActive = true;
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { recentSlugs, addRecentTool };
}
