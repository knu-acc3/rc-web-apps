import { describe, expect, it } from "vitest";
import { moveItem, shiftSelected, toggleSelection } from "@/tools/files/pdf/lib/order";
import { MAX_CANVAS_SIDE, PREVIEW_MAX_PIXELS, THUMB_MAX_PIXELS, fitScale, fitWidth, nextRequest, previewDpr } from "@/tools/files/pdf/lib/render-math";

const A4 = [595.28, 841.89] as const;
const pixels = (w: number, h: number, s: number) => Math.floor(w * s) * Math.floor(h * s);

describe("previewDpr", () => {
  it("never goes above 2 or below 1", () => {
    expect(previewDpr(2.625)).toBe(2);
    expect(previewDpr(3)).toBe(2);
    expect(previewDpr(1.5)).toBe(1.5);
    expect(previewDpr(undefined)).toBe(1);
    expect(previewDpr(0)).toBe(1);
  });
});

describe("fitScale", () => {
  it("renders an A4 page on a Pixel 7 at 2× its CSS width", () => {
    const s = fitScale(A4[0], A4[1], 380, 2.625);
    expect(Math.round(A4[0] * s)).toBe(760);
    expect(pixels(A4[0], A4[1], s)).toBeLessThan(PREVIEW_MAX_PIXELS);
  });

  it("caps the main preview at the pixel budget on big screens", () => {
    const s = fitScale(A4[0], A4[1], 1400, 2);
    expect(pixels(A4[0], A4[1], s)).toBeLessThanOrEqual(PREVIEW_MAX_PIXELS);
    expect(pixels(A4[0], A4[1], s)).toBeGreaterThan(PREVIEW_MAX_PIXELS * 0.95);
  });

  it("caps the longest side of very long pages", () => {
    const s = fitScale(600, 20000, 600, 2);
    expect(20000 * s).toBeLessThanOrEqual(MAX_CANVAS_SIDE);
  });

  it("keeps thumbnails small", () => {
    const s = fitScale(A4[0], A4[1], 160, 2, THUMB_MAX_PIXELS);
    expect(pixels(A4[0], A4[1], s)).toBeLessThanOrEqual(THUMB_MAX_PIXELS);
  });

  it("survives empty sizes", () => {
    expect(fitScale(0, 100, 300, 2)).toBe(1);
    expect(fitScale(100, 100, 0, 2)).toBe(1);
  });
});

describe("fitWidth", () => {
  it("fits a portrait page into a short box by height", () => {
    expect(Math.round(fitWidth(A4[0], A4[1], 1000, 707))).toBe(500);
    expect(fitWidth(A4[0], A4[1], 300)).toBe(300);
  });
});

describe("nextRequest", () => {
  it("draws visible pages first, the latest batch first, lowest page first", () => {
    const q = [
      { index: 5, visible: false, batch: 3 },
      { index: 2, visible: true, batch: 1 },
      { index: 1, visible: true, batch: 1 },
      { index: 9, visible: true, batch: 2 },
      { index: 8, visible: true, batch: 2 },
    ];
    expect(q[nextRequest(q)].index).toBe(8);
    const rest = q.filter((x) => x.batch !== 2);
    expect(rest[nextRequest(rest)].index).toBe(1);
    expect(nextRequest([])).toBe(-1);
  });
});

describe("page order helpers", () => {
  const items = ["a", "b", "c", "d"].map((key) => ({ key }));
  const keys = (l: readonly { key: string }[]) => l.map((x) => x.key).join("");

  it("moves one item", () => {
    expect(keys(moveItem(items, 0, 2))).toBe("bcad");
  });

  it("shifts a selected block together and stops at the edges", () => {
    expect(keys(shiftSelected(items, new Set(["b", "c"]), -1))).toBe("bcad");
    expect(keys(shiftSelected(items, new Set(["b", "c"]), 1))).toBe("adbc");
    expect(shiftSelected(items, new Set(["a"]), -1)).toBe(items);
    expect(keys(shiftSelected(items, new Set(["a", "c"]), -1))).toBe("acbd");
  });

  it("selects ranges with Shift", () => {
    const anchor = { current: null as string | null };
    let sel = toggleSelection(new Set(), ["a", "b", "c", "d"], "b", false, anchor);
    sel = toggleSelection(sel, ["a", "b", "c", "d"], "d", true, anchor);
    expect([...sel].sort().join("")).toBe("bcd");
  });
});
