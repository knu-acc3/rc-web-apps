import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { ROMAN_SYMBOLS, partText, romanParts, toRoman } from "../lib/roman";
import { enOrdinalSuffix } from "../lib/words-en";
import { ruCardinal, ruOrdinal } from "../lib/words-ru";
import { fit, num } from "./text";

/* ───────────── curated numbers ───────────── */

/** The first title that fits 60 characters, else the shortest. */
function pickTitle(candidates: string[]): string {
  return candidates.find((c) => c.length <= 60) ?? candidates[candidates.length - 1];
}

const ROMAN_NUMBERS: number[] = (() => {
  const set = new Set<number>();
  for (let n = 1; n <= 100; n++) set.add(n);
  for (let n = 1900; n <= 2100; n++) set.add(n);
  for (let n = 200; n <= 3900; n += 100) set.add(n);
  set.add(3999);
  return [...set].sort((a, b) => a - b);
})();

const ANCHORS = [1, 4, 5, 9, 10, 12, 14, 19, 20, 40, 50, 90, 100, 400, 500, 900, 1000, 1999, 2000, 2024, 2025, 2026, 3000, 3999];

const fmt = (n: number, locale: Locale) => num(n, locale);
const isYear = (n: number) => n >= 1900 && n <= 2100;
const leap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** "MM + XX + IV" and "2000 + 20 + 4" */
function breakdown(n: number, locale: Locale) {
  const parts = romanParts(n);
  return {
    roman: parts.map(partText).join(" + "),
    arabic: parts.map((p) => fmt(p.value, locale)).join(" + "),
    pairs: parts.map((p) => `${p.roman} (${fmt(p.value, locale)})`).join(" + "),
  };
}

/* ───────────── facts for specific numbers ───────────── */

const MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const RULERS: Record<number, { ru: string; en: string }> = {
  1: { ru: "Пётр I (Пётр Великий), Елизавета I Английская", en: "Peter I (Peter the Great), Elizabeth I of England" },
  2: { ru: "Екатерина II, Николай II, Елизавета II", en: "Catherine II (the Great), Nicholas II, Elizabeth II" },
  3: { ru: "Карл III — король Великобритании с 2022 года", en: "Charles III, King of the United Kingdom since 2022" },
  4: { ru: "Иван IV Грозный", en: "Ivan IV (the Terrible)" },
  8: { ru: "Генрих VIII", en: "Henry VIII" },
  14: { ru: "Людовик XIV, папа римский Лев XIV (избран в 2025 году)", en: "Louis XIV; Pope Leo XIV, elected in 2025" },
  16: { ru: "Людовик XVI, папа римский Бенедикт XVI", en: "Louis XVI; Pope Benedict XVI" },
  23: { ru: "папа римский Иоанн XXIII", en: "Pope John XXIII" },
};

const SUMMER: Record<number, { ru: string; en: string } | null> = {
  1900: { ru: "Париж", en: "Paris" },
  1904: { ru: "Сент-Луис", en: "St. Louis" },
  1908: { ru: "Лондон", en: "London" },
  1912: { ru: "Стокгольм", en: "Stockholm" },
  1916: null,
  1920: { ru: "Антверпен", en: "Antwerp" },
  1924: { ru: "Париж", en: "Paris" },
  1928: { ru: "Амстердам", en: "Amsterdam" },
  1932: { ru: "Лос-Анджелес", en: "Los Angeles" },
  1936: { ru: "Берлин", en: "Berlin" },
  1940: null,
  1944: null,
  1948: { ru: "Лондон", en: "London" },
  1952: { ru: "Хельсинки", en: "Helsinki" },
  1956: { ru: "Мельбурн", en: "Melbourne" },
  1960: { ru: "Рим", en: "Rome" },
  1964: { ru: "Токио", en: "Tokyo" },
  1968: { ru: "Мехико", en: "Mexico City" },
  1972: { ru: "Мюнхен", en: "Munich" },
  1976: { ru: "Монреаль", en: "Montreal" },
  1980: { ru: "Москва", en: "Moscow" },
  1984: { ru: "Лос-Анджелес", en: "Los Angeles" },
  1988: { ru: "Сеул", en: "Seoul" },
  1992: { ru: "Барселона", en: "Barcelona" },
  1996: { ru: "Атланта", en: "Atlanta" },
  2000: { ru: "Сидней", en: "Sydney" },
  2004: { ru: "Афины", en: "Athens" },
  2008: { ru: "Пекин", en: "Beijing" },
  2012: { ru: "Лондон", en: "London" },
  2016: { ru: "Рио-де-Жанейро", en: "Rio de Janeiro" },
  2020: { ru: "Токио (прошли в 2021 году из-за пандемии)", en: "Tokyo (held in 2021 because of the pandemic)" },
  2024: { ru: "Париж", en: "Paris" },
  2028: { ru: "Лос-Анджелес", en: "Los Angeles" },
  2032: { ru: "Брисбен", en: "Brisbane" },
};

