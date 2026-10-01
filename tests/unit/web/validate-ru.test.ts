import { describe, expect, it } from "vitest";
import { validateInn, validateOgrn, validateSnils } from "@/tools/web/validate/lib/ru";

describe("ИНН", () => {
  it("10-digit legal entity (Сбербанк 7707083893)", () => {
    expect(validateInn("7707083893")).toMatchObject({ valid: true, kind: "legal", region: "77" });
    expect(validateInn("7707083894")).toMatchObject({ valid: false, errors: ["checksum"], expected: "7707083893" });
  });
  it("12-digit individual (500100732259)", () => {
    expect(validateInn("500100732259")).toMatchObject({ valid: true, kind: "person", region: "50" });
    expect(validateInn("500100732258").errors).toEqual(["checksum2"]);
    expect(validateInn("500100732269").errors).toContain("checksum");
  });
  it("length and characters", () => {
    expect(validateInn("12345").errors).toEqual(["length"]);
    expect(validateInn("77070838a3").errors).toEqual(["chars"]);
  });
});

describe("СНИЛС", () => {
  it("112-233-445 95", () => {
    expect(validateSnils("112-233-445 95")).toMatchObject({ valid: true, formatted: "112-233-445 95" });
    expect(validateSnils("11223344594")).toMatchObject({ valid: false, errors: ["checksum"], expected: "112-233-445 95" });
  });
  it("sum ≥ 101 uses mod 101", () => {
    // 987-654-321: 9·9+8·8+7·7+6·6+5·5+4·4+3·3+2·2+1·1 = 285 → 285 mod 101 = 83
    expect(validateSnils("98765432183").valid).toBe(true);
  });
  it("numbers ≤ 001-001-998 have no checksum", () => {
    expect(validateSnils("00100199800").noChecksum).toBe(true);
  });
});

describe("ОГРН / ОГРНИП", () => {
  it("13-digit ОГРН (1027700132195)", () => {
    expect(validateOgrn("1027700132195")).toMatchObject({ valid: true, kind: "ogrn", year: 2002, region: "77", sign: 1 });
    expect(validateOgrn("1027700132196").expected).toBe("1027700132195");
  });
  it("15-digit ОГРНИП (304500116000157)", () => {
    expect(validateOgrn("304500116000157")).toMatchObject({ valid: true, kind: "ogrnip", year: 2004, region: "50", sign: 3 });
    expect(validateOgrn("304500116000158").valid).toBe(false);
  });
  it("length", () => {
    expect(validateOgrn("12345678901234").errors).toEqual(["length"]);
  });
});
