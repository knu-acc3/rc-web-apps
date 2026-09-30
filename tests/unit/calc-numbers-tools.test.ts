import { describe, expect, it } from "vitest";
import { toText } from "@/sections/calc/algebra/rational";
import {
  arithmeticMean,
  decimalText,
  geometricMean,
  groundToMap,
  harmonicMean,
  magnitude,
  mapToGround,
  median,
  parseDecimal,
  roundDecimals,
  roundSignificant,
  roundTo,
  ruleOfThree,
  simplifyRatio,
  splitInRatio,
  weightedMean,
} from "@/sections/calc/numbers/engines";

const D = (s: string) => parseDecimal(s)!;
const R = (s: string, d: number, m: Parameters<typeof roundDecimals>[2] = "half-up") => decimalText(roundDecimals(D(s), d, m));

describe("proportion", () => {
  it("direct and inverse", () => {
    expect(ruleOfThree(4, 3, 10)).toBe(7.5); // 3/4 = x/10
    expect(ruleOfThree(4, 6, 3, true)).toBe(8); // 4 workers × 6 days → 3 workers → 8 days
    expect(ruleOfThree(0, 1, 1)).toBeNull();
  });
  it("map scale in correct units", () => {
    expect(mapToGround(4, 25000)).toBe(1000); // 4 cm at 1:25 000 = 1 000 m = 1 km
    expect(mapToGround(1, 100000)).toBe(1000);
    expect(groundToMap(250, 25000)).toBe(1); // 250 m → 1 cm
  });
});

describe("averages", () => {
  it("reference values", () => {
    expect(arithmeticMean([2, 4, 9])).toBe(5);
    expect(geometricMean([2, 8])).toBeCloseTo(4, 12);
    expect(harmonicMean([40, 60])).toBeCloseTo(48, 12);
    expect(weightedMean([[5, 3], [4, 2], [3, 1]])).toBeCloseTo(26 / 6, 12);
    expect(median([5, 1, 3, 2])).toBe(2.5);
    expect(geometricMean([-1, 2])).toBeNaN();
    expect(harmonicMean([0, 2])).toBeNaN();
  });
});

describe("exact rounding", () => {
  it("half-up is away from zero and exact for binary-unfriendly decimals", () => {
    expect(R("2.675", 2)).toBe("2.68");
    expect(R("1.005", 2)).toBe("1.01");
    expect(R("-2.5", 0)).toBe("-3");
    expect(R("1234.5", 0)).toBe("1235");
  });
  it("banker's rounding", () => {
    expect(R("2.5", 0, "half-even")).toBe("2");
    expect(R("3.5", 0, "half-even")).toBe("4");
    expect(R("0.125", 2, "half-even")).toBe("0.12");
  });
  it("floor, ceil, trunc, half-down", () => {
    expect(R("-1.21", 1, "floor")).toBe("-1.3");
    expect(R("-1.29", 1, "ceil")).toBe("-1.2");
    expect(R("-1.29", 1, "trunc")).toBe("-1.2");
    expect(R("2.5", 0, "half-down")).toBe("2");
  });
  it("significant figures and steps", () => {
    expect(decimalText(roundSignificant(D("123456"), 2, "half-up"))).toBe("120000");
    expect(decimalText(roundSignificant(D("0.0012345"), 3, "half-up"))).toBe("0.00123");
    expect(magnitude(D("0.05"))).toBe(-2);
    expect(magnitude(D("999"))).toBe(2);
    expect(decimalText(roundTo(D("1234"), D("100"), "half-up"))).toBe("1200");
    expect(decimalText(roundTo(D("7.3"), D("0.5"), "half-up"))).toBe("7.5");
    expect(R("100", 0)).toBe("100"); // never strips integer zeros
    expect(decimalText(D("1 000,50"), ",")).toBe("1000,5");
  });
});

describe("ratios", () => {
  it("simplifies decimals to integers", () => {
    expect(simplifyRatio([D("1,5"), D("2,25")])).toEqual([2n, 3n]);
    expect(simplifyRatio([D("12"), D("18"), D("30")])).toEqual([2n, 3n, 5n]);
    expect(simplifyRatio([D("0"), D("0")])).toBeNull();
  });
  it("splits amounts so parts add up exactly", () => {
    const parts = splitInRatio(10000n, [1n, 1n, 1n]); // 100.00 in three equal parts
    expect(parts).toEqual([3334n, 3333n, 3333n]);
    expect(parts.reduce((a, b) => a + b, 0n)).toBe(10000n);
    expect(splitInRatio(1000n, [2n, 3n])).toEqual([400n, 600n]);
  });
  it("text helpers", () => {
    expect(toText(D("0,25"))).toBe("1/4");
  });
});
