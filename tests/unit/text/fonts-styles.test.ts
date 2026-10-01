import { describe, expect, it } from "vitest";
import {
  cyrillicNotice,
  DEFAULT_SEED,
  graphemes,
  MATH,
  SMALL_CAPS_CP,
  STYLE_IDS,
  STYLES,
  stylize,
  SUBSCRIPT_MISSING,
  SUPERSCRIPT_CAPS_AS_SMALL,
  SUPERSCRIPT_MISSING,
  xWeightedLength,
  ZALGO_AMOUNT,
  type MathStyleId,
  type StyleId,
} from "@/tools/text/fonts/lib/styles";

const cps = (s: string) => Array.from(s, (c) => c.codePointAt(0)!);
const cp1 = (id: StyleId, ch: string) => {
  const out = cps(stylize(id, ch));
  expect(out, `${id}(${ch})`).toHaveLength(1);
  return out[0];
};
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = UPPER.toLowerCase();
const DIGITS = "0123456789";
const CYR = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const FAMILY = "👨\u{200D}👩\u{200D}👧";
const MARKS = /\p{M}/gu;

describe("mathematical alphanumeric styles", () => {
  const ref: Record<MathStyleId, { A: number; Z: number; a: number; z: number; d0?: number; d9?: number }> = {
    bold: { A: 0x1d400, Z: 0x1d419, a: 0x1d41a, z: 0x1d433, d0: 0x1d7ce, d9: 0x1d7d7 },
    italic: { A: 0x1d434, Z: 0x1d44d, a: 0x1d44e, z: 0x1d467 },
    "bold-italic": { A: 0x1d468, Z: 0x1d481, a: 0x1d482, z: 0x1d49b },
    script: { A: 0x1d49c, Z: 0x1d4b5, a: 0x1d4b6, z: 0x1d4cf },
    "bold-script": { A: 0x1d4d0, Z: 0x1d4e9, a: 0x1d4ea, z: 0x1d503 },
    fraktur: { A: 0x1d504, Z: 0x2128, a: 0x1d51e, z: 0x1d537 },
    "double-struck": { A: 0x1d538, Z: 0x2124, a: 0x1d552, z: 0x1d56b, d0: 0x1d7d8, d9: 0x1d7e1 },
    "bold-fraktur": { A: 0x1d56c, Z: 0x1d585, a: 0x1d586, z: 0x1d59f },
    sans: { A: 0x1d5a0, Z: 0x1d5b9, a: 0x1d5ba, z: 0x1d5d3, d0: 0x1d7e2, d9: 0x1d7eb },
    "sans-bold": { A: 0x1d5d4, Z: 0x1d5ed, a: 0x1d5ee, z: 0x1d607, d0: 0x1d7ec, d9: 0x1d7f5 },
    "sans-italic": { A: 0x1d608, Z: 0x1d621, a: 0x1d622, z: 0x1d63b },
    "sans-bold-italic": { A: 0x1d63c, Z: 0x1d655, a: 0x1d656, z: 0x1d66f },
    monospace: { A: 0x1d670, Z: 0x1d689, a: 0x1d68a, z: 0x1d6a3, d0: 0x1d7f6, d9: 0x1d7ff },
  };

  for (const [id, r] of Object.entries(ref) as [MathStyleId, (typeof ref)[MathStyleId]][]) {
    it(`${id}: A, Z, a, z, 0, 9`, () => {
      expect(cp1(id, "A")).toBe(r.A);
      expect(cp1(id, "Z")).toBe(r.Z);
      expect(cp1(id, "a")).toBe(r.a);
      expect(cp1(id, "z")).toBe(r.z);
      if (r.d0 !== undefined) {
        expect(cp1(id, "0")).toBe(r.d0);
        expect(cp1(id, "9")).toBe(r.d9);
      } else {
        expect(stylize(id, DIGITS)).toBe(DIGITS);
      }
    });

    it(`${id}: every letter is one assigned code point that NFKC-folds back`, () => {
      for (const ch of UPPER + LOWER + (r.d0 !== undefined ? DIGITS : "")) {
        const out = stylize(id, ch);
        expect(cps(out), `${id}(${ch})`).toHaveLength(1);
        expect(/\p{Cn}/u.test(out), `${id}(${ch}) unassigned`).toBe(false);
        expect(out.normalize("NFKC"), `${id}(${ch})`).toBe(ch);
      }
    });
  }

  it("holes come from Letterlike Symbols with exact code points", () => {
    const holes: [MathStyleId, string, number][] = [
      ["italic", "h", 0x210e],
      ["script", "B", 0x212c],
      ["script", "E", 0x2130],
      ["script", "F", 0x2131],
      ["script", "H", 0x210b],
      ["script", "I", 0x2110],
      ["script", "L", 0x2112],
      ["script", "M", 0x2133],
      ["script", "R", 0x211b],
      ["script", "e", 0x212f],
      ["script", "g", 0x210a],
      ["script", "o", 0x2134],
      ["fraktur", "C", 0x212d],
      ["fraktur", "H", 0x210c],
      ["fraktur", "I", 0x2111],
      ["fraktur", "R", 0x211c],
      ["fraktur", "Z", 0x2128],
      ["double-struck", "C", 0x2102],
      ["double-struck", "H", 0x210d],
      ["double-struck", "N", 0x2115],
      ["double-struck", "P", 0x2119],
      ["double-struck", "Q", 0x211a],
      ["double-struck", "R", 0x211d],
      ["double-struck", "Z", 0x2124],
    ];
    for (const [id, ch, cp] of holes) expect(cp1(id, ch), `${id}(${ch})`).toBe(cp);
    const declared = Object.values(MATH).reduce((n, m) => n + Object.keys(m.holes ?? {}).length, 0);
    expect(declared).toBe(holes.length);
  });

  it("reference characters from the spec", () => {
    expect(cp1("bold", "A")).toBe(0x1d400);
    expect(cp1("italic", "h")).toBe(0x210e);
    expect(cp1("script", "B")).toBe(0x212c);
    expect(cp1("fraktur", "C")).toBe(0x212d);
    expect(cp1("double-struck", "R")).toBe(0x211d);
    expect(cp1("bold", "0")).toBe(0x1d7ce);
    expect(cp1("double-struck", "1")).toBe(0x1d7d9);
    expect(cp1("monospace", "a")).toBe(0x1d68a);
  });

  it("keeps diacritics on Latin letters and leaves Cyrillic alone", () => {
    expect(stylize("bold", "é")).toBe(String.fromCodePoint(0x1d41e) + "\u{0301}");
    for (const id of Object.keys(MATH) as MathStyleId[]) expect(stylize(id, CYR)).toBe(CYR);
  });
});

