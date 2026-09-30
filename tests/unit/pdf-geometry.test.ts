import { describe, expect, it } from "vitest";
import {
  PAPER,
  anchorPosition,
  apply,
  compose,
  imageLayout,
  imageMatrix,
  invert,
  mmToPt,
  nupCells,
  nupGrid,
  placePageMatrix,
  pxToPt,
  visualToPage,
  type Matrix,
} from "@/sections/pdf/engine/geometry";
import { readJpegInfo, readPngInfo, sniffImage } from "@/sections/pdf/engine/image-info";

const A4 = PAPER.a4;
const close = (a: number, b: number, eps = 0.01) => Math.abs(a - b) < eps;
const pt = (m: Matrix, x: number, y: number) => apply(m, x, y).map((v) => Math.round(v * 100) / 100);

describe("matrices", () => {
  it("composes in application order and inverts", () => {
    const t: Matrix = [1, 0, 0, 1, 10, 20];
    const s: Matrix = [2, 0, 0, 2, 0, 0];
    expect(apply(compose(t, s), 1, 1)).toEqual([22, 42]); // translate, then scale
    expect(apply(compose(s, t), 1, 1)).toEqual([12, 22]); // scale, then translate
    const m: Matrix = [0, -1, 1, 0, 5, 7];
    const back = apply(invert(m), ...apply(m, 3, 4));
    expect(back[0]).toBeCloseTo(3);
    expect(back[1]).toBeCloseTo(4);
  });

  it("maps visual coordinates to user space for every /Rotate and a CropBox offset", () => {
    const crop = { x: 10, y: 20, width: 600, height: 800 };
    // No rotation: visual (0,0) is the crop's lower-left corner.
    expect(pt(visualToPage(crop, 0), 0, 0)).toEqual([10, 20]);
    // /Rotate 90 (clockwise): shown 800 wide × 600 high. Turning a sheet clockwise moves
    // bottom-right → bottom-left, top-right → bottom-right, top-left → top-right, bottom-left → top-left.
    const r90 = visualToPage(crop, 90);
    expect(pt(r90, 0, 0)).toEqual([610, 20]);
    expect(pt(r90, 800, 0)).toEqual([610, 820]);
    expect(pt(r90, 800, 600)).toEqual([10, 820]);
    expect(pt(r90, 0, 600)).toEqual([10, 20]);
    const r180 = visualToPage(crop, 180);
    expect(pt(r180, 0, 0)).toEqual([610, 820]);
    // /Rotate 270: counter-clockwise, top-left → bottom-left.
    const r270 = visualToPage(crop, 270);
    expect(pt(r270, 0, 0)).toEqual([10, 820]);
    expect(pt(r270, 0, 600)).toEqual([610, 820]);
    expect(pt(r270, 800, 0)).toEqual([10, 20]);
  });

  it("places a rotated embedded page inside its target box", () => {
    // A 600×800 page with /Rotate 90 drawn at (50, 60) with scale 0.5 → occupies 400×300.
    const m = placePageMatrix(600, 800, 90, 50, 60, 0.5);
    const corners = [
      [0, 0],
      [600, 0],
      [0, 800],
      [600, 800],
    ].map(([x, y]) => apply(m, x, y));
    const xs = corners.map((c) => c[0]);
    const ys = corners.map((c) => c[1]);
    expect(Math.min(...xs)).toBeCloseTo(50);
    expect(Math.max(...xs)).toBeCloseTo(450);
    expect(Math.min(...ys)).toBeCloseTo(60);
    expect(Math.max(...ys)).toBeCloseTo(360);
    // Top-left of the page content ends up at the top-right after a clockwise turn.
    expect(apply(m, 0, 800)).toEqual([450, 360]);
  });
});

