import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { amountEn, amountRu, currencyByCode } from "../lib/amount";
import { CASES, CASE_NAMES, ruCardinalCase } from "../lib/declension";
import { toRoman } from "../lib/roman";
import { enCardinal, enOrdinal, enOrdinalSuffix } from "../lib/words-en";
import { capitalize, ruCardinal, ruOrdinal, ruPlural } from "../lib/words-ru";
import { fit, num } from "./text";

const WORD_NUMBERS: number[] = [
  ...Array.from({ length: 25 }, (_, i) => i + 1),
  30, 31, 32, 33, 35, 36, 40, 44, 45, 50, 55, 60, 64, 66, 70, 77, 80, 88, 90, 99,
  100, 101, 111, 120, 128, 150, 200, 250, 256, 300, 365, 400, 500, 512, 600, 700, 800, 900, 999,
  1000, 1001, 1024, 1100, 1200, 1250, 1300, 1500, 1600, 1800, 2000,
  2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
  2400, 2500, 2800, 3000, 3500, 4000, 4500, 5000, 6000, 6500, 7000, 7500, 8000, 9000,
  10_000, 11_000, 12_000, 12_500, 15_000, 20_000, 21_000, 25_000, 30_000, 35_000, 40_000, 45_000, 50_000, 60_000, 70_000, 75_000, 80_000, 90_000,
  100_000, 120_000, 150_000, 200_000, 250_000, 300_000, 350_000, 400_000, 500_000, 600_000, 700_000, 750_000, 800_000, 900_000,
  1_000_000, 1_200_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000, 5_000_000, 10_000_000, 15_000_000, 20_000_000, 50_000_000,
  100_000_000, 500_000_000, 1_000_000_000, 1_000_000_000_000, 1_000_000_000_000_000,
];

const ANCHORS = [1, 2, 3, 5, 10, 11, 12, 20, 21, 100, 1000, 2000, 2025, 5000, 10_000, 100_000, 1_000_000, 1_000_000_000];

const fmt = (n: number, l: Locale) => num(n, l);
const RUB = currencyByCode.get("RUB")!;
const KZT = currencyByCode.get("KZT")!;
const USD = currencyByCode.get("USD")!;
const opts = { minor: "digits", wrap: "none", capitalize: true } as const;

function scaleName(n: number, locale: Locale): string {
  const d = String(n).length;
  const ru = ["", "единицы", "десятки", "сотни", "тысячи", "десятки тысяч", "сотни тысяч", "миллионы", "десятки миллионов", "сотни миллионов", "миллиарды", "десятки миллиардов", "сотни миллиардов", "триллионы", "десятки триллионов", "сотни триллионов", "квадриллионы"];
  const en = ["", "ones", "tens", "hundreds", "thousands", "ten thousands", "hundred thousands", "millions", "ten millions", "hundred millions", "billions", "ten billions", "hundred billions", "trillions", "ten trillions", "hundred trillions", "quadrillions"];
  return (locale === "ru" ? ru : en)[d] ?? "";
}


