/**
 * Minimal, complete GIF decoder: LZW, interlacing, local/global palettes,
 * transparency and frame disposal (compositing like browsers do).
 */

interface GifHeader {
  width: number;
  height: number;
  /** 0 = forever, null = play once (no NETSCAPE extension) */
  loop: number | null;
}

interface RawFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  palette: Uint8Array;
  transparent: number;
  delay: number;
  disposal: number;
  interlaced: boolean;
  minCode: number;
  /** data sub-blocks concatenated */
  data: Uint8Array;
}

interface GifFrameOut {
  index: number;
  /** Full-canvas RGBA after compositing (width × height × 4). */
  rgba: Uint8ClampedArray<ArrayBuffer>;
  /** Delay stored in the file, ms. */
  delay: number;
  /** Delay browsers actually use (≤ 10 ms is played as 100 ms). */
  shownDelay: number;
}

export const shownDelay = (ms: number) => (ms <= 10 ? 100 : ms);

function readSubBlocks(b: Uint8Array, p: number): { data: Uint8Array; end: number } {
  let total = 0;
  let q = p;
  while (q < b.length && b[q] !== 0) {
    total += b[q];
    q += b[q] + 1;
  }
  const data = new Uint8Array(total);
  let o = 0;
  q = p;
  while (q < b.length && b[q] !== 0) {
    const n = b[q];
    data.set(b.subarray(q + 1, Math.min(b.length, q + 1 + n)), o);
    o += n;
    q += n + 1;
  }
  return { data, end: q + 1 };
}

/** Parse the GIF block structure (no pixel decoding yet). */
export function parseGif(b: Uint8Array): { header: GifHeader; frames: RawFrame[] } {
  const sig = String.fromCharCode(...b.subarray(0, 6));
  if (sig !== "GIF87a" && sig !== "GIF89a") throw new Error("Not a GIF file");
  const width = b[6] | (b[7] << 8);
  const height = b[8] | (b[9] << 8);
  const flags = b[10];
  let p = 13;
  let global = new Uint8Array(0);
  if (flags & 0x80) {
    const n = 3 * (1 << ((flags & 7) + 1));
    global = b.slice(p, p + n);
    p += n;
  }
  let loop: number | null = null;
  const frames: RawFrame[] = [];
  let gce = { transparent: -1, delay: 0, disposal: 0 };
  while (p < b.length) {
    const block = b[p++];
    if (block === 0x3b) break;
    if (block === 0x21) {
      const label = b[p++];
      if (label === 0xf9 && b[p] >= 4) {
        const f = b[p + 1];
        gce = {
          disposal: (f >> 2) & 7,
          transparent: f & 1 ? b[p + 4] : -1,
          delay: (b[p + 2] | (b[p + 3] << 8)) * 10,
        };
      } else if (label === 0xff && b[p] === 11) {
        const id = String.fromCharCode(...b.subarray(p + 1, p + 12));
        if ((id === "NETSCAPE2.0" || id === "ANIMEXTS1.0") && b[p + 12] >= 3 && b[p + 13] === 1) loop = b[p + 14] | (b[p + 15] << 8);
      }
      p = readSubBlocks(b, p).end;
    } else if (block === 0x2c) {
      const x = b[p] | (b[p + 1] << 8);
      const y = b[p + 2] | (b[p + 3] << 8);
      const w = b[p + 4] | (b[p + 5] << 8);
      const h = b[p + 6] | (b[p + 7] << 8);
      const f = b[p + 8];
      p += 9;
      let palette = global;
      if (f & 0x80) {
        const n = 3 * (1 << ((f & 7) + 1));
        palette = b.slice(p, p + n);
        p += n;
      }
      const minCode = b[p++];
      const { data, end } = readSubBlocks(b, p);
      p = end;
      frames.push({ x, y, w, h, palette, interlaced: !!(f & 0x40), minCode, data, ...gce });
      gce = { transparent: -1, delay: 0, disposal: 0 };
    } else break; // unknown block: stop (truncated/corrupt file)
  }
  return { header: { width, height, loop }, frames };
}

