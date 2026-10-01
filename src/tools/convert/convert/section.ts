import { tr, type Locale } from "@/i18n/config";
import { formatSmart, plural } from "@/i18n/format";
import { ui } from "@/i18n/ui";
import type { Block, LinkItem, PageModel, QA, SearchEntry, SectionDef } from "@/registry/types";
import { clean, convert, relation } from "./lib/engine";
import { QUANTITIES, type QuantityDef, type UnitDef } from "./data/units";
import type { ClientUnit } from "./UnitConverter";

const SECTION_ID = "convert";
const HUE = 28;
/** Every page is top-level: /unit-converter, /length-converter, /kilometers-to-miles. */
const HUB = "unit-converter";
const QTY_SLUG: Record<string, string> = {
  length: "length-converter",
  weight: "weight-converter",
  volume: "volume-converter",
  temperature: "temperature-converter",
  area: "area-converter",
  speed: "speed-converter",
  time: "time-unit-converter",
  data: "data-storage-converter",
  pressure: "pressure-converter",
  energy: "energy-converter",
  power: "power-converter",
  angle: "angle-converter",
  frequency: "frequency-converter",
  force: "force-converter",
  torque: "torque-converter",
  "data-rate": "data-rate-converter",
  fuel: "fuel-economy-converter",
};
const qSlug = (q: QuantityDef) => QTY_SLUG[q.id];

/** Everyday units: every ordered pair of them gets its own page (on top of the curated pairs). */
const COMMON: Record<string, string[]> = {
  length: ["millimeters", "centimeters", "decimeters", "meters", "kilometers", "inches", "feet", "yards", "miles", "nautical-miles"],
  weight: ["milligrams", "grams", "kilograms", "centners", "tonnes", "carats", "ounces", "pounds", "stones"],
  volume: ["milliliters", "liters", "cubic-meters", "teaspoons", "tablespoons", "us-cups", "us-fluid-ounces", "us-gallons", "imperial-gallons", "cubic-feet"],
  temperature: ["celsius", "fahrenheit", "kelvin"],
  area: ["square-centimeters", "square-meters", "ares", "hectares", "square-kilometers", "square-feet", "acres", "square-miles"],
  speed: ["meters-per-second", "kilometers-per-hour", "miles-per-hour", "knots"],
  time: ["milliseconds", "seconds", "minutes", "hours", "days", "weeks", "months", "years"],
  data: ["bits", "bytes", "kilobytes", "megabits", "megabytes", "gigabytes", "terabytes"],
  pressure: ["pascals", "kilopascals", "bars", "atmospheres", "mmhg", "psi"],
  energy: ["joules", "kilojoules", "calories", "kilocalories", "watt-hours", "kilowatt-hours"],
  power: ["watts", "kilowatts", "horsepower", "metric-horsepower"],
  angle: ["degrees", "radians", "gradians"],
  frequency: ["hertz", "kilohertz", "megahertz", "gigahertz"],
  force: ["newtons", "kilonewtons", "kilograms-force", "pounds-force"],
  torque: ["newton-meters", "kilogram-force-meters", "pound-feet"],
  "data-rate": ["kilobits-per-second", "megabits-per-second", "gigabits-per-second", "megabytes-per-second"],
  fuel: ["liters-per-100-km", "kilometers-per-liter", "mpg-us", "mpg-uk"],
};

const NAME = { ru: "Конвертер единиц", en: "Unit converter" };
const DESC = {
  ru: "Перевод единиц измерения онлайн: длина, вес, объём, температура, площадь, скорость, давление, энергия и другие величины.",
  en: "Convert units online: length, weight, volume, temperature, area, speed, pressure, energy and more.",
};

/* ───────────── indexes ───────────── */

