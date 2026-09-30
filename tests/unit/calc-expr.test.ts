import { describe, expect, it } from "vitest";
import { calculate, compile, errorText, ExprError, factorial, parse } from "@/sections/calc/expr/parser";

const c = (s: string, o: Parameters<typeof calculate>[1] = {}) => calculate(s, o);
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e instanceof ExprError ? e.code : "other";
  }
  return "ok";
};

describe("expression parser — precedence", () => {
  it("basic arithmetic and precedence", () => {
    expect(c("2+3*4")).toBe(14);
    expect(c("(2+3)*4")).toBe(20);
    expect(c("10/4")).toBe(2.5);
    expect(c("7 mod 3")).toBe(1);
    expect(c("2×3÷4")).toBe(1.5);
  });
  it("power is right-associative and binds tighter than unary minus", () => {
    expect(c("2^3^2")).toBe(512);
    expect(c("-2^2")).toBe(-4);
    expect(c("(-2)^2")).toBe(4);
    expect(c("2^-1")).toBe(0.5);
    expect(c("3²")).toBe(9);
  });
  it("implicit multiplication", () => {
    expect(c("2π")).toBeCloseTo(6.283185307179586, 12);
    expect(c("2(3+4)")).toBe(14);
    expect(c("(1+2)(3+4)")).toBe(21);
    expect(c("3sin(90)", { angle: "deg" })).toBe(3);
    expect(compile("2x")(5)).toBe(10);
    expect(compile("x2")(5)).toBe(10);
    expect(code(() => c("2 3"))).toBe("operator"); // not a thousands group → a missing operator
  });
  it("two bare numbers need an operator; thousands spaces are part of the number", () => {
    expect(c("1 000 + 1")).toBe(1001);
    expect(code(() => c("12 34"))).toBe("operator");
  });
});

describe("decimal comma and arguments", () => {
  it("Russian decimal comma", () => {
    expect(c("2,5*2", { decimalComma: true })).toBe(5);
    expect(c("log(8; 2)", { decimalComma: true })).toBeCloseTo(3, 12);
  });
  it("English comma separates arguments", () => {
    expect(c("log(8, 2)")).toBeCloseTo(3, 12);
    expect(c("nroot(27, 3)")).toBeCloseTo(3, 12);
  });
});

describe("functions", () => {
  it("degrees vs radians, exact special angles", () => {
    expect(c("sin(30)", { angle: "deg" })).toBe(0.5);
    expect(c("sin(180)", { angle: "deg" })).toBe(0);
    expect(c("cos(60)", { angle: "deg" })).toBe(0.5);
    expect(c("tan(45)", { angle: "deg" })).toBe(1);
    expect(c("sin(π/6)", { angle: "rad" })).toBeCloseTo(0.5, 12);
    expect(c("sin(π)", { angle: "rad" })).toBe(0);
    expect(c("asin(1)", { angle: "deg" })).toBeCloseTo(90, 10);
    expect(c("sin 30", { angle: "deg" })).toBe(0.5);
  });
  it("log is base 10, ln is natural", () => {
    expect(c("log(100)")).toBe(2);
    expect(c("lg(1000)")).toBeCloseTo(3, 12);
    expect(c("ln(e)")).toBe(1);
    expect(c("log2(8)")).toBe(3);
    expect(c("exp(0)")).toBe(1);
  });
  it("roots, factorial, percent", () => {
    expect(c("√16")).toBe(4);
    expect(c("sqrt(2)^2")).toBeCloseTo(2, 12);
    expect(c("5!")).toBe(120);
    expect(c("0!")).toBe(1);
    expect(factorial(0.5)).toBeCloseTo(0.886226925, 8); // Γ(1.5) = √π / 2
    expect(c("50%")).toBe(0.5);
    expect(c("(-8)^(1/3)")).toBeCloseTo(-2, 12);
    expect(c("cbrt(-27)")).toBe(-3);
  });
});

describe("errors", () => {
  it("syntax errors", () => {
    expect(code(() => parse("2+"))).toBe("operand");
    expect(code(() => parse("(1"))).toBe("unclosed");
    expect(code(() => parse("1)"))).toBe("extra-paren");
    expect(code(() => parse("foo(2)"))).toBe("unknown");
    expect(code(() => parse(""))).toBe("empty");
    expect(code(() => parse("2 $ 3"))).toBe("unexpected");
    expect(code(() => parse("x+1"))).toBe("x");
  });
  it("math errors in strict mode, NaN in the plotter", () => {
    expect(code(() => c("1/0"))).toBe("div0");
    expect(code(() => c("sqrt(-1)"))).toBe("domain");
    expect(code(() => c("ln(0)"))).toBe("domain");
    expect(code(() => c("(-3)!"))).toBe("domain");
    expect(compile("1/x")(0)).toBeNaN();
    expect(compile("ln(x)")(-1)).toBeNaN();
  });
  it("messages", () => {
    try {
      parse("sinn(2)");
    } catch (e) {
      expect(errorText("ru", e)).toBe("Неизвестная функция «sinn»");
    }
  });
});
