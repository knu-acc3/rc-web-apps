import { readFileSync } from "node:fs";
import { createElement, Fragment } from "react";
import { describe, expect, it } from "vitest";
import { clampNum, formatNum, parseNum, stepValue } from "@/lib/number-input";
import { nodeText, optionLabels } from "@/lib/option-labels";
import { fromPos, niceValue, STEPS, toPos } from "@/lib/slider-scale";
import { LOGO } from "@/site/logo-mark";

describe("NumberInput helpers", () => {
  it("parses typed numbers", () => {
    expect(parseNum("1 234,5")).toBe(1234.5);
    expect(parseNum("−3")).toBe(-3);
    expect(parseNum(".5")).toBe(0.5);
    expect(parseNum("")).toBeNull();
    expect(parseNum("-")).toBeNull();
    expect(parseNum("12abc")).toBeNull();
  });
  it("steps to the next multiple and clamps", () => {
    expect(stepValue(7, 1, 5, 0, 100)).toBe(10);
    expect(stepValue(10, 1, 5, 0, 100)).toBe(15);
    expect(stepValue(7, -1, 5, 0, 100)).toBe(5);
    expect(stepValue(100, 1, 5, 0, 100)).toBe(100);
    expect(stepValue(null, 1, 1, 0, 10)).toBe(0);
    expect(stepValue(0.2, 1, 0.1, 0, 1, 1)).toBe(0.3);
  });
  it("clamps and formats", () => {
    expect(clampNum(5.55, 0, 5, 1)).toBe(5);
    expect(formatNum(2.5, 1, "ru")).toBe("2,5");
    expect(formatNum(null, 0)).toBe("");
  });
});

describe("Select option labels", () => {
  it("reads options, groups, fragments and arrays", () => {
    const children = [
      createElement("option", { key: "a", value: "a" }, "Alpha"),
      createElement("optgroup", { key: "g", label: "G" }, [createElement("option", { key: "b", value: "b" }, "Be", "ta")]),
      createElement(Fragment, { key: "f" }, createElement("option", { value: 3 }, 3), false, null),
    ];
    expect(optionLabels(children)).toEqual([
      { value: "a", label: "Alpha" },
      { value: "b", label: "Beta" },
      { value: "3", label: "3" },
    ]);
    expect(nodeText(createElement("span", null, "x", 1))).toBe("x1");
  });
});

describe("slider scale", () => {
  it("round-trips linear and log positions", () => {
    expect(toPos(50, 0, 100)).toBe(STEPS / 2);
    expect(fromPos(STEPS / 2, 0, 100)).toBe(50);
    expect(fromPos(toPos(1_250_000, 0, 10_000_000, "log"), 0, 10_000_000, "log")).toBeCloseTo(1_250_000, -4);
    expect(toPos(-5, 0, 100)).toBe(0);
    expect(toPos(500, 0, 100)).toBe(STEPS);
  });
  it("rounds dragged values like a person would type them", () => {
    expect(niceValue(1_234_567, undefined, "log")).toBe(1_200_000);
    expect(niceValue(7.26, 0.1, "linear")).toBe(7.3);
    expect(niceValue(33.4, undefined, "linear")).toBe(33);
  });
});

describe("logo", () => {
  it("favicon.svg draws the same mark as the site logo", () => {
    const svg = readFileSync("public/favicon.svg", "utf8");
    expect(svg).toContain(LOGO.cookie);
    expect(svg).toContain(LOGO.spark);
    expect(svg).toContain(LOGO.color);
  });
});
