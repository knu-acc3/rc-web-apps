import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { nf, nfix, tt } from "../shared";
import { ringSizes, usToDiameter, type RingSizes, type RingSystem } from "./engine";

const mmU = (l: Locale) => tt(l, "мм", "mm");
const d2 = (l: Locale, v: number) => nfix(l, v, 2);
const c1 = (l: Locale, v: number) => nfix(l, v, 1);
const size = (l: Locale, v: number) => nf(l, v, 2);

function row(l: Locale, s: RingSizes): string[] {
  return [size(l, s.ru), d2(l, s.d), c1(l, s.c), size(l, s.us), s.uk, String(s.eu), String(s.jp)];
}

const HEAD = (l: Locale) => [
  tt(l, "RU", "RU"),
  tt(l, "Диаметр, мм", "Diameter, mm"),
  tt(l, "Окружность, мм", "Circumference, mm"),
  "US",
  "UK",
  tt(l, "EU (ISO)", "EU (ISO)"),
  "JP",
];

function ruTable(l: Locale, from = 15, to = 22, title?: string): Block {
  const rows: string[][] = [];
  for (let d = from; d <= to + 1e-9; d += 0.5) rows.push(row(l, ringSizes(d)));
  return { type: "table", title: title ?? tt(l, "Таблица размеров колец", "Ring size chart"), head: HEAD(l), rows };
}

const MEASURE: Record<Locale, string[]> = {
  ru: [
    "Оберните основание пальца ниткой или полоской бумаги и отметьте место, где она смыкается.",
    "Измерьте длину линейкой — это окружность в миллиметрах. Разделите её на 3,14: получится диаметр, то есть российский размер.",
    "Или измерьте внутренний диаметр кольца, которое хорошо сидит, — по самой широкой части внутри.",
    "Измеряйте вечером при комнатной температуре: утром и в холоде пальцы тоньше, в жару и после нагрузки — толще.",
    "Кольцо должно проходить через сустав с небольшим усилием. Для широких колец (от 6 мм) берите на полразмера больше.",
  ],
  en: [
    "Wrap a thread or a strip of paper around the base of the finger and mark where it meets.",
    "Measure the length with a ruler — that is the circumference in mm. Divide it by 3.14 to get the diameter (the Russian size).",
    "Or measure the inner diameter of a ring that fits well, across its widest inside point.",
    "Measure in the evening at room temperature: fingers are thinner in the morning and in the cold, thicker in heat and after exercise.",
    "The ring should pass over the knuckle with slight effort. For wide bands (6 mm and more) go half a size up.",
  ],
};
const measureBlock = (l: Locale): Block => ({ type: "list", ordered: true, title: tt(l, "Как измерить размер кольца дома", "How to measure your ring size at home"), items: MEASURE[l] });

function facts(l: Locale, s: RingSizes): Block {
  return {
    type: "facts",
    title: tt(l, "Размер во всех системах", "Size in every system"),
    rows: [
      [tt(l, "Внутренний диаметр", "Inner diameter"), `${d2(l, s.d)} ${mmU(l)}`],
      [tt(l, "Окружность", "Circumference"), `${c1(l, s.c)} ${mmU(l)}`],
      [tt(l, "Российский (диаметр, шаг 0,5)", "Russian (diameter, 0.5 steps)"), size(l, s.ru)],
      [tt(l, "США и Канада", "US and Canada"), `${size(l, s.us)} (${tt(l, "точно", "exact")} ${nf(l, s.usExact, 2)})`],
      [tt(l, "Великобритания и Австралия", "UK and Australia"), s.uk],
      [tt(l, "Европа (ISO 8653, окружность)", "Europe (ISO 8653, circumference)"), String(s.eu)],
      [tt(l, "Япония и Китай (JIS)", "Japan and China (JIS)"), String(s.jp)],
    ],
  };
}

type TT = (l: Locale) => { title: string; h1: string; description: string; lead: string };
function mk(
  slug: string,
  name: VariantDef["name"],
  props: { system: RingSystem; value: number },
  t: TT,
  blocks: (l: Locale) => Block[],
  faq: (l: Locale) => QA[],
  keywords: VariantDef["keywords"],
): VariantDef {
  const ru = t("ru");
  const en = t("en");
  return {
    slug,
    name,
    props,
    keywords,
    title: { ru: ru.title, en: en.title },
    h1: { ru: ru.h1, en: en.h1 },
    description: { ru: ru.description, en: en.description },
    lead: { ru: ru.lead, en: en.lead },
    blocks,
    faq: { ru: faq("ru"), en: faq("en") },
  };
}