describe("enclosed, fullwidth and other letter styles", () => {
  it("fullwidth", () => {
    expect(cp1("fullwidth", "A")).toBe(0xff21);
    expect(cp1("fullwidth", "a")).toBe(0xff41);
    expect(cp1("fullwidth", "!")).toBe(0xff01);
    expect(cp1("fullwidth", "~")).toBe(0xff5e);
    expect(cp1("fullwidth", " ")).toBe(0x3000);
    const ascii = Array.from({ length: 0x5e }, (_, i) => String.fromCharCode(0x21 + i)).join("");
    expect(stylize("fullwidth", ascii).normalize("NFKC")).toBe(ascii);
  });

  it("circled", () => {
    expect(cp1("circled", "A")).toBe(0x24b6);
    expect(cp1("circled", "Z")).toBe(0x24cf);
    expect(cp1("circled", "a")).toBe(0x24d0);
    expect(cp1("circled", "z")).toBe(0x24e9);
    expect(cp1("circled", "0")).toBe(0x24ea);
    expect(cp1("circled", "1")).toBe(0x2460);
    expect(cp1("circled", "9")).toBe(0x2468);
    const all = UPPER + LOWER + DIGITS;
    expect(stylize("circled", all).normalize("NFKC")).toBe(all);
  });

  it("negative circled (capitals only)", () => {
    expect(cp1("circled-negative", "A")).toBe(0x1f150);
    expect(cp1("circled-negative", "a")).toBe(0x1f150);
    expect(cp1("circled-negative", "Z")).toBe(0x1f169);
    expect(cp1("circled-negative", "0")).toBe(0x24ff);
    expect(cp1("circled-negative", "1")).toBe(0x2776);
    expect(cp1("circled-negative", "9")).toBe(0x277e);
  });

  it("squared and negative squared (capitals only, no digits)", () => {
    expect(cp1("squared", "A")).toBe(0x1f130);
    expect(cp1("squared", "z")).toBe(0x1f149);
    expect(cp1("squared-negative", "A")).toBe(0x1f170);
    expect(cp1("squared-negative", "a")).toBe(0x1f170);
    expect(cp1("squared-negative", "Z")).toBe(0x1f189);
    expect(stylize("squared", DIGITS)).toBe(DIGITS);
    expect(stylize("squared-negative", DIGITS)).toBe(DIGITS);
    expect(stylize("squared", "ABC").normalize("NFKC")).toBe("ABC");
  });

  it("parenthesized", () => {
    expect(cp1("parenthesized", "a")).toBe(0x249c);
    expect(cp1("parenthesized", "z")).toBe(0x24b5);
    expect(cp1("parenthesized", "A")).toBe(0x1f110);
    expect(cp1("parenthesized", "Z")).toBe(0x1f129);
    expect(cp1("parenthesized", "1")).toBe(0x2474);
    expect(cp1("parenthesized", "9")).toBe(0x247c);
    expect(stylize("parenthesized", "0")).toBe("0");
    expect(stylize("parenthesized", "a").normalize("NFKC")).toBe("(a)");
  });

  it("superscript", () => {
    const digits = [0x2070, 0x00b9, 0x00b2, 0x00b3, 0x2074, 0x2075, 0x2076, 0x2077, 0x2078, 0x2079];
    expect(cps(stylize("superscript", DIGITS))).toEqual(digits);
    expect(cps(stylize("superscript", "+-=()"))).toEqual([0x207a, 0x207b, 0x207c, 0x207d, 0x207e]);
    expect(cp1("superscript", "a")).toBe(0x1d43);
    expect(cp1("superscript", "n")).toBe(0x207f);
    expect(cp1("superscript", "A")).toBe(0x1d2c);
    expect(cp1("superscript", "V")).toBe(0x2c7d);
    expect(SUPERSCRIPT_MISSING).toEqual(["Q", "q"]);
    for (const ch of SUPERSCRIPT_MISSING) expect(stylize("superscript", ch)).toBe(ch);
    for (const ch of UPPER + LOWER) {
      if (SUPERSCRIPT_MISSING.includes(ch)) continue;
      const out = stylize("superscript", ch);
      expect(out, ch).not.toBe(ch);
      // Capitals without a superscript capital use the small superscript letter.
      const folded = out.normalize("NFKC");
      expect(SUPERSCRIPT_CAPS_AS_SMALL.includes(ch) ? folded : folded.toUpperCase(), ch).toBe(SUPERSCRIPT_CAPS_AS_SMALL.includes(ch) ? ch.toLowerCase() : ch.toUpperCase());
    }
  });

  it("subscript", () => {
    expect(cps(stylize("subscript", DIGITS))).toEqual(Array.from({ length: 10 }, (_, i) => 0x2080 + i));
    expect(cp1("subscript", "a")).toBe(0x2090);
    expect(cp1("subscript", "A")).toBe(0x2090);
    expect(cp1("subscript", "i")).toBe(0x1d62);
    expect(cp1("subscript", "j")).toBe(0x2c7c);
    expect(SUBSCRIPT_MISSING).toEqual(["b", "c", "d", "f", "g", "q", "w", "y", "z"]);
    for (const ch of LOWER) {
      const out = stylize("subscript", ch);
      if (SUBSCRIPT_MISSING.includes(ch)) expect(out, ch).toBe(ch);
      else expect(out.normalize("NFKC"), ch).toBe(ch);
    }
    expect(LOWER.length - SUBSCRIPT_MISSING.length).toBe(17);
  });

  it("small caps use real small capital letters", () => {
    const expected = [
      0x1d00, 0x0299, 0x1d04, 0x1d05, 0x1d07, 0xa730, 0x0262, 0x029c, 0x026a, 0x1d0a, 0x1d0b, 0x029f, 0x1d0d, 0x0274, 0x1d0f, 0x1d18, 0x01eb, 0x0280,
      0xa731, 0x1d1b, 0x1d1c, 0x1d20, 0x1d21, 0x0078, 0x028f, 0x1d22,
    ];
    expect(SMALL_CAPS_CP).toEqual(expected);
    expect(cps(stylize("small-caps", LOWER))).toEqual(expected);
    expect(cps(stylize("small-caps", UPPER))).toEqual(expected);
    expect(stylize("small-caps", "x")).toBe("x");
    // Cyrillic: lowercased; а е о р с → Latin small capitals.
    expect(stylize("small-caps", "ПРИВЕТ")).toBe("пᴘивᴇт");
    expect(stylize("small-caps", "Привет")).toBe("пᴘивᴇт");
  });
});

