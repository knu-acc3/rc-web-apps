/**
 * Splitting a file into parts and joining parts back. Pure, unit-tested.
 * Naming follows 7-Zip: "video.mp4.001", "video.mp4.002", …
 */

/** Sizes of the parts: either `count` equal parts or parts of `size` bytes. */
export function partSizes(total: number, by: { count: number } | { size: number }): number[] {
  if (total <= 0) return [];
  if ("count" in by) {
    const n = Math.max(1, Math.min(Math.floor(by.count), total));
    const base = Math.floor(total / n);
    const rest = total - base * n;
    return Array.from({ length: n }, (_, i) => base + (i < rest ? 1 : 0));
  }
  const s = Math.max(1, Math.floor(by.size));
  const n = Math.ceil(total / s);
  return Array.from({ length: n }, (_, i) => (i < n - 1 ? s : total - s * (n - 1)));
}

/** "name.ext.001" — at least three digits, more when there are over 999 parts. */
export function partName(name: string, index: number, count: number): string {
  const digits = Math.max(3, String(count).length);
  return `${name}.${String(index + 1).padStart(digits, "0")}`;
}

export interface ParsedPart {
  base: string;
  index: number;
}

/** Recognise part names: "a.zip.001", "a.part3", "a.part03.rar", "a.z01"… Returns null otherwise. */
export function parsePart(name: string): ParsedPart | null {
  let m = /^(.+)\.(\d{3,})$/.exec(name);
  if (m) return { base: m[1], index: Number(m[2]) };
  m = /^(.+?)\.part0*(\d+)(\.[^.]+)?$/i.exec(name);
  if (m) return { base: m[1] + (m[3] ?? ""), index: Number(m[2]) };
  m = /^(.+)[_-]0*(\d+)$/.exec(name);
  if (m) return { base: m[1], index: Number(m[2]) };
  return null;
}

export interface JoinPlan {
  /** Indices into the input list in joining order. */
  order: number[];
  /** Output file name. */
  base: string;
  /** Part numbers that are missing between the first and the last. */
  missing: number[];
  /** Several different base names in the list. */
  mixed: boolean;
  /** Some names were not recognised as parts (kept in input order at the end). */
  unknown: number[];
  duplicates: number[];
}

export function planJoin(names: string[]): JoinPlan {
  const parsed = names.map((n) => parsePart(n));
  const known = parsed.map((p, i) => ({ p, i })).filter((x): x is { p: ParsedPart; i: number } => !!x.p);
  const unknown = parsed.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0);
  known.sort((a, b) => a.p.index - b.p.index || a.i - b.i);
  const bases = new Set(known.map((k) => k.p.base));
  const nums = known.map((k) => k.p.index);
  const missing: number[] = [];
  const duplicates: number[] = [];
  if (nums.length) {
    const have = new Set<number>();
    for (const n of nums) {
      if (have.has(n)) duplicates.push(n);
      have.add(n);
    }
    for (let n = Math.min(...nums); n <= Math.max(...nums); n++) if (!have.has(n)) missing.push(n);
    if (Math.min(...nums) > 1) for (let n = 1; n < Math.min(...nums); n++) missing.unshift(n);
  }
  return {
    order: [...known.map((k) => k.i), ...unknown],
    base: known[0]?.p.base ?? names[0] ?? "joined.bin",
    missing: [...new Set(missing)].sort((a, b) => a - b),
    mixed: bases.size > 1,
    unknown,
    duplicates,
  };
}
