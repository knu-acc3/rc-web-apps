'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppDatabase, type ToolHistoryItem } from '@/src/lib/storage/AppDatabase';

export interface UseToolStateOptions {
  /** If true, state is NOT saved to disk/IndexedDB (e.g. password generators, RSA keys) */
  sensitive?: boolean;
  /** Debounce interval before saving draft (default 500ms) */
  autoSaveDelayMs?: number;
  /** Max calculation history items to keep */
  historyLimit?: number;
}

export interface UseToolStateReturn<T> {
  state: T;
  setState: (update: T | ((prev: T) => T)) => void;
  isDirty: boolean;
  hasDraft: boolean;
  isHydrated: boolean;
  restoreDraft: () => Promise<void>;
  clearDraft: () => Promise<void>;
  saveHistory: (summary: string, customData?: unknown) => Promise<void>;
  history: ToolHistoryItem[];
  refreshHistory: () => Promise<void>;
}

export function useToolState<T>(
  toolSlug: string,
  defaultState: T,
  options: UseToolStateOptions = {},
): UseToolStateReturn<T> {
  const { sensitive = false, autoSaveDelayMs = 500, historyLimit = 30 } = options;

  // React 19 Hydration mismatch guard: initial render always uses defaultState
  const [state, setInternalState] = useState<T>(defaultState);
  const [isDirty, setIsDirty] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [history, setHistory] = useState<ToolHistoryItem[]>([]);

  const stateRef = useRef<T>(state);
  stateRef.current = state;
  const isDirtyRef = useRef<boolean>(isDirty);
  isDirtyRef.current = isDirty;
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Asynchronous hydration after mount
  useEffect(() => {
    let active = true;

    async function init() {
      if (sensitive) {
        if (active) setIsHydrated(true);
        return;
      }

      try {
        const draft = await AppDatabase.getDraft<T>(toolSlug);
        if (active && draft && draft.state !== undefined) {
          setHasDraft(true);
          // Don't overwrite if user has already made changes before hydration resolved
          if (!isDirtyRef.current) {
            setInternalState(draft.state);
            setIsDirty(draft.isDirty);
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (active) setIsHydrated(true);
      }

      try {
        const hist = await AppDatabase.getHistory(toolSlug, historyLimit);
        if (active) setHistory(hist);
      } catch {
        // Fallback gracefully
      }
    }

    init();

    return () => {
      active = false;
    };
  }, [toolSlug, sensitive, historyLimit]);

  // Debounced auto-save to IndexedDB
  const setState = useCallback(
    (update: T | ((prev: T) => T)) => {
      setIsDirty(true);
      setInternalState((prev) => {
        const next = typeof update === 'function' ? (update as (prev: T) => T)(prev) : update;
        stateRef.current = next;

        if (!sensitive && typeof window !== 'undefined') {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(() => {
            AppDatabase.saveDraft(toolSlug, next).catch(() => {});
            setHasDraft(true);
          }, autoSaveDelayMs);
        }

        return next;
      });
    },
    [toolSlug, sensitive, autoSaveDelayMs],
  );

  const clearDraft = useCallback(async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    await AppDatabase.deleteDraft(toolSlug);
    setInternalState(defaultState);
    stateRef.current = defaultState;
    setIsDirty(false);
    setHasDraft(false);
  }, [toolSlug, defaultState]);

  const restoreDraft = useCallback(async () => {
    const draft = await AppDatabase.getDraft<T>(toolSlug);
    if (draft && draft.state !== undefined) {
      setInternalState(draft.state);
      stateRef.current = draft.state;
      setIsDirty(draft.isDirty);
      setHasDraft(true);
    }
  }, [toolSlug]);

  const refreshHistory = useCallback(async () => {
    try {
      const hist = await AppDatabase.getHistory(toolSlug, historyLimit);
      setHistory(hist);
    } catch {
      // ignore
    }
  }, [toolSlug, historyLimit]);

  const saveHistory = useCallback(
    async (summary: string, customData?: unknown) => {
      const dataToSave = customData !== undefined ? customData : stateRef.current;
      await AppDatabase.addHistory(toolSlug, summary, dataToSave, historyLimit);
      await refreshHistory();
    },
    [toolSlug, historyLimit, refreshHistory],
  );

  return {
    state,
    setState,
    isDirty,
    hasDraft,
    isHydrated,
    restoreDraft,
    clearDraft,
    saveHistory,
    history,
    refreshHistory,
  };
}