describe("n-up layout", () => {
  const page = { width: A4[0], height: A4[1] };

  it("chooses the classic sheet orientation for 2, 4, 6 and 9 A4 pages", () => {
    expect(nupGrid({ n: 2, sheet: A4, page })).toMatchObject({ cols: 2, rows: 1, sheetWidth: A4[1], sheetHeight: A4[0] });
    expect(nupGrid({ n: 4, sheet: A4, page })).toMatchObject({ cols: 2, rows: 2, sheetWidth: A4[0], sheetHeight: A4[1] });
    expect(nupGrid({ n: 6, sheet: A4, page })).toMatchObject({ cols: 3, rows: 2, sheetWidth: A4[1], sheetHeight: A4[0] });
    expect(nupGrid({ n: 9, sheet: A4, page })).toMatchObject({ cols: 3, rows: 3, sheetWidth: A4[0], sheetHeight: A4[1] });
  });

  it("computes the known scale factors (A-series halves scale by 1/√2)", () => {
    expect(nupGrid({ n: 2, sheet: A4, page }).scale).toBeCloseTo(Math.SQRT1_2, 3);
    expect(nupGrid({ n: 4, sheet: A4, page }).scale).toBeCloseTo(0.5, 3);
    expect(nupGrid({ n: 9, sheet: A4, page }).scale).toBeCloseTo(1 / 3, 3);
  });

  it("respects a forced orientation", () => {
    const g = nupGrid({ n: 2, sheet: A4, page, orientation: "portrait" });
    expect(g.sheetWidth).toBeLessThan(g.sheetHeight);
    expect(g.cols * g.rows).toBe(2);
  });

  it("lays cells out left→right, top→bottom inside the margins", () => {
    const grid = nupGrid({ n: 4, sheet: A4, page, margin: 20, gap: 10 });
    const cells = nupCells(grid, 20, 10);
    expect(cells).toHaveLength(4);
    const w = (A4[0] - 40 - 10) / 2;
    const h = (A4[1] - 40 - 10) / 2;
    expect(cells[0].x).toBeCloseTo(20);
    expect(cells[0].y).toBeCloseTo(A4[1] - 20 - h);
    expect(cells[1].x).toBeCloseTo(20 + w + 10);
    expect(cells[2].y).toBeCloseTo(20);
    for (const c of cells) {
      expect(c.width).toBeCloseTo(w);
      expect(c.height).toBeCloseTo(h);
    }
  });

  it("supports column order (N-shape)", () => {
    const grid = nupGrid({ n: 6, sheet: A4, page });
    const cells = nupCells(grid, 0, 0, "columns");
    expect(cells[1].x).toBeCloseTo(cells[0].x); // second page below the first
    expect(cells[1].y).toBeLessThan(cells[0].y);
  });
});

describe("image → page size", () => {
  it("converts pixels to points by DPI, defaulting to 96", () => {
    expect(pxToPt(96, 96)).toBe(72);
    expect(pxToPt(300, 300)).toBe(72);
    expect(pxToPt(96, 0)).toBe(72); // invalid → 96 DPI
    expect(mmToPt(25.4)).toBeCloseTo(72);
  });

  it("keeps the physical size for fit-to-image pages (3000 px at 300 DPI = 10 in)", () => {
    const l = imageLayout({ pxWidth: 3000, pxHeight: 2400, dpiX: 300, dpiY: 300, page: "fit-image" });
    expect(l.pageWidth).toBeCloseTo(720);
    expect(l.pageHeight).toBeCloseTo(576);
    expect(l).toMatchObject({ x: 0, y: 0 });
  });

  it("adds margins around fit-to-image pages", () => {
    const l = imageLayout({ pxWidth: 960, pxHeight: 480, page: "fit-image", margin: 36 });
    expect(l.width).toBeCloseTo(720);
    expect(l.pageWidth).toBeCloseTo(792);
    expect(l.pageHeight).toBeCloseTo(360 + 72);
    expect(l.x).toBe(36);
  });

  it("never exceeds the 200-inch PDF page limit", () => {
    const l = imageLayout({ pxWidth: 40000, pxHeight: 20000, dpiX: 72, dpiY: 72, page: "fit-image" });
    expect(l.pageWidth).toBeLessThanOrEqual(14400);
  });

  it("fits a big photo on A4 inside the margins instead of making a 55-inch page", () => {
    const margin = mmToPt(10);
    const l = imageLayout({ pxWidth: 4000, pxHeight: 3000, dpiX: 72, dpiY: 72, page: "a4", margin });
    // Landscape photo → landscape A4 (auto orientation).
    expect(l.pageWidth).toBeCloseTo(A4[1]);
    expect(l.pageHeight).toBeCloseTo(A4[0]);
    expect(l.x).toBeGreaterThanOrEqual(margin - 1e-6);
    expect(l.y).toBeGreaterThanOrEqual(margin - 1e-6);
    expect(l.x + l.width).toBeLessThanOrEqual(l.pageWidth - margin + 1e-6);
    expect(l.y + l.height).toBeLessThanOrEqual(l.pageHeight - margin + 1e-6);
    expect(l.width / l.height).toBeCloseTo(4 / 3);
  });

  it("does not upscale in original-size mode", () => {
    const l = imageLayout({ pxWidth: 96, pxHeight: 96, page: "a4", scaleMode: "original" });
    expect(l.width).toBeCloseTo(72);
    expect(close(l.x + l.width / 2, A4[0] / 2)).toBe(true);
  });

  it("swaps width and height for EXIF orientations 5–8", () => {
    const l = imageLayout({ pxWidth: 4000, pxHeight: 3000, orientation: 6, page: "a4" });
    expect(l.pageWidth).toBeCloseTo(A4[0]); // portrait: the photo is upright after rotation
    expect(l.height / l.width).toBeCloseTo(4 / 3);
  });

  it("draws the image upright for every EXIF orientation", () => {
    // Stored top-left pixel (unit square (0,1)) must land at the displayed position given by EXIF.
    const topLeft = (o: number) => apply(imageMatrix(o, 0, 0, 10, 10), 0, 1).map(Math.round);
    expect(topLeft(1)).toEqual([0, 10]);
    expect(topLeft(2)).toEqual([10, 10]);
    expect(topLeft(3)).toEqual([10, 0]);
    expect(topLeft(4)).toEqual([0, 0]);
    expect(topLeft(5)).toEqual([0, 10]);
    expect(topLeft(6)).toEqual([10, 10]);
    expect(topLeft(7)).toEqual([10, 0]);
    expect(topLeft(8)).toEqual([0, 0]);
  });
});

