import { describe, expect, it } from "vitest";
import { PAPER, PAPER_BY_SLUG, mmToPt, mmToPx, paperPx } from "@/sections/sizes/paper/data";
import {
  dotPitchMm,
  gcd,
  heightFor,
  megapixels,
  nearestCommonRatio,
  physicalPixels,
  physicalSize,
  ppi,
  reduceRatio,
  resolutionName,
  roundEven,
  widthFor,
} from "@/sections/sizes/screen/engine";
import { SCREENS, screenSlug } from "@/sections/sizes/screen/data";
import { acuityDistance, diagonalForAngle, distanceForAngle, screenDims } from "@/sections/sizes/tv/engine";

const p = (slug: string) => PAPER_BY_SLUG.get(slug)!;

describe("paper sizes", () => {
  it("ISO 216 / 269 reference dimensions are exact", () => {
    expect([p("a4").w, p("a4").h]).toEqual([210, 297]);
    expect([p("a0").w, p("a0").h]).toEqual([841, 1189]);
    expect([p("a10").w, p("a10").h]).toEqual([26, 37]);
    expect([p("b5").w, p("b5").h]).toEqual([176, 250]);
    expect([p("b0").w, p("b0").h]).toEqual([1000, 1414]);
    expect([p("c4").w, p("c4").h]).toEqual([229, 324]);
    expect([p("c5").w, p("c5").h]).toEqual([162, 229]);
    expect([p("dl").w, p("dl").h]).toEqual([110, 220]);
    expect([p("sra3").w, p("sra3").h]).toEqual([320, 450]);
  });

  it("US sizes are defined in inches", () => {
    expect([p("letter").w, p("letter").h]).toEqual([215.9, 279.4]);
    expect(p("letter").inch).toEqual([8.5, 11]);
    expect([p("legal").w, p("legal").h]).toEqual([215.9, 355.6]);
    expect([p("tabloid").w, p("tabloid").h]).toEqual([279.4, 431.8]);
    expect([p("executive").w, p("executive").h]).toEqual([184.15, 266.7]);
    expect(p("half-letter").inch).toEqual([5.5, 8.5]);
  });

  it("pixel math: px = round(mm / 25.4 × dpi)", () => {
    expect(paperPx(p("a4"), 300)).toEqual([2480, 3508]);
    expect(paperPx(p("a4"), 72)).toEqual([595, 842]);
    expect(paperPx(p("a4"), 96)).toEqual([794, 1123]);
    expect(paperPx(p("a4"), 150)).toEqual([1240, 1754]);
    expect(paperPx(p("letter"), 300)).toEqual([2550, 3300]);
    expect(mmToPx(297, 300)).toBe(3508);
    expect(mmToPt(210)).toBeCloseTo(595.28, 2);
  });

  it("every ISO format halves the previous one and keeps ~1:√2", () => {
    for (const s of ["a", "b", "c"]) {
      for (let i = 1; i <= 10; i++) {
        const big = p(`${s}${i - 1}`);
        const small = p(`${s}${i}`);
        expect(small.h, `${s}${i}`).toBe(big.w);
        expect(Math.abs(small.w - Math.floor(big.h / 2)), `${s}${i}`).toBeLessThanOrEqual(1);
        expect(small.h / small.w).toBeGreaterThan(1.38);
        expect(small.h / small.w).toBeLessThan(1.45);
      }
    }
  });

  it("slugs are unique and every format is portrait", () => {
    expect(new Set(PAPER.map((x) => x.slug)).size).toBe(PAPER.length);
    for (const f of PAPER) expect(f.w, f.slug).toBeLessThan(f.h);
  });
});

