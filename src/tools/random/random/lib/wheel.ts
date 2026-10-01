/**
 * Pure geometry of the wheel of fortune.
 *
 * Conventions: angles are in degrees, clockwise, 0° = 12 o'clock (where the
 * pointer is). Sectors are laid out clockwise from 0° in the wheel's own frame.
 * A wheel rotated clockwise by R degrees shows its own angle θ = (−R) mod 360
 * under the pointer.
 */

export interface Sector {
  index: number;
  /** Start angle in the wheel frame, inclusive. */
  start: number;
  /** End angle in the wheel frame, exclusive. */
  end: number;
}

export const mod360 = (a: number) => ((a % 360) + 360) % 360;

/** Sectors proportional to weights (zero weights get empty sectors). */
export function sectorsFromWeights(weights: readonly number[]): Sector[] {
  const total = weights.reduce((s, w) => s + w, 0);
  if (!(total > 0)) throw new RangeError("sectorsFromWeights: total weight must be positive");
  const out: Sector[] = [];
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    const start = (acc / total) * 360;
    acc += weights[i];
    const end = i === weights.length - 1 ? 360 : (acc / total) * 360;
    out.push({ index: i, start, end });
  }
  return out;
}

/** Wheel-frame angle that sits under the pointer for a given rotation. */
export function angleUnderPointer(rotation: number): number {
  return mod360(-rotation);
}

/** Index of the sector under the pointer for a given rotation. */
export function winnerAt(sectors: readonly Sector[], rotation: number): number {
  const a = angleUnderPointer(rotation);
  for (const s of sectors) if (s.end > s.start && a >= s.start && a < s.end) return s.index;
  // a can only fall outside through rounding at 360 → wraps to the first non-empty sector
  return sectors.find((s) => s.end > s.start)?.index ?? 0;
}

/** Margin (degrees) kept from each sector edge so the pointer never lands on a border. */
export function sectorMargin(width: number): number {
  return Math.min(2, width * 0.15);
}

/**
 * Final rotation that puts the pointer inside `sector` at relative position `u`
 * ∈ [0, 1) of the usable (margin-trimmed) arc, after `turns` extra full turns.
 * The result is always > `current` (the wheel only spins forward).
 */
export function targetRotation(current: number, sector: Sector, u: number, turns: number): number {
  const width = sector.end - sector.start;
  const margin = sectorMargin(width);
  const theta = sector.start + margin + u * (width - 2 * margin);
  const wanted = mod360(360 - theta); // rotation (mod 360) that shows θ under the pointer
  const delta = mod360(wanted - mod360(current));
  return current + turns * 360 + delta;
}

/** Ease-out (quartic) for the spin animation: fast start, long gentle stop. */
export function easeOutQuart(t: number): number {
  const x = 1 - Math.min(1, Math.max(0, t));
  return 1 - x * x * x * x;
}

/* ───────────── label colour: pick black or white by WCAG contrast ───────────── */

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a #rgb / #rrggbb colour. */
export function relativeLuminance(hex: string): number {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return 0;
  const n = parseInt(h, 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(l1: number, l2: number): number {
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

/** "#000000" or "#ffffff", whichever has the higher WCAG contrast with `bg`. */
export function readableTextColor(bg: string): "#000000" | "#ffffff" {
  const l = relativeLuminance(bg);
  return contrastRatio(l, 1) >= contrastRatio(l, 0) ? "#ffffff" : "#000000";
}

/** Default slice palette (preview colours, not theme tokens). */
export const WHEEL_PALETTE = [
  "#e8544e",
  "#f28c28",
  "#f6c33b",
  "#5cb85c",
  "#1fa99a",
  "#3b8fd9",
  "#5b5fd6",
  "#9b59c9",
  "#d94f9b",
  "#8d6e63",
  "#2e7d32",
  "#546e7a",
] as const;

/** Palette colour for slot i that never matches its neighbour or (on wrap) the first slice. */
export function paletteColor(i: number, count: number): string {
  const n = WHEEL_PALETTE.length;
  let c = i % n;
  // With count ≡ 1 (mod n) the last slice would touch the first one in the same colour.
  if (i === count - 1 && count > 1 && c === 0) c = Math.floor(n / 2);
  return WHEEL_PALETTE[c];
}
