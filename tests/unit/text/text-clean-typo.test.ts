import { describe, expect, it } from "vitest";
import { cleanText, countInvisible, decodeEntities, quotesToCurly, quotesToGuillemets, quotesToStraight, removeDiacritics, removeInvisible, stripHtml } from "@/tools/text/text/lib/clean";
import { NBSP, NNBSP, toHtmlEntities, typograph } from "@/tools/text/text/lib/typograph";

describe("cleaner", () => {
  it("removes invisible characters but keeps emoji ZWJ sequences", () => {
    const family = "👨‍👩‍👧";
    const rainbow = "🏳️‍🌈";
    const s = `a​b­c﻿d ${family} ${rainbow} e‍f`;
    expect(removeInvisible(s)).toBe(`abcd ${family} ${rainbow} ef`);
    expect(countInvisible(s)).toBe(4);
  });
  it("strips HTML to text", () => {
    expect(stripHtml('<h1>Title</h1><p>One &amp; <b>two</b>&nbsp;three</p><script>alert(1)</script><ul><li>a</li><li>b</li></ul>')).toBe(
      "Title\nOne & two three\n• a\n• b",
    );
    expect(decodeEntities("&laquo;&#1071;&#x44F;&raquo; &unknown;")).toBe("«Яя» &unknown;");
  });
  it("quotes", () => {
    expect(quotesToStraight("«Привет» и “hi” ‘x’")).toBe('"Привет" и "hi" \'x\'');
    expect(quotesToCurly('"Don\'t," she said.')).toBe("“Don’t,” she said.");
    expect(quotesToGuillemets('"Он сказал "привет" и ушёл"')).toBe("«Он сказал „привет“ и ушёл»");
  });
  it("keeps letters of every alphabet when removing punctuation", () => {
    expect(cleanText("Қазақ тілі, Ελληνικά! café — №5?", { punctuation: true })).toBe("Қазақ тілі Ελληνικά café  5");
  });
  it("diacritics: é → e but й, ё, ї stay", () => {
    expect(removeDiacritics("café naïve Ёлка йод Київ за́мок")).toBe("cafe naive Ёлка йод Київ замок");
  });
  it("tabs to spaces with configurable width (tab stops)", () => {
    expect(cleanText("a\tb", { tabs: "spaces", tabWidth: 4 })).toBe("a   b");
    expect(cleanText("\tx", { tabs: "spaces", tabWidth: 2 })).toBe("  x");
    expect(cleanText("ab\tc", { tabs: "spaces", tabWidth: 8 })).toBe("ab      c");
  });
  it("line breaks inside paragraphs and extra spaces", () => {
    const pdf = "Этот текст из PDF-\nфайла, каждая строка\nобрывается.\n\nВторой\nабзац.";
    expect(cleanText(pdf, { lineBreaks: "paragraphs" })).toBe("Этот текст из PDF-файла, каждая строка обрывается.\n\nВторой абзац.");
    expect(cleanText("a\n\nb\nc", { lineBreaks: "all" })).toBe("a b c");
    expect(cleanText("a    b  \n\n\n\nc", { collapseSpaces: true, trimLines: true, emptyLines: "collapse" })).toBe("a b\n\nc");
    expect(cleanText("a\r\n\r\nb", { emptyLines: "remove" })).toBe("a\nb");
  });
  it("ё → е", () => {
    expect(cleanText("Ёлка и ёж", { yo: true })).toBe("Елка и еж");
  });
});

describe("typograph (Russian)", () => {
  it("quotes: «ёлочки» outside, „лапки“ inside", () => {
    expect(typograph('Он сказал: "Это "лучший" вариант".', { nbsp: false })).toBe("Он сказал: «Это „лучший“ вариант».");
  });
  it("em dash with a non-breaking space before it", () => {
    expect(typograph("Москва - столица", { nbsp: false })).toBe(`Москва${NBSP}— столица`);
    expect(typograph("- Привет!", { nbsp: false })).toBe(`—${NBSP}Привет!`);
  });
  it("number ranges get an en dash, dates are not touched", () => {
    expect(typograph("в 2020-2023 годах", { nbsp: false })).toBe("в 2020–2023 годах");
    expect(typograph("2024-01-15", { nbsp: false })).toBe("2024-01-15");
  });
  it("non-breaking spaces after short words and before particles", () => {
    expect(typograph("Я иду в дом и в сад", { quotes: false })).toBe(`Я${NBSP}иду в${NBSP}дом и${NBSP}в${NBSP}сад`);
    expect(typograph("Кто бы мог подумать", {})).toBe(`Кто${NBSP}бы мог подумать`);
    expect(typograph("А. С. Пушкин", {})).toBe(`А.${NBSP}С.${NBSP}Пушкин`);
  });
  it("digit grouping with a narrow no-break space (5+ digits only)", () => {
    expect(typograph("1500000 экз. и 2024 год", { nbsp: false })).toBe(`1${NNBSP}500${NNBSP}000 экз. и 2024 год`);
    expect(typograph("3,14159", { nbsp: false })).toBe("3,14159");
    expect(typograph("+77011234567", { nbsp: false })).toBe("+77011234567");
  });
  it("symbols", () => {
    expect(typograph("Ну... (c) 2025, 45 м2, 1920x1080, 0x1F", { nbsp: false })).toBe("Ну… © 2025, 45 м², 1920×1080, 0x1F");
  });
  it("extra spaces before punctuation", () => {
    expect(typograph("Привет , мир !", { nbsp: false })).toBe("Привет, мир!");
  });
  it("entities", () => {
    expect(toHtmlEntities(`«a»${NBSP}—`)).toBe("&laquo;a&raquo;&nbsp;&mdash;");
  });
});

describe("typograph (English)", () => {
  it("curly quotes, apostrophes and dashes", () => {
    expect(typograph(`She said "it's the 'best' option" - really.`, { lang: "en", nbsp: false })).toBe("She said “it’s the ‘best’ option” — really.");
    expect(typograph("the '90s", { lang: "en", nbsp: false })).toBe("the ’90s");
    expect(typograph('a 15" screen', { lang: "en", nbsp: false })).toBe("a 15″ screen");
  });
});
