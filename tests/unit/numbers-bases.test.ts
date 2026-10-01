import { describe, expect, it } from "vitest";
import { convertInt, divisionSteps, formatBase, formattedText, fromTwos, groupDigits, parseBase, toTwos } from "@/sections/numbers/lib/bases";
import { toScientific, toEngineering, toPlain, parseScientific, roundSig } from "@/sections/numbers/lib/scientific";

const conv = (s: string, from: number, to: number, maxFrac = 32) => {
  const p = parseBase(s, from);
  if (!p.ok) throw new Error(`${s}: ${p.error}`);
  return formattedText(formatBase(p.value, to, maxFrac));
};

describe("base conversion", () => {
  it.each([
    ["255", 10, 16, "FF"],
    ["255", 10, 2, "11111111"],
    ["FF", 16, 10, "255"],
    ["777", 8, 10, "511"],
    ["101010", 2, 10, "42"],
    ["zz", 36, 10, "1295"],
    ["-42", 10, 2, "-101010"],
    ["18446744073709551615", 10, 16, "FFFFFFFFFFFFFFFF"],
    ["123456789012345678901234567890", 10, 36, "BYW97UM9S91DLZ68TSI"],
  ])("%s (base %i) → base %i = %s", (s, a, b, r) => {
    expect(conv(s, a, b)).toBe(r);
  });

  it("converts fractions with repeating periods", () => {
    expect(conv("0.1", 10, 2)).toBe("0.0(0011)");
    expect(conv("0.5", 10, 2)).toBe("0.1");
    expect(conv("10.625", 10, 2)).toBe("1010.101");
    expect(conv("0.1", 3, 10)).toBe("0.(3)");
    expect(conv("A.8", 16, 10)).toBe("10.5");
    expect(conv("0,75", 10, 16)).toBe("0.C");
    // π approximation that neither terminates nor repeats quickly gets cut
    expect(conv("3.14159", 10, 2, 8)).toBe("11.00100100…");
  });

  it("accepts 0x/0b/0o prefixes in any mode", () => {
    const hexInDec = parseBase("0xFF", 10);
    expect(hexInDec.ok && hexInDec.base).toBe(16);
    expect(hexInDec.ok && hexInDec.value.int).toBe(255n);
    const binInHex = parseBase("0b101", 16); // b is a hex digit → read as hex 0B101
    expect(binInHex.ok && binInHex.value.int).toBe(0xb101n);
    const oct = parseBase("0o17", 2);
    expect(oct.ok && oct.value.int).toBe(15n);
    const x = parseBase("-0x10", 10);
    expect(x.ok && x.value.neg && x.value.int).toBe(16n);
  });

  it("reports invalid digits and handles separators", () => {
    expect(parseBase("102", 2)).toMatchObject({ ok: false, error: "digit", char: "2" });
    expect(parseBase("1.2.3", 10)).toMatchObject({ ok: false, error: "format" });
    expect(parseBase("1111_0000", 2)).toMatchObject({ ok: true, value: { int: 240n } });
    expect(parseBase("1,000,000", 10)).toMatchObject({ ok: true, value: { int: 1000000n } });
    expect(convertInt("1 000", 10, 16)).toBe("3E8");
  });

  it("two's complement", () => {
    expect(toTwos(-1n, 8)).toBe(255n);
    expect(toTwos(-5n, 8)!.toString(2)).toBe("11111011");
    expect(toTwos(-128n, 8)).toBe(128n);
    expect(toTwos(128n, 8)).toBeNull();
    expect(toTwos(-129n, 8)).toBeNull();
    expect(toTwos(-1n, 64)!.toString(16)).toBe("ffffffffffffffff");
    expect(toTwos(-2147483648n, 32)!.toString(16)).toBe("80000000");
    expect(fromTwos(0xfbn, 8)).toBe(-5n);
    expect(fromTwos(0x7fn, 8)).toBe(127n);
    expect(fromTwos(0x1ffn, 8)).toBeNull();
    expect(fromTwos(0xffffn, 16)).toBe(-1n);
  });

  it("grouping and steps", () => {
    expect(groupDigits("11111111", 4)).toBe("1111 1111");
    expect(groupDigits("1234567", 3)).toBe("1 234 567");
    expect(divisionSteps(13n, 2).map((s) => s.r)).toEqual([1, 0, 1, 1]);
  });
});

describe("scientific notation", () => {
  const sci = (s: string, sig: number | null = null) => {
    const x = parseScientific(s);
    if (!x) throw new Error(s);
    const n = toScientific(x, sig);
    return `${n.mantissa}e${n.exponent}`;
  };

  it("parses many notations", () => {
    expect(sci("123456")).toBe("1.23456e5");
    expect(sci("0.00042")).toBe("4.2e-4");
    expect(sci("6.022e23")).toBe("6.022e23");
    expect(sci("6,022×10^23")).toBe("6.022e23");
    expect(sci("1.5 · 10²")).toBe("1.5e2");
    expect(sci("-3.2E-5")).toBe("-3.2e-5");
    expect(sci("10^-3")).toBe("1e-3");
    expect(sci("0")).toBe("0e0");
    expect(sci("123456789012345678901234567890")).toBe("1.2345678901234567890123456789e29");
    expect(parseScientific("12abc")).toBeNull();
  });

  it("rounds significant figures exactly", () => {
    expect(sci("123456", 3)).toBe("1.23e5");
    expect(sci("99999", 3)).toBe("1.00e5");
    expect(sci("0.1", 3)).toBe("1.00e-1");
    expect(roundSig(parseScientific("0.0995")!, 2)).toEqual({ digits: "10", mag: -1 });
  });

  it("engineering and plain", () => {
    const eng = (s: string) => {
      const n = toEngineering(parseScientific(s)!);
      return `${n.mantissa}e${n.exponent}`;
    };
    expect(eng("12345")).toBe("12.345e3");
    expect(eng("0.00042")).toBe("420e-6");
    expect(eng("1e7")).toBe("10e6");
    expect(toPlain(parseScientific("1.23e-7")!)).toBe("0.000000123");
    expect(toPlain(parseScientific("4.5e6")!)).toBe("4500000");
    expect(toPlain(parseScientific("12.5")!)).toBe("12.5");
    expect(toPlain(parseScientific("1e1000")!)).toBeNull();
  });
});
