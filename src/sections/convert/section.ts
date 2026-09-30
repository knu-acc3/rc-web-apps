import { tr, type Locale } from "@/i18n/config";
import { formatSmart, plural } from "@/i18n/format";
import { ui } from "@/i18n/ui";
import type { Block, LinkItem, PageModel, QA, SearchEntry, SectionDef } from "@/registry/types";
import { clean, convert, relation } from "./engine";
import { QUANTITIES, type QuantityDef, type UnitDef } from "./units";
import type { ClientUnit } from "./UnitConverter";

const SECTION_ID = "convert";
const HUE = 28;

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
for (const q of QUANTITIES) {
  for (const [a, b] of q.pairs) {
    const ua = q.units.find((u) => u.slug === a);
    const ub = q.units.find((u) => u.slug === b);
    if (!ua || !ub) throw new Error(`Bad pair ${a} → ${b}`);
    pairIndex.set(pairKey(a, b), { q, a: ua, b: ub });
  }
}

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
/** "в милях" / "в км" */
const inUnit = (u: UnitDef) => (isWord(u) ? u.ru.loc : u.sym.ru);
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
  return { path: [SECTION_ID, pairKey(a.slug, b.slug)], label: `${sym(a, locale)} → ${sym(b, locale)}`, hint: pairTitle(a, b, locale) };
}

function quantityLink(q: QuantityDef, locale: Locale): LinkItem {
  return {
    path: [SECTION_ID, q.id],
    label: locale === "ru" ? `Конвертер ${q.gen.ru}` : `${q.name.en} converter`,
    hint: q.units.slice(0, 6).map((u) => sym(u, locale)).join(", "),
    icon: q.icon,
    hue: HUE,
  };
}

/* ───────────── pages ───────────── */