const unitIndex = new Map<string, { q: QuantityDef; u: UnitDef }>();
for (const q of QUANTITIES) for (const u of q.units) {
  if (unitIndex.has(u.slug)) throw new Error(`Duplicate unit slug ${u.slug}`);
  unitIndex.set(u.slug, { q, u });
}
const quantityById = new Map(QUANTITIES.map((q) => [q.id, q]));
const pairKey = (a: string, b: string) => `${a}-to-${b}`;
const pairIndex = new Map<string, { q: QuantityDef; a: UnitDef; b: UnitDef }>();
/** Pairs of a quantity: curated (most searched first), then every pair of its everyday units. */
const pairsOf = new Map<string, [string, string][]>();
for (const q of QUANTITIES) {
  const list: [string, string][] = [...q.pairs];
  const common = COMMON[q.id] ?? [];
  for (const a of common) for (const b of common) if (a !== b) list.push([a, b]);
  const seen = new Set<string>();
  const out: [string, string][] = [];
  for (const [a, b] of list) {
    const k = pairKey(a, b);
    if (seen.has(k)) continue;
    seen.add(k);
    const ua = q.units.find((u) => u.slug === a);
    const ub = q.units.find((u) => u.slug === b);
    if (!ua || !ub) throw new Error(`Bad pair ${a} → ${b}`);
    pairIndex.set(k, { q, a: ua, b: ub });
    out.push([a, b]);
  }
  pairsOf.set(q.id, out);
}
const qPairs = (q: QuantityDef) => pairsOf.get(q.id)!;

/* ───────────── text helpers ───────────── */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const nameN = (u: UnitDef, n: number, locale: Locale) => (locale === "ru" ? plural("ru", n, [...u.ru.f, u.ru.o ?? u.ru.f[1]]) : Math.abs(n) === 1 ? u.en[0] : u.en[1]);
const plName = (u: UnitDef, locale: Locale) => (locale === "ru" ? u.ru.pl : u.en[1]);
const sym = (u: UnitDef, locale: Locale) => u.sym[locale];
const num = (n: number, locale: Locale) => formatSmart(locale, clean(n));
const qty = (n: number, u: UnitDef, locale: Locale) => `${num(n, locale)} ${nameN(u, clean(n), locale)}`;
/** RU symbol that is really a word (миля, фут, дюйм…) must be declined in prose. */
const isWord = (u: UnitDef) => u.ru.f[0].toLowerCase() === u.sym.ru.toLowerCase();
/** "5 км" / "5 миль" / "5 mi" — short quantity for tables and facts. */
const short = (n: number, u: UnitDef, locale: Locale) => (locale === "ru" && isWord(u) ? qty(n, u, locale) : `${num(n, locale)} ${sym(u, locale)}`);
/** Unit as a noun in formulas: "км", "мили", "mi". */
const noun = (u: UnitDef, locale: Locale) => (locale === "ru" && isWord(u) ? u.ru.pl : sym(u, locale));
/** genitive plural or symbol: "перевод футов", "перевод км" */
const ofUnit = (u: UnitDef) => (isWord(u) ? u.ru.f[2] : u.sym.ru);

function clientUnits(q: QuantityDef, locale: Locale): ClientUnit[] {
  return q.units.map((u) => ({
    slug: u.slug,
    sym: sym(u, locale),
    label: `${cap(plName(u, locale))} (${sym(u, locale)})`,
    forms: locale === "ru" ? [...u.ru.f, u.ru.o ?? u.ru.f[1]] : [u.en[0], u.en[1]],
    kind: u.kind,
    factor: u.factor,
    offset: u.offset,
    word: locale === "ru" && isWord(u),
  }));
}

function formulaText(a: UnitDef, b: UnitDef, locale: Locale): string {
  const r = relation(a, b);
  const A = noun(a, locale);
  const B = noun(b, locale);
  if (r.type === "div") return `${B} = ${num(r.k, locale)} / ${A}`;
  const mul = `${B} = ${A} × ${num(r.m, locale)}`;
  if (r.c === 0) return mul;
  return `${mul} ${r.c < 0 ? "−" : "+"} ${num(Math.abs(r.c), locale)}`;
}

function pairTitle(a: UnitDef, b: UnitDef, locale: Locale): string {
  return locale === "ru" ? `${cap(a.ru.pl)} в ${b.ru.pl}` : `${cap(a.en[1])} to ${b.en[1]}`;
}

function pairLink(a: UnitDef, b: UnitDef, locale: Locale): LinkItem {
  return { path: [pairKey(a.slug, b.slug)], label: `${sym(a, locale)} → ${sym(b, locale)}`, hint: pairTitle(a, b, locale) };
}

