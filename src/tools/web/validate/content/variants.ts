/* Variant pages of the validators: IBAN countries, phone countries, card networks. Server-side only. */
import { getCountryCallingCode, getExampleNumber, type CountryCode } from "libphonenumber-js/max";
import examples from "libphonenumber-js/examples.mobile.json";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import type { Block, QA, VariantDef } from "@/registry/types";
import { IBAN_COUNTRIES, type IbanCountry } from "../data/iban-countries";
import { BRANDS, luhnCheckDigit, type Brand } from "../lib/card";
import { formatIban, structureParts } from "../lib/iban";

const SYM = ["символ", "символа", "символов"];
const fit = (variants: string[], max = 60) => variants.find((v) => v.length <= max) ?? variants[variants.length - 1];
/** "16, 17, 18, 19" → "16–19" */
const lengthsText = (ls: number[]) => (ls.length > 2 && ls[ls.length - 1] - ls[0] === ls.length - 1 ? `${ls[0]}–${ls[ls.length - 1]}` : ls.join(", "));
const symRu = (n: number) => `${n} ${plural("ru", n, SYM)}`;

/* ───────────── IBAN ───────────── */

/** Wikipedia-style layout: KZkk bbbc cccc cccc cccc */
export function ibanLayout(c: IbanCountry): string {
  const chars: string[] = [];
  const total = c.length - 4;
  for (let i = 1; i <= total; i++) {
    if (i >= c.bank[0] && i <= c.bank[1]) chars.push("b");
    else if (c.branch && i >= c.branch[0] && i <= c.branch[1]) chars.push("s");
    else chars.push("c");
  }
  return formatIban(`${c.code}kk${chars.join("")}`);
}

const KIND = { n: { ru: "цифры", en: "digits" }, a: { ru: "заглавные латинские буквы", en: "upper-case letters" }, c: { ru: "буквы и цифры", en: "letters and digits" } };

function kindsBetween(c: IbanCountry, from: number, to: number, l: Locale): string {
  const kinds = new Set<string>();
  let pos = 1;
  for (const p of structureParts(c.bban)) {
    const end = pos + p.len - 1;
    if (end >= from && pos <= to) kinds.add(KIND[p.kind][l]);
    pos = end + 1;
  }
  return [...kinds].join(", ");
}

function ibanBlocks(c: IbanCountry, l: Locale): Block[] {
  const ru = l === "ru";
  const name = ru ? c.ru : c.en;
  const bban = c.length - 4;
  const rows: string[][] = [
    ["1–2", ru ? "Код страны" : "Country code", c.code, ru ? "буквы" : "letters"],
    ["3–4", ru ? "Контрольные цифры" : "Check digits", c.example.slice(2, 4), ru ? "цифры" : "digits"],
    [`${4 + c.bank[0]}–${4 + c.bank[1]}`, ru ? "Код банка" : "Bank code", c.example.slice(3 + c.bank[0], 4 + c.bank[1]), kindsBetween(c, c.bank[0], c.bank[1], l)],
  ];
  if (c.branch) rows.push([`${4 + c.branch[0]}–${4 + c.branch[1]}`, ru ? "Код отделения" : "Branch code", c.example.slice(3 + c.branch[0], 4 + c.branch[1]), kindsBetween(c, c.branch[0], c.branch[1], l)]);
  const accStart = Math.max(c.bank[1], c.branch?.[1] ?? 0) + 1;
  if (accStart <= bban) rows.push([`${4 + accStart}–${c.length}`, ru ? "Номер счёта и прочие поля" : "Account number and other fields", c.example.slice(3 + accStart), kindsBetween(c, accStart, bban, l)]);
  const facts: [string, string][] = [
    [ru ? "Страна" : "Country", `${name} (${c.code})`],
    [ru ? "Длина IBAN" : "IBAN length", ru ? symRu(c.length) : `${c.length} characters`],
    [ru ? "Формат" : "Layout", ibanLayout(c)],
    [ru ? "Структура BBAN (нотация SWIFT)" : "BBAN structure (SWIFT notation)", c.bban],
    [ru ? "Пример" : "Example", formatIban(c.example)],
  ];
  if (c.sepa) facts.push([ru ? "Зона SEPA" : "SEPA", ru ? "входит — переводы в евро по правилам SEPA" : "member — euro transfers under SEPA rules"]);
  return [
    { type: "facts", title: ru ? `IBAN: ${name} коротко` : `${name} IBAN at a glance`, rows: facts },
    { type: "table", title: ru ? "Из чего состоит IBAN" : "IBAN structure", head: ru ? ["Позиции", "Поле", "В примере", "Символы"] : ["Positions", "Field", "In the example", "Characters"], rows, mono: false },
  ];
}

