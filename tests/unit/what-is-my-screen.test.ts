import { describe, expect, it } from "vitest";
import {
  aspectRatio,
  breakpoint,
  dotPitchMm,
  logicalDpi,
  parseCalibration,
  parseCalibrationDpr,
  physicalSize,
  ppiFromCalibration,
  ppiFromDiagonal,
  resolutionName,
  sizeFromPpi,
} from "@/sections/what-is-my/lib/screen";

describe("physicalSize + resolutionName", () => {
  it("names a scaled 4K screen by physical pixels, not CSS pixels", () => {
    // Windows 150 %: CSS 2560×1440 — the old tool called this "QHD".
    const p = physicalSize(2560, 1440, 1.5);
    expect(p).toEqual({ w: 3840, h: 2160, approx: false });
    expect(resolutionName(p.w, p.h).name).toBe("4K UHD");
  });

  it("handles 125 % and 200 % scaling", () => {
    expect(physicalSize(1536, 864, 1.25)).toEqual({ w: 1920, h: 1080, approx: false });
    expect(physicalSize(1920, 1080, 2)).toEqual({ w: 3840, h: 2160, approx: false });
    expect(physicalSize(1512, 982, 2)).toEqual({ w: 3024, h: 1964, approx: false });
  });

  it("snaps fractional scaling rounding errors to a known resolution", () => {
    // 175 %: 3840/1.75 = 2194.29 → the browser reports 2194×1234.
    expect(physicalSize(2194, 1234, 1.75)).toEqual({ w: 3840, h: 2160, approx: true });
    // Portrait phones keep their orientation.
    expect(physicalSize(1080, 1920, 1)).toEqual({ w: 1080, h: 1920, approx: false });
  });

  it("names well-known resolutions", () => {
    expect(resolutionName(1920, 1080)).toEqual({ name: "Full HD", alias: "1080p", exact: true });
    expect(resolutionName(2560, 1440).name).toBe("QHD");
    expect(resolutionName(1366, 768).name).toBe("HD");
    expect(resolutionName(3440, 1440).name).toBe("UWQHD");
    expect(resolutionName(7680, 4320).name).toBe("8K UHD");
    expect(resolutionName(1080, 1920).name).toBe("Full HD");
  });

  it("estimates a class for non-standard panels", () => {
    expect(resolutionName(1080, 2400)).toEqual({ name: "Full HD+", exact: false });
    expect(resolutionName(1440, 3200).name).toBe("QHD+");
    expect(resolutionName(1170, 2532).name).toBe("Full HD+");
    expect(resolutionName(3024, 1964).name).toBe("3K");
    expect(resolutionName(3456, 2234).name).toBe("3.5K");
    expect(resolutionName(4480, 2520).name).toBe("4.5K");
    expect(resolutionName(640, 480).name).toBe("SD");
  });
});

describe("aspectRatio", () => {
  it("reduces and maps to marketing ratios", () => {
    expect(aspectRatio(1920, 1080)).toEqual({ exact: "16:9", common: "16:9" });
    expect(aspectRatio(1366, 768)).toEqual({ exact: "683:384", common: "16:9" });
    expect(aspectRatio(2560, 1600)).toEqual({ exact: "8:5", common: "16:10" });
    expect(aspectRatio(3440, 1440)).toEqual({ exact: "43:18", common: "21:9" });
    expect(aspectRatio(1080, 2400)).toEqual({ exact: "9:20", common: "9:20" });
    expect(aspectRatio(1280, 1024).common).toBe("5:4");
    expect(aspectRatio(1000, 900).common).toBeNull();
  });
});

describe("breakpoint", () => {
  it("Tailwind and Bootstrap", () => {
    expect(breakpoint(360, "tailwind")).toBe("base");
    expect(breakpoint(768, "tailwind")).toBe("md");
    expect(breakpoint(1536, "tailwind")).toBe("2xl");
    expect(breakpoint(575, "bootstrap")).toBe("xs");
    expect(breakpoint(992, "bootstrap")).toBe("lg");
    expect(breakpoint(1400, "bootstrap")).toBe("xxl");
  });
});

describe("DPI / PPI", () => {
  it("logical DPI is 96 × DPR", () => {
    expect(logicalDpi(1)).toBe(96);
    expect(logicalDpi(1.5)).toBe(144);
  });

  it("physical PPI from calibration", () => {
    expect(ppiFromCalibration(3.7795, 2)).toBeCloseTo(192, 0);
    expect(ppiFromCalibration(96 / 25.4, 1)).toBeCloseTo(96, 6);
  });

  it("PPI from diagonal", () => {
    expect(ppiFromDiagonal(1920, 1080, 24)).toBeCloseTo(91.79, 2);
    expect(ppiFromDiagonal(3840, 2160, 27)).toBeCloseTo(163.18, 2);
    expect(ppiFromDiagonal(2560, 1440, 27)).toBeCloseTo(108.79, 2);
    expect(ppiFromDiagonal(1920, 1080, 0)).toBeNaN();
    expect(dotPitchMm(100)).toBeCloseTo(0.254, 6);
    expect(sizeFromPpi(3840, 2160, 163.18).diagonal).toBeCloseTo(27, 2);
  });

  it("parses the actual-size calibration record", () => {
    expect(parseCalibration(JSON.stringify({ v: 1, pxPerMm: 3.9, method: "card", at: 1700000000000 }))).toEqual({
      v: 1,
      pxPerMm: 3.9,
      method: "card",
      at: 1700000000000,
    });
    expect(parseCalibration(null)).toBeNull();
    expect(parseCalibration("not json")).toBeNull();
    expect(parseCalibration(JSON.stringify({ v: 2, pxPerMm: 3.9, method: "card", at: 1 }))).toBeNull();
    expect(parseCalibration(JSON.stringify({ v: 1, pxPerMm: -1, method: "card", at: 1 }))).toBeNull();
    expect(parseCalibration(JSON.stringify({ v: 1, pxPerMm: 3.9, method: "ruler", at: 1 }))).toBeNull();
    expect(parseCalibration(JSON.stringify({ v: 1, pxPerMm: 90, method: "card", at: 1 }))).toBeNull();
  });

  it("reads the DPR stored with the same calibration only", () => {
    expect(parseCalibrationDpr(JSON.stringify({ at: 1700000000000, dpr: 1.5 }), 1700000000000)).toBe(1.5);
    expect(parseCalibrationDpr(JSON.stringify({ at: 1, dpr: 1.5 }), 1700000000000)).toBeNull();
    expect(parseCalibrationDpr(JSON.stringify({ at: 5, dpr: 0 }), 5)).toBeNull();
    expect(parseCalibrationDpr(null, 5)).toBeNull();
    // Physical PPI is invariant under later zoom when the calibration DPR is used.
    expect(ppiFromCalibration(4.2, 1.5)).toBeCloseTo(160.02, 2);
  });
});
