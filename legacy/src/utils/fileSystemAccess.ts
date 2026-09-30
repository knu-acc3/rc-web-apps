/**
 * Chromium File System Access API wrapper.
 * Allows saving files directly to user-selected locations or updating existing files
 * without littering Downloads with 'file (1).ext' duplicates.
 */

import { downloadBlob } from '@/src/utils/exportHelpers';

export interface FilePickerTypeOption {
  description?: string;
  accept: Record<string, string[]>;
}

export interface SaveFileOptions {
  suggestedName: string;
  blobOrText: Blob | string;
  types?: FilePickerTypeOption[];
}

interface FileSystemFileHandleLike {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}

interface WindowWithFileSystemAccess extends Window {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: FilePickerTypeOption[];
  }) => Promise<FileSystemFileHandleLike>;
}

export async function saveWithFilePicker(options: SaveFileOptions): Promise<boolean> {
  const { suggestedName, blobOrText, types } = options;
  const blob = blobOrText instanceof Blob ? blobOrText : new Blob([blobOrText], { type: 'text/plain;charset=utf-8' });

  // 1. Try Chromium File System Access API if available
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const win = window as WindowWithFileSystemAccess;
      if (win.showSaveFilePicker) {
        const pickerOptions = {
          suggestedName,
          ...(types && types.length > 0 ? { types } : {}),
        };

        const handle = await win.showSaveFilePicker(pickerOptions);
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User intentionally cancelled picker
        return false;
      }
      // Permission denied or failure: fall through to fallback download
    }
  }

  // 2. Fallback to standard browser download
  downloadBlob(blob, suggestedName);
  return true;
}