function hubPage(locale: Locale): PageModel {
  const t = ui(locale);
  const popular = QUANTITIES.flatMap((q) => q.pairs.slice(0, 4).map(([a, b]) => pairLink(unitIndex.get(a)!.u, unitIndex.get(b)!.u, locale)));
  return {
    path: [SECTION_ID],
    sectionId: SECTION_ID,
    kind: "hub",
    title: locale === "ru" ? "Конвертер единиц измерения онлайн" : "Unit converter online",
    h1: tr(NAME, locale),
    description: tr(DESC, locale),
    lead: tr(DESC, locale),
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

function quantityPage(q: QuantityDef, locale: Locale): PageModel {
  const t = ui(locale);
  const [da, db] = q.def;
  const base = q.units.find((u) => u.slug === da)!;
  const name = locale === "ru" ? `Конвертер ${q.gen.ru}` : `${q.name.en} converter`;
  const unitsList = q.units.map((u) => plName(u, locale)).join(", ");
  const blocks: Block[] = [
    {
      type: "table",
      title: locale === "ru" ? `1 ${nameN(base, 1, locale)} в других единицах` : `1 ${base.en[0]} in other units`,
      head: [locale === "ru" ? "Единица" : "Unit", locale === "ru" ? "Значение" : "Value"],
      rows: q.units.filter((u) => u !== base).map((u) => [`${cap(plName(u, locale))} (${sym(u, locale)})`, num(convert(1, base, u), locale)]),
    },
    {
      type: "text",
      title: t.about,
      paragraphs:
        locale === "ru"
          ? [
              `Конвертер ${q.gen.ru} переводит значения между единицами: ${unitsList}. Введите число в любое поле — результат пересчитывается сразу, в обе стороны.`,
              "Ниже результата показано то же значение во всех остальных единицах — любое можно скопировать одним нажатием. Расчёт выполняется в браузере по точным коэффициентам.",
            ]
          : [
              `The ${q.name.en.toLowerCase()} converter translates values between ${unitsList}. Type a number in either field — the result updates instantly in both directions.`,
              "Below the result the same value is shown in every other unit, each one copyable with a click. Calculations run in your browser using exact conversion factors.",
            ],
    },
  ];
  return {
    path: [SECTION_ID, q.id],
    sectionId: SECTION_ID,
    kind: "tool",
    title: locale === "ru" ? `${name} онлайн — ${q.units.slice(0, 4).map((u) => sym(u, locale)).join(", ")} и др.` : `${name} — ${q.units.slice(0, 4).map((u) => sym(u, locale)).join(", ")} and more`,
    h1: name,
    description:
      locale === "ru"
        ? `${name} онлайн: ${unitsList}. Мгновенный перевод в обе стороны, таблица значений, точные коэффициенты.`
        : `${name} online: ${unitsList}. Instant two-way conversion, value table, exact factors.`,
    lead: locale === "ru" ? `Переводите ${q.gen.ru === "единиц информации" ? "единицы информации" : "единицы " + q.gen.ru} мгновенно и в обе стороны.` : `Convert ${q.gen.en} units instantly in both directions.`,
    breadcrumbs: [
      { name: t.home, path: [] },
      { name: tr(NAME, locale), path: [SECTION_ID] },
    ],
    tool: { id: "convert/units", props: { units: clientUnits(q, locale), from: da, to: db, value: 1, allowNegative: !!q.allowNegative } },
    topBlocks: [
      { type: "links", title: locale === "ru" ? "Популярные переводы" : "Popular conversions", style: "chips", items: q.pairs.map(([a, b]) => pairLink(unitIndex.get(a)!.u, unitIndex.get(b)!.u, locale)) },
    ],
    blocks,
    related: QUANTITIES.filter((x) => x !== q).slice(0, 8).map((x) => quantityLink(x, locale)),
    schemaType: "WebApplication",
    icon: q.icon,
    hue: HUE,
  };
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
        ]
      : [
          { q: `How many ${b.en[1]} are in 1 ${a.en[0]}?`, a: `${lead}.` },
          { q: `How many ${a.en[1]} are in 1 ${b.en[0]}?`, a: `${leadBack}.` },
          { q: `How do I convert ${a.en[1]} to ${b.en[1]}?`, a: `Use the formula ${formula}, or type a value into the converter above for an instant result.` },
        ];

  const sameFrom = q.pairs.filter(([x, y]) => x === a.slug && y !== b.slug).map(([x, y]) => pairLink(unitIndex.get(x)!.u, unitIndex.get(y)!.u, locale));
  const sameTo = q.pairs.filter(([x, y]) => y === b.slug && x !== a.slug).map(([x, y]) => pairLink(unitIndex.get(x)!.u, unitIndex.get(y)!.u, locale));
  const others = q.pairs
    .filter(([x, y]) => x !== a.slug && y !== b.slug && !(x === b.slug && y === a.slug))
    .map(([x, y]) => pairLink(unitIndex.get(x)!.u, unitIndex.get(y)!.u, locale));

  const topBlocks: Block[] = [];
  if (rev) topBlocks.push({ type: "links", title: locale === "ru" ? "Обратный перевод" : "Reverse conversion", style: "chips", items: [pairLink(b, a, locale)] });
  if (sameFrom.length || sameTo.length)
    topBlocks.push({ type: "links", title: locale === "ru" ? `Другие переводы (${A}, ${B})` : `More conversions (${A}, ${B})`, style: "chips", items: [...sameFrom, ...sameTo] });
  if (others.length) topBlocks.push({ type: "links", title: locale === "ru" ? `Конвертер ${q.gen.ru}` : `${q.name.en} conversions`, style: "chips", items: others });

  return {
    path: [SECTION_ID, pairKey(a.slug, b.slug)],
    sectionId: SECTION_ID,
    kind: "variant",
    title: locale === "ru" ? `${title}: перевод ${ofUnit(a)} в ${noun(b, "ru")} онлайн` : `${title} (${A} to ${B}) — converter`,
    h1: title,
    description:
      locale === "ru"
        ? `Перевод ${a.ru.f[2]} в ${b.ru.pl} онлайн: ${lead}. Формула ${formula}, таблица значений и мгновенный конвертер ${A} → ${B}.`
        : `Convert ${a.en[1]} to ${b.en[1]} online: ${lead}. Formula ${formula}, conversion table and instant ${A} → ${B} converter.`,
    lead: `${lead} · ${leadBack}`,
    breadcrumbs: [
      { name: t.home, path: [] },
      { name: tr(NAME, locale), path: [SECTION_ID] },
      { name: locale === "ru" ? `Конвертер ${q.gen.ru}` : `${q.name.en} converter`, path: [SECTION_ID, q.id] },
    ],
    tool: { id: "convert/units", props: { units: clientUnits(q, locale), from: a.slug, to: b.slug, value: 1, allowNegative: !!q.allowNegative } },
    topBlocks,
    blocks: [
      {
        type: "facts",
        title: locale === "ru" ? "Коротко" : "Quick facts",
        rows: [
          [locale === "ru" ? `1 ${nameN(a, 1, "ru")} в ${inUnit(b)}` : `1 ${a.en[0]} in ${b.en[1]}`, short(one, b, locale)],
          [locale === "ru" ? `1 ${nameN(b, 1, "ru")} в ${inUnit(a)}` : `1 ${b.en[0]} in ${a.en[1]}`, short(back, a, locale)],
          [locale === "ru" ? "Формула" : "Formula", formula],
          [locale === "ru" ? "Величина" : "Quantity", tr(q.name, locale)],
        ],
      },
      {
        type: "table",
        title: locale === "ru" ? `Таблица перевода: ${a.ru.pl} в ${b.ru.pl}` : `Conversion table: ${a.en[1]} to ${b.en[1]}`,
        head: [`${cap(plName(a, locale))} (${A})`, `${cap(plName(b, locale))} (${B})`],
        rows: table.map((v) => [short(v, a, locale), short(convert(v, a, b), b, locale)]),
      },
      { type: "text", title: locale === "ru" ? `Как перевести ${a.ru.pl} в ${b.ru.pl}` : `How to convert ${a.en[1]} to ${b.en[1]}`, paragraphs: howTo },
    ],
    faq,
    related: [quantityLink(q, locale), ...QUANTITIES.filter((x) => x !== q).slice(0, 5).map((x) => quantityLink(x, locale))],
    schemaType: "WebApplication",
    icon: q.icon,
    hue: HUE,
  };
}

/* ───────────── section ───────────── */

export const convertSection: SectionDef = {
  id: SECTION_ID,
  name: NAME,
  description: DESC,
  icon: "ArrowLeftRight",
  hue: HUE,
  category: "convert",
  order: 1,
  paths() {
    return [[], ...QUANTITIES.map((q) => [q.id]), ...[...pairIndex.keys()].map((k) => [k])];
  },
  resolve(locale, rest) {
    if (rest.length === 0) return hubPage(locale);
    if (rest.length !== 1) return null;
    const q = quantityById.get(rest[0]);
    if (q) return quantityPage(q, locale);
    const p = pairIndex.get(rest[0]);
    return p ? pairPage(p.q, p.a, p.b, locale) : null;
  },
  search(locale) {
    const out: SearchEntry[] = [];
    const hint = tr(NAME, locale);
    out.push({ path: [SECTION_ID], title: hint, hint: ui(locale).allTools, keywords: "конвертер единиц converter units перевод", weight: 3 });
    for (const q of QUANTITIES) {
      out.push({
        path: [SECTION_ID, q.id],
        title: locale === "ru" ? `Конвертер ${q.gen.ru}` : `${q.name.en} converter`,
        hint,
        keywords: q.units.map((u) => `${u.sym.ru} ${u.sym.en} ${u.ru.pl} ${u.en[1]} ${u.kw ?? ""}`).join(" "),
        weight: 3,
      });
    }
    for (const { a, b } of pairIndex.values()) {
      out.push({
        path: [SECTION_ID, pairKey(a.slug, b.slug)],
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
};