const WINTER: [number, number, { ru: string; en: string }][] = [
  [1924, 1, { ru: "Шамони", en: "Chamonix" }],
  [1928, 2, { ru: "Санкт-Мориц", en: "St. Moritz" }],
  [1932, 3, { ru: "Лейк-Плэсид", en: "Lake Placid" }],
  [1936, 4, { ru: "Гармиш-Партенкирхен", en: "Garmisch-Partenkirchen" }],
  [1948, 5, { ru: "Санкт-Мориц", en: "St. Moritz" }],
  [1952, 6, { ru: "Осло", en: "Oslo" }],
  [1956, 7, { ru: "Кортина-д’Ампеццо", en: "Cortina d’Ampezzo" }],
  [1960, 8, { ru: "Скво-Вэлли", en: "Squaw Valley" }],
  [1964, 9, { ru: "Инсбрук", en: "Innsbruck" }],
  [1968, 10, { ru: "Гренобль", en: "Grenoble" }],
  [1972, 11, { ru: "Саппоро", en: "Sapporo" }],
  [1976, 12, { ru: "Инсбрук", en: "Innsbruck" }],
  [1980, 13, { ru: "Лейк-Плэсид", en: "Lake Placid" }],
  [1984, 14, { ru: "Сараево", en: "Sarajevo" }],
  [1988, 15, { ru: "Калгари", en: "Calgary" }],
  [1992, 16, { ru: "Альбервиль", en: "Albertville" }],
  [1994, 17, { ru: "Лиллехаммер", en: "Lillehammer" }],
  [1998, 18, { ru: "Нагано", en: "Nagano" }],
  [2002, 19, { ru: "Солт-Лейк-Сити", en: "Salt Lake City" }],
  [2006, 20, { ru: "Турин", en: "Turin" }],
  [2010, 21, { ru: "Ванкувер", en: "Vancouver" }],
  [2014, 22, { ru: "Сочи", en: "Sochi" }],
  [2018, 23, { ru: "Пхёнчхан", en: "PyeongChang" }],
  [2022, 24, { ru: "Пекин", en: "Beijing" }],
  [2026, 25, { ru: "Милан и Кортина-д’Ампеццо", en: "Milan and Cortina d’Ampezzo" }],
  [2030, 26, { ru: "Французские Альпы", en: "the French Alps" }],
  [2034, 27, { ru: "Солт-Лейк-Сити", en: "Salt Lake City" }],
];