describe("aspect ratio", () => {
  it("reduces with gcd", () => {
    expect(gcd(1920, 1080)).toBe(120);
    expect(reduceRatio(1920, 1080)).toEqual([16, 9]);
    expect(reduceRatio(2560, 1080)).toEqual([64, 27]);
    expect(reduceRatio(3440, 1440)).toEqual([43, 18]);
    expect(reduceRatio(1366, 768)).toEqual([683, 384]);
    expect(reduceRatio(1080, 1920)).toEqual([9, 16]);
  });

  it("finds the nearest common (marketing) ratio", () => {
    expect(nearestCommonRatio(1366, 768)?.label).toBe("16:9");
    expect(nearestCommonRatio(1366, 768)?.exact).toBe(false);
    expect(nearestCommonRatio(1920, 1080)?.exact).toBe(true);
    expect(nearestCommonRatio(2560, 1080)?.label).toBe("21:9");
    expect(nearestCommonRatio(3440, 1440)?.label).toBe("21:9");
    expect(nearestCommonRatio(1170, 2532)?.oriented).toBe("9:19.5");
    expect(nearestCommonRatio(1080, 2400)?.oriented).toBe("9:20");
    expect(nearestCommonRatio(5120, 1440)?.label).toBe("32:9");
    expect(nearestCommonRatio(3024, 1964)).toBeNull();
  });

  it("solves the missing side and rounds to even", () => {
    expect(heightFor(16, 9, 1366)).toBeCloseTo(768.375, 6);
    expect(roundEven(heightFor(16, 9, 1366))).toBe(768);
    expect(roundEven(heightFor(16, 9, 854))).toBe(480);
    expect(widthFor(4, 3, 768)).toBe(1024);
    expect(roundEven(1081)).toBe(1082);
    expect(roundEven(1079.2)).toBe(1080);
  });
});

describe("pixel density", () => {
  it("PPI reference values", () => {
    expect(ppi(1920, 1080, 24)).toBeCloseTo(91.79, 2);
    expect(ppi(3840, 2160, 27)).toBeCloseTo(163.18, 2);
    expect(ppi(2560, 1440, 27)).toBeCloseTo(108.79, 1);
    expect(dotPitchMm(ppi(1920, 1080, 24))).toBeCloseTo(0.2767, 3);
  });

  it("physical size and megapixels", () => {
    const [w, h] = physicalSize(1920, 1080, 24);
    expect(w).toBeCloseTo(20.92, 2);
    expect(h).toBeCloseTo(11.77, 2);
    expect(megapixels(3840, 2160)).toBeCloseTo(8.2944, 4);
  });

  it("names resolutions by physical pixels in either orientation", () => {
    expect(resolutionName(3840, 2160)).toBe("4K UHD (2160p)");
    expect(resolutionName(1080, 1920)).toBe("Full HD (1080p)");
    expect(resolutionName(1536, 864)).toBeNull();
  });

  it("labels the screen by physical pixels, not CSS pixels", () => {
    // 4K monitor at 150% Windows scaling reports 2560 × 1440 CSS px.
    expect(physicalPixels(2560, 1440, 1.5)).toEqual([3840, 2160]);
    expect(resolutionName(...physicalPixels(2560, 1440, 1.5))).toBe("4K UHD (2160p)");
    // Full HD laptop at 125% reports 1536 × 864.
    expect(physicalPixels(1536, 864, 1.25)).toEqual([1920, 1080]);
    // iPhone 12: 390 × 844 CSS px at DPR 3.
    expect(physicalPixels(390, 844, 3)).toEqual([1170, 2532]);
  });

  it("screen catalogue has unique slugs", () => {
    const slugs = SCREENS.map(screenSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("tv viewing distance", () => {
  it("16:9 dimensions", () => {
    const [w, h] = screenDims(55);
    expect(w).toBeCloseTo(47.94, 2);
    expect(h).toBeCloseTo(26.96, 2);
  });

  it("field-of-view distances round-trip", () => {
    const d = distanceForAngle(55, 30);
    expect(d).toBeCloseTo(2.272, 2);
    expect(diagonalForAngle(d, 30)).toBeCloseTo(55, 6);
    expect(distanceForAngle(55, 40)).toBeLessThan(d);
  });

  it("visual acuity: 1080p ≈ 1.56 × diagonal, 4K ≈ 0.78 × diagonal", () => {
    const diagM = (55 * 2.54) / 100;
    expect(acuityDistance(55, 1080) / diagM).toBeCloseTo(1.56, 2);
    expect(acuityDistance(55, 2160) / diagM).toBeCloseTo(0.78, 2);
  });
});
