import { describe, expect, it } from "vitest";
import { gs1Check, gs1Steps, gs1Valid, isbn10Check, msiMod10, upcEToA } from "@/sections/qr/lib/checkdigits";
import { prepareBarcode, SAMPLE, SYMBOLOGIES } from "@/sections/qr/lib/barcode";

describe("barcode input preparation", () => {
  it("accepts every sample", () => {
    for (const s of SYMBOLOGIES) expect(prepareBarcode(s, SAMPLE[s]).ok, s).toBe(true);
  });
  it("adds or verifies GS1 check digits", () => {
    expect(prepareBarcode("ean13", "400638133393")).toEqual({ ok: true, value: "4006381333931", check: "1", added: true });
    expect(prepareBarcode("ean13", "4006381333932")).toEqual({ ok: false, error: "check", expected: "4006381333931" });
    expect(prepareBarcode("ean13", "40063813339")).toMatchObject({ ok: false, error: "length" });
    expect(prepareBarcode("upca", "03600029145")).toMatchObject({ ok: true, value: "036000291452" });
    expect(prepareBarcode("itf14", "1001234567890")).toMatchObject({ ok: true, value: "10012345678902" });
    expect(prepareBarcode("upce", "425261")).toMatchObject({ ok: true, value: "04252614" });
    expect(prepareBarcode("upce", "24252614")).toMatchObject({ ok: false, error: "upceNs" });
  });
  it("checks character sets", () => {
    expect(prepareBarcode("code128", "Привет")).toMatchObject({ ok: false, error: "ascii" });
    expect(prepareBarcode("code39", "abc-1")).toMatchObject({ ok: true, value: "ABC-1" });
    expect(prepareBarcode("code39", "a_b")).toMatchObject({ ok: false, error: "code39" });
    expect(prepareBarcode("codabar", "40156")).toMatchObject({ ok: true, value: "A40156A" });
    expect(prepareBarcode("msi", "1234567")).toMatchObject({ ok: true, check: "4" });
  });
});

describe("GS1 check digits", () => {
  it.each([
    ["400638133393", 1], // EAN-13 4006381333931
    ["03600029145", 2], // UPC-A 036000291452
    ["9638507", 4], // EAN-8 96385074
    ["1001234567890", 2], // GTIN-14 10012345678902
    ["978030640615", 7], // ISBN-13 9780306406157
    ["460123456789", 3], // Russian GS1 prefix 460
  ])("%s → %d", (body, check) => {
    expect(gs1Check(body as string)).toBe(check);
  });

  it("validates full codes and shows steps", () => {
    expect(gs1Valid("4006381333931")).toBe(true);
    expect(gs1Valid("4006381333932")).toBe(false);
    expect(gs1Valid("036000291452")).toBe(true);
    const s = gs1Steps("400638133393");
    expect(s.sum).toBe(89);
    expect(s.check).toBe(1);
    expect(s.steps[0]).toEqual({ digit: 4, weight: 1, product: 4 });
    expect(s.steps[1]).toEqual({ digit: 0, weight: 3, product: 0 });
  });
});

describe("ISBN-10", () => {
  it("computes X", () => {
    expect(isbn10Check("030640615")).toBe("2");
    expect(isbn10Check("080442957")).toBe("X");
  });
});

describe("MSI and UPC-E", () => {
  it("MSI mod 10", () => {
    expect(msiMod10("1234567")).toBe(4);
  });
  it("UPC-E expansion", () => {
    // Known pair: UPC-E 04252614 ↔ UPC-A 042100005264
    expect(upcEToA("0", "425261")).toBe("04210000526");
    expect(gs1Check(upcEToA("0", "425261")!)).toBe(4);
    // X1X2X3X4X5 3 → X1X2X3 00000 X4X5
    expect(upcEToA("0", "123453")).toBe("01230000045");
    // X1..X5 with last digit 5–9 → X1..X5 0000 X6
    expect(upcEToA("0", "123457")).toBe("01234500007");
    expect(upcEToA("2", "123456")).toBeNull();
  });
});
