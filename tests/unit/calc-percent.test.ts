import { describe, expect, it } from "vitest";
import { computePercent } from "@/sections/calc/percent/engine";

const v = (r: ReturnType<typeof computePercent>) => (r.ok ? r.value : NaN);

describe("percent engine", () => {
  it("x percent of y", () => {
    expect(v(computePercent("x-percent-of-y", 15, 200))).toBe(30);
    expect(v(computePercent("x-percent-of-y", 7, 1.1))).toBe(0.077);
    expect(v(computePercent("x-percent-of-y", 150, 80))).toBe(120);
  });

  it("what percent", () => {
    expect(v(computePercent("what-percent", 30, 200))).toBe(15);
    expect(v(computePercent("what-percent", 1, 3))).toBeCloseTo(33.3333333, 6);
    expect(computePercent("what-percent", 1, 0)).toEqual({ ok: false, error: "div0" });
  });

  it("percent change is measured against the original value", () => {
    expect(v(computePercent("percent-change", 80, 100))).toBe(25);
    expect(v(computePercent("percent-change", 100, 80))).toBe(-20);
    expect(v(computePercent("percent-change", -50, -25))).toBe(50);
    expect(computePercent("percent-change", 0, 5).ok).toBe(false);
  });

  it("add / subtract / reverse", () => {
    expect(v(computePercent("add-percent", 1000, 16))).toBe(1160);
    expect(v(computePercent("subtract-percent", 1000, 20))).toBe(800);
    expect(v(computePercent("reverse-percent", 30, 15))).toBe(200);
    expect(v(computePercent("reverse-percent", 1500, 75))).toBe(2000);
  });

  it("percentage points", () => {
    const r = computePercent("percentage-points", 12, 16);
    expect(r).toMatchObject({ ok: true, value: 4 });
    expect(r.ok && r.relative).toBeCloseTo(33.3333, 3);
  });
});
