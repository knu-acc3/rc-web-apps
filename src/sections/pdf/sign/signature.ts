/** Canvas helpers for the signature: trimming to the ink and building a PNG. */

export interface SignatureImage {
  png: ArrayBuffer;
  url: string;
  width: number;
  height: number;
}

/** Crop a canvas to its non-transparent pixels (+padding) and export a PNG. */
export async function trimToPng(src: HTMLCanvasElement, pad = 6): Promise<SignatureImage | null> {
  const ctx = src.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const { width, height } = src;
  const data = ctx.getImageData(0, 0, width, height).data;
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(width - 1, x1 + pad);
  y1 = Math.min(height - 1, y1 + pad);
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")!.drawImage(src, x0, y0, w, h, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => out.toBlob(r, "image/png"));
  out.width = out.height = 1;
  if (!blob) return null;
  return { png: await blob.arrayBuffer(), url: URL.createObjectURL(blob), width: w, height: h };
}

/** Render typed text as a signature. */
export function typedCanvas(text: string, font: string, color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const size = 96;
  const ctx = c.getContext("2d")!;
  ctx.font = `${size}px ${font}`;
  const w = Math.ceil(ctx.measureText(text).width) + size;
  c.width = Math.min(4000, Math.max(200, w));
  c.height = Math.round(size * 1.8);
  const g = c.getContext("2d")!;
  g.font = `${size}px ${font}`;
  g.fillStyle = color;
  g.textBaseline = "middle";
  g.fillText(text, size / 2, c.height / 2);
  return c;
}

/** Draw an uploaded image; optionally make its light background transparent. */
export async function imageCanvas(file: File, removeWhite: boolean): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bmp.width * k));
  c.height = Math.max(1, Math.round(bmp.height * k));
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  if (removeWhite) {
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Soft threshold keeps anti-aliased edges smooth.
      if (lum > 225) d[i + 3] = 0;
      else if (lum > 180) d[i + 3] = Math.round((d[i + 3] * (225 - lum)) / 45);
    }
    ctx.putImageData(img, 0, 0);
  }
  return c;
}
