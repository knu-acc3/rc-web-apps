'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { writeClipboardText } from '@/src/utils/clipboard';

interface CopyOptions {
  /** Message shown in toast on success */
  successMessage?: string;
  /** Whether to also show a toast (in addition to the inline flag) */
  showToast?: boolean;
  /** ms to keep `copied=true` flag */
  flagDuration?: number;
}

let lastGlobalToastAt = 0;

/**
 * Single source of truth for copy-to-clipboard with consistent feedback.
 */
export function useCopyWithToast(defaults?: CopyOptions) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastToastRef = useRef(0);

  const copy = useCallback(
    async (text: string, options?: CopyOptions) => {
      const opts = { ...defaults, ...options };
      const ok = await writeClipboardText(text);
      if (ok) {
        setCopied(true);
        if (opts.showToast !== false) {
          const now = Date.now();
          if (now - lastToastRef.current > 500 && now - lastGlobalToastAt > 500) {
            lastToastRef.current = now;
            lastGlobalToastAt = now;
            toast.success(opts.successMessage ?? 'Copied');
          }
        }
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), opts.flagDuration ?? 1500);
        return true;
      }

      toast.error('Copy failed');
      return false;
    },
    [defaults],
  );

  return { copied, copy };
}