function usageNotes(n: number, locale: Locale): string[] {
  const r = toRoman(n);
  const out: string[] = [];
  const ru = locale === "ru";
  if (isYear(n)) {
    const c = Math.ceil(n / 100);
    const m = Math.ceil(n / 1000);
    out.push(
      ru
        ? `${n} год относится к ${toRoman(c)} веку (${ruOrdinal(c)} век, ${(c - 1) * 100 + 1}–${c * 100} годы) и ${toRoman(m)} тысячелетию.${n % 100 === 0 ? ` Обратите внимание: ${n} год — последний год ${toRoman(c)} века, а не первый год следующего.` : ""}`
        : `The year ${n} belongs to the ${c}${c === 21 ? "st" : c === 22 ? "nd" : "th"} century (${(c - 1) * 100 + 1}–${c * 100}).${n % 100 === 0 ? ` Note that ${n} is the last year of that century, not the first year of the next one.` : ""}`,
    );
    out.push(
      ru
        ? `${n} год ${leap(n) ? "високосный — в нём 366 дней" : "не високосный — в нём 365 дней"}. Прописью: ${ruOrdinal(n)} год.`
        : `${n} ${leap(n) ? "is a leap year with 366 days" : "is not a leap year; it has 365 days"}.`,
    );
    if (n in SUMMER) {
      const host = SUMMER[n];
      const olymp = (n - 1896) / 4 + 1;
      out.push(
        host
          ? ru
            ? `Летние Олимпийские игры ${n} года — Игры ${toRoman(olymp)} Олимпиады: ${host.ru}.`
            : `The ${n} Summer Olympics were the Games of the ${toRoman(olymp)} Olympiad: ${host.en}.`
          : ru
            ? `Игры ${toRoman(olymp)} Олимпиады (${n}) были отменены из-за мировой войны, но номер Олимпиады сохранился.`
            : `The Games of the ${toRoman(olymp)} Olympiad (${n}) were cancelled because of the world war, yet the Olympiad keeps its number.`,
      );
    }
    const w = WINTER.find(([y]) => y === n);
    if (w) out.push(ru ? `${toRoman(w[1])} зимние Олимпийские игры — ${w[2].ru}, ${n}.` : `The ${toRoman(w[1])} Olympic Winter Games — ${w[2].en}, ${n}.`);
    out.push(
      ru
        ? `Римскими цифрами год пишут в титрах фильмов, на фасадах зданий, памятных медалях и в дипломах: ${r}.`
        : `Film and TV credits, building facades, medals and diplomas often show the year in Roman numerals: ${r}.`,
    );
    return out;
  }
  if (n <= 12) {
    out.push(ru ? `На циферблатах часов ${n === 4 ? "4 обычно пишут как IIII (традиция часовщиков), хотя правильная запись — IV" : `${n} обозначают как ${r}`}.` : `On clock faces ${n === 4 ? "4 is usually shown as IIII (a clockmakers’ tradition), although the standard form is IV" : `${n} is shown as ${r}`}.`);
    out.push(
      ru
        ? `В датах месяц иногда пишут римскими цифрами: 1.${r}.2025 — 1 ${MONTHS_GEN[n - 1]} 2025 года.`
        : `Some European date formats write the month in Roman numerals: 1.${r}.2025 is 1 ${MONTHS_EN[n - 1]} 2025.`,
    );
  }
  if (ru && n <= 21) out.push(`${r} век — это ${n === 1 ? "1–100" : `${(n - 1) * 100 + 1}–${n * 100}`} годы (${ruOrdinal(n)} век).`);
  if (ru && n <= 4) out.push(`Кварталы года тоже нумеруют римскими цифрами: ${r} квартал.`);
  if (!ru && n <= 60 && n !== 50) out.push(`Super Bowl ${r} was played in ${1966 + n}.`);
  if (!ru && n === 50) out.push("Super Bowl 50 (2016) is the only one numbered with Arabic numerals instead of L.");
  const rule = RULERS[n];
  if (rule) out.push(ru ? `Порядковые номера монархов и пап: ${rule.ru}.` : `Regnal numbers of monarchs and popes: ${rule.en}.`);
  if (n === 3999) out.push(ru ? "3999 — самое большое число, которое записывается стандартными римскими цифрами без черты сверху." : "3999 is the largest number that standard Roman numerals can express without an overline.");
  if (n % 100 === 0 && n > 100) {
    out.push(
      ru
        ? `Сотни и тысячи пишутся символами C (100), D (500) и M (1000): ${breakdown(n, locale).pairs}.`
        : `Hundreds and thousands use C (100), D (500) and M (1000): ${breakdown(n, locale).pairs}.`,
    );
  }
  return out;
}