function ibanFaq(c: IbanCountry, l: Locale): QA[] {
  const ru = l === "ru";
  const name = ru ? c.ru : c.en;
  const bankPos = `${4 + c.bank[0]}–${4 + c.bank[1]}`;
  if (ru)
    return [
      { q: `Сколько символов в IBAN (${name})?`, a: `${symRu(c.length)}: код страны ${c.code}, две контрольные цифры и ${symRu(c.length - 4)} национального номера счёта (BBAN).` },
      { q: `Где в IBAN (${name}) код банка?`, a: `На позициях ${bankPos}${c.branch ? `, код отделения — на позициях ${4 + c.branch[0]}–${4 + c.branch[1]}` : ""}. В примере ${formatIban(c.example)} это ${c.example.slice(3 + c.bank[0], 4 + c.bank[1])}.` },
      { q: "Как проверить IBAN?", a: "Вставьте номер в поле выше: инструмент сверит длину и структуру с форматом страны и пересчитает контрольную сумму по модулю 97 (ISO 13616). Одна опечатка почти всегда ломает контрольную сумму." },
    ];
  return [
    { q: `How many characters are in a ${name} IBAN?`, a: `${c.length}: the country code ${c.code}, two check digits and a ${c.length - 4}-character national account number (BBAN).` },
    { q: `Where is the bank code in a ${name} IBAN?`, a: `At positions ${bankPos}${c.branch ? `, with the branch code at ${4 + c.branch[0]}–${4 + c.branch[1]}` : ""}. In the example ${formatIban(c.example)} it's ${c.example.slice(3 + c.bank[0], 4 + c.bank[1])}.` },
    { q: "How is an IBAN validated?", a: "Paste it above: the tool checks the length and structure against the country format and recomputes the mod-97 checksum (ISO 13616). A single typo almost always breaks the checksum." },
  ];
}

export function ibanVariants(): VariantDef[] {
  return IBAN_COUNTRIES.map((c) => ({
    slug: c.code.toLowerCase(),
    name: { ru: `${c.code} · ${c.ru}`, en: `${c.code} · ${c.en}` },
    title: {
      ru: fit([`IBAN ${c.ru} (${c.code}): формат, пример и проверка`, `IBAN ${c.ru} (${c.code}): формат и проверка`]),
      en: fit([`${c.en} IBAN (${c.code}) — Format, Example, Validator`, `${c.en} IBAN (${c.code}) — Format and Validator`]),
    },
    h1: { ru: `Проверка IBAN — ${c.ru}`, en: `${c.en} IBAN validator` },
    description: {
      ru: `IBAN ${c.ru} (${c.code}): ${symRu(c.length)}, код банка на позициях ${4 + c.bank[0]}–${4 + c.bank[1]}. Пример ${c.example} и онлайн-проверка контрольной суммы.`,
      en: `${c.en} IBAN (${c.code}): ${c.length} characters, bank code at positions ${4 + c.bank[0]}–${4 + c.bank[1]}. Example ${c.example} and an online checksum check.`,
    },
    lead: {
      ru: `IBAN (${c.ru}) — ${symRu(c.length)} по схеме ${ibanLayout(c)}, код банка на позициях ${4 + c.bank[0]}–${4 + c.bank[1]}.`,
      en: `A ${c.en} IBAN has ${c.length} characters in the layout ${ibanLayout(c)}; the bank code is at positions ${4 + c.bank[0]}–${4 + c.bank[1]}.`,
    },
    props: { country: c.code },
    keywords: { ru: [`iban ${c.code.toLowerCase()}`, `iban ${c.ru.toLowerCase()}`], en: [`iban ${c.en.toLowerCase()}`, `${c.code} iban format`] },
    blocks: (l: Locale) => ibanBlocks(c, l),
    faq: { ru: ibanFaq(c, "ru"), en: ibanFaq(c, "en") },
  }));
}

