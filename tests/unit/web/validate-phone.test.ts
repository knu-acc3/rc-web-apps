import * as lib from "libphonenumber-js/max";
import { describe, expect, it } from "vitest";
import { analyzePhone } from "@/tools/web/validate/lib/phone";

describe("phone numbers", () => {
  it("Kazakhstan mobile +7 701 …", () => {
    const r = analyzePhone(lib, "+7 701 234 5678", "KZ", "KZ");
    expect(r).toMatchObject({ valid: true, country: "KZ", type: "MOBILE", e164: "+77012345678", otherCountry: false });
    expect(analyzePhone(lib, "8 701 234 56 78", "KZ", "KZ").country).toBe("KZ");
  });

  it("+7 9xx is Russia, not Kazakhstan", () => {
    const r = analyzePhone(lib, "+7 912 345 67 89", "KZ", "KZ");
    expect(r.country).toBe("RU");
    expect(r.otherCountry).toBe(true);
  });

  it("formats E.164, international, national and tel: URI", () => {
    const r = analyzePhone(lib, "+74951234567", "RU", "RU");
    expect(r).toMatchObject({ valid: true, type: "FIXED_LINE", international: "+7 495 123 45 67", national: "8 (495) 123-45-67", uri: "tel:+74951234567" });
  });

  it("reports length problems", () => {
    const r = analyzePhone(lib, "+7 701 234", "KZ", "KZ");
    expect(r.valid).toBe(false);
    expect(r.lengthIssue).toBe("TOO_SHORT");
  });
});
