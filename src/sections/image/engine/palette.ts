/** Dominant colours by median cut + colour format helpers. */

export interface PaletteColor {
  r: number;
  g: number;
  b: number;
  /** Share of (opaque, sampled) pixels, 0–1. */
  share: number;
}

interface Box {
  px: Uint8Array; // packed rgb triplets
  n: number;
}

function range(box: Box): { ch: number; span: number } {
  let rmin = 255,
    rmax = 0,
    gmin = 255,
    gmax = 0,
    bmin = 255,
    bmax = 0;
  const p = box.px;
  for (let i = 0; i < box.n * 3; i += 3) {
    const r = p[i],
      g = p[i + 1],
      b = p[i + 2];
    if (r < rmin) rmin = r;
    if (r > rmax) rmax = r;
    if (g < gmin) gmin = g;
    if (g > gmax) gmax = g;
    if (b < bmin) bmin = b;
    if (b > bmax) bmax = b;
  }
  const rs = rmax - rmin,
    gs = gmax - gmin,
    bs = bmax - bmin;
  if (gs >= rs && gs >= bs) return { ch: 1, span: gs };
  if (rs >= bs) return { ch: 0, span: rs };
  return { ch: 2, span: bs };
}

function split(box: Box, ch: number): [Box, Box] {
  // counting sort on the channel, then cut at the median
  const counts = new Uint32Array(256);
  const p = box.px;
  for (let i = ch; i < box.n * 3; i += 3) counts[p[i]]++;
  let acc = 0;
  let cut = 0;
  const half = box.n / 2;
  for (let v = 0; v < 256; v++) {
    acc += counts[v];
    if (acc >= half) {
      cut = v;
      break;
    }
  }
  const lo: number[] = [];
  const hi: number[] = [];
  // keep both halves non-empty
  let loCount = 0;
  for (let i = 0; i < box.n; i++) if (p[i * 3 + ch] <= cut) loCount++;
  const useStrict = loCount === box.n;
  for (let i = 0; i < box.n; i++) {
    const v = p[i * 3 + ch];
    const target = (useStrict ? v < cut : v <= cut) ? lo : hi;
    target.push(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
  }
  return [
    { px: Uint8Array.from(lo), n: lo.length / 3 },
    { px: Uint8Array.from(hi), n: hi.length / 3 },
  ];
}

/**
 * Median-cut palette of `count` colours from RGBA pixels. Transparent pixels
 * (alpha < 128) are ignored; large images are sampled evenly (≤ maxSamples).
 */
export function medianCut(rgba: Uint8Array | Uint8ClampedArray, count: number, maxSamples = 120_000): PaletteColor[] {
  const total = rgba.length / 4;
  const step = Math.max(1, Math.floor(total / maxSamples));
  const px: number[] = [];
  for (let i = 0; i < total; i += step) {
    const o = i * 4;
    if (rgba[o + 3] < 128) continue;
    px.push(rgba[o], rgba[o + 1], rgba[o + 2]);
  }
  if (!px.length) return [];
  let boxes: Box[] = [{ px: Uint8Array.from(px), n: px.length / 3 }];
  while (boxes.length < count) {
    // split the box with the largest (span × population)
    let best = -1;
    let bestScore = 0;
    let bestCh = 0;
    boxes.forEach((b, i) => {
      if (b.n < 2) return;
      const { ch, span } = range(b);
      const score = span * Math.sqrt(b.n);
      if (span > 0 && score > bestScore) {
        bestScore = score;
        best = i;
        bestCh = ch;
      }
    });
    if (best < 0) break;
    const [a, c] = split(boxes[best], bestCh);
    if (!a.n || !c.n) break;
    boxes = [...boxes.slice(0, best), a, c, ...boxes.slice(best + 1)];
  }
  const sampled = px.length / 3;
  const colors = boxes.map((b) => {
    let r = 0,
      g = 0,
      bl = 0;
    for (let i = 0; i < b.n * 3; i += 3) {
      r += b.px[i];
      g += b.px[i + 1];
      bl += b.px[i + 2];
    }
    return { r: Math.round(r / b.n), g: Math.round(g / b.n), b: Math.round(bl / b.n), share: b.n / sampled };
  });
  return colors.sort((a, b) => b.share - a.share);
}

/* ───────────── colour formats ───────────── */

const hex2 = (n: number) => n.toString(16).padStart(2, "0");

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`.toUpperCase();
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  h *= 60;
  return [Math.round(h) % 360, Math.round(s * 100), Math.round(l * 100)];
}

/** Parse "#abc" / "#aabbcc" (case-insensitive) → [r,g,b] or null. */
export function parseHex(input: string): [number, number, number] | null {
  const s = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(s)) return [0, 1, 2].map((i) => parseInt(s[i] + s[i], 16)) as [number, number, number];
  if (/^[0-9a-f]{6}$/i.test(s)) return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)) as [number, number, number];
  return null;
}

/** Normalise any valid HEX input to "#RRGGBB", or null. */
export function normalizeHex(input: string): string | null {
  const c = parseHex(input);
  return c ? rgbToHex(...c) : null;
}

/** WCAG relative luminance, for picking readable text on a swatch. */
export function luminance(r: number, g: number, b: number): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
