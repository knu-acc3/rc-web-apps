/**
 * Image Transform Worker using OffscreenCanvas and createImageBitmap.
 * Offloads heavy 48MP image resizing, cropping, and color quantization
 * entirely from the UI thread to keep 60 FPS performance.
 */

export interface ImageTransformTaskPayload {
  readonly taskId: string;
  readonly type: 'RESIZE' | 'CROP' | 'QUANTIZE';
  readonly source: ImageBitmap | Blob;
  readonly options?: {
    width?: number;
    height?: number;
    cropX?: number;
    cropY?: number;
    cropWidth?: number;
    cropHeight?: number;
    format?: 'image/jpeg' | 'image/png' | 'image/webp';
    quality?: number;
    paletteSize?: number;
  };
}

self.onmessage = async (event: MessageEvent<ImageTransformTaskPayload>) => {
  const { taskId, type, source, options = {} } = event.data;

  try {
    const bitmap = source instanceof ImageBitmap ? source : await createImageBitmap(source);

    if (type === 'RESIZE') {
      const targetWidth = Math.max(1, Math.round(options.width || bitmap.width));
      const targetHeight = Math.max(1, Math.round(options.height || bitmap.height));

      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d', { willReadFrequently: false });
      if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

      const mime = options.format || 'image/webp';
      const blob = await canvas.convertToBlob({
        type: mime,
        quality: options.quality ?? 0.85,
      });

      self.postMessage({
        taskId,
        success: true,
        result: {
          blob,
          width: targetWidth,
          height: targetHeight,
          format: mime,
          byteLength: blob.size,
        },
      });
      bitmap.close();
      return;
    }

    if (type === 'CROP') {
      const cropX = Math.max(0, options.cropX || 0);
      const cropY = Math.max(0, options.cropY || 0);
      const cropW = Math.min(bitmap.width - cropX, options.cropWidth || bitmap.width);
      const cropH = Math.min(bitmap.height - cropY, options.cropHeight || bitmap.height);

      const canvas = new OffscreenCanvas(cropW, cropH);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable');

      ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const mime = options.format || 'image/webp';
      const blob = await canvas.convertToBlob({
        type: mime,
        quality: options.quality ?? 0.85,
      });

      self.postMessage({
        taskId,
        success: true,
        result: {
          blob,
          width: cropW,
          height: cropH,
          format: mime,
        },
      });
      bitmap.close();
      return;
    }

    if (type === 'QUANTIZE') {
      // Downscale to 128x128 for fast color sampling
      const sampleCanvas = new OffscreenCanvas(128, 128);
      const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
      if (!sampleCtx) throw new Error('OffscreenCanvas 2D context unavailable');

      sampleCtx.drawImage(bitmap, 0, 0, 128, 128);
      const imgData = sampleCtx.getImageData(0, 0, 128, 128);
      const pixels = imgData.data;

      const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();
      const step = 4;

      for (let i = 0; i < pixels.length; i += step * 4) {
        const a = pixels[i + 3];
        if (a < 128) continue; // Skip transparent
        const r = Math.round(pixels[i] / 16) * 16;
        const g = Math.round(pixels[i + 1] / 16) * 16;
        const b = Math.round(pixels[i + 2] / 16) * 16;
        const key = `${r},${g},${b}`;
        const existing = colorMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          colorMap.set(key, { r, g, b, count: 1 });
        }
      }

      const sorted = Array.from(colorMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, options.paletteSize || 6)
        .map((c) => ({
          hex: `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`,
          rgb: `rgb(${c.r}, ${c.g}, ${c.b})`,
          weight: c.count,
        }));

      self.postMessage({
        taskId,
        success: true,
        result: { palette: sorted },
      });
      bitmap.close();
      return;
    }

    throw new Error(`Unsupported task type: ${type}`);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Image transform error';
    self.postMessage({ taskId, success: false, error });
  }
};