describe("upside down and mirror", () => {
  it("flips and reverses", () => {
    expect(stylize("upside-down", "Hello")).toBe("ollǝH");
    expect(stylize("upside-down", "Привет")).toBe("ʇǝвиd⊔");
    expect(stylize("upside-down", "line1\nline2")).toBe(`${stylize("upside-down", "line2")}\n${stylize("upside-down", "line1")}`);
  });

  it("round-trips Latin letters, digits and punctuation", () => {
    const s = `${UPPER} ${LOWER} ${DIGITS} (x) [y] {z} <w> «q» ?!.,'"_&`;
    const once = stylize("upside-down", s);
    expect(once).not.toBe(s);
    expect(stylize("upside-down", once)).toBe(s);
  });

  it("mirror reverses each line and keeps line order", () => {
    expect(stylize("mirror", "Hello")).toBe("ollɘH");
    expect(stylize("mirror", "RN")).toBe("ИЯ");
    expect(stylize("mirror", "Я")).toBe("R");
    expect(stylize("mirror", "ab\ncd")).toBe("dɒ\nbɔ");
  });
});

describe("combining-mark styles", () => {
  const marks: Partial<Record<StyleId, number>> = {
    strikethrough: 0x0336,
    "slash-through": 0x0338,
    underline: 0x0332,
    "double-underline": 0x0333,
    overline: 0x0305,
    bubble: 0x20dd,
  };

  it("mark every Cyrillic letter per grapheme", () => {
    for (const [id, mark] of Object.entries(marks) as [StyleId, number][]) {
      expect(STYLES[id].mark).toBe(mark);
      const expected = Array.from("Привет", (c) => c + String.fromCodePoint(mark)).join("");
      expect(stylize(id, "Привет"), id).toBe(expected);
    }
  });

  it("put the mark after a whole grapheme cluster (decomposed й)", () => {
    expect(stylize("strikethrough", "и\u{0306}")).toBe("и\u{0306}\u{0336}");
  });

  it("line styles also mark spaces; slash-through and bubble don't", () => {
    expect(stylize("strikethrough", "a b")).toBe("a\u{0336} \u{0336}b\u{0336}");
    expect(stylize("underline", "a b")).toBe("a\u{0332} \u{0332}b\u{0332}");
    expect(stylize("slash-through", "a b")).toBe("a\u{0338} b\u{0338}");
    expect(stylize("bubble", "a, b!")).toBe("a\u{20DD}, b\u{20DD}!");
  });

  it("never break emoji sequences in any style", () => {
    for (const id of STYLE_IDS) {
      for (const emoji of [FAMILY, "1\u{FE0F}\u{20E3}", "🇰🇿", "❤\u{FE0F}"]) {
        const out = stylize(id, `a ${emoji} b`);
        expect(out.includes(emoji), `${id} broke ${emoji}`).toBe(true);
        expect(graphemes(out).includes(emoji), `${id} merged ${emoji}`).toBe(true);
      }
    }
    expect(graphemes(FAMILY)).toHaveLength(1);
  });
});