function quantityLink(q: QuantityDef, locale: Locale): LinkItem {
  return {
    path: [qSlug(q)],
    label: locale === "ru" ? `Конвертер ${q.gen.ru}` : `${q.name.en} converter`,
    hint: titleUnits(q, locale),
    icon: q.icon,
    hue: HUE,
  };
}

/* ───────────── pages ───────────── */

function hubPage(locale: Locale): PageModel {
  const t = ui(locale);
  const popular = QUANTITIES.flatMap((q) => q.pairs.slice(0, 4).map(([a, b]) => pairLink(unitIndex.get(a)!.u, unitIndex.get(b)!.u, locale)));
  return {
    path: [HUB],
    sectionId: SECTION_ID,
    kind: "hub",
    title: locale === "ru" ? "Конвертер единиц измерения | перевод величин онлайн" : "Unit converter | convert units of measurement online",
    h1: tr(NAME, locale),
    description: tr(DESC, locale),
    lead: locale === "ru" ? "Выберите величину или готовый перевод — ответ появляется сразу, пока вы вводите число." : "Pick a quantity or a ready-made conversion — the answer appears as you type.",
    breadcrumbs: [{ name: t.home, path: [] }],
    topBlocks: [
      { type: "links", title: locale === "ru" ? "Величины" : "Quantities", style: "cards", items: QUANTITIES.map((q) => quantityLink(q, locale)) },
      { type: "links", title: locale === "ru" ? "Популярные переводы" : "Popular conversions", style: "chips", items: popular },
    ],
    schemaType: "CollectionPage",
    icon: "ArrowLeftRight",
    hue: HUE,
    wide: true,
  };
}

/** The most searched units of a quantity (in order of its popular pairs) for the page title. */
function titleUnits(q: QuantityDef, locale: Locale): string {
  const slugs = [...new Set(q.pairs.flat())].slice(0, 5);
  return slugs.map((sl) => sym(unitIndex.get(sl)!.u, locale)).join(", ");
}

/** "км, миль, м и футов" / "km, miles, m and ft" — the units people convert most, for the title. */
function titleUnitsOf(q: QuantityDef, locale: Locale, n = 4): string {
  const us = [...new Set(q.pairs.flat())].slice(0, n).map((sl) => unitIndex.get(sl)!.u);
  const names = us.map((u) => (locale === "ru" ? ofUnit(u) : isWord(u) ? u.en[1] : u.sym.en));
  const last = names.pop();
  return `${names.join(", ")} ${locale === "ru" ? "и" : "and"} ${last}`;
}

function quantityName(q: QuantityDef, locale: Locale): string {
  return locale === "ru" ? `Конвертер ${q.gen.ru}` : `${q.name.en} converter`;
}

