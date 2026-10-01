import { describe, expect, it } from "vitest";
import * as phoneLib from "libphonenumber-js/max";
import { computeDiff } from "@/tools/text/text/lib/diff";
import { extractDates, extractEmails, extractHashtags, extractMentions, extractNumbers, extractPhones, extractUrls } from "@/tools/text/text/lib/extract";
import { addPrefixSuffix, filterLines, joinLines, numberLines, removeEmptyLines, repeatText, splitToLines, wrapText } from "@/tools/text/text/lib/lineTools";
import { generateLorem, latinToCyrillicLorem, loremToHtml, ruAdjForms, ruNounAcc } from "@/tools/text/text/lib/lorem";
import { replaceText, type ReplaceRequest } from "@/tools/text/text/lib/replace";
import { wordCount } from "@/tools/text/text/lib/textOps";

const sample =
  "Пишите на info@example.kz или sales@пример.рф, копия — @manager (не путать с user@mail.ru).\n" +
  "Сайт: https://example.kz/contacts?utm=1, зеркало www.example.com и example.org/help.\n" +
  "Телефоны: +7 (701) 123-45-67, 8 (727) 355-00-00. Не телефоны: 12.03.2024, 192.168.1.1, 2024-01-15.\n" +
  "Цена 1 250 000 ₸, скидка 15,5 %, оборот 1,000,000 $. #скидки #Алматы2025 встреча 5 марта 2025 года. (см. https://ru.wikipedia.org/wiki/Алматы_(город))";

describe("extract", () => {
  it("emails (incl. IDN)", () => {
    expect(extractEmails(sample)).toEqual(["info@example.kz", "sales@пример.рф", "user@mail.ru"]);
  });
  it("urls, trailing punctuation and balanced brackets", () => {
    expect(extractUrls(sample)).toEqual(["https://example.kz/contacts?utm=1", "www.example.com", "https://ru.wikipedia.org/wiki/Алматы_(город)"]);
    expect(extractUrls(sample, true)).toEqual(["https://example.kz/contacts?utm=1", "www.example.com", "example.org/help", "https://ru.wikipedia.org/wiki/Алматы_(город)"]);
  });
  it("mentions are not taken from e-mail addresses", () => {
    expect(extractMentions(sample)).toEqual(["@manager"]);
  });
  it("hashtags in any script", () => {
    expect(extractHashtags(sample)).toEqual(["#скидки", "#Алматы2025"]);
    expect(extractHashtags("page.html#anchor and #1 and C#")).toEqual([]);
  });
  it("numbers keep thousands separators together", () => {
    const n = extractNumbers("Цена 1 250 000 ₸, скидка 15,5 %, оборот 1,000,000 $ и -3.");
    expect(n).toEqual(["1 250 000", "15,5", "1,000,000", "-3"]);
    expect(extractNumbers("v2 и x1")).toEqual([]);
  });
  it("dates in several formats", () => {
    expect(extractDates(sample)).toEqual(["12.03.2024", "2024-01-15", "5 марта 2025 года"]);
    expect(extractDates("Due March 5, 2025 or 15 Jan")).toEqual(["March 5, 2025", "15 Jan"]);
  });
  it("phones via libphonenumber-js: no dates, no IPs", () => {
    const phones = extractPhones(sample, phoneLib, "KZ", "e164");
    expect(phones).toEqual(["+77011234567", "+77273550000"]);
    expect(extractPhones("12.03.2024 192.168.1.1 2024-01-15", phoneLib, "RU")).toEqual([]);
  });
});

describe("replace", () => {
  const base: ReplaceRequest = { text: "", find: "", replace: "", regex: false, caseSensitive: false, wholeWord: false, multiline: true, dotAll: false, all: true, escapes: false };
  it("literal replacement treats $ literally", () => {
    expect(replaceText({ ...base, text: "a.b.c", find: ".", replace: "$&" })).toEqual({ ok: true, text: "a$&b$&c", count: 2 });
  });
  it("whole word works for Cyrillic", () => {
    const r = replaceText({ ...base, text: "кот котёнок Кот скот", find: "кот", replace: "пёс", wholeWord: true });
    expect(r).toEqual({ ok: true, text: "пёс котёнок пёс скот", count: 2 });
  });
  it("regex with groups and the m flag", () => {
    expect(replaceText({ ...base, regex: true, text: "2025-09-30", find: "(\\d+)-(\\d+)-(\\d+)", replace: "$3.$2.$1" })).toMatchObject({ text: "30.09.2025" });
    expect(replaceText({ ...base, regex: true, text: "a\n\n\nb\n", find: "^[ \\t]*\\n", replace: "" })).toMatchObject({ text: "a\nb\n" });
    expect(replaceText({ ...base, regex: true, text: "x=1", find: "(?<k>\\w)=(?<v>\\d)", replace: "$<v>=$<k>" })).toMatchObject({ text: "1=x" });
  });
  it("first only, escapes, invalid regex", () => {
    expect(replaceText({ ...base, text: "a a a", find: "a", replace: "b", all: false })).toMatchObject({ text: "b a a" });
    expect(replaceText({ ...base, text: "a,b", find: ",", replace: "\\n", escapes: true })).toMatchObject({ text: "a\nb" });
    expect(replaceText({ ...base, regex: true, text: "x", find: "(" }).ok).toBe(false);
  });
});

