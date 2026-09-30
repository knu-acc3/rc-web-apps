/**
 * ImageMagick WASM Worker.
 * Offloads complex raster & vector conversions for rare formats
 * (TIFF, BMP, ICO, HDR, SVG, WebP, TGA, PSD) using @imagemagick/magick-wasm.
 */

import { initializeImageMagick, ImageMagick, MagickFormat } from '@imagemagick/magick-wasm';
import type { WorkerTaskPayload, WorkerTaskResponse } from '@/src/lib/workers/workerPool';

export interface ImageConvertPayload {
  readonly bytes: Uint8Array;
  readonly targetFormat: string;
  readonly quality?: number;
  readonly width?: number;
  readonly height?: number;
}

let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureImageMagickInitialized(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const wasmUrl = new URL('/vendor/imagemagick/magick.wasm', self.location.origin);
      const response = await fetch(wasmUrl);
      if (!response.ok) {
        throw new Error(`Failed to load magick.wasm: ${response.statusText}`);
      }
      const wasmBytes = new Uint8Array(await response.arrayBuffer());
      await initializeImageMagick(wasmBytes);
      isInitialized = true;
    } catch (err) {
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

function resolveMagickFormat(fmt: string): MagickFormat {
  const clean = fmt.toUpperCase().replace(/^\./, '');
  switch (clean) {
    case 'JPG':
    case 'JPEG':
      return MagickFormat.Jpeg;
    case 'PNG':
      return MagickFormat.Png;
    case 'WEBP':
      return MagickFormat.WebP;
    case 'TIFF':
    case 'TIF':
      return MagickFormat.Tiff;
    case 'BMP':
      return MagickFormat.Bmp;
    case 'ICO':
      return MagickFormat.Ico;
    case 'HDR':
      return MagickFormat.Hdr;
    case 'SVG':
      return MagickFormat.Svg;
    case 'AVIF':
      return MagickFormat.Avif;
    case 'GIF':
      return MagickFormat.Gif;
    default:
      return MagickFormat.Png;
  }
}

self.onmessage = async (event: MessageEvent<WorkerTaskPayload<ImageConvertPayload>>) => {
  const { taskId, type, data } = event.data;

  if (type !== 'IMAGE_CONVERT' && type !== 'IMAGE_RESIZE') {
    self.postMessage({
      taskId,
      success: false,
      error: `Unsupported task type: ${type}`,
    } satisfies WorkerTaskResponse);
    return;
  }

  try {
    await ensureImageMagickInitialized();

    const targetFormat = resolveMagickFormat(data.targetFormat);

    const convertedBytes = await new Promise<Uint8Array>((resolve, reject) => {
      try {
        ImageMagick.read(data.bytes, (image) => {
          if (data.quality !== undefined && data.quality > 0 && data.quality <= 100) {
            image.quality = data.quality;
          }
          if (data.width && data.height) {
            image.resize(data.width, data.height);
          }

          image.write(targetFormat, (outputData) => {
            // Create a copy of the Uint8Array since buffer can be released
            resolve(new Uint8Array(outputData));
          });
        });
      } catch (err) {
        reject(err);
      }
    });

    self.postMessage(
      {
        taskId,
        success: true,
        result: {
          bytes: convertedBytes,
          format: data.targetFormat,
          byteLength: convertedBytes.byteLength,
        },
      } satisfies WorkerTaskResponse,
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Image processing error';
    self.postMessage({
      taskId,
      success: false,
      error: errorMsg,
    } satisfies WorkerTaskResponse);
  }
};
