/**
 * ToolPipeBroker: Cross-tool data streaming broker.
 * Enables zero-effort pipeline handoffs (e.g. PDF Text Extraction -> Diff Checker,
 * Image Converter -> Image Compressor -> Watermark).
 * Handles small text payloads via URL hash/sessionStorage, and large files via Blob Vault.
 */

import { tools, type Tool, type ToolContract, type ToolDataType } from '@/src/data/tools';
import { AppDatabase } from '@/src/lib/storage/AppDatabase';

const KNOWN_CONTRACTS: Record<string, ToolContract> = {
  // PDF tools
  'pdf-to-text': { accepts: ['pdf'], produces: ['text'] },
  'pdf-to-image': { accepts: ['pdf'], produces: ['image'] },
  'jpg-to-pdf': { accepts: ['image'], produces: ['pdf'] },
  'compress-pdf': { accepts: ['pdf'], produces: ['pdf'] },
  'merge-pdf': { accepts: ['pdf'], produces: ['pdf'] },
  'split-pdf': { accepts: ['pdf'], produces: ['pdf'] },
  'protect-pdf': { accepts: ['pdf'], produces: ['pdf'] },
  'pdf-metadata': { accepts: ['pdf'], produces: ['json', 'text'] },

  // Images
  'image-compressor': { accepts: ['image'], produces: ['image'] },
  'image-converter': { accepts: ['image'], produces: ['image'] },
  'image-crop': { accepts: ['image'], produces: ['image'] },
  'image-filters': { accepts: ['image'], produces: ['image'] },
  'watermark-image': { accepts: ['image'], produces: ['image'] },
  'image-rotate': { accepts: ['image'], produces: ['image'] },
  'image-to-base64': { accepts: ['image'], produces: ['text'] },
  'color-picker': { accepts: ['image'], produces: ['text', 'json'] },
  'image-colors': { accepts: ['image'], produces: ['json', 'text'] },

  // Text & Code
  'diff-checker': { accepts: ['text'], produces: ['text'] },
  'text-analyzer': { accepts: ['text'], produces: ['json', 'text'] },
  'case-converter': { accepts: ['text'], produces: ['text'] },
  'regex-tester': { accepts: ['text'], produces: ['text', 'json'] },
  'markdown-preview': { accepts: ['text'], produces: ['text'] },

  // Formats
  'json-formatter': { accepts: ['json', 'text'], produces: ['json', 'text'] },
  'csv-to-json': { accepts: ['csv', 'text'], produces: ['json', 'csv'] },
  'json-to-csv': { accepts: ['json', 'text'], produces: ['csv', 'text'] },
  'svg-editor': { accepts: ['svg', 'text'], produces: ['svg', 'image'] },
  'base64-encoder': { accepts: ['text', 'image'], produces: ['text'] },
  'hash-generator': { accepts: ['text', 'image', 'pdf'], produces: ['text'] },
};

export function resolveToolContract(tool: Tool): ToolContract {
  if (tool.contract) return tool.contract;
  if (KNOWN_CONTRACTS[tool.slug]) return KNOWN_CONTRACTS[tool.slug];

  // Infer by groupId
  switch (tool.groupId) {
    case 'pdf':
      return { accepts: ['pdf'], produces: ['pdf'] };
    case 'images':
      return { accepts: ['image'], produces: ['image'] };
    case 'text':
      return { accepts: ['text'], produces: ['text'] };
    case 'converters':
      return { accepts: ['text', 'csv', 'json'], produces: ['text', 'json'] };
    case 'security':
      return { accepts: ['text'], produces: ['text'] };
    default:
      return { accepts: ['text'], produces: ['text'] };
  }
}

export function findCompatibleTools(produces: readonly ToolDataType[], currentSlug?: string): Tool[] {
  const implemented = tools.filter((t) => t.implemented && !t.hidden && t.slug !== currentSlug);
  return implemented.filter((candidate) => {
    const contract = resolveToolContract(candidate);
    return candidate.slug !== currentSlug && candidate.implemented && contract.accepts.some((acc) => produces.includes(acc));
  });
}

export interface PipePayload {
  type: ToolDataType;
  payload: string | Blob;
  name?: string;
}

const SESSION_PIPE_KEY = 'rc_pipe_data';

export const ToolPipeBroker = {
  async sendDataToTool(
    targetSlug: string,
    data: PipePayload,
    locale = 'ru',
  ): Promise<string> {
    if (typeof window === 'undefined') return `/${locale}/tools/${targetSlug}`;

    if (data.payload instanceof Blob) {
      // Store in blob vault
      const blobId = await AppDatabase.storeBlob(data.payload, {
        name: data.name,
        mimeType: data.payload.type,
      });
      return `/${locale}/tools/${targetSlug}#pipe=${blobId}`;
    }

    const text = String(data.payload);
    if (text.length <= 1500) {
      const encoded = encodeURIComponent(text);
      return `/${locale}/tools/${targetSlug}#pipe_text=${encoded}`;
    }

    // Larger text: pass through sessionStorage
    try {
      sessionStorage.setItem(
        SESSION_PIPE_KEY,
        JSON.stringify({
          type: data.type,
          payload: text,
          name: data.name,
          timestamp: Date.now(),
        }),
      );
    } catch {
      // fallback to blob vault
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const blobId = await AppDatabase.storeBlob(blob, { name: data.name });
      return `/${locale}/tools/${targetSlug}#pipe=${blobId}`;
    }

    return `/${locale}/tools/${targetSlug}#pipe=session`;
  },

  async receivePipedData(): Promise<PipePayload | null> {
    if (typeof window === 'undefined') return null;

    const hash = window.location.hash;

    // 1. Text in URL hash
    const textMatch = hash.match(/#pipe_text=([^&]+)/);
    if (textMatch) {
      try {
        const text = decodeURIComponent(textMatch[1]);
        // Clean URL hash without reload
        history.replaceState(null, '', window.location.pathname + window.location.search);
        return { type: 'text', payload: text };
      } catch {
        // ignore
      }
    }

    // 2. Blob in vault
    const blobMatch = hash.match(/#pipe=(blob_[^&]+)/);
    if (blobMatch) {
      const blobId = blobMatch[1];
      try {
        const entry = await AppDatabase.getBlob(blobId);
        if (entry) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
          const type: ToolDataType = entry.mimeType.includes('pdf')
            ? 'pdf'
            : entry.mimeType.includes('image')
              ? 'image'
              : entry.mimeType.includes('csv')
                ? 'csv'
                : entry.mimeType.includes('json')
                  ? 'json'
                  : 'text';
          return { type, payload: entry.blob, name: entry.name };
        }
      } catch {
        // ignore
      }
    }

    // 3. Session storage
    if (hash.includes('#pipe=session') || sessionStorage.getItem(SESSION_PIPE_KEY)) {
      try {
        const raw = sessionStorage.getItem(SESSION_PIPE_KEY);
        if (raw) {
          sessionStorage.removeItem(SESSION_PIPE_KEY);
          history.replaceState(null, '', window.location.pathname + window.location.search);
          const parsed = JSON.parse(raw);
          if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
            return {
              type: parsed.type,
              payload: parsed.payload,
              name: parsed.name,
            };
          }
        }
      } catch {
        // ignore
      }
    }

    return null;
  },
};
