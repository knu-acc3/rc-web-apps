'use client';

import { useEffect, useRef } from 'react';

export interface UseGlobalFilePasteOptions {
  onFiles?: (files: File[]) => void;
  targetSelector?: string;
  disabled?: boolean;
}

/**
 * Global paste listener that intercepts image/file clipboard events (e.g. PrintScreen, Win+Shift+S, copied files)
 * and seamlessly forwards them to the active file dropzone / input[data-file-paste-target="true"].
 */
export function useGlobalFilePaste({
  onFiles,
  targetSelector = 'input[data-file-paste-target="true"]',
  disabled = false,
}: UseGlobalFilePasteOptions = {}) {
  const onFilesRef = useRef(onFiles);
  useEffect(() => {
    onFilesRef.current = onFiles;
  });

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData || !clipboardData.files || clipboardData.files.length === 0) {
        return;
      }

      // If active element is a text input or textarea and clipboard has text, let default text paste happen,
      // UNLESS the clipboard specifically contains an image/binary file (e.g. screenshot) and no plain text was copied.
      const activeEl = document.activeElement;
      const isTextInput =
        activeEl instanceof HTMLInputElement && activeEl.type === 'text' ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable);

      const hasText = Boolean(clipboardData.getData('text/plain'));
      const hasImageFile = Array.from(clipboardData.files).some((f) => f.type.startsWith('image/'));

      if (isTextInput && hasText && !hasImageFile) {
        return;
      }

      const files = Array.from(clipboardData.files);
      if (files.length === 0) return;

      e.preventDefault();

      // Custom callback takes precedence if provided
      if (onFilesRef.current) {
        onFilesRef.current(files);
        return;
      }

      // Otherwise find the active paste target in DOM
      const targetInput = document.querySelector(targetSelector) as HTMLInputElement | null;
      if (targetInput && typeof DataTransfer !== 'undefined') {
        try {
          const dt = new DataTransfer();
          for (const f of files) {
            dt.items.add(f);
          }
          targetInput.files = dt.files;
          targetInput.dispatchEvent(new Event('change', { bubbles: true }));
        } catch {
          // Fallback if DataTransfer cannot be mutated in some older engines
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [disabled, targetSelector]);
}