describe("line tools", () => {
  it("prefix/suffix, numbering, join, split, remove empty", () => {
    expect(addPrefixSuffix("a\n\nb", "- ", ";")).toBe("- a;\n\n- b;");
    expect(numberLines("a\nb\n\nc", { format: "{n}) " })).toBe("1) a\n2) b\n\n3) c");
    expect(numberLines(Array.from({ length: 10 }, () => "x").join("\n"), { pad: true }).split("\n")[0]).toBe("01. x");
    expect(joinLines(" a \n\nb\nc", ", ")).toBe("a, b, c");
    expect(splitToLines("a, b,,c", ",")).toBe("a\nb\nc");
    expect(removeEmptyLines("a\n \n\nb")).toBe("a\nb");
    expect(removeEmptyLines("a\n \n\nb", false)).toBe("a\n \nb");
    expect(filterLines("ERROR 1\nINFO 2\nerror 3", { query: "error", mode: "keep", ignoreCase: true })).toBe("ERROR 1\nerror 3");
    expect(repeatText("ab", 3, "-")).toBe("ab-ab-ab");
  });
  it("wraps by graphemes without breaking words", () => {
    expect(wrapText("один два три четыре", 9)).toBe("один два\nтри\nчетыре");
    expect(wrapText("abcdefghij", 4, true)).toBe("abcd\nefgh\nij");
  });
});

describe("lorem", () => {
  it("is deterministic for a seed and renders real text", () => {
    const a = generateLorem({ lang: "russian", unit: "paragraphs", count: 3, seed: 1 });
    const b = generateLorem({ lang: "russian", unit: "paragraphs", count: 3, seed: 1 });
    expect(a).toEqual(b);
    expect(a).toHaveLength(3);
    expect(a[0].length).toBeGreaterThan(100);
  });
  it("counts", () => {
    const w = generateLorem({ lang: "latin", unit: "words", count: 50, seed: 7, classicStart: true })[0];
    expect(wordCount(w, "en")).toBe(50);
    expect(w.startsWith("Lorem ipsum dolor sit amet")).toBe(true);
    expect(generateLorem({ lang: "english", unit: "list", count: 7, seed: 3 })).toHaveLength(7);
    expect(loremToHtml(["a<b"], "paragraphs")).toBe("<p>a&lt;b</p>");
  });
  it("Russian grammar helpers", () => {
    expect(ruAdjForms("новый")).toEqual(["новый", "новая", "новое", "новую"]);
    expect(ruAdjForms("синий")).toEqual(["синий", "синяя", "синее", "синюю"]);
    expect(ruAdjForms("хороший")).toEqual(["хороший", "хорошая", "хорошее", "хорошую"]);
    expect(ruAdjForms("строгий")).toEqual(["строгий", "строгая", "строгое", "строгую"]);
    expect(ruAdjForms("большой")).toEqual(["большой", "большая", "большое", "большую"]);
    expect(ruNounAcc("задача", "f")).toBe("задачу");
    expect(ruNounAcc("неделя", "f")).toBe("неделю");
    expect(ruNounAcc("связь", "f")).toBe("связь");
    expect(ruNounAcc("проект", "m")).toBe("проект");
  });
  it("Cyrillic lorem", () => {
    expect(["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit"].map(latinToCyrillicLorem).join(" ")).toBe(
      "лорем ипсум долор сит амет консектетур адиписцинг элит",
    );
  });
});

describe("diff", () => {
  it("lines with side-by-side rows", () => {
    const r = computeDiff("a\nb\nc", "a\nB\nc\nd", { mode: "lines", ignoreCase: false, ignoreWhitespace: false });
    expect(r.added).toBe(2);
    expect(r.removed).toBe(1);
    expect(r.rows.map((x) => x.kind)).toEqual(["same", "changed", "same", "added"]);
    expect(r.patch).toContain("-b");
    expect(r.patch).toContain("+B");
    const ci = computeDiff("a\nb", "A\nb", { mode: "lines", ignoreCase: true, ignoreWhitespace: false });
    expect(ci.added + ci.removed).toBe(0);
  });
  it("words are Unicode-aware tokens", () => {
    const r = computeDiff("Привет мир", "Привет Казахстан", { mode: "words", ignoreCase: false, ignoreWhitespace: false, locale: "ru" });
    expect(r.parts.filter((p) => p.removed).map((p) => p.value.trim())).toEqual(["мир"]);
    expect(r.parts.filter((p) => p.added).map((p) => p.value.trim())).toEqual(["Казахстан"]);
  });
  it("chars by grapheme", () => {
    const r = computeDiff("a👨‍👩‍👧b", "a👨‍👩‍👦b", { mode: "chars", ignoreCase: false, ignoreWhitespace: false });
    expect(r.removed).toBe(1);
    expect(r.added).toBe(1);
  });
});
