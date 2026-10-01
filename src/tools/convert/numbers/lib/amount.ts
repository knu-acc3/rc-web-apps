/**
 * Amount in words ("сумма прописью") for several currencies, with correct Russian
 * agreement of numerals and currency nouns (один рубль, две тысячи рублей,
 * двадцать одна копейка) and an English version.
 */
import { enCardinal } from "./words-en";
import { groupThousands, parseDecimalInput } from "./parse";
import { capitalize, ruCardinal, ruPlural, RU_MAX, type Gender } from "./words-ru";

export type CurrencyCode = "RUB" | "KZT" | "USD" | "EUR" | "CNY" | "BYN" | "UAH" | "GBP";

export interface CurrencyDef {
  code: CurrencyCode;
  slug: string;
  symbol: string;
  ru: {
    /** Currency name for headings: "российский рубль". */
    name: string;
    /** Genitive plural for "сумма прописью в …": "в рублях". */
    inName: string;
    major: { forms: [string, string, string]; gender: Gender };
    minor: { forms: [string, string, string]; gender: Gender };
    /** Nominative plural of the minor unit for prose: «копейки», «тиыны». */
    minorPl: string;
  };
  en: {
    name: string;
    major: [string, string];
    minor: [string, string];
  };
}

export const CURRENCIES: CurrencyDef[] = [
  {
    code: "RUB",
    slug: "rubles",
    symbol: "₽",
    ru: {
      name: "российский рубль",
      inName: "в рублях",
      major: { forms: ["рубль", "рубля", "рублей"], gender: "m" },
      minor: { forms: ["копейка", "копейки", "копеек"], gender: "f" },
      minorPl: "копейки",
    },
    en: { name: "Russian ruble", major: ["ruble", "rubles"], minor: ["kopeck", "kopecks"] },
  },
  {
    code: "KZT",
    slug: "tenge",
    symbol: "₸",
    ru: {
      name: "казахстанский тенге",
      inName: "в тенге",
      major: { forms: ["тенге", "тенге", "тенге"], gender: "m" },
      minor: { forms: ["тиын", "тиына", "тиынов"], gender: "m" },
      minorPl: "тиыны",
    },
    en: { name: "Kazakhstani tenge", major: ["tenge", "tenge"], minor: ["tiyn", "tiyn"] },
  },
  {
    code: "USD",
    slug: "dollars",
    symbol: "$",
    ru: {
      name: "доллар США",
      inName: "в долларах США",
      major: { forms: ["доллар США", "доллара США", "долларов США"], gender: "m" },
      minor: { forms: ["цент", "цента", "центов"], gender: "m" },
      minorPl: "центы",
    },
    en: { name: "US dollar", major: ["dollar", "dollars"], minor: ["cent", "cents"] },
  },
  {
    code: "EUR",
    slug: "euros",
    symbol: "€",
    ru: {
      name: "евро",
      inName: "в евро",
      major: { forms: ["евро", "евро", "евро"], gender: "m" },
      minor: { forms: ["цент", "цента", "центов"], gender: "m" },
      minorPl: "центы",
    },
    en: { name: "euro", major: ["euro", "euros"], minor: ["cent", "cents"] },
  },
  {
    code: "CNY",
    slug: "yuan",
    symbol: "¥",
    ru: {
      name: "китайский юань",
      inName: "в юанях",
      major: { forms: ["юань", "юаня", "юаней"], gender: "m" },
      minor: { forms: ["фэнь", "фэня", "фэней"], gender: "m" },
      minorPl: "фэни",
    },
    en: { name: "Chinese yuan", major: ["yuan", "yuan"], minor: ["fen", "fen"] },
  },
  {
    code: "BYN",
    slug: "belarusian-rubles",
    symbol: "Br",
    ru: {
      name: "белорусский рубль",
      inName: "в белорусских рублях",
      major: { forms: ["белорусский рубль", "белорусских рубля", "белорусских рублей"], gender: "m" },
      minor: { forms: ["копейка", "копейки", "копеек"], gender: "f" },
      minorPl: "копейки",
    },
    en: { name: "Belarusian ruble", major: ["Belarusian ruble", "Belarusian rubles"], minor: ["kopeck", "kopecks"] },
  },
  {
    code: "UAH",
    slug: "hryvnias",
    symbol: "₴",
    ru: {
      name: "украинская гривна",
      inName: "в гривнах",
      major: { forms: ["гривна", "гривны", "гривен"], gender: "f" },
      minor: { forms: ["копейка", "копейки", "копеек"], gender: "f" },
      minorPl: "копейки",
    },
    en: { name: "Ukrainian hryvnia", major: ["hryvnia", "hryvnias"], minor: ["kopiyka", "kopiykas"] },
  },
  {
    code: "GBP",
    slug: "pounds",
    symbol: "£",
    ru: {
      name: "фунт стерлингов",
      inName: "в фунтах стерлингов",
      major: { forms: ["фунт стерлингов", "фунта стерлингов", "фунтов стерлингов"], gender: "m" },
      minor: { forms: ["пенс", "пенса", "пенсов"], gender: "m" },
      minorPl: "пенсы",
    },
    en: { name: "pound sterling", major: ["pound", "pounds"], minor: ["penny", "pence"] },
  },
];

