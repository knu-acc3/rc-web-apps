import { describe, expect, it } from "vitest";
import { detectBrand, formatCard, luhn, luhnCheckDigit, validateCard } from "@/sections/validate/lib/card";

const withCheck = (prefix: string, len: number) => {
  const body = prefix.padEnd(len - 1, "0");
  return body + luhnCheckDigit(body);
};

describe("Luhn", () => {
  it("known numbers", () => {
    expect(luhn("4111111111111111")).toBe(true);
    expect(luhn("5555555555554444")).toBe(true);
    expect(luhn("378282246310005")).toBe(true);
    expect(luhn("79927398713")).toBe(true);
    expect(luhn("4111111111111112")).toBe(false);
    expect(luhnCheckDigit("7992739871")).toBe(3);
  });
});

describe("brand ranges", () => {
  it.each([
    ["4111111111111111", "visa"],
    ["5105105105105100", "mastercard"],
    ["2221000000000009", "mastercard"],
    ["2720999999999996", "mastercard"],
    ["2200000000000004", "mir"],
    ["2204999999999992", "mir"],
    ["378282246310005", "amex"],
    ["341111111111111", "amex"],
    ["3530111333300000", "jcb"],
    ["6200000000000005", "unionpay"],
    ["6011111111111117", "discover"],
    ["36227206271667", "diners"],
    ["6759649826438453", "maestro"],
  ])("%s → %s", (num, brand) => {
    expect(detectBrand(num)?.id).toBe(brand);
  });

  it("range boundaries", () => {
    expect(detectBrand("2205000000000000")?.id).toBeUndefined();
    expect(detectBrand("2220999999999999")?.id).toBeUndefined();
    expect(detectBrand("2721000000000000")?.id).toBeUndefined();
    expect(detectBrand("5000000000000000")?.id).toBeUndefined();
    expect(detectBrand("5600000000000000")?.id).toBeUndefined();
  });

  it("validation and formatting", () => {
    const mir = withCheck("2202", 16);
    expect(validateCard(mir)).toMatchObject({ valid: true, brand: { id: "mir" } });
    expect(validateCard("4111 1111 1111 1111").formatted).toBe("4111 1111 1111 1111");
    expect(validateCard("3782 822463 10005").formatted).toBe("3782 822463 10005");
    expect(validateCard("378282246310005").formatted).toBe("3782 822463 10005");
    expect(validateCard("4111111111111112").errors).toEqual(["luhn"]);
    expect(validateCard(withCheck("51", 15)).errors).toContain("length");
    expect(validateCard("41111").errors).toEqual(["short"]);
    expect(validateCard("4111-1111-1111-111a").errors).toEqual(["chars"]);
    expect(formatCard("22020000000000000", null)).toBe("2202 0000 0000 0000 0");
  });
});
