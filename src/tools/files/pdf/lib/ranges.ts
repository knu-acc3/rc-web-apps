/**
 * The ONE page-range parser of the PDF section.
 *
 * Syntax (1-based page numbers, case/whitespace-insensitive):
 *   "5"        a single page
 *   "1-3"      an inclusive range
 *   "8-"       from page 8 to the last page
 *   "-3"       from the first page to page 3
 *   "5-1"      a descending range (pages 5, 4, 3, 2, 1) — order is preserved
 *   "1-3, 5; 8-"   parts separated by commas, semicolons or whitespace
 * En/em dashes and the minus sign are accepted as range separators.
 *
 * The order of parts is kept and duplicates are allowed, so "3, 1-2, 3"
 * yields [3, 1, 2, 3]. Callers that need a set use `uniqueSorted()`.
 * Pages outside 1…pageCount are an error (never silently dropped).
 */

export interface RangeSegment {
  /** First page of the segment (1-based). */
  start: number;
  /** Last page of the segment (1-based, may be < start for descending ranges). */
  end: number;
  /** Source text of the segment. */
  token: string;
}

export type RangeErrorCode = "empty" | "syntax" | "zero" | "out-of-range";

export interface RangeError {
  code: RangeErrorCode;
  /** The offending part of the input ("" for `empty`). */
  token: string;
}

export type RangeResult =
  | { ok: true; segments: RangeSegment[]; pages: number[] }
  | { ok: false; error: RangeError };

const DASHES = /[‐-―−﹘﹣－]/g;

export function parsePageRanges(input: string, pageCount: number): RangeResult {
  const text = input.replace(DASHES, "-").trim();
  if (!text) return { ok: false, error: { code: "empty", token: "" } };

  // Tokenize: numbers, "-", separators. Whitespace around "-" belongs to the range.
  const parts = text
    .replace(/\s*-\s*/g, "-")
    .split(/[\s,;]+/)
    .filter(Boolean);
  if (!parts.length) return { ok: false, error: { code: "empty", token: "" } };

  const segments: RangeSegment[] = [];
  for (const part of parts) {
    let m: RegExpMatchArray | null;
    let start: number;
    let end: number;
    if ((m = part.match(/^(\d+)$/))) {
      start = end = Number(m[1]);
    } else if ((m = part.match(/^(\d*)-(\d*)$/)) && (m[1] || m[2])) {
      start = m[1] ? Number(m[1]) : 1;
      end = m[2] ? Number(m[2]) : pageCount;
    } else {
      return { ok: false, error: { code: "syntax", token: part } };
    }
    if (start === 0 || end === 0) return { ok: false, error: { code: "zero", token: part } };
    if (start > pageCount || end > pageCount) return { ok: false, error: { code: "out-of-range", token: part } };
    segments.push({ start, end, token: part });
  }

  const pages: number[] = [];
  for (const s of segments) {
    const step = s.end >= s.start ? 1 : -1;
    for (let p = s.start; p !== s.end + step; p += step) pages.push(p);
  }
  return { ok: true, segments, pages };
}

/** Pages of each segment as separate groups ("1-3, 5" → [[1,2,3],[5]]) — used by split-by-ranges. */
export function segmentPages(seg: RangeSegment): number[] {
  const out: number[] = [];
  const step = seg.end >= seg.start ? 1 : -1;
  for (let p = seg.start; p !== seg.end + step; p += step) out.push(p);
  return out;
}

export function uniqueSorted(pages: readonly number[]): number[] {
  return [...new Set(pages)].sort((a, b) => a - b);
}

/** Compact a page list into range syntax: [1,2,3,5,8,9] → "1-3, 5, 8-9". Order is kept. */
export function formatPageRanges(pages: readonly number[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < pages.length) {
    let j = i;
    while (j + 1 < pages.length && pages[j + 1] === pages[j] + 1) j++;
    out.push(j > i ? `${pages[i]}-${pages[j]}` : String(pages[i]));
    i = j + 1;
  }
  return out.join(", ");
}

/** Consecutive chunks of `size` pages: (7, 3) → [[1,2,3],[4,5,6],[7]]. */
export function chunkPages(pageCount: number, size: number): number[][] {
  const n = Math.max(1, Math.floor(size));
  const out: number[][] = [];
  for (let s = 1; s <= pageCount; s += n) {
    const g: number[] = [];
    for (let p = s; p < s + n && p <= pageCount; p++) g.push(p);
    out.push(g);
  }
  return out;
}

export function oddPages(pageCount: number): number[] {
  const out: number[] = [];
  for (let p = 1; p <= pageCount; p += 2) out.push(p);
  return out;
}

export function evenPages(pageCount: number): number[] {
  const out: number[] = [];
  for (let p = 2; p <= pageCount; p += 2) out.push(p);
  return out;
}