function ruVariant(d: number): VariantDef {
  const s = ringSizes(d);
  const slug = `ru-${String(d).replace(".", "-")}`;
  return mk(
    slug,
    { ru: `RU ${nf("ru", d, 1)}`, en: `RU ${d}` },
    { system: "ru", value: d },
    (l) => ({
      title: tt(l, `${size(l, d)} размер кольца: US, UK, EU, диаметр и окружность`, `Russian ring size ${size(l, d)}: US, UK, EU and mm`),
      h1: tt(l, `${size(l, d)} размер кольца`, `Russian ring size ${size(l, d)}`),
      description: tt(
        l,
        `${size(l, d)} размер кольца — внутренний диаметр ${d2(l, d)} мм и окружность ${c1(l, s.c)} мм. Это US ${size(l, s.us)}, UK ${s.uk}, EU ${s.eu}, JP ${s.jp}. Таблица соседних размеров.`,
        `Russian ring size ${size(l, d)} is a ${d2(l, d)} mm inner diameter and ${c1(l, s.c)} mm circumference: US ${size(l, s.us)}, UK ${s.uk}, EU ${s.eu}, JP ${s.jp}. Neighbouring sizes chart.`,
      ),
      lead: tt(
        l,
        `Размер ${size(l, d)} = диаметр ${d2(l, d)} мм = окружность ${c1(l, s.c)} мм ≈ US ${size(l, s.us)} ≈ UK ${s.uk} ≈ EU ${s.eu} ≈ JP ${s.jp}.`,
        `Size ${size(l, d)} = ${d2(l, d)} mm diameter = ${c1(l, s.c)} mm circumference ≈ US ${size(l, s.us)} ≈ UK ${s.uk} ≈ EU ${s.eu} ≈ JP ${s.jp}.`,
      ),
    }),
    (l) => [facts(l, s), ruTable(l, Math.max(14, d - 1), d + 1, tt(l, "Соседние размеры", "Neighbouring sizes")), measureBlock(l)],
    (l) => [
      {
        q: tt(l, `${size(l, d)} размер кольца — это какой американский?`, `What US size is Russian ${size(l, d)}?`),
        a: tt(
          l,
          `US ${size(l, s.us)}. По формуле US = (диаметр − 11,63) / 0,8128 получается ${nf(l, s.usExact, 2)}; американские размеры идут с шагом ¼, поэтому ближайший — ${size(l, s.us)}.`,
          `US ${size(l, s.us)}. The formula US = (diameter − 11.63) / 0.8128 gives ${nf(l, s.usExact, 2)}; US sizes come in quarter steps, so the nearest is ${size(l, s.us)}.`,
        ),
      },
      {
        q: tt(l, `Какая окружность у ${size(l, d)} размера?`, `What circumference is size ${size(l, d)}?`),
        a: tt(
          l,
          `${c1(l, s.c)} мм: окружность = π × диаметр = 3,1416 × ${size(l, d)}. Именно такую длину покажет нитка, обёрнутая вокруг пальца. Европейский размер по ISO 8653 — эта же окружность, округлённая до миллиметра: ${s.eu}.`,
          `${c1(l, s.c)} mm: circumference = π × diameter = 3.1416 × ${size(l, d)}. That's the length a thread wrapped around the finger shows. The European ISO 8653 size is the same circumference rounded to a millimetre: ${s.eu}.`,
        ),
      },
      {
        q: tt(l, `Как проверить, подходит ли ${size(l, d)} размер?`, `How can I check that size ${size(l, d)} fits?`),
        a: tt(
          l,
          `Измерьте внутренний диаметр кольца, которое хорошо сидит: если он около ${d2(l, d)} мм — это ваш размер. Для широких колец (от 6 мм) берите на полразмера больше.`,
          `Measure the inner diameter of a ring that fits: if it's about ${d2(l, d)} mm, this is your size. For wide bands (6 mm and more) go half a size up.`,
        ),
      },
    ],
    { ru: [`${size("ru", d)} размер кольца`, `размер кольца ${size("ru", d)} это`], en: [`russian ring size ${d}`, `${d} mm ring size`] },
  );
}

