import { describe, expect, it } from "vitest";
import { Base64Error, base64Length, bytesToBase64, parseBase64Input, svgToDataUri } from "@/sections/image/engine/base64";
import { cellsOf, gridRects, layoutsFor, placeCells } from "@/sections/image/engine/collage";
import { detectFormat } from "@/sections/image/engine/detect";
import { exactIndex } from "@/sections/image/engine/pixel-gif";
import { roundNumbers, splitProlog } from "@/sections/image/engine/svg-optimize";

const PNG_1PX = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("Base64 input parsing", () => {
  it("decodes raw Base64 and detects the real format from bytes", () => {
    const { bytes, declared } = parseBase64Input(PNG_1PX);
    expect(declared).toBeUndefined();
    expect(detectFormat(bytes)).toBe("png");
  });
  it("accepts a data URI and reports the declared MIME separately", () => {
    const { bytes, declared } = parseBase64Input(`data:image/jpeg;base64,${PNG_1PX}`);
    expect(declared).toBe("image/jpeg");
    expect(detectFormat(bytes)).toBe("png"); // real type wins
  });
  it("accepts CSS url(), whitespace, line breaks and Base64URL", () => {
    const wrapped = `url("data:image/png;base64,${PNG_1PX.slice(0, 20)}\n${PNG_1PX.slice(20)}")`;
    expect(detectFormat(parseBase64Input(wrapped).bytes)).toBe("png");
    const url = PNG_1PX.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(parseBase64Input(url).bytes).toEqual(parseBase64Input(PNG_1PX).bytes);
  });
  it("decodes URL-encoded SVG data URIs", () => {
    const { bytes } = parseBase64Input("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E");
    expect(detectFormat(bytes)).toBe("svg");
  });
  it("rejects invalid characters with their position and truncated input", () => {
    try {
      parseBase64Input("iVBOR$$$");
      throw new Error("no throw");
    } catch (e) {
      expect(e).toBeInstanceOf(Base64Error);
      expect((e as Base64Error).code).toBe("INVALID");
      expect((e as Base64Error).at).toBe(5);
    }
    expect(() => parseBase64Input("iVBORw0KG")).toThrow(Base64Error);
    expect(() => parseBase64Input("   ")).toThrow(Base64Error);
  });
  it("encodes large buffers in chunks and predicts the length (+33 %)", () => {
    const big = new Uint8Array(200_001).map((_, i) => i % 251);
    const b64 = bytesToBase64(big);
    expect(b64.length).toBe(base64Length(big.length));
    expect(parseBase64Input(b64).bytes).toEqual(big);
    expect(base64Length(3)).toBe(4);
    expect(base64Length(4)).toBe(8);
  });
  it("builds compact SVG data URIs", () => {
    expect(svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg">\n  <path d="M0 0"/>#</svg>')).toBe(
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E %3Cpath d='M0 0'/%3E%23%3C/svg%3E",
    );
  });
});

describe("collage layouts", () => {
  it("offers distinct layouts for 2–9 photos, each with the right cell count", () => {
    for (let n = 2; n <= 9; n++) {
      const ls = layoutsFor(n);
      expect(ls.length).toBeGreaterThan(0);
      for (const l of ls) expect(cellsOf(l)).toHaveLength(n);
      expect(new Set(ls.map((l) => l.id)).size).toBe(ls.length);
    }
    // 2 photos: side by side and stacked (the transposed duplicate is removed)
    expect(layoutsFor(2).map((l) => l.id)).toEqual(["r2", "c2"]);
  });
  it("normalised cells tile the unit square exactly", () => {
    for (const l of layoutsFor(5)) {
      const area = cellsOf(l).reduce((a, c) => a + c.w * c.h, 0);
      expect(area).toBeCloseTo(1, 9);
    }
  });
  it("places cells with gaps and padding without overlap", () => {
    const [l] = layoutsFor(4); // 2×2
    const r = placeCells(l, 1000, 1000, 20, 30);
    expect(r).toEqual([
      { x: 30, y: 30, w: 460, h: 460 },
      { x: 510, y: 30, w: 460, h: 460 },
      { x: 30, y: 510, w: 460, h: 460 },
      { x: 510, y: 510, w: 460, h: 460 },
    ]);
    const cols = layoutsFor(3).find((x) => x.id === "c1-2")!; // big left, two stacked right
    const rc = placeCells(cols, 900, 600, 0, 0);
    expect(rc[0]).toEqual({ x: 0, y: 0, w: 450, h: 600 });
    expect(rc[1]).toEqual({ x: 450, y: 0, w: 450, h: 300 });
    expect(rc[2]).toEqual({ x: 450, y: 300, w: 450, h: 300 });
  });
});

describe("grid split", () => {
  it("covers the image exactly even when sizes don't divide evenly", () => {
    const r = gridRects(1001, 700, 3, 3);
    expect(r).toHaveLength(9);
    expect(r.slice(0, 3).reduce((a, x) => a + x.w, 0)).toBe(1001);
    expect([r[0].h, r[3].h, r[6].h].reduce((a, b) => a + b, 0)).toBe(700);
    expect(r[8].x + r[8].w).toBe(1001);
    expect(r[8].y + r[8].h).toBe(700);
  });
});

describe("SVG optimiser helpers", () => {
  it("rounds path numbers without touching commands or flags", () => {
    expect(roundNumbers("M 10.123456 10.987654 L 190.55555 -0.0001 Z", 2)).toBe("M 10.12 10.99 L 190.56 0 Z");
    expect(roundNumbers("a25 25 0 1 0 50.5555 0", 1)).toBe("a25 25 0 1 0 50.6 0");
    expect(roundNumbers("1e-7 2.5e2", 3)).toBe("0 250");
  });
  it("keeps the XML declaration and DOCTYPE verbatim", () => {
    const src =
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg/>';
    expect(splitProlog(src).prolog).toBe(
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    );
    expect(splitProlog("<svg/>").prolog).toBe("");
  });
});

describe("pixel art → GIF palette", () => {
  const px = (colors: [number, number, number, number][]) => new Uint8Array(colors.flat());

  it("uses an exact palette (pixel-perfect) with a transparent index", () => {
    const r = exactIndex(
      px([
        [255, 0, 0, 255],
        [0, 0, 0, 0],
        [255, 0, 0, 255],
        [0, 255, 0, 255],
      ]),
    )!;
    expect(r.palette.slice(0, 3)).toEqual([
      [255, 0, 0],
      [0, 0, 0],
      [0, 255, 0],
    ]);
    expect(Array.from(r.index)).toEqual([0, 1, 0, 2]);
    expect(r.transparentIndex).toBe(1);
  });
  it("gives up on more than 256 colours (the caller then quantises instead of corrupting)", () => {
    const many = new Uint8Array(300 * 4);
    for (let i = 0; i < 300; i++) many.set([i & 255, i >> 8, 7, 255], i * 4);
    expect(exactIndex(many)).toBeNull();
  });
});
