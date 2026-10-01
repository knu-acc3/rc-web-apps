import { describe, expect, it } from "vitest";
import { angleAt, armsAngle, formatInchFraction, inchFraction, polar, rulerTicks, snapAngle, snapRuler } from "@/tools/convert/actual-size/lib/geometry";

describe("ruler ticks", () => {
  it("centimetre ruler: a tick every millimetre, labels every centimetre", () => {
    const t = rulerTicks("cm", 30);
    expect(t).toHaveLength(301);
    expect(t.filter((x) => x.label !== undefined)).toHaveLength(31);
    expect(t[100]).toEqual({ mm: 100, level: 0, label: "10" });
    expect(t[105].level).toBe(1);
    expect(t[103].level).toBe(2);
  });

  it("inch ruler: sixteenths with five tick levels", () => {
    const t = rulerTicks("in", 12);
    expect(t).toHaveLength(193);
    expect(t[16]).toEqual({ mm: 25.4, level: 0, label: "1" });
    expect(t[8].level).toBe(1);
    expect(t[4].level).toBe(2);
    expect(t[2].level).toBe(3);
    expect(t[1].level).toBe(4);
    expect(t[1].mm).toBeCloseTo(1.5875, 10);
    expect(t[192].mm).toBeCloseTo(304.8, 10);
  });

  it("snaps readings to the ruler resolution", () => {
    expect(snapRuler(12.26, "cm")).toBe(12.5);
    expect(snapRuler(12.2, "cm")).toBe(12);
    expect(snapRuler(4.3 * 25.4, "in")).toBeCloseTo((69 / 16) * 25.4, 10);
  });

  it("formats inch fractions", () => {
    expect(inchFraction(69)).toEqual({ whole: 4, num: 5, den: 16 });
    expect(formatInchFraction(69)).toBe("4 5/16");
    expect(formatInchFraction(8)).toBe("1/2");
    expect(formatInchFraction(20)).toBe("1 1/4");
    expect(formatInchFraction(48)).toBe("3");
    expect(formatInchFraction(0)).toBe("0");
  });
});

describe("protractor geometry", () => {
  it("measures angles counter-clockwise from the right, screen y down", () => {
    expect(angleAt(0, 0, 10, 0)).toBe(0);
    expect(angleAt(0, 0, 0, -10)).toBeCloseTo(90, 10);
    expect(angleAt(0, 0, -10, 0)).toBe(180);
    expect(angleAt(0, 0, -10, -0.0001)).toBeCloseTo(180, 2);
    expect(angleAt(0, 0, 10, -10)).toBeCloseTo(45, 10);
    expect(angleAt(0, 0, -10, -10)).toBeCloseTo(135, 10);
  });

  it("clamps points below the baseline to the nearest end", () => {
    expect(angleAt(0, 0, 10, 5)).toBe(0);
    expect(angleAt(0, 0, -10, 5)).toBe(180);
  });

  it("snaps and measures between arms", () => {
    expect(snapAngle(47.26, 0.5)).toBe(47.5);
    expect(snapAngle(47.26, 0.1)).toBe(47.3);
    expect(snapAngle(47.26, 1)).toBe(47);
    expect(snapAngle(181, 1)).toBe(180);
    expect(snapAngle(-3, 1)).toBe(0);
    expect(armsAngle(20, 130)).toBe(110);
    expect(armsAngle(130, 20)).toBe(110);
  });

  it("places points on the arc", () => {
    const p = polar(100, 100, 50, 90);
    expect(p.x).toBeCloseTo(100, 10);
    expect(p.y).toBeCloseTo(50, 10);
    const q = polar(0, 0, 10, 60);
    expect(q.x).toBeCloseTo(5, 10);
    expect(q.y).toBeCloseTo(-8.6603, 4);
  });
});