/** GIF LZW decoder → palette indices (w×h), tolerant to truncated data. */
export function lzwDecode(minCode: number, data: Uint8Array, pixels: number): Uint8Array {
  const out = new Uint8Array(pixels);
  const clear = 1 << minCode;
  const eoi = clear + 1;
  const prefix = new Int16Array(4096);
  const suffix = new Uint8Array(4096);
  const stack = new Uint8Array(4097);
  let codeSize = minCode + 1;
  let codeMask = (1 << codeSize) - 1;
  let avail = clear + 2;
  let old = -1;
  let first = 0;
  let datum = 0;
  let bits = 0;
  let op = 0;
  for (let i = 0; i < clear; i++) {
    prefix[i] = -1;
    suffix[i] = i;
  }
  let dp = 0;
  while (op < pixels) {
    while (bits < codeSize) {
      if (dp >= data.length) return out;
      datum |= data[dp++] << bits;
      bits += 8;
    }
    const code = datum & codeMask;
    datum >>= codeSize;
    bits -= codeSize;
    if (code === clear) {
      codeSize = minCode + 1;
      codeMask = (1 << codeSize) - 1;
      avail = clear + 2;
      old = -1;
      continue;
    }
    if (code === eoi) break;
    if (old === -1) {
      out[op++] = suffix[code];
      old = code;
      first = code;
      continue;
    }
    let sp = 0;
    let c = code;
    if (code >= avail) {
      stack[sp++] = first;
      c = old;
    }
    while (c >= clear) {
      stack[sp++] = suffix[c];
      c = prefix[c];
      if (sp > 4096) return out; // corrupt
    }
    first = suffix[c];
    stack[sp++] = first;
    if (avail < 4096) {
      prefix[avail] = old;
      suffix[avail] = first;
      avail++;
      if ((avail & codeMask) === 0 && avail < 4096) {
        codeSize++;
        codeMask = (1 << codeSize) - 1;
      }
    }
    old = code;
    while (sp > 0 && op < pixels) out[op++] = stack[--sp];
  }
  return out;
}

function deinterlace(src: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(src.length);
  let row = 0;
  const passes: [number, number][] = [
    [0, 8],
    [4, 8],
    [2, 4],
    [1, 2],
  ];
  for (const [start, step] of passes) {
    for (let y = start; y < h; y += step) {
      out.set(src.subarray(row * w, row * w + w), y * w);
      row++;
    }
  }
  return out;
}

/**
 * Decode all frames, composited onto the logical screen exactly like
 * browsers (disposal 2 clears to transparent, 3 restores the previous state).
 */
export function* decodeGifFrames(b: Uint8Array): Generator<GifFrameOut, void, unknown> {
  const { header, frames } = parseGif(b);
  const W = header.width;
  const H = header.height;
  const canvas = new Uint8ClampedArray(W * H * 4);
  let prevDisposal = 0;
  let prevRect: RawFrame | null = null;
  let saved: Uint8ClampedArray | null = null;
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    // dispose the previous frame
    if (prevRect && prevDisposal === 2) {
      for (let y = Math.max(0, prevRect.y); y < Math.min(H, prevRect.y + prevRect.h); y++) {
        canvas.fill(0, (y * W + Math.max(0, prevRect.x)) * 4, (y * W + Math.min(W, prevRect.x + prevRect.w)) * 4);
      }
    } else if (prevDisposal === 3 && saved) {
      canvas.set(saved);
    }
    saved = f.disposal === 3 ? canvas.slice() : null;
    let idx = lzwDecode(f.minCode, f.data, f.w * f.h);
    if (f.interlaced) idx = deinterlace(idx, f.w, f.h);
    const pal = f.palette;
    const nColors = pal.length / 3;
    for (let y = 0; y < f.h; y++) {
      const cy = f.y + y;
      if (cy < 0 || cy >= H) continue;
      for (let x = 0; x < f.w; x++) {
        const cx = f.x + x;
        if (cx < 0 || cx >= W) continue;
        const ci = idx[y * f.w + x];
        if (ci === f.transparent || ci >= nColors) continue;
        const o = (cy * W + cx) * 4;
        canvas[o] = pal[ci * 3];
        canvas[o + 1] = pal[ci * 3 + 1];
        canvas[o + 2] = pal[ci * 3 + 2];
        canvas[o + 3] = 255;
      }
    }
    yield { index: i, rgba: canvas.slice(), delay: f.delay, shownDelay: shownDelay(f.delay) };
    prevDisposal = f.disposal;
    prevRect = f;
  }
}

/** Header + per-frame delays without decoding pixels. */
export function gifInfo(b: Uint8Array): GifHeader & { frames: number; delays: number[]; duration: number } {
  const { header, frames } = parseGif(b);
  const delays = frames.map((f) => f.delay);
  return { ...header, frames: frames.length, delays, duration: delays.reduce((s, d) => s + shownDelay(d), 0) };
}
