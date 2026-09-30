import { describe, expect, it } from "vitest";
import { annuityPayment, loanSchedule, yearlyTotals } from "@/sections/finance/engines/loan";

const sum = (xs: number[]) => Math.round(xs.reduce((s, x) => s + Math.round(x * 100), 0)) / 100;

describe("loan engine — annuity", () => {
  // 1 000 000 at 12 %/yr, 12 months: i = 0.01, P = 1e6·0.01/(1 − 1.01^−12) = 88 848.7887… → 88 848.79
  const r = loanSchedule({ principal: 1_000_000, annualRate: 12, months: 12, type: "annuity" });

  it("computes the textbook payment", () => {
    expect(annuityPayment(1_000_000, 12, 12)).toBe(88848.79);
    expect(r.firstPayment).toBe(88848.79);
    expect(r.months).toBe(12);
  });

  it("repays exactly the principal and ends at zero (last-payment true-up)", () => {
    expect(sum(r.rows.map((x) => x.principal))).toBe(1_000_000);
    expect(r.rows[11].balance).toBe(0);
    expect(Math.abs(r.lastPayment - r.firstPayment)).toBeLessThan(0.1);
    // Total interest = Σ payments − principal (kopeck-exact).
    expect(r.totalInterest).toBe(Math.round((r.totalPaid - 1_000_000) * 100) / 100);
    // 12 × 88 848.79 − 1 000 000 = 66 185.48; the last payment true-up changes it by at most a few kopecks.
    expect(Math.abs(r.totalInterest - 66185.48)).toBeLessThan(0.1);
  });

  it("first month interest is balance × i", () => {
    expect(r.rows[0].interest).toBe(10000);
    expect(r.rows[0].principal).toBe(78848.79);
  });

  it("works with a zero rate", () => {
    const z = loanSchedule({ principal: 1000, annualRate: 0, months: 3, type: "annuity" });
    expect(z.rows.map((x) => x.payment)).toEqual([333.33, 333.33, 333.34]);
    expect(z.totalInterest).toBe(0);
  });

  it("a long mortgage-like loan stays kopeck-exact", () => {
    const m = loanSchedule({ principal: 25_000_000, annualRate: 7, months: 300, type: "annuity" });
    // (1 + 0.07/12)^300 = 5.72567…, 25e6 · 0.0058333 / (1 − 1/5.72567) = 176 694.8…
    expect(m.firstPayment).toBeCloseTo(176694.8, 1);
    expect(sum(m.rows.map((x) => x.principal))).toBe(25_000_000);
    expect(m.rows[m.rows.length - 1].balance).toBe(0);
  });
});

describe("loan engine — differentiated", () => {
  const r = loanSchedule({ principal: 1_000_000, annualRate: 12, months: 12, type: "diff" });

  it("splits the principal evenly with the remainder in the last month", () => {
    expect(r.rows[0].principal).toBe(83333.33);
    expect(r.rows[11].principal).toBe(83333.37);
    expect(r.firstPayment).toBe(93333.33);
    expect(r.rows[11].balance).toBe(0);
  });

  it("total interest = S·i·(n+1)/2", () => {
    // 1e6 · 0.01 · 13 / 2 = 65 000
    expect(r.totalInterest).toBe(65000);
  });
});

describe("loan engine — early repayment", () => {
  const base = loanSchedule({ principal: 1_000_000, annualRate: 12, months: 24, type: "annuity" });

  it("reducing the term keeps the payment and shortens the loan", () => {
    const t = loanSchedule({ principal: 1_000_000, annualRate: 12, months: 24, type: "annuity", extras: [{ month: 3, amount: 300_000 }], extraMode: "term" });
    expect(t.months).toBeLessThan(24);
    expect(t.rows[5].payment).toBe(base.rows[5].payment);
    expect(t.totalInterest).toBeLessThan(base.totalInterest);
    expect(t.rows[t.rows.length - 1].balance).toBe(0);
    expect(sum(t.rows.map((x) => x.principal + x.extra))).toBe(1_000_000);
  });

  it("reducing the payment keeps the term", () => {
    const p = loanSchedule({ principal: 1_000_000, annualRate: 12, months: 24, type: "annuity", extras: [{ month: 3, amount: 300_000 }], extraMode: "payment" });
    expect(p.months).toBe(24);
    expect(p.rows[5].payment).toBeLessThan(base.rows[5].payment);
    expect(p.totalInterest).toBeLessThan(base.totalInterest);
  });

  it("a huge extra payment closes the loan", () => {
    const c = loanSchedule({ principal: 100_000, annualRate: 10, months: 12, type: "diff", extras: [{ month: 2, amount: 1e9 }] });
    expect(c.months).toBe(2);
    expect(c.rows[1].balance).toBe(0);
  });

  it("regular monthly extra shortens the term", () => {
    const x = loanSchedule({ principal: 1_000_000, annualRate: 12, months: 24, type: "annuity", monthlyExtra: 20_000 });
    expect(x.months).toBeLessThan(24);
  });

  it("aggregates by year", () => {
    const y = yearlyTotals(base.rows);
    expect(y).toHaveLength(2);
    expect(Math.round((y[0].principal + y[1].principal) * 100) / 100).toBe(1_000_000);
  });
});
