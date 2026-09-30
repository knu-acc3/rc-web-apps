'use client';

import { useCallback, useState } from 'react';

export interface ClipboardPasteState {
  pasting: boolean;
  error: string | null;
}

export function useClipboardPaste() {
  const [state, setState] = useState<ClipboardPasteState>({ pasting: false, error: null });

  const pasteText = useCallback(async (): Promise<string | null> => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      setState({ pasting: false, error: 'clipboard_unavailable' });
      return null;
    }

    setState({ pasting: true, error: null });
    try {
      const text = await navigator.clipboard.readText();
      setState({ pasting: false, error: null });
      return text;
    } catch {
      setState({ pasting: false, error: 'clipboard_denied' });
      return null;
    }
  }, []);

  return { ...state, pasteText };
}
