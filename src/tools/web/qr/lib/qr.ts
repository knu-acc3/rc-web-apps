/* QR encoding and rendering helpers (browser-safe, no DOM at import time). */

import type { encode as encodeFn } from "uqr";

export type Ecc = "L" | "M" | "Q" | "H";
type QrMode = "numeric" | "alphanumeric" | "byte";

interface QrMatrix {
  version: number;
  size: number;
  data: boolean[][];
}

/** Quiet zone required by ISO/IEC 18004: 4 modules. */
export const QUIET = 4;

/** Maximum characters at version 40 for each mode and EC level. */
export const CAPACITY: Record<QrMode, Record<Ecc, number>> = {
  numeric: { L: 7089, M: 5596, Q: 3993, H: 3057 },
  alphanumeric: { L: 4296, M: 3391, Q: 2420, H: 1852 },
  byte: { L: 2953, M: 2331, Q: 1663, H: 1273 },
};

export function detectMode(text: string): QrMode {
  if (/^\d*$/.test(text)) return "numeric";
  if (/^[0-9A-Z $%*+\-./:]*$/.test(text)) return "alphanumeric";
  return "byte";
}

/** Units of the mode's capacity used by the text (bytes for byte mode). */
export function payloadUnits(text: string): number {
  return detectMode(text) === "byte" ? new TextEncoder().encode(text).length : text.length;
}

export function encodeQr(encode: typeof encodeFn, text: string, ecc: Ecc): QrMatrix | null {
  try {
    const r = encode(text, { ecc, border: 0 });
    return { version: r.version, size: r.size, data: r.data };
  } catch {
    return null;
  }
}

/** SVG path of dark modules, merging horizontal runs; coordinates include the quiet zone. */
export function modulesPath(m: QrMatrix, margin = QUIET): string {
  let d = "";
  for (let y = 0; y < m.size; y++) {
    const row = m.data[y];
    let x = 0;
    while (x < m.size) {
      if (!row[x]) {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < m.size && row[end]) end++;
      d += `M${x + margin} ${y + margin}h${end - x}v1h-${end - x}z`;
      x = end;
    }
  }
  return d;
}

interface Look {
  fg: string;
  bg: string;
  /** data: URL of a centered logo, or null. */
  logo?: string | null;
  /** Logo side as a share of the symbol side (without quiet zone), ≤ 0.2. */
  logoScale?: number;
}

/** Logo box in module units (with a one-module pad), centered, snapped to whole modules. */
export function logoBox(size: number, scale = 0.2, margin = QUIET): { x: number; y: number; side: number } {
  let side = Math.round(size * Math.min(scale, 0.2));
  if ((size - side) % 2) side += 1;
  const x = margin + (size - side) / 2;
  return { x, y: x, side };
}

export function qrSvg(m: QrMatrix, look: Look, margin = QUIET): string {
  const n = m.size + margin * 2;
  let logo = "";
  if (look.logo) {
    const b = logoBox(m.size, look.logoScale, margin);
    logo = `<rect x="${b.x}" y="${b.y}" width="${b.side}" height="${b.side}" fill="${look.bg}"/><image href="${look.logo}" x="${b.x + 0.5}" y="${b.y + 0.5}" width="${b.side - 1}" height="${b.side - 1}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="${look.bg}"/><path fill="${look.fg}" d="${modulesPath(m, margin)}"/>${logo}</svg>`;
}

/** Integer pixels per module so that the image is at most `target` px wide (≥ 1). */
export function moduleScale(size: number, target: number, margin = QUIET): number {
  return Math.max(1, Math.floor(target / (size + margin * 2)));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("image"));
    img.src = src;
  });
}

/** Render to PNG with whole-pixel modules (no blurry edges). */
export async function qrPng(m: QrMatrix, look: Look, target: number, margin = QUIET): Promise<Blob> {
  const s = moduleScale(m.size, target, margin);
  const px = (m.size + margin * 2) * s;
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = look.bg;
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = look.fg;
  for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) if (m.data[y][x]) ctx.fillRect((x + margin) * s, (y + margin) * s, s, s);
  if (look.logo) {
    const b = logoBox(m.size, look.logoScale, margin);
    ctx.fillStyle = look.bg;
    ctx.fillRect(b.x * s, b.y * s, b.side * s, b.side * s);
    const img = await loadImage(look.logo);
    const box = (b.side - 1) * s;
    const k = Math.min(box / img.width, box / img.height);
    const w = img.width * k;
    const h = img.height * k;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, (b.x + 0.5) * s + (box - w) / 2, (b.y + 0.5) * s + (box - h) / 2, w, h);
  }
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("png"))), "image/png"));
}

/* ───── colour contrast ───── */

function parseHex(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

type ContrastIssue = "invalid" | "inverted" | "low" | null;

/** Scanners expect dark modules on a light background with enough contrast (WCAG ratio ≥ 4.5). */
export function contrastCheck(fg: string, bg: string): { ratio: number; issue: ContrastIssue } {
  const a = parseHex(fg);
  const b = parseHex(bg);
  if (!a || !b) return { ratio: 0, issue: "invalid" };
  const la = luminance(a);
  const lb = luminance(b);
  const ratio = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  if (la >= lb) return { ratio, issue: "inverted" };
  if (ratio < 4.5) return { ratio, issue: "low" };
  return { ratio, issue: null };
}

/** File-name-safe slug of a payload for downloads. */
export function fileSlug(text: string, fallback = "qr-code"): string {
  const s = text
    .replace(/^[a-z]+:\/\/(www\.)?/i, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return s || fallback;
}
