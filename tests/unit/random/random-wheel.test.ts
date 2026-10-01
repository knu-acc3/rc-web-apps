import { describe, expect, it } from "vitest";
import {
  angleUnderPointer,
  contrastRatio,
  readableTextColor,
  relativeLuminance,
  sectorMargin,
  sectorsFromWeights,
  targetRotation,
  winnerAt,
  WHEEL_PALETTE,
  paletteColor,
} from "@/tools/random/random/lib/wheel";
import { pickWeighted, randomFloat, randomInt } from "@/tools/random/random/lib/rng";

describe("wheel: sectors", () => {
  it("splits 360° proportionally to weights", () => {
    const s = sectorsFromWeights([1, 1, 2]);
    expect(s.map((x) => [x.start, x.end])).toEqual([
      [0, 90],
      [90, 180],
      [180, 360],
    ]);
  });

  it("last sector always ends exactly at 360°", () => {
    const s = sectorsFromWeights([0.1, 0.2, 0.3, 0.7]);
    expect(s[s.length - 1].end).toBe(360);
  });
});

describe("wheel: angle → winner", () => {
  const s = sectorsFromWeights([1, 1, 1, 1]); // 0-90, 90-180, 180-270, 270-360

  it("rotation 0 shows the start of sector 0 under the pointer", () => {
    expect(angleUnderPointer(0)).toBe(0);
    expect(winnerAt(s, 0)).toBe(0);
  });

  it("clockwise rotation brings earlier-by-angle sectors from the left", () => {
    // Rotating the wheel clockwise by 10° shows wheel angle 350° (sector 3) at the top.
    expect(winnerAt(s, 10)).toBe(3);
    expect(winnerAt(s, 100)).toBe(2);
    expect(winnerAt(s, -10)).toBe(0);
    expect(winnerAt(s, -100)).toBe(1);
  });

  it("boundaries belong to the sector that starts there", () => {
    expect(winnerAt(s, -90)).toBe(1); // θ = 90 → start of sector 1
    expect(winnerAt(s, 90)).toBe(3); // θ = 270 → start of sector 3
    expect(winnerAt(s, 180)).toBe(2);
    expect(winnerAt(s, 360)).toBe(0);
    expect(winnerAt(s, 720 + 45)).toBe(3);
  });

  it("zero-weight sectors are never under the pointer", () => {
    const z = sectorsFromWeights([1, 0, 1]);
    for (let r = 0; r < 360; r += 0.5) expect(winnerAt(z, r)).not.toBe(1);
  });
});

describe("wheel: target rotation lands inside the chosen sector", () => {
  it("for fixed positions at both ends of the usable arc", () => {
    const s = sectorsFromWeights([3, 1, 5, 2, 0.5]);
    for (const sec of s) {
      for (const u of [0, 0.25, 0.5, 0.999999]) {
        for (const current of [0, 12.5, 359.9, 1234.567, -45]) {
          const r = targetRotation(current, sec, u, 5);
          expect(r).toBeGreaterThan(current);
          expect(r - current).toBeGreaterThanOrEqual(5 * 360);
          expect(r - current).toBeLessThan(6 * 360);
          expect(winnerAt(s, r)).toBe(sec.index);
          const a = angleUnderPointer(r);
          const m = sectorMargin(sec.end - sec.start);
          expect(a).toBeGreaterThanOrEqual(sec.start + m - 1e-9);
          expect(a).toBeLessThanOrEqual(sec.end - m + 1e-9);
        }
      }
    }
  });

  it("for thousands of random weighted spins (winner chosen first, then the angle)", () => {
    const weights = [1, 7, 2, 1, 13, 1, 1, 4];
    const s = sectorsFromWeights(weights);
    let rot = 0;
    for (let i = 0; i < 5000; i++) {
      const w = pickWeighted(weights);
      rot = targetRotation(rot, s[w], randomFloat(), 4 + randomInt(3));
      expect(winnerAt(s, rot)).toBe(w);
    }
  });

  it("works for very thin sectors", () => {
    const weights = [1, ...new Array(999).fill(1000)];
    const s = sectorsFromWeights(weights);
    for (const u of [0, 0.5, 0.9999]) expect(winnerAt(s, targetRotation(777.7, s[0], u, 6))).toBe(0);
  });
});

describe("wheel: readable label colour (WCAG contrast)", () => {
  it("luminance of black and white", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 10);
    expect(relativeLuminance("#fff")).toBeCloseTo(1, 10);
  });

  it("picks the colour with the higher contrast ratio", () => {
    expect(readableTextColor("#ffffff")).toBe("#000000");
    expect(readableTextColor("#000000")).toBe("#ffffff");
    expect(readableTextColor("#f6c33b")).toBe("#000000"); // yellow
    expect(readableTextColor("#1d2b64")).toBe("#ffffff"); // navy
    // Mid red: a naive 50 % luminance cut-off would choose white; black actually has more contrast.
    const red = "#e8544e";
    const l = relativeLuminance(red);
    const best = contrastRatio(l, 0) > contrastRatio(l, 1) ? "#000000" : "#ffffff";
    expect(readableTextColor(red)).toBe(best);
  });

  it("every palette colour gets at least 4.5:1 with its chosen label colour", () => {
    for (const c of WHEEL_PALETTE) {
      const l = relativeLuminance(c);
      const text = readableTextColor(c) === "#ffffff" ? 1 : 0;
      expect(contrastRatio(l, text)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("neighbouring slices never share a palette colour, including the wrap-around", () => {
    for (let count = 2; count <= 40; count++) {
      const colors = Array.from({ length: count }, (_, i) => paletteColor(i, count));
      for (let i = 0; i < count; i++) expect(colors[i]).not.toBe(colors[(i + 1) % count]);
    }
  });
});