/* ───────────── variant pages ───────────── */

function neighboursTable(n: number, locale: Locale): Block {
  const rows: string[][] = [];
  for (let k = Math.max(1, n - 5); k <= Math.min(3999, n + 5); k++) rows.push([k === n ? `→ ${fmt(k, locale)}` : fmt(k, locale), toRoman(k)]);
  return {
    type: "table",
    title: locale === "ru" ? `Соседние числа: от ${fmt(Math.max(1, n - 5), locale)} до ${fmt(Math.min(3999, n + 5), locale)}` : `Neighbouring numbers ${fmt(Math.max(1, n - 5), locale)}–${fmt(Math.min(3999, n + 5), locale)}`,
    head: locale === "ru" ? ["Число", "Римскими цифрами"] : ["Number", "Roman numeral"],
    rows,
  };
}

function romanVariant(n: number): VariantDef {
  const r = toRoman(n);
  const b = (l: Locale) => breakdown(n, l);
  const year = isYear(n);
  const c = Math.ceil(n / 100);
  const single = romanParts(n).length === 1;

  const faq: Record<Locale, QA[]> = {
    ru: [
      {
        q: `Как написать ${fmt(n, "ru")} римскими цифрами?`,
        a: single ? `${fmt(n, "ru")} = ${r}.` : `${fmt(n, "ru")} = ${r}. Число раскладывают по разрядам: ${b("ru").arabic}, и каждый разряд записывают отдельно: ${b("ru").pairs}.`,
      },
      {
        q: `Что означает ${r}?`,
        a: `${r} — это ${fmt(n, "ru")} (${ruCardinal(n)}). ${r.length > 1 ? `Символы читают слева направо; меньший символ перед большим вычитается (IV = 4, IX = 9, XL = 40, XC = 90, CD = 400, CM = 900), в остальных случаях значения складываются.` : ""}`.trim(),
      },
      ...(year
        ? [{ q: `Какой это век — ${n} год?`, a: `${n} год — это ${toRoman(c)} век (${ruOrdinal(c)}). Век длится с ${(c - 1) * 100 + 1} по ${c * 100} год включительно.` }]
        : n <= 21
          ? [{ q: `Как пишется ${ruOrdinal(n)} век римскими цифрами?`, a: `${ruOrdinal(n).charAt(0).toUpperCase() + ruOrdinal(n).slice(1)} век — ${r} век: годы с ${(n - 1) * 100 + 1} по ${n * 100}.` }]
          : []),
    ],
    en: [
      {
        q: `How do you write ${fmt(n, "en")} in Roman numerals?`,
        a: single ? `${fmt(n, "en")} = ${r}.` : `${fmt(n, "en")} = ${r}. Split the number by place value — ${b("en").arabic} — and write each part: ${b("en").pairs}.`,
      },
      {
        q: `What does ${r} mean?`,
        a: `${r} means ${fmt(n, "en")}. ${r.length > 1 ? "Read the symbols left to right; a smaller symbol before a larger one is subtracted (IV = 4, IX = 9, XL = 40, XC = 90, CD = 400, CM = 900), otherwise values are added." : ""}`.trim(),
      },
      ...(year ? [{ q: `How is the year ${n} written on film credits?`, a: `As ${r} — the same standard Roman numeral: ${b("en").pairs}.` }] : []),
    ],
  };
  if (n === 4) {
    faq.ru.push({ q: "Почему на часах 4 пишут как IIII?", a: "Это давняя традиция часовщиков: IIII визуально уравновешивает VIII на противоположной стороне циферблата. Стандартная запись числа 4 — IV." });
    faq.en.push({ q: "Why do clocks show 4 as IIII?", a: "It is a long-standing clockmakers’ tradition — IIII visually balances VIII on the opposite side of the dial. The standard form of 4 is IV." });
  }

  const near = (l: Locale) => (n > 1 && n < 3999 ? `${fmt(n - 1, l)} = ${toRoman(n - 1)}, ${fmt(n + 1, l)} = ${toRoman(n + 1)}` : "");
  const descRu = year
    ? fit(`${n} римскими цифрами — ${r}: ${b("ru").pairs}. Год ${n} — это ${toRoman(c)} век.`, [[" Разбор записи, соседние годы и онлайн-конвертер.", " Разбор и соседние годы."]])
    : fit(`Число ${fmt(n, "ru")} римскими цифрами записывается как ${r}${single ? "" : `: ${b("ru").pairs}`}.`, [
        near("ru") ? ` Соседние числа: ${near("ru")}.` : "",
        ` Прописью — ${ruCardinal(n)}.`,
        [" Разбор записи и онлайн-конвертер.", " Где встречается."],
        " Символы: I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000.",
      ]);
  const descEn = year
    ? fit(`${n} in Roman numerals is ${r}: ${b("en").pairs}.`, [
        ` A year of the ${enOrdinalSuffix(c)} century.`,
        [" Breakdown, neighbouring years and a two-way converter.", " Breakdown and neighbouring years."],
      ])
    : fit(`${fmt(n, "en")} in Roman numerals is ${r}${single ? "" : `: ${b("en").pairs}`}.`, [
        near("en") ? ` Neighbours: ${near("en")}.` : "",
        [" Step-by-step breakdown, where it is used and a two-way converter.", " Breakdown and converter."],
        " Symbols: I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000.",
      ]);

  return {
    slug: String(n),
    name: { ru: fmt(n, "ru"), en: fmt(n, "en") },
    title: {
      ru: pickTitle([`${fmt(n, "ru")} римскими цифрами — ${r} | как записать число`, `${fmt(n, "ru")} римскими цифрами — ${r} | запись числа`, `${fmt(n, "ru")} римскими цифрами | ${r}`]),
      en: pickTitle([`${fmt(n, "en")} in Roman numerals — ${r} | how to write it`, `${fmt(n, "en")} in Roman numerals — ${r} | spelled out`, `${fmt(n, "en")} in Roman numerals | ${r}`]),
    },
    h1: { ru: `${fmt(n, "ru")} римскими цифрами`, en: `${fmt(n, "en")} in Roman numerals` },
    description: { ru: descRu, en: descEn },
    lead: {
      ru: `${fmt(n, "ru")} = ${r}${single ? "" : ` (${b("ru").roman})`}${year ? ` · ${toRoman(c)} век` : ""}`,
      en: `${fmt(n, "en")} = ${r}${single ? "" : ` (${b("en").roman})`}`,
    },
    props: { value: n },
    keywords: { ru: [r, `${n} римскими`, year ? `${n} год` : ""].filter(Boolean), en: [r, `${n} roman`] },
    blocks: (locale) => {
      const bb = b(locale);
      const facts: [string, string][] =
        locale === "ru"
          ? [
              ["Римскими цифрами", r],
              ["Строчными буквами", r.toLowerCase()],
              ["Разбор по разрядам", `${bb.roman} = ${bb.arabic}`],
              ["Количество символов", String(r.length)],
              ["Прописью", ruCardinal(n)],
              ...(n > 1 ? ([["Предыдущее число", `${fmt(n - 1, locale)} = ${toRoman(n - 1)}`]] as [string, string][]) : []),
              ...(n < 3999 ? ([["Следующее число", `${fmt(n + 1, locale)} = ${toRoman(n + 1)}`]] as [string, string][]) : []),
            ]
          : [
              ["Roman numeral", r],
              ["Lowercase", r.toLowerCase()],
              ["Place-value breakdown", `${bb.roman} = ${bb.arabic}`],
              ["Number of symbols", String(r.length)],
              ...(n > 1 ? ([["Previous number", `${fmt(n - 1, locale)} = ${toRoman(n - 1)}`]] as [string, string][]) : []),
              ...(n < 3999 ? ([["Next number", `${fmt(n + 1, locale)} = ${toRoman(n + 1)}`]] as [string, string][]) : []),
            ];
      const notes = usageNotes(n, locale);
      const blocks: Block[] = [{ type: "facts", title: locale === "ru" ? `Число ${fmt(n, locale)}: коротко` : `${fmt(n, locale)} at a glance`, rows: facts }];
      if (notes.length) blocks.push({ type: "list", title: locale === "ru" ? "Где встречается" : "Where you see it", items: notes });
      blocks.push(neighboursTable(n, locale));
      return blocks;
    },
    faq,
  };
}

