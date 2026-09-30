import { describe, expect, it } from "vitest";
import { formatSmart, parseNumber, plural } from "@/i18n/format";

describe("parseNumber", () => {
  it.each([
    ["1", 1],
    ["1,5", 1.5],
    ["1.5", 1.5],
    ["1 000", 1000],
    ["1 000,25", 1000.25],
    ["1,000.25", 1000.25],
    ["1.000.000", 1000000],
    ["1,000,000", 1000000],
    ["−5", -5],
    ["-0,5", -0.5],
    ["1e3", 1000],
    [".5", 0.5],
  ])("%s → %s", (input, expected) => {
    expect(parseNumber(input)).toBe(expected);
  });

  it.each(["", "abc", "0x1F", "1..2", "--1"])("rejects %s", (input) => {
    expect(parseNumber(input)).toBeNull();
  });
});

describe("formatSmart", () => {
  it("keeps integer zeros", () => {
    expect(formatSmart("en", 100)).toBe("100");
    expect(formatSmart("en", 240)).toBe("240");
  });
  it("uses locale separators", () => {
    expect(formatSmart("ru", 1234.5).replace(/\s/g, " ")).toBe("1 234,5");
    expect(formatSmart("en", 1234.5)).toBe("1,234.5");
  });
  it("switches to exponent for extreme values", () => {
    expect(formatSmart("en", 1.5e-9)).toContain("×10⁻⁹");
  });
});

describe("plural", () => {
  const f = ["километр", "километра", "километров", "километра"];
  it.each([
    [1, "километр"],
    [2, "километра"],
    [5, "километров"],
    [11, "километров"],
    [21, "километр"],
    [1.5, "километра"],
  ])("ru %s", (n, expected) => {
    expect(plural("ru", n, f)).toBe(expected);
  });
  it("en", () => {
    expect(plural("en", 1, ["mile", "miles"])).toBe("mile");
    expect(plural("en", 2, ["mile", "miles"])).toBe("miles");
  });
});