function quantityPage(q: QuantityDef, locale: Locale): PageModel {
  const t = ui(locale);
  const [da, db] = q.def;
  const base = q.units.find((u) => u.slug === da)!;
  const name = quantityName(q, locale);
  const unitsList = q.units.map((u) => plName(u, locale)).join(", ");
  const pairs = qPairs(q);
  const blocks: Block[] = [
    {
      type: "table",
      split: true,
      title: locale === "ru" ? `1 ${nameN(base, 1, locale)} в других единицах` : `1 ${base.en[0]} in other units`,
      head: [locale === "ru" ? "Единица" : "Unit", locale === "ru" ? "Значение" : "Value"],
      rows: q.units.filter((u) => u !== base).map((u) => [`${cap(plName(u, locale))} (${sym(u, locale)})`, num(convert(1, base, u), locale)]),
    },
    { type: "links", title: locale === "ru" ? "Все переводы" : "All conversions", style: "chips", items: pairs.map(([a, b]) => ({ ...pairLink(unitIndex.get(a)!.u, unitIndex.get(b)!.u, locale), label: pairTitle(unitIndex.get(a)!.u, unitIndex.get(b)!.u, locale) })) },
    {
      type: "text",
      title: t.about,
      fold: true,
      paragraphs:
        locale === "ru"
          ? [
              `${name} переводит значения между единицами: ${unitsList}. Введите число в любое поле — результат пересчитывается сразу, в обе стороны.`,
              "Под результатом раскрывается список «во всех единицах» — то же значение сразу во всех остальных единицах. Расчёт идёт в браузере по точным коэффициентам.",
            ]
          : [
              `The ${q.name.en.toLowerCase()} converter translates values between ${unitsList}. Type a number in either field — the result updates instantly in both directions.`,
              "Under the result, expand the \"in all units\" list to see the same value in every other unit. Calculations run in your browser using exact conversion factors.",
            ],
    },
  ];
  return {
    path: [qSlug(q)],
    sectionId: SECTION_ID,
    kind: "tool",
    title: fitText(
      locale === "ru"
        ? [`${name} | перевод ${titleUnitsOf(q, locale)}`, `${name} | перевод ${titleUnitsOf(q, locale, 3)}`, `${name} | перевод единиц онлайн`]
        : [`${name} | ${titleUnitsOf(q, locale)}`, `${name} | ${titleUnitsOf(q, locale, 3)}`, `${name} | convert units online`],
      65,
    ),
    h1: name,
    description: fitText(
      locale === "ru"
        ? [
            `${name} онлайн: ${unitsList}. Мгновенный перевод в обе стороны, таблица значений, точные коэффициенты.`,
            `${name} онлайн: ${shortList(q, locale)} и другие единицы. Мгновенный перевод в обе стороны и таблица значений.`,
            `${name} онлайн: ${shortList(q, locale, 3)} и другие единицы. Мгновенный перевод и таблица значений.`,
          ]
        : [
            `${name} online: ${unitsList}. Instant two-way conversion, value table, exact factors.`,
            `${name} online: ${shortList(q, locale)} and more. Instant two-way conversion and a value table.`,
            `${name} online: ${shortList(q, locale, 3)} and more. Instant conversion and a value table.`,
          ],
    ),
    lead: locale === "ru" ? `Переводите ${q.gen.ru === "единиц информации" ? "единицы информации" : "единицы " + q.gen.ru} мгновенно и в обе стороны.` : `Convert ${q.gen.en} units instantly in both directions.`,
    breadcrumbs: [
      { name: t.home, path: [] },
      { name: tr(NAME, locale), path: [HUB] },
    ],
    tool: { id: "convert/units", props: { units: clientUnits(q, locale), from: da, to: db, value: 1, allowNegative: !!q.allowNegative } },
    blocks,
    related: QUANTITIES.filter((x) => x !== q).slice(0, 8).map((x) => quantityLink(x, locale)),
    schemaType: "WebApplication",
    icon: q.icon,
    hue: HUE,
  };
}

/** The first candidate that fits a meta description (≤ 170 characters), else the shortest. */
function fitText(candidates: string[], max = 170): string {
  return candidates.find((c) => c.length <= max) ?? candidates.reduce((x, y) => (y.length < x.length ? y : x));
}

/** A few everyday units of a quantity for short texts. */
function shortList(q: QuantityDef, locale: Locale, n = 5): string {
  const us = [...new Set(qPairs(q).flat())].slice(0, n).map((sl) => plName(unitIndex.get(sl)!.u, locale));
  return us.join(", ");
}

/** Second half of a pair title: the short form people also type ("кг в унции конвертер", "kg to oz converter"). */
function pairAlt(a: UnitDef, b: UnitDef, locale: Locale): string {
  if (locale === "ru") {
    const short = `${noun(a, "ru")} в ${noun(b, "ru")}`;
    return short.toLowerCase() === `${a.ru.pl} в ${b.ru.pl}`.toLowerCase() ? `перевод ${a.ru.f[2]} в ${b.ru.pl}` : `${short} конвертер`;
  }
  const short = `${a.sym.en} to ${b.sym.en}`;
  return short.toLowerCase() === `${a.en[1]} to ${b.en[1]}`.toLowerCase() ? `convert ${a.en[1]} into ${b.en[1]}` : `${short} converter`;
}

/** Rounded rule of thumb: "1 км ≈ 0,62 мили". */
function roughly(n: number, locale: Locale): string {
  const abs = Math.abs(n);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 2 : 3;
  return formatSmart(locale, Number(n.toPrecision(Math.max(2, digits + 1))));
}