/* ───────────── phone countries ───────────── */

export const PHONE_COUNTRIES: CountryCode[] = ["KZ", "RU", "BY", "UZ", "KG", "TJ", "TM", "AM", "AZ", "GE", "UA", "MD", "MN", "TR", "CN", "IN", "US", "CA", "GB", "DE", "FR", "IT", "ES", "PL", "NL", "CZ", "LT", "LV", "EE", "FI", "SE", "AE", "IL", "SA", "EG", "KR", "JP", "TH", "VN", "ID", "BR", "MX", "AR", "AU"];

const dnCache: Partial<Record<Locale, Intl.DisplayNames>> = {};
export function countryName(code: string, l: Locale): string {
  dnCache[l] ??= new Intl.DisplayNames([l], { type: "region" });
  return dnCache[l]!.of(code) ?? code;
}

const PHONE_NOTES: Partial<Record<CountryCode, { ru: string; en: string }>> = {
  KZ: {
    ru: "Казахстан и Россия делят код +7. Номера Казахстана начинаются с +7 6xx или +7 7xx (мобильные — 700–702, 705–708, 747, 771, 775–778; городские — 7172 Астана, 727 Алматы и т. д.), российские — с +7 3xx, 4xx, 8xx и 9xx. Поэтому +7 912… — это номер России, а не Казахстана. Внутри страны вместо +7 набирают 8.",
    en: "Kazakhstan shares +7 with Russia. Kazakh numbers start with +7 6xx or +7 7xx (mobile 700–702, 705–708, 747, 771, 775–778; landlines such as 7172 Astana, 727 Almaty), Russian ones with +7 3xx, 4xx, 8xx or 9xx. So +7 912… is Russian, not Kazakh. Domestically 8 is dialled instead of +7.",
  },
  RU: {
    ru: "Россия делит код +7 с Казахстаном: российские номера начинаются с +7 3xx, 4xx, 8xx или 9xx (мобильные — 9xx), казахстанские — с +7 6xx и 7xx. Внутри страны вместо +7 набирают 8; номера 8-800 бесплатны для звонящего.",
    en: "Russia shares +7 with Kazakhstan: Russian numbers start with +7 3xx, 4xx, 8xx or 9xx (mobile 9xx), Kazakh ones with +7 6xx and 7xx. Domestically 8 replaces +7; 8-800 numbers are free to call.",
  },
  US: { ru: "США, Канада и ещё два десятка стран Северной Америки используют общий код +1 (NANP): номер из 10 цифр — код зоны из трёх цифр и семизначный номер.", en: "The US, Canada and about twenty other countries share +1 (the NANP): 10-digit numbers made of a 3-digit area code and a 7-digit number." },
  CA: { ru: "Канада входит в североамериканский план нумерации с кодом +1, общим с США: по номеру страну определяет код зоны.", en: "Canada is part of the North American Numbering Plan with +1, shared with the US: the area code tells the country." },
  BY: { ru: "В Беларуси внутри страны номер набирают через 8 0 (например, 8 029 …), а из-за рубежа — +375 без нуля.", en: "In Belarus numbers are dialled domestically with 8 0 (e.g. 8 029 …) and from abroad as +375 without the zero." },
  UZ: { ru: "В Узбекистане мобильные номера — +998 и двузначный код оператора (90, 91, 93, 94, 97, 99, 33, 88 и др.) и 7 цифр.", en: "Uzbek mobile numbers are +998, a two-digit operator code (90, 91, 93, 94, 97, 99, 33, 88 etc.) and 7 digits." },
};

function nationalPrefix(national: string, nsn: string): string {
  const digits = national.replace(/\D/g, "");
  return digits.endsWith(nsn) ? digits.slice(0, digits.length - nsn.length) : "";
}

