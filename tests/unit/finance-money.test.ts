import { describe, expect, it } from "vitest";
import {
  addVat,
  breakEven,
  cagr,
  discountPercent,
  discountPrice,
  extractVat,
  fromCostPrice,
  marginToMarkup,
  markupToMargin,
  originalPrice,
  priceFromMargin,
  priceFromMarkup,
  roi,
  rule503020,
  splitTip,
  stackedDiscount,
  unitPrice,
  VAT_PRESETS,
} from "@/sections/finance/engines/money";

describe("VAT", () => {
  it("adds VAT", () => {
    expect(addVat(1000, 16)).toEqual({ net: 1000, vat: 160, gross: 1160 });
    expect(addVat(1000, 22).gross).toBe(1220);
  });
  it("extracts VAT: gross × r / (100 + r)", () => {
    expect(extractVat(1160, 16)).toEqual({ net: 1000, vat: 160, gross: 1160 });
    expect(extractVat(1220, 22).vat).toBe(220);
    expect(extractVat(112, 12).vat).toBe(12);
    expect(extractVat(100, 20).vat).toBe(16.67); // 100 × 20 / 120 = 16.666… → 16.67
  });
  it("has the documented presets", () => {
    expect(VAT_PRESETS.find((p) => p.id === "kz-2026")?.rate).toBe(16);
    expect(VAT_PRESETS.find((p) => p.id === "kz-2025")?.rate).toBe(12);
    expect(VAT_PRESETS.find((p) => p.id === "ru-2026")?.rate).toBe(22);
  });
});

describe("discounts", () => {
  it("forward and reverse", () => {
    expect(discountPrice(2500, 20)).toEqual({ final: 2000, saved: 500 });
    expect(originalPrice(1500, 25)).toBe(2000);
    expect(originalPrice(100, 100)).toBeNull();
    expect(discountPercent(2000, 1500)).toBe(25);
  });
  it("stacked discounts multiply", () => {
    expect(stackedDiscount([20, 10])).toBeCloseTo(28, 10);
  });
});

describe("tip split — totals always add up", () => {
  it("100 between 3 people with no tip → 33.34 + 33.33 + 33.33", () => {
    const r = splitTip(100, 0, 3);
    expect(r.shares).toEqual([33.34, 33.33, 33.33]);
    expect(r.collected).toBe(100);
  });
  it("exact split with a tip", () => {
    const r = splitTip(4575, 10, 4);
    expect(r.total).toBe(5032.5);
    expect(r.collected).toBe(5032.5);
    expect(r.shares.reduce((s, x) => s + x, 0)).toBeCloseTo(5032.5, 10);
  });
  it("rounding up to a coarser step raises the tip", () => {
    const r = splitTip(10_000, 10, 3, 100);
    // 11 000 / 3 = 3666.67 → 3700 each → 11 100 collected, tip 1 100 (11 %)
    expect(r.shares).toEqual([3700, 3700, 3700]);
    expect(r.collected).toBe(11_100);
    expect(r.actualTip).toBe(1100);
    expect(r.actualPct).toBeCloseTo(11, 10);
  });
});

describe("markup and margin", () => {
  it("from cost and price", () => {
    const r = fromCostPrice(800, 1000);
    expect(r.profit).toBe(200);
    expect(r.markup).toBe(25);
    expect(r.margin).toBe(20);
  });
  it("conversions", () => {
    expect(markupToMargin(25)).toBe(20);
    expect(markupToMargin(100)).toBe(50);
    expect(marginToMarkup(50)).toBe(100);
    expect(marginToMarkup(20)).toBe(25);
    expect(priceFromMarkup(800, 35).price).toBeCloseTo(1080, 10);
    expect(priceFromMargin(800, 20)?.price).toBeCloseTo(1000, 10);
    expect(priceFromMargin(800, 100)).toBeNull();
  });
});

describe("break-even, ROI, CAGR", () => {
  it("break-even units = fixed / (price − variable)", () => {
    const r = breakEven(10_000, 30, 50)!;
    expect(r.units).toBe(500);
    expect(r.unitsCeil).toBe(500);
    expect(r.revenue).toBe(25_000);
    expect(r.contributionRatio).toBe(40);
    expect(breakEven(100, 60, 50)).toBeNull();
    expect(breakEven(1000, 30, 50.5)!.unitsCeil).toBe(49); // 1000 / 20.5 = 48.78 → 49
  });
  it("ROI and CAGR", () => {
    expect(roi(1000, 1500)).toBe(50);
    expect(roi(1000, 800)).toBe(-20);
    expect(cagr(1000, 2000, 5)).toBeCloseTo(14.8698, 3);
    expect(cagr(1000, 500, 2)).toBeCloseTo(-29.2893, 3);
    expect(cagr(0, 100, 1)).toBeNull();
  });
});

describe("unit price and budget", () => {
  it("normalises to per kg / per litre / per piece", () => {
    expect(unitPrice(450, 900, "g")).toEqual({ perBase: 500, base: "kg" });
    expect(unitPrice(1200, 1.5, "l")).toEqual({ perBase: 800, base: "l" });
    expect(unitPrice(300, 500, "ml")).toEqual({ perBase: 600, base: "l" });
    expect(unitPrice(900, 10, "pcs")).toEqual({ perBase: 90, base: "pcs" });
    expect(unitPrice(100, 0, "kg")).toBeNull();
  });
  it("50/30/20", () => {
    expect(rule503020(400_000)).toEqual({ needs: 200_000, wants: 120_000, savings: 80_000 });
  });
});