function usVariant(us: number): VariantDef {
  const d = usToDiameter(us);
  const s = ringSizes(d);
  return mk(
    `us-${us}`,
    { ru: `US ${us}`, en: `US ${us}` },
    { system: "us", value: us },
    (l) => ({
      title: tt(l, `Размер кольца US ${us}: российский, UK, EU и мм`, `US ring size ${us}: diameter, circumference, UK and EU`),
      h1: tt(l, `Размер кольца US ${us}`, `US ring size ${us}`),
      description: tt(
        l,
        `US ${us} — диаметр ${d2(l, d)} мм и окружность ${c1(l, s.c)} мм: российский ${size(l, s.ru)}, UK ${s.uk}, EU ${s.eu}, JP ${s.jp}. Формула: диаметр = 11,63 + 0,8128 × размер.`,
        `US size ${us} is a ${d2(l, d)} mm diameter and ${c1(l, s.c)} mm circumference: Russian ${size(l, s.ru)}, UK ${s.uk}, EU ${s.eu}, JP ${s.jp}. Formula: diameter = 11.63 + 0.8128 × size.`,
      ),
      lead: tt(
        l,
        `US ${us} = диаметр ${d2(l, d)} мм ≈ российский ${size(l, s.ru)} ≈ UK ${s.uk} ≈ EU ${s.eu} ≈ JP ${s.jp}.`,
        `US ${us} = ${d2(l, d)} mm diameter ≈ Russian ${size(l, s.ru)} ≈ UK ${s.uk} ≈ EU ${s.eu} ≈ JP ${s.jp}.`,
      ),
    }),
    (l) => [facts(l, s), ruTable(l, Math.max(14, s.ru - 1), s.ru + 1, tt(l, "Ближайшие российские размеры", "Nearest Russian sizes")), measureBlock(l)],
    (l) => [
      {
        q: tt(l, `US ${us} — это какой российский размер кольца?`, `What Russian size is US ${us}?`),
        a: tt(
          l,
          `Диаметр US ${us} — ${d2(l, d)} мм, поэтому ближайший российский размер — ${size(l, s.ru)}. Если значение между размерами, для широкого кольца выбирайте больший.`,
          `US ${us} has a ${d2(l, d)} mm diameter, so the nearest Russian size is ${size(l, s.ru)}. If you're between sizes, pick the larger one for a wide band.`,
        ),
      },
      {
        q: tt(l, "Как считается американский размер кольца?", "How are US ring sizes calculated?"),
        a: tt(
          l,
          `Диаметр в мм = 11,63 + 0,8128 × размер: каждый целый размер добавляет 0,032 дюйма (0,81 мм) диаметра. Для US ${us}: 11,63 + 0,8128 × ${us} = ${d2(l, d)} мм.`,
          `Diameter in mm = 11.63 + 0.8128 × size: each whole size adds 0.032 inch (0.81 mm) of diameter. For US ${us}: 11.63 + 0.8128 × ${us} = ${d2(l, d)} mm.`,
        ),
      },
    ],
    { ru: [`размер кольца ${us} us`, `us ${us} кольцо в русский`], en: [`us ring size ${us}`, `size ${us} ring in mm`] },
  );
}

