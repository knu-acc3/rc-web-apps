import { describe, expect, it } from "vitest";
import { compile } from "@/sections/calc/expr/parser";
import { DEFAULT_VIEW, gridStep, pan, parseView, sample, serializeView, zoomAt } from "@/sections/calc/graph/sampling";

describe("graph sampling", () => {
  it("draws a continuous parabola as one segment", () => {
    const segs = sample(compile("x^2"), DEFAULT_VIEW, 400);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toHaveLength(401);
  });

  it("breaks tan(x) at its asymptotes", () => {
    const segs = sample(compile("tan(x)"), DEFAULT_VIEW, 800);
    // asymptotes at ±π/2, ±3π/2, ±5π/2 inside [−10, 10] → 7 visible branches
    expect(segs.length).toBe(7);
  });

  it("breaks 1/x at zero and skips NaN (ln x for x ≤ 0)", () => {
    expect(sample(compile("1/x"), DEFAULT_VIEW, 400).length).toBe(2);
    const ln = sample(compile("ln(x)"), DEFAULT_VIEW, 400);
    expect(ln).toHaveLength(1);
    expect(ln[0][0][0]).toBeGreaterThan(0);
  });

  it("log is base 10 in the plotter too", () => {
    expect(compile("log(x)")(100)).toBe(2);
    expect(compile("ln(x)")(Math.E)).toBe(1);
  });
});

describe("view window", () => {
  it("zooms around a point and pans", () => {
    const z = zoomAt(DEFAULT_VIEW, 0.5, 0, 0);
    expect(z).toEqual({ x0: -5, x1: 5, y0: -3, y1: 3 });
    expect(pan(z, 1, -1)).toEqual({ x0: -4, x1: 6, y0: -4, y1: 2 });
  });
  it("serializes and parses", () => {
    expect(parseView(serializeView(DEFAULT_VIEW))).toEqual(DEFAULT_VIEW);
    expect(parseView("1_0_0_1")).toBeNull();
    expect(parseView("a_b")).toBeNull();
  });
  it("grid steps are 1, 2 or 5 × 10ⁿ", () => {
    expect(gridStep(20, 800)).toBe(2);
    expect(gridStep(1000, 800)).toBe(100);
    expect(gridStep(0.01, 800)).toBe(0.001);
  });
});
