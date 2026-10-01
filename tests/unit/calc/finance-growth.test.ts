import { describe, expect, it } from "vitest";
import { parseIso } from "@/tools/calc/shared/dates";
import { depositSchedule, effectiveRate } from "@/tools/calc/finance/lib/deposit";
import { averageRate, compound, cumulative, futureCost, invest, monthlyNeeded, monthsNeeded, presentValue, retirement } from "@/tools/calc/finance/lib/growth";

const round2 = (x: number) => Math.round(x * 100) / 100;
const start = parseIso("2026-01-01")!;

describe("deposit (exact day count)", () => {
  it("simple interest paid at the end: 1 000 000 × 12 % × 365/365 = 120 000", () => {
    const r = depositSchedule({ amount: 1_000_000, annualRate: 12, months: 12, start, cap: "end" });
    expect(r.days).toBe(365);
    expect(r.totalInterest).toBe(120000);
    expect(r.final).toBe(1_120_000);
    // monthly rows add up exactly to the credited amount
    expect(round2(r.rows.reduce((s, x) => s + x.interest, 0))).toBe(120000);
  });

  it("monthly capitalization is close to the nominal-month formula 1e6·1.01^12 = 1 126 825.03", () => {
    const r = depositSchedule({ amount: 1_000_000, annualRate: 12, months: 12, start, cap: "monthly" });
    expect(Math.abs(r.final - 1_126_825.03) / 1_126_825.03).toBeLessThan(0.001);
    // January: 1e6 × 0.12 × 31/365 = 10 191.78
    expect(r.rows[0].interest).toBe(10191.78);
    expect(r.rows[0].balance).toBe(1_010_191.78);
  });

  it("quarterly capitalization credits every 3 months", () => {
    const r = depositSchedule({ amount: 1_000_000, annualRate: 12, months: 12, start, cap: "quarterly" });
    expect(r.rows.filter((x) => x.credited > 0).map((x) => x.month)).toEqual([3, 6, 9, 12]);
    const monthly = depositSchedule({ amount: 1_000_000, annualRate: 12, months: 12, start, cap: "monthly" });
    expect(r.final).toBeLessThan(monthly.final);
    expect(r.final).toBeGreaterThan(1_120_000);
  });

  it("uses 366 days in leap years", () => {
    const leap = depositSchedule({ amount: 1_000_000, annualRate: 10, months: 12, start: parseIso("2028-01-01")!, cap: "end" });
    expect(leap.days).toBe(366);
    expect(leap.totalInterest).toBe(100000);
  });

  it("top-ups and withdrawals on monthly anniversaries", () => {
    const r = depositSchedule({ amount: 100_000, annualRate: 0, months: 12, start, cap: "monthly", topUp: 10_000, withdrawal: 2_000 });
    expect(r.totalTopUps).toBe(110_000);
    expect(r.totalWithdrawals).toBe(22_000);
    expect(r.final).toBe(188_000);
  });

  it("effective rate", () => {
    expect(effectiveRate(12, "monthly")).toBeCloseTo(12.6825, 4);
    expect(effectiveRate(12, "quarterly")).toBeCloseTo(12.5509, 4);
    expect(effectiveRate(12, "end")).toBe(12);
  });
});

describe("compound interest", () => {
  it("matches A = P(1 + r/n)^(nt)", () => {
    expect(round2(compound({ principal: 10_000, rate: 5, years: 10, comp: "yearly" }).final)).toBe(16288.95);
    expect(round2(compound({ principal: 10_000, rate: 5, years: 10, comp: "monthly" }).final)).toBe(16470.09);
    expect(round2(compound({ principal: 10_000, rate: 5, years: 10, comp: "continuous" }).final)).toBe(16487.21);
    expect(round2(compound({ principal: 10_000, rate: 5, years: 10, comp: "quarterly" }).final)).toBe(16436.19);
  });

  it("adds contributions (ordinary annuity: FV = PMT·((1+i)^n − 1)/i)", () => {
    // 100/month at 12 %/12 for 12 months, end of month: 100 · (1.01^12 − 1)/0.01 = 1268.25
    const r = compound({ principal: 0, rate: 12, years: 1, comp: "monthly", contribution: 100 });
    expect(round2(r.final)).toBe(1268.25);
    expect(r.invested).toBe(1200);
    // annuity due (start of month): × 1.01 = 1280.93
    expect(round2(compound({ principal: 0, rate: 12, years: 1, comp: "monthly", contribution: 100, timing: "start" }).final)).toBe(1280.93);
  });

  it("yearly contributions", () => {
    // 1000 at the end of each year at 10 % for 3 years: 1000·(1.1² + 1.1 + 1) = 3310
    const r = compound({ principal: 0, rate: 10, years: 3, comp: "yearly", contribution: 1000, contribFreq: "yearly" });
    expect(round2(r.final)).toBe(3310);
    expect(r.rows).toHaveLength(3);
  });
});

describe("investment", () => {
  it("allows negative returns", () => {
    const r = invest({ initial: 10_000, monthly: 0, rate: -10, years: 2 });
    expect(round2(r.final)).toBe(8100);
  });

  it("fees and inflation", () => {
    const r = invest({ initial: 10_000, monthly: 0, rate: 10, fee: 1, inflation: 5, years: 1 });
    expect(round2(r.final)).toBe(10890); // 10000 · 1.1 · 0.99
    expect(round2(r.real)).toBe(10371.43); // 10890 / 1.05
  });
});

describe("retirement", () => {
  const base = { age: 30, retireAge: 65, endAge: 90, savings: 0, monthly: 500, increase: 0, returnPre: 7, returnPost: 4, inflation: 0, income: 2000 };

  it("accumulates contributions", () => {
    const r = retirement(base);
    expect(r.contributed).toBe(500 * 12 * 35);
    expect(r.nestEgg).toBeGreaterThan(r.contributed);
    expect(r.rule4Monthly).toBeCloseTo((r.nestEgg * 0.04) / 12, 6);
  });

  it("detects depletion", () => {
    const r = retirement({ ...base, monthly: 50, income: 5000 });
    expect(r.depletedAge).not.toBeNull();
    expect(r.depletedAge!).toBeLessThan(90);
    const rich = retirement({ ...base, savings: 5_000_000 });
    expect(rich.depletedAge).toBeNull();
  });

  it("required nest egg at 0 % return = income × months", () => {
    const r = retirement({ ...base, returnPost: 0, income: 1000, retireAge: 65, endAge: 75 });
    expect(round2(r.required)).toBe(120_000);
  });
});

describe("savings goal and inflation", () => {
  it("monthly deposit needed", () => {
    // 0 %: (12 000 − 0) / 12 = 1000
    expect(monthlyNeeded(12_000, 0, 0, 12)).toBe(1000);
    expect(monthlyNeeded(1000, 2000, 5, 12)).toBe(0);
    const pmt = monthlyNeeded(100_000, 10_000, 8, 36);
    expect(monthsNeeded(100_000, 10_000, 8, pmt + 0.01)).toBe(36);
  });

  it("months needed", () => {
    expect(monthsNeeded(1200, 0, 0, 100)).toBe(12);
    expect(monthsNeeded(1e9, 0, 0, 1)).toBeNull();
  });

  it("inflation", () => {
    expect(round2(futureCost(1000, 10, 2))).toBe(1210);
    expect(round2(presentValue(1210, 10, 2))).toBe(1000);
    expect(averageRate(100, 121, 2)).toBeCloseTo(10, 10);
    expect(cumulative([10, 10])).toBeCloseTo(21, 10);
  });
});
