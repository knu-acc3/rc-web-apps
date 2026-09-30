import { tr, type Locale } from "@/i18n/config";
import { defineToolSection } from "@/registry/tool-section";
import type { Block, LinkItem, PageModel, SectionDef } from "@/registry/types";
import { amountTool } from "./content/amount";
import { baseTool } from "./content/bases";
import { inWordsTool, WORD_GROUPS, wordChipNumbers } from "./content/in-words";
import { romanChipNumbers, ROMAN_GROUPS, romanTool } from "./content/roman";
import { scientificTool } from "./content/scientific";
import { num } from "./content/text";
import { toRoman } from "./roman";

/**
 * Navigation group "Числа" (no landing page — the group name is not a search query).
 * Tools are top-level pages: /roman-numerals, /number-to-words, /amount-in-words,
 * /number-base-converter, /scientific-notation.
 */
const base = defineToolSection({
  id: "numbers",
  name: { ru: "Числа", en: "Numbers" },
  description: {
    ru: "Римские цифры, число и сумма прописью, перевод между системами счисления, стандартный вид числа",
    en: "Roman numerals, numbers and amounts in words, number base conversion, scientific notation",
  },
  icon: "Hash",
  hue: 20,
  category: "convert",
  order: 2,
  tools: [romanTool, inWordsTool, amountTool, baseTool, scientificTool],
});

/* ───────────── chip windows for the two large variant families ───────────── */

const ROMAN = romanTool.slug;
const WORDS = inWordsTool.slug;

function romanLink(n: number, locale: Locale): LinkItem {
  return { path: [ROMAN, String(n)], label: num(n, locale), hint: toRoman(n) };
}
function wordsLink(n: number, locale: Locale): LinkItem {
  return { path: [WORDS, String(n)], label: num(n, locale) };
}

function groupedChips(groups: { ru: string; en: string; nums: number[] }[], link: (n: number, l: Locale) => LinkItem, locale: Locale): Block[] {
  return groups.map((g) => ({ type: "links", title: g[locale], style: "chips", items: g.nums.map((n) => link(n, locale)) }));
}

/**
 * The generic builder shows every sibling variant; for 337 Roman numerals and 148 numbers in
 * words that is too many. Tool pages get grouped chips (all variants, for crawling), variant
 * pages a window of ~25 neighbours plus well-known anchors (20–50 chips).
 */
function adjust(page: PageModel, locale: Locale, segs: string[]): PageModel {
  const [tool, variant] = segs;
  if (tool === ROMAN) {
    if (!variant) return { ...page, topBlocks: groupedChips(ROMAN_GROUPS, romanLink, locale) };
    return { ...page, topBlocks: [{ type: "links", title: tr(romanTool.variants!.title, locale), style: "chips", items: romanChipNumbers(Number(variant)).map((n) => romanLink(n, locale)) }] };
  }
  if (tool === WORDS) {
    if (!variant) return { ...page, topBlocks: groupedChips(WORD_GROUPS, wordsLink, locale) };
    return { ...page, topBlocks: [{ type: "links", title: tr(inWordsTool.variants!.title, locale), style: "chips", items: wordChipNumbers(Number(variant)).map((n) => wordsLink(n, locale)) }] };
  }
  return page;
}

export const numbersSection: SectionDef = {
  ...base,
  resolve(locale, segs) {
    const page = base.resolve(locale, segs);
    return page ? adjust(page, locale, segs) : null;
  },
};
