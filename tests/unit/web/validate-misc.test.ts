import { describe, expect, it } from "vitest";
import { validateIsbn } from "@/tools/web/validate/lib/isbn";
import { modelYears, regionOf, validateVin, vinCheckDigit } from "@/tools/web/validate/lib/vin";

describe("ISBN", () => {
  it("ISBN-10 and conversion to ISBN-13", () => {
    expect(validateIsbn("0-306-40615-2")).toMatchObject({ valid: true, kind: 10, isbn13: "9780306406157" });
    expect(validateIsbn("080442957X")).toMatchObject({ valid: true, kind: 10 });
    expect(validateIsbn("0306406153")).toMatchObject({ valid: false, errors: ["checksum"], expected: "0306406152" });
  });
  it("ISBN-13 and conversion to ISBN-10", () => {
    expect(validateIsbn("ISBN 978-0-306-40615-7")).toMatchObject({ valid: true, kind: 13, isbn10: "0306406152" });
    expect(validateIsbn("9790306406156").isbn10).toBeUndefined();
    expect(validateIsbn("9780306406158").errors).toEqual(["checksum"]);
    expect(validateIsbn("4006381333931").errors).toEqual(["prefix"]);
  });
});

describe("VIN", () => {
  it("valid North American VIN 1HGCM82633A004352", () => {
    const r = validateVin("1HGCM82633A004352");
    expect(r.valid).toBe(true);
    expect(r.checkOk).toBe(true);
    expect(r.region).toBe("north-america");
    expect(r.wmi).toBe("1HG");
    expect(r.years).toEqual([2003, 2033]);
    expect(vinCheckDigit("1HGCM82633A004352")).toBe("3");
  });
  it("check digit mismatch and forbidden letters", () => {
    expect(validateVin("1HGCM82643A004352").checkOk).toBe(false);
    expect(validateVin("1HGCM8263QA004352").errors).toContain("ioq");
    expect(validateVin("1HGCM8263").errors).toContain("length");
  });
  it("regions and model years", () => {
    expect(regionOf("W")).toBe("europe");
    expect(regionOf("X")).toBe("europe");
    expect(regionOf("J")).toBe("asia");
    expect(regionOf("9")).toBe("south-america");
    expect(modelYears("A")).toEqual([1980, 2010]);
    expect(modelYears("Y")).toEqual([2000, 2030]);
    expect(modelYears("9")).toEqual([2009, 2039]);
    expect(modelYears("0")).toBeNull();
  });
});