function phoneBlocks(code: CountryCode, l: Locale): Block[] {
  const ru = l === "ru";
  const ex = getExampleNumber(code, examples);
  const cc = getCountryCallingCode(code);
  const facts: [string, string][] = [
    [ru ? "Код страны" : "Country code", `+${cc}`],
    [ru ? "ISO-код" : "ISO code", code],
  ];
  if (ex) {
    const prefix = nationalPrefix(ex.formatNational(), ex.nationalNumber);
    facts.push(
      [ru ? "Пример мобильного (международный формат)" : "Mobile example (international)", ex.formatInternational()],
      [ru ? "Внутри страны" : "Domestic format", ex.formatNational()],
      [ru ? "Для баз данных (E.164)" : "For databases (E.164)", ex.number],
      [ru ? "Цифр в национальном номере" : "Digits in the national number", String(ex.nationalNumber.length)],
      [ru ? "Префикс при звонке внутри страны" : "Domestic trunk prefix", prefix || (ru ? "нет" : "none")],
    );
  }
  const blocks: Block[] = [{ type: "facts", title: ru ? `Номера: ${countryName(code, l)}` : `${countryName(code, l)} phone numbers`, rows: facts }];
  const note = PHONE_NOTES[code];
  if (note) blocks.push({ type: "text", title: ru ? "Особенности нумерации" : "Numbering notes", paragraphs: [note[l]] });
  return blocks;
}

function phoneFaq(code: CountryCode, l: Locale): QA[] {
  const ru = l === "ru";
  const name = countryName(code, l);
  const ex = getExampleNumber(code, examples);
  const cc = getCountryCallingCode(code);
  if (ru)
    return [
      { q: `Какой телефонный код у страны ${name}?`, a: `+${cc}. Из-за рубежа номер набирают как +${cc} и национальный номер${ex ? `, например ${ex.formatInternational()}` : ""}.` },
      { q: "В каком формате хранить номер в базе данных?", a: `В формате E.164 — плюс, код страны и номер без пробелов${ex ? `: ${ex.number}` : ""}. Так номер однозначен для любых сервисов рассылок и звонков.` },
      ...(code === "KZ" ? [{ q: "Как отличить номер Казахстана от российского?", a: "По первой цифре после +7: 6 и 7 — Казахстан, 3, 4, 8 и 9 — Россия. Валидатор делает это автоматически и предупредит, если номер не казахстанский." }] : []),
      ...(code === "RU" ? [{ q: "Как отличить российский номер от казахстанского?", a: "После +7 у российских номеров идут цифры 3, 4, 8 или 9, у казахстанских — 6 или 7." }] : []),
    ];
  return [
    { q: `What is the calling code for ${name}?`, a: `+${cc}. From abroad dial +${cc} followed by the national number${ex ? `, e.g. ${ex.formatInternational()}` : ""}.` },
    { q: "Which format should a database store?", a: `E.164 — a plus, the country code and the number without spaces${ex ? `: ${ex.number}` : ""}. It's unambiguous for any messaging or calling service.` },
    ...(code === "KZ" ? [{ q: "How do I tell a Kazakh number from a Russian one?", a: "By the first digit after +7: 6 and 7 are Kazakhstan; 3, 4, 8 and 9 are Russia. The validator checks this automatically." }] : []),
  ];
}

export function phoneVariants(): VariantDef[] {
  return PHONE_COUNTRIES.map((code) => {
    const cc = getCountryCallingCode(code);
    const ex = getExampleNumber(code, examples);
    const ruName = countryName(code, "ru");
    const enName = countryName(code, "en");
    return {
      slug: code.toLowerCase(),
      name: { ru: `${ruName} +${cc}`, en: `${enName} +${cc}` },
      title: { ru: `Проверка номера телефона: ${ruName} (+${cc})`, en: `${enName} Phone Number Validator (+${cc})` },
      h1: { ru: `Проверка номера телефона — ${ruName}`, en: `${enName} phone number validator` },
      description: {
        ru: `Проверка и форматирование номеров (${ruName}, код +${cc})${ex ? `: пример ${ex.formatInternational()}` : ""}. Тип номера, формат E.164 и национальный. Работает офлайн.`,
        en: `Validate and format ${enName} phone numbers (+${cc})${ex ? `, e.g. ${ex.formatInternational()}` : ""}. Number type, E.164 and national formats. Works offline.`,
      },
      lead: {
        ru: `Код страны +${cc}${ex ? `, мобильный номер выглядит так: ${ex.formatInternational()}` : ""}.`,
        en: `Country code +${cc}${ex ? `; a mobile number looks like ${ex.formatInternational()}` : ""}.`,
      },
      props: { country: code, value: ex ? ex.formatInternational() : "" },
      keywords: { ru: [`номер телефона ${ruName.toLowerCase()}`, `+${cc}`], en: [`${enName.toLowerCase()} phone number`, `+${cc}`] },
      blocks: (l: Locale) => phoneBlocks(code, l),
      faq: { ru: phoneFaq(code, "ru"), en: phoneFaq(code, "en") },
    };
  });
}

