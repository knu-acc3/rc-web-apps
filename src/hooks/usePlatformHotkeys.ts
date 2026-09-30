'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface UsePlatformHotkeysOptions {
  onPrimaryAction?: () => void;
  onCopyResult?: () => void;
  onReset?: () => void;
  disabled?: boolean;
}

/**
 * Universal platform hotkeys:
 * - Ctrl+Enter / Cmd+Enter: Execute primary tool action
 * - Ctrl+Shift+C: Quick copy main result to clipboard
 * - Escape: Reset/clear input (when no modal is open)
 */
export function usePlatformHotkeys({
  onPrimaryAction,
  onCopyResult,
  onReset,
  disabled = false,
}: UsePlatformHotkeysOptions = {}) {
  const onPrimaryRef = useRef(onPrimaryAction);
  const onCopyRef = useRef(onCopyResult);
  const onResetRef = useRef(onReset);

  useEffect(() => {
    onPrimaryRef.current = onPrimaryAction;
    onCopyRef.current = onCopyResult;
    onResetRef.current = onReset;
  });

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // 1. Ctrl + Enter / Cmd + Enter: Primary Action
      if (isCmdOrCtrl && e.key === 'Enter') {
        if (onPrimaryRef.current) {
          e.preventDefault();
          onPrimaryRef.current();
          return;
        }
        const primaryBtn = document.querySelector<HTMLButtonElement>(
          '[data-tool-primary-action]:not([disabled])',
        );
        if (primaryBtn) {
          e.preventDefault();
          primaryBtn.click();
          return;
        }
      }

      // 2. Ctrl + Shift + C: Copy main result
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'c') {
        if (onCopyRef.current) {
          e.preventDefault();
          onCopyRef.current();
          return;
        }
        const copyBtn = document.querySelector<HTMLButtonElement>(
          '[data-tool-copy-result]:not([disabled]), [data-copy-button]:not([disabled])',
        );
        if (copyBtn) {
          e.preventDefault();
          copyBtn.click();
          return;
        }
      }

      // 3. Escape: Reset / Clear
      if (e.key === 'Escape') {
        // Don't trigger reset if a Radix dialog or modal is open
        const hasOpenDialog = document.querySelector('[role="dialog"][data-state="open"]');
        if (hasOpenDialog) return;

        if (onResetRef.current) {
          e.preventDefault();
          onResetRef.current();
          return;
        }
        const resetBtn = document.querySelector<HTMLButtonElement>(
          '[data-tool-reset-action]:not([disabled])',
        );
        if (resetBtn) {
          e.preventDefault();
          resetBtn.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [disabled]);
}

/**
 * Undo / Redo history state hook for editors (Ctrl+Z / Ctrl+Y).
 */
export function useUndoRedo<T>(initialState: T, maxHistory = 50) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialState);
  const [future, setFuture] = useState<T[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture([present, ...future]);
    setPresent(previous);
  }, [canUndo, past, present, future]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast([...past, present]);
    setFuture(newFuture);
    setPresent(next);
  }, [canRedo, past, present, future]);

  const set = useCallback(
    (newPresent: T | ((curr: T) => T)) => {
      const resolved = typeof newPresent === 'function' ? (newPresent as (curr: T) => T)(present) : newPresent;
      if (resolved === present) return;

      setPast((prev) => [...prev.slice(-(maxHistory - 1)), present]);
      setPresent(resolved);
      setFuture([]);
    },
    [present, maxHistory],
  );

  const resetState = useCallback((newInitial: T) => {
    setPast([]);
    setPresent(newInitial);
    setFuture([]);
  }, []);

  // Keyboard shortcut listener for Ctrl+Z / Ctrl+Y (or Cmd+Shift+Z)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (!isCmdOrCtrl) return;

      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        undo();
      } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
        redo();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo]);

  return {
    state: present,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    resetState,
  };
}