describe("zalgo and glitch", () => {
  const text = "Привет, world 123";

  it("are deterministic for a seed and default to DEFAULT_SEED", () => {
    for (const id of ["zalgo", "glitch"] as const) {
      expect(stylize(id, text)).toBe(stylize(id, text, { seed: DEFAULT_SEED }));
      expect(stylize(id, text, { seed: 42 })).toBe(stylize(id, text, { seed: 42 }));
      expect(stylize(id, text, { seed: 42 })).not.toBe(stylize(id, text, { seed: 43 }));
    }
  });

  it("only add combining marks", () => {
    for (const id of ["zalgo", "glitch"] as const) expect(stylize(id, text, { seed: 7 }).replace(MARKS, "")).toBe(text);
  });

  it("appending text keeps the marks of earlier letters", () => {
    expect(stylize("zalgo", `${text}!`).startsWith(stylize("zalgo", text))).toBe(true);
  });

  it("respects intensity ranges", () => {
    for (const level of ["light", "medium", "heavy"] as const) {
      const [min, max] = ZALGO_AMOUNT[level].reduce(([a, b], [x, y]) => [a + x, b + y], [0, 0]);
      for (const g of graphemes(stylize("zalgo", "abcdefghijklmnopqrstuvwxyz", { zalgo: level, seed: 99 }))) {
        const n = (g.match(MARKS) ?? []).length;
        expect(n, `${level}: ${g}`).toBeGreaterThanOrEqual(min);
        expect(n, `${level}: ${g}`).toBeLessThanOrEqual(max);
      }
    }
  });
});