export const currencyByCode = new Map(CURRENCIES.map((c) => [c.code, c]));

export interface Money {
  major: bigint;
  /** 0–99 */
  minor: number;
  /** The input had more than two decimals and was rounded half-up. */
  rounded: boolean;
}

type MoneyParse = { ok: true; money: Money } | { ok: false; error: "empty" | "invalid" | "negative" | "too-big" };

/** Parse an amount and round it to whole kopecks/cents (half-up, exact decimal arithmetic). */
export function parseMoney(input: string): MoneyParse {
  if (!input.trim()) return { ok: false, error: "empty" };
  const d = parseDecimalInput(input);
  if (!d) return { ok: false, error: "invalid" };
  if (d.neg) return { ok: false, error: "negative" };
  let major = d.int;
  const frac = d.frac.padEnd(2, "0");
  let minor = Number(frac.slice(0, 2));
  const rest = frac.slice(2);
  const rounded = /[1-9]/.test(rest);
  if (rest && Number(rest[0]) >= 5) minor += 1;
  if (minor === 100) {
    minor = 0;
    major += 1n;
  }
  if (major > RU_MAX) return { ok: false, error: "too-big" };
  return { ok: true, money: { major, minor, rounded } };
}

export type MinorStyle = "digits" | "words" | "none";
export type Wrap = "none" | "contract" | "paren";

interface AmountOptions {
  minor: MinorStyle;
  wrap: Wrap;
  capitalize: boolean;
}

const DEFAULT_AMOUNT_OPTIONS: AmountOptions = { minor: "digits", wrap: "none", capitalize: true };

const two = (n: number) => String(n).padStart(2, "0");

/**
 * Russian amount in words.
 *  none:     «Одна тысяча двести рублей 05 копеек»
 *  contract: «1 200 (Одна тысяча двести) рублей 05 копеек»
 *  paren:    «(Одна тысяча двести рублей 05 копеек)»
 */
export function amountRu(m: Money, cur: CurrencyDef, o: AmountOptions = DEFAULT_AMOUNT_OPTIONS): string {
  const words = ruCardinal(m.major, cur.ru.major.gender);
  const major = ruPlural(m.major, cur.ru.major.forms);
  const minor =
    o.minor === "none"
      ? ""
      : o.minor === "digits"
        ? ` ${two(m.minor)} ${ruPlural(m.minor, cur.ru.minor.forms)}`
        : ` ${ruCardinal(m.minor, cur.ru.minor.gender)} ${ruPlural(m.minor, cur.ru.minor.forms)}`;
  const cap = (s: string) => (o.capitalize ? capitalize(s) : s);
  if (o.wrap === "contract") return `${groupThousands(m.major.toString())} (${cap(words)}) ${major}${minor}`;
  const text = cap(`${words} ${major}${minor}`);
  return o.wrap === "paren" ? `(${text})` : text;
}

/**
 * English amount in words: «One thousand two hundred dollars and five cents»,
 * with digits: «… dollars and 05/100» (cheque style).
 */
export function amountEn(m: Money, cur: CurrencyDef, o: AmountOptions = DEFAULT_AMOUNT_OPTIONS): string {
  const words = enCardinal(m.major);
  const major = m.major === 1n ? cur.en.major[0] : cur.en.major[1];
  const minor =
    o.minor === "none"
      ? ""
      : o.minor === "digits"
        ? ` and ${two(m.minor)}/100`
        : ` and ${enCardinal(m.minor)} ${m.minor === 1 ? cur.en.minor[0] : cur.en.minor[1]}`;
  const cap = (s: string) => (o.capitalize ? capitalize(s) : s);
  if (o.wrap === "contract") return `${groupThousands(m.major.toString(), ",")} (${cap(words)}) ${major}${minor}`;
  const text = cap(`${words} ${major}${minor}`);
  return o.wrap === "paren" ? `(${text})` : text;
}

/** "1 234 567,89 ₽" / "$1,234,567.89" style numeric amount. */
export function moneyNumeric(m: Money, cur: CurrencyDef, locale: "ru" | "en"): string {
  const int = groupThousands(m.major.toString(), locale === "ru" ? " " : ",");
  const n = `${int}${locale === "ru" ? "," : "."}${two(m.minor)}`;
  return locale === "ru" ? `${n} ${cur.symbol}` : cur.symbol.length === 1 && cur.code !== "KZT" ? `${cur.symbol}${n}` : `${n} ${cur.symbol}`;
}