function pairPage(q: QuantityDef, a: UnitDef, b: UnitDef, locale: Locale): PageModel {
  const t = ui(locale);
  const one = convert(1, a, b);
  const back = convert(1, b, a);
  const title = pairTitle(a, b, locale);
  const A = sym(a, locale);
  const B = sym(b, locale);
  const formula = formulaText(a, b, locale);
  const table = q.table ?? [1, 2, 5, 10, 20, 50, 100];
  const rev = pairIndex.get(pairKey(b.slug, a.slug));
  const rel = relation(a, b);
  const affine = rel.type !== "mul" || rel.c !== 0;

  const lead = `1 ${nameN(a, 1, locale)} = ${qty(one, b, locale)}`;
  const leadBack = `1 ${nameN(b, 1, locale)} = ${qty(back, a, locale)}`;

  const howTo =
    locale === "ru"
      ? relation(a, b).type === "div"
        ? [`Величины обратно пропорциональны: ${formula}.`, `Например, ${short(10, a, locale)} = ${short(convert(10, a, b), b, locale)}.`]
        : [
            `Чтобы перевести ${a.ru.pl} в ${b.ru.pl}, воспользуйтесь формулой: ${formula}.`,
            `Например, ${short(10, a, locale)} = ${short(convert(10, a, b), b, locale)}, а ${short(100, a, locale)} = ${short(convert(100, a, b), b, locale)}.`,
          ]
      : relation(a, b).type === "div"
        ? [`The units are inversely proportional: ${formula}.`, `For example, 10 ${A} = ${num(convert(10, a, b), locale)} ${B}.`]
        : [
            `To convert ${a.en[1]} to ${b.en[1]}, use the formula: ${formula}.`,
            `For example, 10 ${A} = ${num(convert(10, a, b), locale)} ${B} and 100 ${A} = ${num(convert(100, a, b), locale)} ${B}.`,
          ];

  const faq: QA[] =
    locale === "ru"
      ? [
          { q: `1 ${a.ru.f[0]} — это сколько ${b.ru.f[2]}?`, a: `${cap(lead)}.` },
          { q: `1 ${b.ru.f[0]} — это сколько ${a.ru.f[2]}?`, a: `${cap(leadBack)}.` },
          { q: `Как перевести ${a.ru.pl} в ${b.ru.pl}?`, a: `Используйте формулу ${formula}. Или введите значение в конвертер выше — результат появится сразу.` },
          { q: `Сколько будет ${short(100, a, locale)} в ${b.ru.loc}?`, a: `${short(100, a, locale)} = ${short(convert(100, a, b), b, locale)}.` },
        ]
      : [
          { q: `How many ${b.en[1]} are in 1 ${a.en[0]}?`, a: `${lead}.` },
          { q: `How many ${a.en[1]} are in 1 ${b.en[0]}?`, a: `${leadBack}.` },
          { q: `How do I convert ${a.en[1]} to ${b.en[1]}?`, a: `Use the formula ${formula}, or type a value into the converter above for an instant result.` },
          { q: `What is 100 ${A} in ${b.en[1]}?`, a: `100 ${A} = ${num(convert(100, a, b), locale)} ${B}.` },
        ];

  const all = qPairs(q);
  const sameFrom = all.filter(([x, y]) => x === a.slug && y !== b.slug).map(([x, y]) => pairLink(unitIndex.get(x)!.u, unitIndex.get(y)!.u, locale));
  const sameTo = all.filter(([x, y]) => y === b.slug && x !== a.slug).map(([x, y]) => pairLink(unitIndex.get(x)!.u, unitIndex.get(y)!.u, locale));
  const others = q.pairs
    .filter(([x, y]) => x !== a.slug && y !== b.slug && !(x === b.slug && y === a.slug))
    .map(([x, y]) => pairLink(unitIndex.get(x)!.u, unitIndex.get(y)!.u, locale));

  const more = [...(rev ? [pairLink(b, a, locale)] : []), ...sameFrom, ...sameTo, ...others].slice(0, 32);
  const facts: [string, string][] =
    locale === "ru"
      ? [
          ["Формула", formula],
          ["Обратный перевод", leadBack],
          ...(affine ? [] : ([["Округлённо", `1 ${A} ≈ ${roughly(one, locale)} ${noun(b, "ru")}`]] as [string, string][])),
          ["Величина", q.name.ru],
        ]
      : [
          ["Formula", formula],
          ["Reverse", leadBack],
          ...(affine ? [] : ([["Roughly", `1 ${A} ≈ ${roughly(one, locale)} ${B}`]] as [string, string][])),
          ["Quantity", q.name.en],
        ];
  return {
    path: [pairKey(a.slug, b.slug)],
    sectionId: SECTION_ID,
    kind: "variant",
    title: fitText([`${title} | ${pairAlt(a, b, locale)}`, `${title} | ${locale === "ru" ? "конвертер" : "converter"}`], 75),
    h1: title,
    description: fitText(
      locale === "ru"
        ? [
            `Перевод ${a.ru.f[2]} в ${b.ru.pl}: ${lead}. Формула ${formula}, таблица значений и мгновенный конвертер ${A} → ${B}.`,
            `Перевод ${a.ru.f[2]} в ${b.ru.pl}: ${lead}. Таблица значений и мгновенный конвертер ${A} → ${B}.`,
            `Перевод ${a.ru.f[2]} в ${b.ru.pl}: ${lead}. Таблица значений и конвертер.`,
          ]
        : [
            `Convert ${a.en[1]} to ${b.en[1]}: ${lead}. Formula ${formula}, conversion table and instant ${A} → ${B} converter.`,
            `Convert ${a.en[1]} to ${b.en[1]}: ${lead}. Conversion table and instant ${A} → ${B} converter.`,
            `Convert ${a.en[1]} to ${b.en[1]}: ${lead}. Conversion table and converter.`,
          ],
    ),
    lead: `${lead} · ${leadBack}`,
    breadcrumbs: [
      { name: t.home, path: [] },
      { name: tr(NAME, locale), path: [HUB] },
      { name: quantityName(q, locale), path: [qSlug(q)] },
    ],
    tool: { id: "convert/units", props: { units: clientUnits(q, locale), from: a.slug, to: b.slug, value: 1, allowNegative: !!q.allowNegative } },
    blocks: [
      {
        type: "table",
        title: locale === "ru" ? `Таблица перевода: ${a.ru.pl} в ${b.ru.pl}` : `Conversion table: ${a.en[1]} to ${b.en[1]}`,
        head: [`${cap(plName(a, locale))} (${A})`, `${cap(plName(b, locale))} (${B})`],
        rows: table.map((v) => [short(v, a, locale), short(convert(v, a, b), b, locale)]),
        split: true,
      },
      { type: "facts", rows: facts },
      { type: "text", title: locale === "ru" ? `Как перевести ${a.ru.pl} в ${b.ru.pl}` : `How to convert ${a.en[1]} to ${b.en[1]}`, paragraphs: howTo },
      ...(more.length
        ? [{ type: "links", title: locale === "ru" ? "Другие переводы" : "More conversions", style: "chips", items: more, more: quantityLink(q, locale) } satisfies Block]
        : []),
    ],
    faq,
    related: [quantityLink(q, locale), ...QUANTITIES.filter((x) => x !== q).slice(0, 5).map((x) => quantityLink(x, locale))],
    schemaType: "WebApplication",
    icon: q.icon,
    hue: HUE,
  };
}

