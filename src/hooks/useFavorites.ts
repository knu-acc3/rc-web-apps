'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const LOCAL_KEY = 'ut_favorites';
const CHANGE_EVENT = 'ut_favorites_changed';
const EMPTY_SNAPSHOT = '[]';
let memorySlugs: string[] = [];
let storageFallbackActive = false;

function sanitizeSlugs(value: unknown): string[] {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0)))
    : [];
}

let cachedSnapshot: string | null = null;
let cachedParsedSlugs: string[] = [];
let cachedSlugsSet: Set<string> = new Set();

function updateParsedCache(raw: string) {
  try {
    cachedParsedSlugs = sanitizeSlugs(JSON.parse(raw));
  } catch {
    cachedParsedSlugs = memorySlugs;
  }
  cachedSlugsSet = new Set(cachedParsedSlugs);
}

function getSnapshot(): string {
  if (cachedSnapshot !== null) return cachedSnapshot;
  if (storageFallbackActive) {
    cachedSnapshot = JSON.stringify(memorySlugs);
    updateParsedCache(cachedSnapshot);
    return cachedSnapshot;
  }
  try {
    cachedSnapshot = localStorage.getItem(LOCAL_KEY) || EMPTY_SNAPSHOT;
    updateParsedCache(cachedSnapshot);
    return cachedSnapshot;
  } catch {
    storageFallbackActive = true;
    cachedSnapshot = JSON.stringify(memorySlugs);
    updateParsedCache(cachedSnapshot);
    return cachedSnapshot;
  }
}

function readLocal(): string[] {
  if (typeof window === 'undefined') return [];
  if (cachedSnapshot !== null) return cachedParsedSlugs;
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (!stored) return memorySlugs;
    memorySlugs = sanitizeSlugs(JSON.parse(stored));
    cachedSnapshot = stored;
    updateParsedCache(stored);
    return memorySlugs;
  } catch {
    return memorySlugs;
  }
}

function writeLocal(slugs: string[]) {
  memorySlugs = sanitizeSlugs(slugs);
  const serialized = JSON.stringify(memorySlugs);
  cachedSnapshot = serialized;
  updateParsedCache(serialized);
  try {
    localStorage.setItem(LOCAL_KEY, serialized);
    storageFallbackActive = false;
  } catch {
    storageFallbackActive = true;
  }
}

const getServerSnapshot = () => EMPTY_SNAPSHOT;

const listeners = new Set<() => void>();
let isListening = false;

function setupStorageListeners() {
  if (isListening || typeof window === 'undefined') return;
  isListening = true;
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === LOCAL_KEY) {
      cachedSnapshot = null;
      listeners.forEach((l) => l());
    }
  });
  window.addEventListener(CHANGE_EVENT, () => {
    cachedSnapshot = null;
    listeners.forEach((l) => l());
  });
}

function subscribe(onChange: () => void) {
  setupStorageListeners();
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function useFavorites() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const favoriteSlugs = useMemo(() => {
    void snapshot;
    getSnapshot();
    return cachedParsedSlugs;
  }, [snapshot]);

  const toggleFavorite = useCallback((slug: string) => {
    const current = readLocal();
    const next = current.includes(slug) ? current.filter(s => s !== slug) : [slug, ...current];
    writeLocal(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const isFavorite = useCallback((slug: string) => cachedSlugsSet.has(slug), []);

  return { favoriteSlugs, toggleFavorite, isFavorite, loading: false };
}