/* ───────────── card networks ───────────── */

const BRAND_TEXT: Record<Brand, { ranges: string; ru: string; en: string; slug: string; test: string }> = {
  visa: { slug: "visa", ranges: "4", test: "4", ru: "Visa — крупнейшая международная платёжная система. Номера начинаются с 4, обычно 16 цифр (встречаются 13 и 19).", en: "Visa is the largest international card network. Numbers start with 4, usually 16 digits (13 and 19 exist)." },
  mastercard: { slug: "mastercard", ranges: "51–55, 2221–2720", test: "5", ru: "Mastercard использует диапазоны 51–55 и, с 2017 года, 2221–2720. Номер всегда из 16 цифр.", en: "Mastercard uses 51–55 and, since 2017, 2221–2720. Numbers always have 16 digits." },
  mir: { slug: "mir", ranges: "2200–2204", test: "2200", ru: "«Мир» — национальная платёжная система России (НСПК). Номера начинаются с 2200–2204, длина 16–19 цифр. Не путайте с Mastercard: его «двойки» начинаются только с 2221.", en: "Mir is Russia's national card network (NSPK). Numbers start with 2200–2204 and have 16–19 digits. Don't confuse it with Mastercard, whose 2-series starts at 2221." },
  amex: { slug: "american-express", ranges: "34, 37", test: "37", ru: "American Express: номера из 15 цифр, начинаются с 34 или 37, группируются как 4-6-5, код безопасности CID — 4 цифры на лицевой стороне.", en: "American Express: 15-digit numbers starting with 34 or 37, grouped 4-6-5, with a 4-digit CID on the front." },
  unionpay: { slug: "unionpay", ranges: "62", test: "62", ru: "UnionPay — китайская платёжная система, крупнейшая в мире по числу выпущенных карт. Номера начинаются с 62, длина 16–19 цифр; часть диапазона 622126–622925 принимается и в сети Discover.", en: "UnionPay is China's card network, the world's largest by cards issued. Numbers start with 62 and have 16–19 digits; part of the 622126–622925 range is also accepted on the Discover network." },
  jcb: { slug: "jcb", ranges: "3528–3589", test: "3530", ru: "JCB — японская платёжная система. Номера начинаются с 3528–3589, длина 16–19 цифр.", en: "JCB is a Japanese card network. Numbers start with 3528–3589, 16–19 digits." },
  maestro: { slug: "maestro", ranges: "5018, 5020, 5038, 5893, 6304, 6759, 6761–6763", test: "6759", ru: "Maestro — дебетовые карты Mastercard с длиной номера от 12 до 19 цифр. В 2023 году Mastercard начала сворачивать выпуск Maestro в Европе в пользу Debit Mastercard.", en: "Maestro is Mastercard's debit brand with 12–19 digit numbers. Mastercard began phasing out new Maestro issuance in Europe in 2023 in favour of Debit Mastercard." },
  discover: { slug: "discover", ranges: "6011, 644–649, 65", test: "6011", ru: "Discover — американская платёжная система; номера начинаются с 6011, 644–649 или 65, длина 16–19 цифр.", en: "Discover is a US card network; numbers start with 6011, 644–649 or 65, 16–19 digits." },
  diners: { slug: "diners-club", ranges: "300–305, 3095, 36, 38–39", test: "36", ru: "Diners Club — одна из первых карт в мире (1950). Номера начинаются с 300–305, 3095, 36 или 38–39, классическая длина — 14 цифр.", en: "Diners Club was one of the first cards (1950). Numbers start with 300–305, 3095, 36 or 38–39; the classic length is 14 digits." },
};