function wordsVariant(n: number): VariantDef {
  const big = BigInt(n);
  const card = ruCardinal(big);
  const ord = ruOrdinal(big);
  const en = enCardinal(big);
  const enOrd = enOrdinal(big);
  const genderMatters = n % 10 <= 2 && n % 10 >= 1 && n % 100 !== 11 && n % 100 !== 12;
  const money = { major: big, minor: 0, rounded: false };
  const rub = amountRu(money, RUB, opts);
  const kzt = amountRu(money, KZT, opts);
  const usdEn = amountEn(money, USD, { ...opts, minor: "words" });
  const roman = toRoman(n, true);

  const titleRu = `${fmt(n, "ru")} прописью — ${card}`;
  const titleEn = `${fmt(n, "en")} in words — ${en}`;

  const faq: Record<Locale, QA[]> = {
    ru: [
      { q: `Как пишется ${fmt(n, "ru")} прописью?`, a: `${capitalize(card)}.${genderMatters ? ` С существительными женского рода — «${ruCardinal(big, "f")}», среднего — «${ruCardinal(big, "n")}».` : ""}` },
      { q: `Как написать ${fmt(n, "ru")} ${ruPlural(big, RUB.ru.major.forms)} прописью?`, a: `${rub}. В договорах часто используют формат «${fmt(n, "ru")} (${card}) ${ruPlural(big, RUB.ru.major.forms)} 00 копеек».` },
      { q: `Как склоняется ${fmt(n, "ru")}?`, a: `Родительный — ${ruCardinalCase(big, "gen")}, дательный — ${ruCardinalCase(big, "dat")}, творительный — ${ruCardinalCase(big, "ins")}, предложный — о ${ruCardinalCase(big, "pre")}.` },
      { q: `Как будет ${fmt(n, "ru")} по-английски?`, a: `${capitalize(en)}; порядковое — ${enOrd} (${enOrdinalSuffix(big)}).` },
    ],
    en: [
      {
        q: `How do you write ${fmt(n, "en")} in words?`,
        a: `${capitalize(en)}.${enCardinal(big, { british: true }) !== en ? ` British English adds “and”: ${enCardinal(big, { british: true })}.` : " American and British spelling are the same."}`,
      },
      { q: `What is the ordinal of ${fmt(n, "en")}?`, a: `${capitalize(enOrd)} (${enOrdinalSuffix(big)}).` },
      { q: `How do you write ${fmt(n, "en")} dollars on a cheque?`, a: `${usdEn.replace(" and zero cents", "")} and 00/100.` },
      { q: `How is ${fmt(n, "en")} written in Russian?`, a: `${capitalize(card)}${genderMatters ? ` (masculine; feminine — ${ruCardinal(big, "f")})` : ""}. The ordinal is ${ord}.` },
    ],
  };

  return {
    slug: String(n),
    name: { ru: fmt(n, "ru"), en: fmt(n, "en") },
    title: { ru: titleRu.length <= 60 ? titleRu : `${fmt(n, "ru")} прописью: как пишется словами`, en: titleEn.length <= 60 ? titleEn : `${fmt(n, "en")} in words: how to spell it` },
    h1: { ru: `${fmt(n, "ru")} прописью`, en: `${fmt(n, "en")} in words` },
    description: {
      ru: fit(`${fmt(n, "ru")} прописью: «${card}».`, [` Порядковое — «${ord}».`, ` По-английски — ${en}.`, [" Женский и средний род, склонение по падежам, сумма в рублях и тенге.", " Склонение по падежам и сумма в рублях.", " Склонение по падежам."]]),
      en: fit(`${fmt(n, "en")} in words: “${en}”.`, [
        ` Ordinal: ${enOrd} (${enOrdinalSuffix(big)}).`,
        ` In Russian: ${card}.`,
        [" US and British spelling, cheque format and Russian cases.", " Cheque format and Russian cases."],
      ]),
    },
    lead: { ru: `${fmt(n, "ru")} — ${card}; порядковое — ${ord}`, en: `${fmt(n, "en")} — ${en}; ordinal: ${enOrd}` },
    props: { value: String(n) },
    keywords: { ru: [card, ord, `${n} словами`], en: [en, enOrd, `${n} spelled out`] },
    blocks: (locale) => {
      const facts: [string, string][] =
        locale === "ru"
          ? [
              ["Прописью", card],
              ...(genderMatters
                ? ([
                    ["Женский род", ruCardinal(big, "f")],
                    ["Средний род", ruCardinal(big, "n")],
                  ] as [string, string][])
                : []),
              ["Порядковое (м. р.)", ord],
              ["Порядковое (ж. р. / ср. р.)", `${ruOrdinal(big, "f")} / ${ruOrdinal(big, "n")}`],
              ["В рублях", rub],
              ["В тенге", kzt],
              ["По-английски", en],
              ["Порядковое по-английски", `${enOrd} (${enOrdinalSuffix(big)})`],
              ...(roman ? ([["Римскими цифрами", roman]] as [string, string][]) : []),
              ["Количество цифр", `${String(n).length}, старший разряд — ${scaleName(n, "ru")}`],
            ]
          : [
              ["In words", en],
              ["Ordinal", `${enOrd} (${enOrdinalSuffix(big)})`],
              ["British English", enCardinal(big, { british: true })],
              ["As a dollar amount", usdEn.replace(" and zero cents", "")],
              ["In Russian", card],
              ["Russian ordinal", ord],
              ...(roman ? ([["Roman numeral", roman]] as [string, string][]) : []),
              ["Number of digits", `${String(n).length}, highest place — ${scaleName(n, "en")}`],
            ];
      const blocks: Block[] = [{ type: "facts", title: locale === "ru" ? `Число ${fmt(n, locale)} словами` : `${fmt(n, locale)} spelled out`, rows: facts }];
      blocks.push({
        type: "table",
        title: locale === "ru" ? `Склонение числа ${fmt(n, locale)} по падежам` : `${fmt(n, locale)} in Russian cases`,
        head: locale === "ru" ? ["Падеж", "Вопрос", "Как пишется"] : ["Case", "Question", "Form"],
        rows: CASES.map((c) => [CASE_NAMES[c].name, CASE_NAMES[c].q, (c === "pre" ? "о " : "") + ruCardinalCase(big, c)]),
      });
      if (locale === "ru")
        blocks.push({
          type: "text",
          paragraphs: [
            `При склонении составного числительного изменяется каждое слово: «${ruCardinalCase(big, "ins")}». Винительный падеж дан для неодушевлённых существительных${n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? `; с одушевлёнными числительные два, три и четыре в конце ставятся в форму родительного падежа (вижу ${ruCardinalCase(big, "gen")} студентов)` : ""}.`,
          ],
        });
      return blocks;
    },
    faq,
  };
}

