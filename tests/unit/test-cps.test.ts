import { describe, expect, it } from "vitest";
import { CPS_DURATIONS, CPS_RANKS, cps, cpsRank, isCpsDuration, isNewBest, rankMax, roundCps } from "@/sections/test/lib/cps";

describe("cps calculator", () => {
  it("divides clicks by the full duration", () => {
    expect(cps(57, 10)).toBeCloseTo(5.7, 10);
    expect(cps(7, 1)).toBe(7);
    expect(cps(330, 60)).toBeCloseTo(5.5, 10);
    expect(cps(64, 5)).toBeCloseTo(12.8, 10);
  });

  it("handles empty and invalid input", () => {
    expect(cps(0, 10)).toBe(0);
    expect(cps(10, 0)).toBe(0);
    expect(cps(10, -5)).toBe(0);
  });

  it("rounds to two decimals", () => {
    expect(roundCps(cps(100, 30))).toBe(3.33);
    expect(roundCps(cps(200, 30))).toBe(6.67);
  });

  it("assigns ranks by thresholds", () => {
    expect(cpsRank(0)).toBe("relaxed");
    expect(cpsRank(3.99)).toBe("relaxed");
    expect(cpsRank(4)).toBe("casual");
    expect(cpsRank(5.7)).toBe("casual");
    expect(cpsRank(6)).toBe("average");
    expect(cpsRank(8)).toBe("fast");
    expect(cpsRank(9.99)).toBe("fast");
    expect(cpsRank(10)).toBe("very-fast");
    expect(cpsRank(14)).toBe("butterfly");
    expect(cpsRank(19.9)).toBe("butterfly");
    expect(cpsRank(20)).toBe("superhuman");
    expect(cpsRank(35)).toBe("superhuman");
  });

  it("rank thresholds are ascending and bounded", () => {
    for (let i = 1; i < CPS_RANKS.length; i++) expect(CPS_RANKS[i].min).toBeGreaterThan(CPS_RANKS[i - 1].min);
    expect(rankMax("relaxed")).toBe(4);
    expect(rankMax("superhuman")).toBeNull();
  });

  it("detects a new personal best", () => {
    expect(isNewBest(null, 5)).toBe(true);
    expect(isNewBest(5, 5)).toBe(false);
    expect(isNewBest(5, 5.1)).toBe(true);
    expect(isNewBest(null, 0)).toBe(false);
  });

  it("knows the supported durations", () => {
    expect([...CPS_DURATIONS]).toEqual([1, 5, 10, 30, 60]);
    expect(isCpsDuration(10)).toBe(true);
    expect(isCpsDuration(15)).toBe(false);
    expect(isCpsDuration("10")).toBe(false);
  });
});