describe("anchor positions", () => {
  it("positions items inside the page with margins", () => {
    expect(anchorPosition("bottom-center", 600, 800, 100, 20, 30)).toEqual({ x: 250, y: 30 });
    expect(anchorPosition("top-right", 600, 800, 100, 20, 30)).toEqual({ x: 470, y: 750 });
    expect(anchorPosition("center", 600, 800, 100, 20, 30)).toEqual({ x: 250, y: 390 });
    expect(anchorPosition("middle-left", 600, 800, 100, 20, 30)).toEqual({ x: 30, y: 390 });
  });
});

/* ───────────── header readers ───────────── */

function jpegBytes(opts: { w: number; h: number; jfifDpi?: number; exif?: { orientation?: number; xres?: number } }): Uint8Array {
  const parts: number[] = [0xff, 0xd8];
  if (opts.jfifDpi) parts.push(0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 1, opts.jfifDpi >> 8, opts.jfifDpi & 255, opts.jfifDpi >> 8, opts.jfifDpi & 255, 0, 0);
  if (opts.exif) {
    // Big-endian TIFF with 2 IFD entries: orientation and XResolution (rational at offset 38).
    const tiff = [0x4d, 0x4d, 0, 42, 0, 0, 0, 8, 0, 2];
    tiff.push(0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, opts.exif.orientation ?? 1, 0, 0);
    tiff.push(0x01, 0x1a, 0, 5, 0, 0, 0, 1, 0, 0, 0, 38);
    tiff.push(0, 0, 0, 0); // next IFD
    const x = opts.exif.xres ?? 72;
    tiff.push(0, 0, x >> 8, x & 255, 0, 0, 0, 1);
    const seg = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
    parts.push(0xff, 0xe1, (seg.length + 2) >> 8, (seg.length + 2) & 255, ...seg);
  }
  parts.push(0xff, 0xc0, 0, 17, 8, opts.h >> 8, opts.h & 255, opts.w >> 8, opts.w & 255, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1);
  parts.push(0xff, 0xd9);
  return new Uint8Array(parts);
}

function pngBytes(w: number, h: number, ppm?: number): Uint8Array {
  const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const chunk = (type: string, data: number[]) => [...u32(data.length), ...[...type].map((c) => c.charCodeAt(0)), ...data, 0, 0, 0, 0];
  const out = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  out.push(...chunk("IHDR", [...u32(w), ...u32(h), 8, 6, 0, 0, 0]));
  if (ppm) out.push(...chunk("pHYs", [...u32(ppm), ...u32(ppm), 1]));
  out.push(...chunk("IEND", []));
  return new Uint8Array(out);
}

describe("image headers", () => {
  it("reads JPEG size and JFIF density", () => {
    const info = readJpegInfo(jpegBytes({ w: 4000, h: 3000, jfifDpi: 300 }));
    expect(info).toMatchObject({ width: 4000, height: 3000, dpiX: 300, dpiY: 300, orientation: 1, components: 3 });
  });

  it("reads EXIF orientation and resolution", () => {
    const info = readJpegInfo(jpegBytes({ w: 640, h: 480, exif: { orientation: 6, xres: 150 } }));
    expect(info).toMatchObject({ width: 640, height: 480, orientation: 6, dpiX: 150 });
  });

  it("reads PNG size and pHYs (3780 px/m ≈ 96 DPI)", () => {
    const info = readPngInfo(pngBytes(800, 600, 3780));
    expect(info?.width).toBe(800);
    expect(info?.height).toBe(600);
    expect(info?.dpiX).toBeCloseTo(96, 0);
    expect(info?.alpha).toBe(true);
    expect(readPngInfo(pngBytes(10, 10))?.dpiX).toBeNull();
  });

  it("sniffs formats", () => {
    expect(sniffImage(jpegBytes({ w: 1, h: 1 }))).toBe("jpeg");
    expect(sniffImage(pngBytes(1, 1))).toBe("png");
    expect(sniffImage(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("webp");
    expect(sniffImage(new Uint8Array([0, 0, 0, 24, ...new TextEncoder().encode("ftypheic"), 0, 0]))).toBe("heic");
  });
});