/* ───────────── tool page ───────────── */

function referenceTable(locale: Locale): Block {
  const ones = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return {
    type: "table",
    title: locale === "ru" ? "Таблица римских цифр по разрядам" : "Roman numerals by place value",
    head: locale === "ru" ? ["Цифра", "Единицы", "Десятки", "Сотни", "Тысячи"] : ["Digit", "Ones", "Tens", "Hundreds", "Thousands"],
    rows: ones.map((d) => [String(d), toRoman(d), toRoman(d * 10), toRoman(d * 100), d <= 3 ? toRoman(d * 1000) : toRoman(d * 1000, true)]),
  };
}

export const romanTool: ToolDef = {
  slug: "roman-numerals",
  component: "numbers/roman",
  icon: "Landmark",
  popular: true,
  name: { ru: "Римские цифры", en: "Roman numerals" },
  title: { ru: "Римские цифры онлайн — перевод в арабские и обратно", en: "Roman Numeral Converter — Numbers to Roman and Back" },
  h1: { ru: "Перевод римских цифр", en: "Roman numeral converter" },
  description: {
    ru: "Перевод римских цифр в арабские и обратно: от 1 до 3999, с винкулумом — до 3 999 999. Разбор по разрядам и проверка ошибок вроде IIII, VV и IC.",
    en: "Convert Roman numerals to numbers and back: 1 to 3,999, or up to 3,999,999 with vinculum. Place-value breakdown and checks for invalid forms like IIII or VV.",
  },
  lead: {
    ru: "Введите число или римскую запись — перевод и разбор по разрядам появятся сразу.",
    en: "Type a number or a Roman numeral — the conversion and place-value breakdown appear instantly.",
  },
  keywords: {
    ru: ["римские цифры", "переводчик римских цифр", "римские числа", "арабские цифры", "винкулум"],
    en: ["roman numerals", "roman numeral converter", "roman to number", "vinculum"],
  },
  howTo: {
    ru: [
      "Введите арабское число в левое поле — справа появится римская запись.",
      "Или введите римские цифры в правое поле (регистр не важен) — слева появится число.",
      "Для чисел больше 3999 включите винкулум: буквы с чертой сверху умножаются на 1000.",
      "Если запись неправильная (IIII, VV, IC), конвертер объяснит ошибку и предложит верный вариант.",
    ],
    en: [
      "Type an Arabic number in the left field — the Roman numeral appears on the right.",
      "Or type Roman numerals in the right field (any case) — the number appears on the left.",
      "For numbers above 3,999 turn on vinculum: overlined letters are multiplied by 1,000.",
      "If a numeral is invalid (IIII, VV, IC), the converter explains the mistake and offers the correct form.",
    ],
  },
  faq: {
    ru: [
      { q: "Какие символы используются в римских цифрах?", a: "Семь букв: I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000. Все остальные числа складываются из них." },
      { q: "Как работает правило вычитания?", a: "Если меньший символ стоит перед большим, он вычитается: IV = 4, IX = 9, XL = 40, XC = 90, CD = 400, CM = 900. Вычитать можно только I, X и C и только из двух ближайших больших символов — поэтому 99 пишется XCIX, а не IC." },
      { q: "Какое самое большое число можно записать?", a: "Стандартной записью — 3999 (MMMCMXCIX), потому что один символ нельзя повторять больше трёх раз подряд. С винкулумом (чертой над буквами, ×1000) — до 3 999 999." },
      { q: "Есть ли в римских цифрах ноль?", a: "Нет. Римская система появилась без нуля и отрицательных чисел, поэтому записываются только натуральные числа от 1." },
      { q: "Почему иногда пишут IIII вместо IV?", a: "На циферблатах часов 4 часто изображают как IIII — это традиция часовщиков. В остальных случаях правильная запись — IV, и конвертер отметит IIII как неканоническую форму." },
    ],
    en: [
      { q: "Which symbols do Roman numerals use?", a: "Seven letters: I = 1, V = 5, X = 10, L = 50, C = 100, D = 500 and M = 1000. Every other number is built from them." },
      { q: "How does the subtraction rule work?", a: "A smaller symbol placed before a larger one is subtracted: IV = 4, IX = 9, XL = 40, XC = 90, CD = 400, CM = 900. Only I, X and C are subtracted, and only from the next two larger symbols — so 99 is XCIX, not IC." },
      { q: "What is the largest Roman numeral?", a: "In standard notation it is 3,999 (MMMCMXCIX), because a symbol may not repeat more than three times. With vinculum (an overline multiplying by 1,000) you can go up to 3,999,999." },
      { q: "Is there a zero in Roman numerals?", a: "No. The system has no zero and no negative numbers, so only natural numbers from 1 upward can be written." },
      { q: "Why do some clocks use IIII instead of IV?", a: "It is a clockmakers’ tradition that balances the dial visually. Everywhere else the standard form is IV, and the converter flags IIII as non-standard." },
    ],
  },
  about: {
    ru: [
      "Римская запись непозиционная: значение символа не зависит от места, а число получается сложением и вычитанием. Поэтому удобнее всего переводить по разрядам — отдельно тысячи, сотни, десятки и единицы: 1994 = M + CM + XC + IV = MCMXCIV.",
      "Сегодня римскими цифрами обозначают века (XXI век), тома и главы, порядковые номера монархов и съездов, группы инвалидности и классы опасности, часы на циферблатах, а также год выпуска в титрах фильмов.",
      "Конвертер работает в браузере и проверяет запись по стандартным правилам: не больше трёх одинаковых символов подряд, V, L и D не повторяются, вычитаются только I, X и C.",
    ],
    en: [
      "Roman notation is not positional: each symbol has a fixed value and numbers are formed by adding and subtracting. The easiest way to convert is place by place — thousands, hundreds, tens and ones: 1994 = M + CM + XC + IV = MCMXCIV.",
      "Today Roman numerals appear in regnal numbers (Elizabeth II), book volumes and chapters, clock faces, outlines, sporting events like the Super Bowl and copyright years in film credits.",
      "The converter runs in your browser and validates input against the standard rules: no symbol more than three times in a row, V, L and D never repeat, and only I, X and C are subtracted.",
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: locale === "ru" ? "Основные символы" : "Basic symbols",
      head: locale === "ru" ? ["Символ", "Значение"] : ["Symbol", "Value"],
      rows: ROMAN_SYMBOLS.map(([s, v]) => [s, String(v)]),
    },
    referenceTable(locale),
  ],
  variants: {
    title: { ru: "Числа римскими цифрами", en: "Numbers in Roman numerals" },
    list: () => ROMAN_NUMBERS.map(romanVariant),
  },
};

/* ───────────── chip helpers used by the section wrapper ───────────── */

export function romanChipNumbers(n: number): number[] {
  const i = ROMAN_NUMBERS.indexOf(n);
  const win = ROMAN_NUMBERS.slice(Math.max(0, i - 12), i + 13);
  return [...new Set([...win, ...ANCHORS])].filter((x) => x !== n && ROMAN_NUMBERS.includes(x)).sort((a, b) => a - b);
}

export const ROMAN_GROUPS: { ru: string; en: string; nums: number[] }[] = [
  { ru: "От 1 до 100", en: "1 to 100", nums: ROMAN_NUMBERS.filter((n) => n <= 100) },
  { ru: "Годы с 1900 по 2100", en: "Years 1900–2100", nums: ROMAN_NUMBERS.filter(isYear) },
  { ru: "Сотни и тысячи", en: "Hundreds and thousands", nums: ROMAN_NUMBERS.filter((n) => n > 100 && !isYear(n)) },
];
