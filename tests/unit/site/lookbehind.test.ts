import { describe, expect, it } from "vitest";
import { execAllNotAfter, replaceNotAfter } from "@/lib/lookbehind";
import { replaceText } from "@/tools/text/text/lib/replace";

/** The helpers must give exactly what a native lookbehind gives (old Safari can't parse lookbehind at all). */
describe("lookbehind emulation", () => {
  const cases: [string, RegExp, RegExp, RegExp][] = [
    ["abc 123 x45 6,7 8", /\d+/g, /[\p{L}\p{N},]/u, /(?<![\p{L}\p{N},])\d+/gu],
    ["км2 xкм2 м3 см2", /((?:к|с|д|м)?м)([23])/gu, /\p{L}/u, /(?<!\p{L})((?:к|с|д|м)?м)([23])/gu],
    ["#tag a#b #1a &#x #ok", /#([\p{L}\p{N}_]*\p{L}[\p{L}\p{N}_]*)/gu, /[\p{L}\p{N}_&/#]/u, /(?<![\p{L}\p{N}_&/#])#([\p{L}\p{N}_]*\p{L}[\p{L}\p{N}_]*)/gu],
    ["😀a b😀c", /[a-c]/gu, /\p{Emoji_Presentation}/u, /(?<!\p{Emoji_Presentation})[a-c]/gu],
  ];
  for (const [text, re, notAfter, native] of cases) {
    it(`matches like ${native}`, () => {
      expect(execAllNotAfter(text, re, notAfter).map((m) => [m.index, m[0]])).toEqual([...text.matchAll(native)].map((m) => [m.index, m[0]]));
    });
  }

  it("replaces like String.replace with a lookbehind", () => {
    const s = "10-20, 1-2-3, a-b, 5-6";
    expect(replaceNotAfter(s, /(\d+)-(\d+)(?![\d\-–.:/])/g, /[\d\-–.:/]/, (m) => `${m[1]}–${m[2]}`)).toBe(s.replace(/(?<![\d\-–.:/])(\d+)-(\d+)(?![\d\-–.:/])/g, "$1–$2"));
  });

  it("whole-word replace works for Cyrillic without lookbehind", () => {
    const base = { regex: false, caseSensitive: false, wholeWord: true, multiline: true, dotAll: false, all: true, escapes: false };
    expect(replaceText({ ...base, text: "кот котик кот, скот", find: "кот", replace: "пёс" })).toEqual({ ok: true, text: "пёс котик пёс, скот", count: 2 });
    expect(replaceText({ ...base, all: false, text: "кот кот", find: "кот", replace: "пёс" })).toEqual({ ok: true, text: "пёс кот", count: 2 });
    expect(replaceText({ ...base, regex: true, wholeWord: false, text: "a1 b2", find: "([a-z])(\\d)", replace: "$2$1" })).toEqual({ ok: true, text: "1a 2b", count: 2 });
  });
});