/* ───────────── old URLs and typed aliases ───────────── */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[°'"]/g, "")
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/µ/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Alias → unit slug ("km" → kilometers, "kilometre" → kilometers). Ambiguous aliases are dropped. */
const aliases = (() => {
  const seen = new Map<string, string | null>();
  const add = (alias: string, slug: string) => {
    if (!alias || alias.length < 2) return;
    const prev = seen.get(alias);
    seen.set(alias, prev === undefined || prev === slug ? slug : null);
  };
  for (const q of QUANTITIES) {
    for (const u of q.units) {
      const forms = [u.slug, slugify(u.en[0]), slugify(u.en[1]), slugify(u.sym.en)];
      for (const f of [...forms]) forms.push(f.replace(/meter/g, "metre").replace(/liter/g, "litre"));
      for (const f of forms) add(f, u.slug);
    }
  }
  const out = new Map<string, string>();
  for (const [k, v] of seen) if (v) out.set(k, v);
  return out;
})();

/**
 * Where an old or hand-typed converter URL should go: /convert/… (previous structure) and
 * /km-to-miles-style aliases. Returns the canonical path, or null.
 */
export function convertRedirect(segs: string[]): string[] | null {
  if (segs[0] === SECTION_ID) {
    if (segs.length === 1) return [HUB];
    if (segs.length !== 2) return null;
    const q = quantityById.get(segs[1]);
    if (q) return [qSlug(q)];
    if (pairIndex.has(segs[1])) return [segs[1]];
    return convertRedirect([segs[1]]);
  }
  if (segs.length !== 1) return null;
  const m = /^(.+)-(?:to|in|into)-(.+)$/.exec(segs[0]);
  if (!m) return null;
  const a = aliases.get(m[1]);
  const b = aliases.get(m[2]);
  if (!a || !b || a === b) return null;
  const key = pairKey(a, b);
  if (key === segs[0]) return null;
  if (pairIndex.has(key)) return [key];
  const qa = unitIndex.get(a)!.q;
  return qa === unitIndex.get(b)!.q ? [qSlug(qa)] : null;
}

/* ───────────── section ───────────── */

const bySlug = new Map<string, QuantityDef>(QUANTITIES.map((q) => [qSlug(q), q]));

export const convertSection: SectionDef = {
  id: SECTION_ID,
  name: NAME,
  description: DESC,
  icon: "ArrowLeftRight",
  hue: HUE,
  category: "convert",
  order: 1,
  absolute: true,
  hubPath: [HUB],
  mounts() {
    return [HUB, ...bySlug.keys(), ...pairIndex.keys()];
  },
  paths() {
    return [[HUB], ...[...bySlug.keys()].map((k) => [k]), ...[...pairIndex.keys()].map((k) => [k])];
  },
  resolve(locale, segs) {
    if (segs.length !== 1) return null;
    if (segs[0] === HUB) return hubPage(locale);
    const q = bySlug.get(segs[0]);
    if (q) return quantityPage(q, locale);
    const p = pairIndex.get(segs[0]);
    return p ? pairPage(p.q, p.a, p.b, locale) : null;
  },
  search(locale) {
    const out: SearchEntry[] = [];
    const hint = tr(NAME, locale);
    out.push({ path: [HUB], title: hint, hint: ui(locale).allTools, keywords: "конвертер единиц converter units перевод", weight: 3 });
    for (const q of QUANTITIES) {
      out.push({
        path: [qSlug(q)],
        title: quantityName(q, locale),
        hint,
        keywords: q.units.map((u) => `${u.sym.ru} ${u.sym.en} ${u.ru.pl} ${u.en[1]} ${u.kw ?? ""}`).join(" "),
        weight: 3,
      });
    }
    for (const { a, b } of pairIndex.values()) {
      out.push({
        path: [pairKey(a.slug, b.slug)],
        title: pairTitle(a, b, locale),
        hint: `${sym(a, locale)} → ${sym(b, locale)}`,
        keywords: `${a.sym.ru} ${b.sym.ru} ${a.sym.en} ${b.sym.en} ${a.ru.pl} ${b.ru.pl} ${a.en[1]} ${b.en[1]} ${a.kw ?? ""} ${b.kw ?? ""}`,
        weight: 2,
      });
    }
    return out;
  },
  featured(locale) {
    return [
      quantityLink(quantityById.get("length")!, locale),
      quantityLink(quantityById.get("weight")!, locale),
      quantityLink(quantityById.get("temperature")!, locale),
      ...[
        ["kilometers", "miles"],
        ["kilograms", "pounds"],
        ["celsius", "fahrenheit"],
        ["centimeters", "inches"],
      ].map(([a, b]) => ({ ...pairLink(unitIndex.get(a)!.u, unitIndex.get(b)!.u, locale), label: pairTitle(unitIndex.get(a)!.u, unitIndex.get(b)!.u, locale) })),
    ];
  },
  tools(locale) {
    return [{ path: [HUB], label: tr(NAME, locale), hint: tr(DESC, locale), icon: "ArrowLeftRight", hue: HUE }, ...QUANTITIES.map((q) => quantityLink(q, locale))];
  },
};