export const inWordsTool: ToolDef = {
  slug: "number-to-words",
  component: "numbers/in-words",
  icon: "WholeWord",
  popular: true,
  name: { ru: "Число прописью", en: "Number to words" },
  title: { ru: "Число прописью онлайн — на русском и английском", en: "Number to Words Converter — Cardinal and Ordinal" },
  h1: { ru: "Число прописью", en: "Number to words converter" },
  description: {
    ru: "Число прописью на русском и английском: количественные и порядковые числительные, мужской, женский и средний род, склонение по падежам и дроби до квадриллионов.",
    en: "Write numbers in words in English and Russian: cardinal and ordinal numbers, British “and”, decimals, Russian genders and cases — up to 999 quadrillion.",
  },
  lead: {
    ru: "Введите число — оно сразу появится словами: количественное, порядковое и по-английски.",
    en: "Type a number to see it spelled out instantly — cardinal, ordinal and in Russian.",
  },
  keywords: {
    ru: ["число прописью", "цифры прописью", "число словами", "порядковое числительное", "склонение числительных"],
    en: ["number to words", "numbers in words", "spell number", "ordinal numbers", "number spelling"],
  },
  howTo: {
    ru: [
      "Введите число цифрами — пробелы между разрядами можно оставить, дробную часть отделите запятой.",
      "Выберите род, если число будет стоять перед существительным: «одна тысяча», «двадцать одно окно».",
      "Скопируйте нужный вариант: количественное, порядковое или английское написание.",
      "Ниже результата — склонение числа по всем шести падежам.",
    ],
    en: [
      "Type a number — group separators are fine; use a point for decimals.",
      "Turn on British style if you need “one hundred and five”.",
      "Copy the cardinal or ordinal form with one click.",
      "The Russian spelling, genders and grammatical cases are shown alongside.",
    ],
  },
  faq: {
    ru: [
      { q: "Как правильно: «тысяча» или «одна тысяча»?", a: "Оба варианта верны. В документах и суммах прописью обычно пишут «одна тысяча», чтобы исключить подделку; в обычной речи — «тысяча». Конвертер выдаёт полную форму." },
      { q: "Как пишутся порядковые числительные от больших чисел?", a: "Если число оканчивается на тысячи или миллионы, порядковое пишется одним словом: 2000 — двухтысячный, 40 000 — сорокатысячный, 1 000 000 — миллионный. В остальных случаях изменяется только последнее слово: две тысячи двадцать четвёртый." },
      { q: "Как читать десятичные дроби?", a: "Целая часть и числитель ставятся в женский род, знаменатель — по количеству знаков: 1,5 — одна целая пять десятых; 2,25 — две целых двадцать пять сотых." },
      { q: "До какого числа работает конвертер?", a: "До 999 999 999 999 999 999 (999 квадриллионов) и до 15 знаков после запятой. Вычисления точные — без округления больших чисел." },
      { q: "Чем американский вариант отличается от британского?", a: "В британском английском после hundred добавляют and: one hundred and twenty-three. В американском and обычно опускают: one hundred twenty-three." },
    ],
    en: [
      { q: "Should I write “one hundred and five” or “one hundred five”?", a: "Both are correct. British English normally includes “and” after hundred; American English usually leaves it out, especially on cheques. Use the British style switch to choose." },
      { q: "How are ordinal numbers formed?", a: "Only the last word changes: twenty-one → twenty-first, one hundred two → one hundred second. Irregular endings: first, second, third, fifth, eighth, ninth, twelfth; tens change -y to -ieth (twentieth)." },
      { q: "How are decimals read?", a: "The whole part is read as a number and each digit after the point is read separately: 3.14 is “three point one four”." },
      { q: "How large a number can be converted?", a: "Up to 999,999,999,999,999,999 (999 quadrillion) with exact integer arithmetic, plus up to 15 decimal places." },
      { q: "Why does Russian have several forms of the same number?", a: "Russian numerals 1 and 2 agree in gender (один/одна/одно, два/две) and every numeral changes by case. The tool shows all genders and the six cases." },
    ],
  },
  about: {
    ru: [
      "Число прописью нужно в платёжных документах, договорах, доверенностях, школьных заданиях и везде, где сумму или количество важно записать без двусмысленности.",
      "Конвертер учитывает правила русской грамматики: согласование «один/одна/одно» и «два/две» с родом, формы «тысяча — тысячи — тысяч», слитное написание порядковых вроде «двухсоттысячный» и склонение каждого слова составного числа.",
      "Для денежных сумм с копейками используйте отдельный инструмент «Сумма прописью» — он добавляет название валюты в правильной форме.",
    ],
    en: [
      "Numbers in words are used on cheques, in contracts and legal documents, and wherever an amount must be unambiguous.",
      "The converter follows the standard short scale (million, billion, trillion, quadrillion), handles ordinals with their irregular endings and optional British “and”.",
      "It also shows the Russian spelling with gender agreement and all six grammatical cases — handy for translators and learners.",
    ],
  },
  variants: {
    title: { ru: "Числа прописью", en: "Numbers in words" },
    list: () => WORD_NUMBERS.map(wordsVariant),
  },
};

export function wordChipNumbers(n: number): number[] {
  const i = WORD_NUMBERS.indexOf(n);
  const win = WORD_NUMBERS.slice(Math.max(0, i - 10), i + 11);
  return [...new Set([...win, ...ANCHORS])].filter((x) => x !== n && WORD_NUMBERS.includes(x)).sort((a, b) => a - b);
}

export const WORD_GROUPS: { ru: string; en: string; nums: number[] }[] = [
  { ru: "До 1000", en: "Up to 1,000", nums: WORD_NUMBERS.filter((n) => n < 1000) },
  { ru: "Тысячи", en: "Thousands", nums: WORD_NUMBERS.filter((n) => n >= 1000 && n < 1_000_000) },
  { ru: "Миллионы и больше", en: "Millions and more", nums: WORD_NUMBERS.filter((n) => n >= 1_000_000) },
];
