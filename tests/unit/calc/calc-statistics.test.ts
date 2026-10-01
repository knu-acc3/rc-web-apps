import { describe as suite, expect, it } from "vitest";
import { describe, histogram, parseData, quantile } from "@/tools/calc/calc/statistics/engine";

suite("statistics input", () => {
  it("never splits by comma: '1,5 2,5 3,5' in Russian is three values", () => {
    expect(parseData("ru", "1,5 2,5 3,5").values).toEqual([1.5, 2.5, 3.5]);
    expect(parseData("ru", "1,5;2,5\n3,5\t4").values).toEqual([1.5, 2.5, 3.5, 4]);
  });
  it("reports invalid tokens", () => {
    expect(parseData("en", "1 2 abc 4").invalid).toEqual(["abc"]);
    expect(parseData("en", "1.5 2.5").values).toEqual([1.5, 2.5]);
  });
});

suite("descriptive statistics", () => {
  const s = describe([2, 4, 4, 4, 5, 5, 7, 9])!;
  it("mean, median, mode", () => {
    expect(s.mean).toBe(5);
    expect(s.median).toBe(4.5);
    expect(s.modes).toEqual([4]);
    expect(s.range).toBe(7);
    expect(s.sum).toBe(40);
  });
  it("population vs sample standard deviation", () => {
    expect(s.sdPop).toBe(2); // √(32/8)
    expect(s.sdSample!).toBeCloseTo(2.13809, 5); // √(32/7)
    expect(s.varSample!).toBeCloseTo(32 / 7, 12);
  });
  it("quartiles by linear interpolation (Excel QUARTILE.INC)", () => {
    // positions (n−1)p: Q1 at 1.75 → 4, Q3 at 5.25 → 5 + 0.25·(7 − 5) = 5.5
    expect(s.q1).toBe(4);
    expect(s.q3).toBe(5.5);
    expect(s.iqr).toBe(1.5);
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
  });
  it("Tukey outliers", () => {
    // fences: 4 − 2.25 = 1.75 and 5.5 + 2.25 = 7.75 → 9 is an outlier
    expect(s.outliers).toEqual([9]);
    expect(describe([1, 2, 3, 4, 100])!.outliers).toEqual([100]);
  });
  it("multimodal, no mode, single value", () => {
    expect(describe([1, 1, 2, 2, 3])!.modes).toEqual([1, 2]);
    expect(describe([1, 2, 3])!.modes).toEqual([]);
    const one = describe([7])!;
    expect(one.varSample).toBeNull();
    expect(one.sdPop).toBe(0);
    expect(describe([])).toBeNull();
  });
  it("geometric mean and histogram", () => {
    expect(describe([2, 8])!.geoMean).toBeCloseTo(4, 12);
    expect(describe([-1, 2])!.geoMean).toBeNull();
    const h = histogram([1, 2, 2, 3, 3, 3, 4, 4, 5, 10]);
    expect(h.reduce((a, b) => a + b.count, 0)).toBe(10);
  });
});