function testNumber(prefix: string, len: number): string {
  const body = prefix.padEnd(len - 1, "0");
  return body + luhnCheckDigit(body);
}

export function cardVariants(): VariantDef[] {
  return (Object.keys(BRANDS) as Brand[]).map((b) => {
    const info = BRANDS[b];
    const tx = BRAND_TEXT[b];
    const len = info.lengths.includes(16) ? 16 : info.lengths[0];
    const sample = testNumber(tx.test, len);
    const ruName = info.name;
    return {
      slug: tx.slug,
      name: { ru: ruName, en: info.name === "Мир" ? "Mir" : info.name },
      title: { ru: `Проверка карты ${ruName}: номер, диапазоны BIN, Луна`, en: `${info.name === "Мир" ? "Mir" : info.name} Card Number Validator — Ranges and Luhn` },
      h1: { ru: `Проверка номера карты ${ruName}`, en: `${info.name === "Мир" ? "Mir" : info.name} card number validator` },
      description: {
        ru: `Как проверить номер карты ${ruName}: начало номера ${b === "maestro" ? "50, 58, 63 или 67" : tx.ranges}, длина ${lengthsText(info.lengths)} цифр, контрольная цифра по алгоритму Луна. Проверка в браузере.`,
        en: `Validate a ${info.name === "Мир" ? "Mir" : info.name} card number: it starts with ${b === "maestro" ? "50, 58, 63 or 67" : tx.ranges}, has ${lengthsText(info.lengths).replace(", 19", " or 19")} digits and ends with a Luhn check digit. Checked in your browser.`,
      },
      lead: { ru: `Номера ${ruName} начинаются с ${tx.ranges} и содержат ${lengthsText(info.lengths)} цифр.`, en: `${info.name === "Мир" ? "Mir" : info.name} numbers start with ${tx.ranges} and have ${lengthsText(info.lengths)} digits.` },
      props: { value: sample.replace(/(.{4})(?=.)/g, "$1 ") },
      keywords: { ru: [`проверка карты ${ruName.toLowerCase()}`, `bin ${ruName.toLowerCase()}`], en: [`${info.name.toLowerCase()} card validator`] },
      blocks: (l: Locale) => [
        {
          type: "facts",
          title: l === "ru" ? `Карты ${ruName} коротко` : `${info.name === "Мир" ? "Mir" : info.name} at a glance`,
          rows: [
            [l === "ru" ? "Первые цифры номера" : "Leading digits", tx.ranges],
            [l === "ru" ? "Длина номера" : "Number length", lengthsText(info.lengths)],
            [l === "ru" ? "Группировка" : "Grouping", info.groups.join("-")],
            [l === "ru" ? "Код безопасности" : "Security code", l === "ru" ? `${info.cvcLength} цифры` : `${info.cvcLength} digits`],
            [l === "ru" ? "Тестовый номер (не настоящая карта)" : "Test number (not a real card)", sample],
          ],
        },
        { type: "text", title: l === "ru" ? "О платёжной системе" : "About the network", paragraphs: [tx[l]] },
      ],
      faq: {
        ru: [
          { q: `С каких цифр начинается номер карты ${ruName}?`, a: `С ${tx.ranges}. Эти первые цифры — часть BIN (IIN), по которому определяется платёжная система.` },
          { q: "Можно ли по номеру узнать банк?", a: "Первые 6–8 цифр (BIN) закреплены за банком-эмитентом, но таблицы BIN платёжные системы не публикуют открыто, а банки часто меняют диапазоны. Поэтому мы показываем только платёжную систему и не угадываем банк." },
        ],
        en: [
          { q: `What digits does a ${info.name === "Мир" ? "Mir" : info.name} card start with?`, a: `${tx.ranges}. These leading digits are part of the BIN (IIN) that identifies the network.` },
          { q: "Can I find the bank from the number?", a: "The first 6–8 digits (BIN) belong to the issuing bank, but networks don't publish BIN tables and banks reshuffle ranges. So we show only the card network and don't guess the bank." },
        ],
      },
    };
  });
}
