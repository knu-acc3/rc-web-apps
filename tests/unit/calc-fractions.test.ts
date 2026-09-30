import { describe, expect, it } from "vitest";
import { approximate, decimalExpansion, parseQ, q, toMixed, toText } from "@/sections/calc/algebra/rational";
import { operate } from "@/sections/calc/fractions/engine";

const P = (s: string) => parseQ(s)!;
const R = (a: string, op: "+" | "-" | "*" | "/", b: string) => toText(operate(P(a), op, P(b)).result);

describe("rational parsing", () => {
  it("fractions, mixed numbers, decimals", () => {
    expect(toText(P("3/4"))).toBe("3/4");
    expect(toText(P("-6/8"))).toBe("−3/4");
    expect(toText(P("1 2/3"))).toBe("5/3");
    expect(toText(P("−1 1/2"))).toBe("−3/2");
    expect(toText(P("0,125"))).toBe("1/8");
    expect(toText(P("0.5/2"))).toBe("1/4");
    expect(parseQ("1/0")).toBeNull();
    expect(parseQ("abc")).toBeNull();
  });
  it("repeating decimals", () => {
    expect(toText(P("0,(3)"))).toBe("1/3");
    expect(toText(P("1,2(34)"))).toBe("611/495");
    expect(toText(P("0.1(6)"))).toBe("1/6");
    expect(toText(P("0,(27)"))).toBe("3/11");
  });
});

describe("fraction arithmetic", () => {
  it("reference results", () => {
    expect(R("1/2", "+", "1/3")).toBe("5/6");
    expect(R("3/4", "-", "5/6")).toBe("−1/12");
    expect(R("2/3", "*", "9/4")).toBe("3/2");
    expect(R("1 2/3", "/", "5/6")).toBe("2");
    expect(toText(q(42, 56))).toBe("3/4");
  });
  it("steps for addition with different denominators", () => {
    const r = operate(P("1/4"), "+", P("1/6"));
    expect(r.steps.map((s) => s.kind)).toEqual(["lcm", "expand", "combine"]);
    expect(r.steps[0].n).toBe("12");
    expect(toText(r.result)).toBe("5/12");
  });
  it("big numbers stay exact", () => {
    const big = operate(P("123456789012345678901234567890/7"), "*", P("7/3"));
    expect(toText(big.result)).toBe("41152263004115226300411522630");
  });
});

describe("conversions", () => {
  it("decimal expansion with period", () => {
    expect(decimalExpansion(q(1, 3))).toMatchObject({ int: "0", fixed: "", repeat: "3" });
    expect(decimalExpansion(q(7, 12))).toMatchObject({ int: "0", fixed: "58", repeat: "3" });
    expect(decimalExpansion(q(1, 8))).toMatchObject({ fixed: "125", repeat: null });
  });
  it("mixed numbers", () => {
    expect(toMixed(q(-7, 3))).toEqual({ negative: true, whole: 2n, num: 1n, den: 3n });
  });
  it("best rational approximation", () => {
    expect(toText(approximate(Math.PI, 1000))).toBe("355/113");
    expect(toText(approximate(0.75))).toBe("3/4");
  });
});
