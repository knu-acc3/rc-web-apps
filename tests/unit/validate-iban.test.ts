import { describe, expect, it } from "vitest";
import { IBAN_COUNTRIES } from "@/sections/validate/data/iban-countries";
import { checkDigits, formatIban, mod97, structureRegex, validateIban } from "@/sections/validate/lib/iban";

describe("IBAN", () => {
  it("every registry example is valid (length, structure, mod-97)", () => {
    expect(IBAN_COUNTRIES.length).toBeGreaterThanOrEqual(85);
    for (const c of IBAN_COUNTRIES) {
      expect(c.example.length, c.code).toBe(c.length);
      expect(c.example.slice(0, 2)).toBe(c.code);
      expect(structureRegex(c.bban).test(c.example.slice(4)), `${c.code} structure`).toBe(true);
      expect(mod97(c.example), `${c.code} checksum`).toBe(1);
      const sum = [...c.bban.matchAll(/(\d+)!/g)].reduce((s, m) => s + Number(m[1]), 0);
      expect(sum + 4, `${c.code} bban length`).toBe(c.length);
      expect(validateIban(c.example).valid, c.code).toBe(true);
    }
  });

  it.each([
    ["KZ86125KZT5004100100", "125"],
    ["DE89 3704 0044 0532 0130 00", "37040044"],
    ["GB29 NWBK 6016 1331 9268 19", "NWBK"],
    ["FR14 2004 1010 0505 0001 3M02 606", "20041"],
  ])("valid %s", (iban, bank) => {
    const r = validateIban(iban);
    expect(r.valid).toBe(true);
    expect(r.bank).toBe(bank);
  });

  it("detects errors precisely", () => {
    expect(validateIban("KZ87125KZT5004100100").errors).toEqual(["checksum"]);
    expect(validateIban("KZ87125KZT5004100100").expectedCheck).toBe("86");
    expect(validateIban("DE8937040044053201300").errors).toContain("length");
    expect(validateIban("GB29NWBK6016133192681A").errors).toContain("structure");
    expect(validateIban("FR1420041010050500013M02607").errors).toEqual(["checksum"]);
    expect(validateIban("XX89370400440532013000").errors).toEqual(["country"]);
    // Russia: in the registry since 2023, 33 characters (BIK + 20-digit account).
    const ru = validateIban("RU03 0445 2522 5408 1781 0538 0913 1041 9");
    expect(ru.valid).toBe(true);
    expect([ru.bank, ru.branch, ru.account]).toEqual(["044525225", "40817", "810538091310419"]);
    expect(validateIban("RU0304452522540817810538091310418").errors).toEqual(["checksum"]);
    expect(validateIban("DE89 3704 0044 0532 0130 0!").errors).toEqual(["chars"]);
    expect(validateIban("").errors).toEqual(["empty"]);
  });

  it("computes check digits and formats", () => {
    expect(checkDigits("DE", "370400440532013000")).toBe("89");
    expect(checkDigits("KZ", "125KZT5004100100")).toBe("86");
    expect(formatIban("DE89370400440532013000")).toBe("DE89 3704 0044 0532 0130 00");
  });
});
