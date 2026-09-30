/** Collage layouts: rows of equal cells, plus their transposed (column) versions. */
import type { Rect } from "./geometry";

export interface Layout {
  id: string;
  /** Number of cells in each row (or column when `cols`). */
  lines: number[];
  cols: boolean;
}

const BASE: Record<number, number[][]> = {
  2: [[2]],
  3: [[3], [1, 2], [2, 1]],
  4: [[2, 2], [4], [1, 3], [3, 1]],
  5: [[2, 3], [3, 2], [1, 2, 2]],
  6: [[3, 3], [2, 2, 2], [1, 2, 3]],
  7: [[3, 4], [4, 3], [2, 3, 2]],
  8: [[4, 4], [3, 2, 3], [2, 2, 2, 2]],
  9: [[3, 3, 3], [2, 3, 4]],
};

/** All distinct layouts for `n` images (2–9). */
export function layoutsFor(n: number): Layout[] {
  const base = BASE[Math.max(2, Math.min(9, n))] ?? [];
  const out: Layout[] = [];
  const seen = new Set<string>();
  for (const lines of base) {
    for (const cols of [false, true]) {
      const sig = JSON.stringify(cellsOf({ id: "", lines, cols }).map((c) => [c.x, c.y, c.w, c.h].map((v) => Math.round(v * 1000))).sort());
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push({ id: `${cols ? "c" : "r"}${lines.join("-")}`, lines, cols });
    }
  }
  return out;
}

/** Normalised cells (0–1) in reading order. */
export function cellsOf(layout: Layout): Rect[] {
  const n = layout.lines.length;
  const cells: Rect[] = [];
  layout.lines.forEach((k, li) => {
    for (let i = 0; i < k; i++) {
      const a = { x: i / k, y: li / n, w: 1 / k, h: 1 / n };
      cells.push(layout.cols ? { x: a.y, y: a.x, w: a.h, h: a.w } : a);
    }
  });
  return cells;
}

/**
 * Pixel rectangles for a W×H canvas with `gap` px between cells and `pad` px
 * around. Edges are rounded so neighbouring cells never overlap.
 */
export function placeCells(layout: Layout, W: number, H: number, gap: number, pad: number): Rect[] {
  const n = layout.lines.length;
  const iw = W - 2 * pad;
  const ih = H - 2 * pad;
  const out: Rect[] = [];
  layout.lines.forEach((k, li) => {
    for (let i = 0; i < k; i++) {
      // along the line (k cells) and across lines (n lines)
      const alongLen = layout.cols ? ih : iw;
      const acrossLen = layout.cols ? iw : ih;
      const cellAlong = (alongLen - (k - 1) * gap) / k;
      const cellAcross = (acrossLen - (n - 1) * gap) / n;
      const a0 = Math.round(i * (cellAlong + gap));
      const a1 = Math.round(i * (cellAlong + gap) + cellAlong);
      const b0 = Math.round(li * (cellAcross + gap));
      const b1 = Math.round(li * (cellAcross + gap) + cellAcross);
      out.push(layout.cols ? { x: pad + b0, y: pad + a0, w: b1 - b0, h: a1 - a0 } : { x: pad + a0, y: pad + b0, w: a1 - a0, h: b1 - b0 });
    }
  });
  return out;
}
