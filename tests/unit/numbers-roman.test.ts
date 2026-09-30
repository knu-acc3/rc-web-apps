import { describe, expect, it } from "vitest";
import { BAR, parseRoman, romanParts, toRoman, toRomanStandard } from "@/sections/numbers/roman";

describe("toRoman", () => {
  it.each([
    [1, "I"],
    [4, "IV"],
    [9, "IX"],
    [14, "XIV"],
    [40, "XL"],
    [49, "XLIX"],
    [90, "XC"],
    [400, "CD"],
    [444, "CDXLIV"],
    [900, "CM"],
    [1994, "MCMXCIV"],
    [2024, "MMXXIV"],
    [3999, "MMMCMXCIX"],
  ])("%i → %s", (n, r) => {
    expect(toRoman(n)).toBe(r);
  });

  it("rejects out-of-range values in standard mode", () => {
    expect(toRoman(0)).toBe("");
    expect(toRoman(4000)).toBe("");
    expect(toRoman(2.5)).toBe("");
    expect(toRomanStandard(-1)).toBe("");
  });

  it("uses vinculum above 3999", () => {
    expect(toRoman(4000, true)).toBe(`I${BAR}V${BAR}`);
    expect(toRoman(5000, true)).toBe(`V${BAR}`);
    expect(toRoman(10_001, true)).toBe(`X${BAR}I`);
    expect(toRoman(3_999_999, true)).toBe(`M${BAR}M${BAR}M${BAR}C${BAR}M${BAR}X${BAR}C${BAR}I${BAR}X${BAR}CMXCIX`);
    expect(toRoman(4_000_000, true)).toBe("");
    // below 4000 vinculum mode keeps the standard form
    expect(toRoman(3999, true)).toBe("MMMCMXCIX");
  });

  it("round-trips 1–3999 and samples of the vinculum range", () => {
    for (let n = 1; n <= 3999; n++) {
      const p = parseRoman(toRoman(n));
      expect(p.ok && p.value).toBe(n);
    }
    for (const n of [4000, 4999, 12_345, 100_000, 2_024_024, 3_999_999]) {
      const p = parseRoman(toRoman(n, true));
      expect(p.ok && p.value, String(n)).toBe(n);
    }
  });
});

describe("romanParts", () => {
  it("breaks 2024 into MM + XX + IV", () => {
    expect(romanParts(2024)).toEqual([
      { roman: "MM", value: 2000 },
      { roman: "XX", value: 20 },
      { roman: "IV", value: 4 },
    ]);
  });
  it("marks the overlined part", () => {
    expect(romanParts(5004, true)).toEqual([
      { roman: "V", value: 5000, barred: true },
      { roman: "IV", value: 4 },
    ]);
  });
});

describe("parseRoman", () => {
  it("accepts lowercase, spaces and Unicode numerals", () => {
    expect(parseRoman("mmxxiv")).toMatchObject({ ok: true, value: 2024 });
    expect(parseRoman(" XIV ")).toMatchObject({ ok: true, value: 14 });
    expect(parseRoman("Ⅻ")).toMatchObject({ ok: true, value: 12 });
  });

  it("flags IIII with the canonical IV", () => {
    expect(parseRoman("IIII")).toEqual({ ok: false, error: "noncanonical", value: 4, canonical: "IV", issue: { kind: "repeat", letter: "I", count: 4 } });
  });

  it("flags VV, LL, DD", () => {
    expect(parseRoman("VV")).toMatchObject({ ok: false, value: 10, canonical: "X", issue: { kind: "repeat-five", letter: "V" } });
    expect(parseRoman("DD")).toMatchObject({ ok: false, value: 1000, canonical: "M" });
  });

  it("flags invalid subtractive pairs", () => {
    expect(parseRoman("IC")).toMatchObject({ ok: false, value: 99, canonical: "XCIX", issue: { kind: "bad-subtract", pair: "IC" } });
    expect(parseRoman("IM")).toMatchObject({ ok: false, value: 999, canonical: "CMXCIX", issue: { kind: "bad-subtract", pair: "IM" } });
    expect(parseRoman("VX")).toMatchObject({ ok: false, value: 5, issue: { kind: "bad-subtract", pair: "VX" } });
  });

  it("flags wrong order", () => {
    expect(parseRoman("IIX")).toMatchObject({ ok: false, error: "noncanonical", canonical: "X" });
    expect(parseRoman("XIIX")).toMatchObject({ ok: false, error: "noncanonical" });
  });

  it("MMMM needs vinculum", () => {
    expect(parseRoman("MMMM")).toMatchObject({ ok: false, value: 4000, canonical: `I${BAR}V${BAR}`, issue: { kind: "repeat", letter: "M" } });
  });

  it("reports invalid characters", () => {
    expect(parseRoman("XIZ")).toEqual({ ok: false, error: "chars", chars: "Z" });
    expect(parseRoman("")).toEqual({ ok: false, error: "empty" });
  });

  it("reads overlined letters", () => {
    expect(parseRoman(`V${BAR}`)).toEqual({ ok: true, value: 5000, canonical: `V${BAR}`, vinculum: true });
    expect(parseRoman(`V̄I`)).toMatchObject({ ok: true, value: 5001 });
    // overlined thousands below 4000 should be written with M
    expect(parseRoman(`I${BAR}I${BAR}`)).toMatchObject({ ok: false, value: 2000, canonical: "MM" });
  });
});
