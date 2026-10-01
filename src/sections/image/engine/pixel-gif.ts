/**
 * Indexed-colour helpers for pixel art → GIF. Exact palettes when a frame has
 * ≤ 256 colours (pixel art stays pixel-perfect); proper quantisation above
 * that (the old editor silently mapped every extra colour to index 0).
 */

interface IndexedFrame {
  index: Uint8Array;
  palette: number[][];
  transparentIndex: number;
}

/** Map RGBA pixels to palette indices. Alpha < 128 is treated as transparent. */
export function exactIndex(rgba: Uint8Array | Uint8ClampedArray): IndexedFrame | null {
  const map = new Map<number, number>();
  const palette: number[][] = [];
  const index = new Uint8Array(rgba.length / 4);
  let transparentIndex = -1;
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    let key: number;
    if (rgba[i + 3] < 128) key = -1;
    else key = (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
    let idx = map.get(key);
    if (idx === undefined) {
      if (palette.length >= 256) return null;
      idx = palette.length;
      map.set(key, idx);
      if (key === -1) {
        palette.push([0, 0, 0]);
        transparentIndex = idx;
      } else palette.push([(key >> 16) & 255, (key >> 8) & 255, key & 255]);
    }
    index[p] = idx;
  }
  // GIF colour tables must have a power-of-two size ≥ 2
  while (palette.length < 2) palette.push([0, 0, 0]);
  return { index, palette, transparentIndex };
}

/** Exact palette when possible, otherwise gifenc quantisation (256 colours). */
export async function indexFrame(rgba: Uint8Array | Uint8ClampedArray): Promise<IndexedFrame> {
  const exact = exactIndex(rgba);
  if (exact) return exact;
  const { quantize, applyPalette } = await import("gifenc");
  let alpha = false;
  for (let i = 3; i < rgba.length; i += 4)
    if (rgba[i] < 128) {
      alpha = true;
      break;
    }
  const format = alpha ? "rgba4444" : "rgb565";
  const palette = quantize(rgba, 256, alpha ? { format, oneBitAlpha: true, clearAlpha: true } : { format });
  const index = applyPalette(rgba, palette, format);
  return { index, palette, transparentIndex: alpha ? palette.findIndex((p) => p[3] === 0) : -1 };
}
