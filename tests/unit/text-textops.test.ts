import { describe, expect, it } from "vitest";
import {
  firstNumber,
  graphemeCount,
  paragraphs,
  prepareLines,
  removeDuplicateLines,
  reverseText,
  sentences,
  shuffle,
  sortLines,
  splitLines,
  textStats,
  utf8Bytes,
  wordCount,
  wordFrequency,
} from "@/sections/text/lib/textOps";

describe("textOps: counting", () => {
  it("counts graphemes, not code units", () => {
    expect(graphemeCount("👨‍👩‍👧")).toBe(1);
    expect(graphemeCount("🇰🇿🇷🇺")).toBe(2);
    expect(graphemeCount("é")).toBe(1); // e + combining acute
    expect("👨‍👩‍👧".length).toBe(8);
  });

  it("counts words in Russian, English, Kazakh and CJK", () => {
    expect(wordCount("Привет, мир! Как дела?")).toBe(4);
    expect(wordCount("It's a well-known fact.", "en")).toBe(5); // it's · a · well · known · fact
    expect(wordCount("Қазақстан Республикасы")).toBe(2);
    expect(wordCount("我喜欢读书", "zh")).toBeGreaterThanOrEqual(3);
    expect(wordCount("  ")).toBe(0);
    expect(wordCount("")).toBe(0);
  });

  it("splits sentences and paragraphs", () => {
    expect(sentences("Первое. Второе! Третье?")).toHaveLength(3);
    expect(sentences("Заголовок\n\nТекст абзаца.")).toHaveLength(2);
    expect(paragraphs("a\nb\n\n\nc\n  \nd")).toEqual(["a\nb", "c", "d"]);
    expect(paragraphs("")).toEqual([]);
  });

  it("splits any line ending", () => {
    expect(splitLines("a\r\nb\rc\nd")).toEqual(["a", "b", "c", "d"]);
    expect(splitLines("")).toEqual([]);
  });

  it("text statistics", () => {
    const s = textStats("Привет, мир! 👋\nВторая строка 2025.");
    expect(s.chars).toBe(34);
    expect(s.words).toBe(5);
    expect(s.lines).toBe(2);
    expect(s.emoji).toBe(1);
    expect(s.digits).toBe(4);
    expect(s.sentences).toBe(2);
    expect(s.charsNoSpaces).toBe(s.chars - s.spaces);
    expect(utf8Bytes("я")).toBe(2);
    expect(utf8Bytes("€")).toBe(3);
    expect(utf8Bytes("😀")).toBe(4);
    const empty = textStats("");
    expect([empty.chars, empty.words, empty.lines, empty.paragraphs, empty.readingSeconds]).toEqual([0, 0, 0, 0, 0]);
  });

  it("reading time uses 200 wpm", () => {
    const text = Array.from({ length: 400 }, () => "слово").join(" ");
    expect(textStats(text).readingSeconds).toBe(120);
  });

  it("word frequency (case-insensitive, stop words)", () => {
    const { rows, total } = wordFrequency("Кот и кот. КОТ и пёс.", { excludeStopWords: true });
    expect(rows[0]).toMatchObject({ word: "кот", count: 3 });
    expect(rows.find((r) => r.word === "и")).toBeUndefined();
    expect(total).toBe(4);
    const bi = wordFrequency("big data and big data", { ngram: 2, locale: "en" });
    expect(bi.rows[0]).toMatchObject({ word: "big data", count: 2 });
  });
});

describe("textOps: remove duplicates", () => {
  it("handles \\r\\n, trim, case and keeps blank lines", () => {
    const r = removeDuplicateLines("a\r\nb\r\nA\r\n\r\n b \r\n\r\nc", { ignoreCase: true, trim: true, blank: "keep" });
    expect(r.text).toBe("a\nb\n\n\nc");
    expect(r.text.includes("\r")).toBe(false);
    expect(r.removed).toBe(2);
  });
  it("blank line modes", () => {
    expect(removeDuplicateLines("a\n\n\nb\n\n", { blank: "dedupe" }).text).toBe("a\n\nb");
    expect(removeDuplicateLines("a\n\nb", { blank: "remove" }).text).toBe("a\nb");
  });
  it("case-sensitive by default", () => {
    expect(removeDuplicateLines("Да\nда").text).toBe("Да\nда");
  });
  it("unique and duplicates modes", () => {
    expect(removeDuplicateLines("a\nb\na\nc", { mode: "unique" }).text).toBe("b\nc");
    expect(removeDuplicateLines("a\nb\na\nc\nb", { mode: "duplicates" }).text).toBe("a\nb");
  });
});

describe("textOps: sorting", () => {
  it("alphabetical with Russian collation (ё next to е, Cyrillic first)", () => {
    expect(sortLines("яблоко\nёж\nерш\nabc\nЖук", { locale: "ru" })).toEqual(["ёж", "ерш", "Жук", "яблоко", "abc"]);
    expect(sortLines("яблоко\nabc", { locale: "en" })).toEqual(["abc", "яблоко"]);
  });
  it("natural sort", () => {
    expect(sortLines("file10\nfile2\nfile1", { mode: "natural" })).toEqual(["file1", "file2", "file10"]);
    expect(sortLines("file10\nfile2\nfile1", { mode: "alpha" })).toEqual(["file1", "file10", "file2"]);
  });
  it("numeric sort never produces NaN and keeps lines without numbers last", () => {
    const out = sortLines("груша 1 000\nвишня\nApple 2,5\nбанан 3\n−7 долг\nслива", { mode: "numeric" });
    expect(out).toEqual(["−7 долг", "Apple 2,5", "банан 3", "груша 1 000", "вишня", "слива"]);
    const desc = sortLines("a 1\nb\nc 10", { mode: "numeric", descending: true });
    expect(desc).toEqual(["c 10", "a 1", "b"]);
  });
  it("parses numbers in both locales", () => {
    expect(firstNumber("цена 1 250 000 ₸")).toBe(1250000);
    expect(firstNumber("$1,250,000.50")).toBe(1250000.5);
    expect(firstNumber("3,14")).toBe(3.14);
    expect(firstNumber("0,125 кг")).toBe(0.125);
    expect(firstNumber("1,000 items")).toBe(1000);
    expect(firstNumber("нет чисел")).toBeNull();
  });
  it("by length and reverse", () => {
    expect(sortLines("ccc\na\nbb", { mode: "length" })).toEqual(["a", "bb", "ccc"]);
    expect(sortLines("1\n2\n3", { mode: "reverse" })).toEqual(["3", "2", "1"]);
  });
  it("shuffle is a permutation", () => {
    let k = 0;
    const seq = [2, 0, 1, 0];
    const out = shuffle([1, 2, 3, 4, 5], () => seq[k++ % seq.length]);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(prepareLines(" a \n\n b", { trim: true, removeEmpty: true })).toEqual(["a", "b"]);
  });
});

describe("textOps: reverse", () => {
  it("keeps emoji, flags and combining marks intact", () => {
    expect(reverseText("ab👨‍👩‍👧🇰🇿é", "text")).toBe("é🇰🇿👨‍👩‍👧ba");
  });
  it("modes", () => {
    expect(reverseText("один два три", "words")).toBe("три два один");
    expect(reverseText("a\nb\nc", "lines")).toBe("c\nb\na");
    expect(reverseText("Привет, мир!", "letters-in-words")).toBe("тевирП, рим!");
    expect(reverseText("ab\ncd", "each-line")).toBe("ba\ndc");
  });
});
