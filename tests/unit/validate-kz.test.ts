import { describe, expect, it } from "vitest";
import { detectKz, kzCheckDigit, parseBin, parseIin } from "@/sections/validate/lib/kz";

describe("Kazakhstan IIN", () => {
  it("male born 15.05.1990 (hand-computed check digit 9)", () => {
    const r = parseIin("900515312349");
    expect(r.valid).toBe(true);
    expect(r.birth).toEqual({ y: 1990, m: 5, d: 15 });
    expect(r.gender).toBe("m");
    expect(r.century).toBe(20);
    expect(r.serial).toBe("1234");
  });

  it("female born 28.02.2001 (check digit 0)", () => {
    const r = parseIin("010228 600010");
    expect(r.valid).toBe(true);
    expect(r.birth).toEqual({ y: 2001, m: 2, d: 28 });
    expect(r.gender).toBe("f");
    expect(r.century).toBe(21);
  });

  it("rejects bad checksum, dates and century digits", () => {
    expect(parseIin("900515312348").errors).toEqual(["checksum"]);
    expect(parseIin("900230312349").errors).toContain("date");
    expect(parseIin("900515712349").errors).toContain("century");
    expect(parseIin("90051531234").errors).toEqual(["length"]);
    expect(parseIin("9005153123ab").errors).toEqual(["chars"]);
  });

  it("second weight pass when the first remainder is 10", () => {
    // find a prefix whose first-pass remainder is 10 and check the second pass is used
    const w1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const w2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];
    let found = false;
    for (let n = 0; n < 2000 && !found; n++) {
      const p = `900515${String(3)}${String(n).padStart(4, "0")}`;
      const d = Array.from(p, Number);
      if (d.reduce((s, x, i) => s + x * w1[i], 0) % 11 !== 10) continue;
      const second = d.reduce((s, x, i) => s + x * w2[i], 0) % 11;
      expect(kzCheckDigit(p)).toBe(second === 10 ? null : second);
      found = true;
    }
    expect(found).toBe(true);
  });
});

describe("Kazakhstan BIN", () => {
  it("resident legal entity, head office, registered 05.2004 (check digit 6)", () => {
    const r = parseBin("040540123456");
    expect(r.valid).toBe(true);
    expect(r.year).toBe(2004);
    expect(r.month).toBe(5);
    expect(r.type).toBe(4);
    expect(r.attr).toBe(0);
    expect(r.serial).toBe("12345");
  });

  it("rejects invalid type, month and checksum", () => {
    expect(parseBin("040540123457").errors).toEqual(["checksum"]);
    expect(parseBin("041540123456").errors).toContain("month");
    expect(parseBin("040570123456").errors).toContain("type");
  });

  it("detects IIN vs BIN", () => {
    expect(detectKz("040540123456")).toBe("bin");
    expect(detectKz("900515312349")).toBe("iin");
  });
});