export const ringsTool: ToolDef = {
  slug: "ring-size-chart",
  component: "sizes/rings",
  icon: "CircleDot",
  popular: true,
  name: { ru: "Размер кольца", en: "Ring sizes" },
  title: { ru: "Размер кольца: таблица и перевод RU, US, UK, EU, JP", en: "Ring size chart and converter: US, UK, EU, JP, mm" },
  h1: { ru: "Размер кольца: таблица и перевод", en: "Ring size chart and converter" },
  description: {
    ru: "Перевод размеров колец: российский (диаметр в мм), американский, британский, европейский (окружность) и японский. RU 17 = US 6,5 = UK M½ = EU 53. Как измерить палец.",
    en: "Convert ring sizes: Russian (diameter in mm), US, UK letters, European (circumference) and Japanese. US 7 = 17.32 mm = UK N½ = EU 54. How to measure your finger.",
  },
  lead: {
    ru: "Введите размер в любой системе, диаметр или окружность — конвертер покажет размер во всех остальных.",
    en: "Enter a size in any system, a diameter or a circumference to see the size in every other system.",
  },
  keywords: {
    ru: ["размер кольца", "таблица размеров колец", "американский размер кольца", "как узнать размер кольца"],
    en: ["ring size chart", "ring size converter", "ring size in mm", "uk ring size"],
  },
  props: { system: "ru", value: 17 },
  howTo: {
    ru: [
      "Выберите, что вы знаете: российский размер, US, UK, EU, JP, диаметр или окружность.",
      "Введите или выберите значение — остальные размеры появятся сразу.",
      "Не знаете размер — измерьте палец ниткой или диаметр подходящего кольца (инструкция ниже).",
      "Если результат между размерами, берите больший, особенно для широких колец.",
    ],
    en: [
      "Choose what you know: Russian, US, UK, EU or JP size, diameter or circumference.",
      "Type or pick the value — every other size appears instantly.",
      "Don't know your size? Measure your finger with a thread or measure a ring that fits (see below).",
      "If you're between sizes, go up — especially for wide bands.",
    ],
  },
  faq: {
    ru: [
      { q: "Что означает российский размер кольца?", a: "Это внутренний диаметр кольца в миллиметрах: размер 17 — диаметр 17 мм. Размеры идут с шагом 0,5 мм." },
      { q: "Как перевести американский размер кольца в российский?", a: "Диаметр в мм = 11,63 + 0,8128 × US. Например, US 7 = 17,32 мм — это российский 17–17,5." },
      { q: "Как узнать размер кольца дома?", a: "Оберните палец ниткой, измерьте её длину и разделите на 3,14 — получите диаметр, то есть российский размер. Или измерьте внутренний диаметр кольца, которое хорошо сидит." },
      { q: "Что такое европейский размер кольца?", a: "По ISO 8653 размер — длина внутренней окружности в миллиметрах: 54 = окружность 54 мм = диаметр 17,19 мм." },
      { q: "Как устроены британские и японские размеры?", a: "Британские обозначаются буквами: C соответствует окружности 40 мм, каждая следующая буква добавляет 1,25 мм. Японский размер 1 — диаметр 13 мм, каждый следующий — плюс ⅓ мм." },
    ],
    en: [
      { q: "What does a Russian ring size mean?", a: "It is the inner diameter of the ring in millimetres: size 17 is 17 mm across. Sizes go in 0.5 mm steps." },
      { q: "How do US ring sizes convert to millimetres?", a: "Diameter in mm = 11.63 + 0.8128 × US size. US 7 is 17.32 mm, i.e. Russian 17–17.5." },
      { q: "How can I find my ring size at home?", a: "Wrap a thread around your finger, measure its length and divide by 3.14 — that's the diameter (the Russian size). Or measure the inner diameter of a ring that fits well." },
      { q: "What is the European ring size?", a: "Under ISO 8653 the size is the inner circumference in millimetres: 54 = a 54 mm circumference = 17.19 mm diameter." },
      { q: "How do UK and Japanese sizes work?", a: "UK sizes are letters: C is a 40 mm circumference and each next letter adds 1.25 mm. Japanese size 1 is a 13 mm diameter, and each next size adds ⅓ mm." },
    ],
  },
  about: {
    ru: [
      "В России и странах СНГ размер кольца — внутренний диаметр в миллиметрах. В Европе (ISO 8653) — длина внутренней окружности, в США и Канаде — условная шкала: диаметр = 11,63 + 0,8128 × размер. Британские размеры обозначают буквами: C — 40 мм окружности, каждая следующая буква — плюс 1,25 мм. Японский размер 1 соответствует диаметру 13 мм, каждый следующий — плюс ⅓ мм.",
      "Конвертер хранит точный диаметр и пересчитывает его во все системы: российский размер округляется до 0,5 мм, американский — до четверти, британский — до половины буквы, европейский и японский — до целого.",
    ],
    en: [
      "In Russia and the CIS a ring size is the inner diameter in millimetres. In Europe (ISO 8653) it's the inner circumference; the US and Canada use a scale where diameter = 11.63 + 0.8128 × size. UK sizes are letters: C is a 40 mm circumference and each letter adds 1.25 mm. Japanese size 1 is a 13 mm diameter, each next size adds ⅓ mm.",
      "The converter keeps the exact diameter and converts it to every system: Russian sizes are rounded to 0.5 mm, US sizes to a quarter, UK sizes to half a letter, European and Japanese sizes to a whole number.",
    ],
  },
  related: ["convert/millimeters-to-inches"],
  variants: {
    title: { ru: "Размеры колец", en: "Ring sizes" },
    list: () => [...Array.from({ length: 15 }, (_, i) => ruVariant(15 + i * 0.5)), ...Array.from({ length: 9 }, (_, i) => usVariant(4 + i))],
  },
  blocks: (l) => [measureBlock(l), ruTable(l)],
};