describe("Cyrillic support flags match the engine", () => {
  const expected: Record<"full" | "partial" | "none", StyleId[]> = {
    full: ["bubble", "strikethrough", "slash-through", "underline", "double-underline", "overline", "zalgo", "glitch"],
    partial: ["small-caps", "upside-down", "mirror"],
    none: STYLE_IDS.filter((id) => !["bubble", "strikethrough", "slash-through", "underline", "double-underline", "overline", "zalgo", "glitch", "small-caps", "upside-down", "mirror"].includes(id)),
  };

  it("flags", () => {
    for (const [level, ids] of Object.entries(expected)) for (const id of ids) expect(STYLES[id].cyr, id).toBe(level);
  });

  it("none: Cyrillic is left exactly as is", () => {
    for (const id of expected.none) expect(stylize(id, CYR), id).toBe(CYR);
  });

  it("full: every Cyrillic letter is changed", () => {
    for (const id of expected.full) {
      for (const ch of CYR) expect(stylize(id, ch, { seed: 1 }), `${id}(${ch})`).not.toBe(ch);
    }
  });

  it("partial: some letters change, some don't", () => {
    for (const id of expected.partial) {
      const changed = Array.from(CYR).filter((ch) => stylize(id, ch) !== ch).length;
      expect(changed, id).toBeGreaterThan(0);
      expect(changed, id).toBeLessThan(CYR.length);
    }
  });

  it("notice only when the input has Cyrillic and the style doesn't fully support it", () => {
    expect(cyrillicNotice("bold", "Привет")).toBe("none");
    expect(cyrillicNotice("small-caps", "Привет")).toBe("partial");
    expect(cyrillicNotice("strikethrough", "Привет")).toBeNull();
    expect(cyrillicNotice("bold", "Hello")).toBeNull();
  });
});

describe("output sanity", () => {
  it("no style produces unassigned code points", () => {
    const ascii = Array.from({ length: 0x5f }, (_, i) => String.fromCharCode(0x20 + i)).join("");
    for (const id of STYLE_IDS) expect(/\p{Cn}/u.test(stylize(id, ascii + CYR)), id).toBe(false);
  });
});

describe("X (twitter-text) weighted length", () => {
  it("weights", () => {
    expect(xWeightedLength("Hello")).toBe(5);
    expect(xWeightedLength(stylize("bold", "Hello"))).toBe(10);
    expect(xWeightedLength("Привет")).toBe(6);
    expect(xWeightedLength(FAMILY)).toBe(2);
    expect(xWeightedLength(stylize("strikethrough", "ab"))).toBe(4);
    expect(xWeightedLength(stylize("fullwidth", "hi"))).toBe(4);
    expect(xWeightedLength("ᴀ")).toBe(2);
    expect(xWeightedLength("ʙ")).toBe(1);
    expect(xWeightedLength("“quote”")).toBe(7);
  });
});
