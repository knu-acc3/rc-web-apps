import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { nf, tt } from "../shared";
import { allSizes, chartRows, footFromEu, footFromUs, footRangeForEu, sizeIn, type ShoeGroup } from "./engine";
import { footRangeText, shoeLabel, sz } from "./format";

/* ───────────── shared blocks ───────────── */

function chartTable(l: Locale, g: ShoeGroup, title?: string): Block {
  const rows = chartRows(g);
  const cmHead = tt(l, "Длина стопы", "Foot length");
  const jpHead = tt(l, "Mondopoint / JP, см", "Mondopoint / JP, cm");
  if (g === "kids") {
    return {
      type: "table",
      title: title ?? tt(l, "Детские размеры обуви", "Kids' shoe sizes"),
      head: ["EU / RU", "UK", "US", cmHead, jpHead],
      rows: rows.map((r) => [sz(l, r.eu), shoeLabel(l, "uk", r.uk, g), shoeLabel(l, "us", r.us, g), footRangeText(l, r.range), shoeLabel(l, "cm", r.cm, g)]),
    };
  }
  return {
    type: "table",
    title: title ?? (g === "men" ? tt(l, "Мужские размеры обуви", "Men's shoe sizes") : tt(l, "Женские размеры обуви", "Women's shoe sizes")),
    head: ["EU", "RU", "UK", g === "men" ? tt(l, "US (муж.)", "US men") : tt(l, "US (жен.)", "US women"), cmHead, jpHead],
    rows: rows.map((r) => [sz(l, r.eu), sz(l, r.ru), sz(l, r.uk), sz(l, r.us), footRangeText(l, r.range), shoeLabel(l, "cm", r.cm, g)]),
  };
}

const MEASURE: Record<Locale, string[]> = {
  ru: [
    "Измеряйте вечером: к концу дня стопа немного увеличивается.",
    "Встаньте на лист бумаги в носке, в котором будете носить обувь, перенеся вес на эту ногу.",
    "Отметьте карандашом, держа его вертикально, самую дальнюю точку пятки и кончик самого длинного пальца.",
    "Измерьте расстояние между отметками линейкой. Повторите для второй ноги и берите большее значение.",
    "Для зимней обуви и толстых носков добавьте около 0,5 см.",
  ],
  en: [
    "Measure in the evening: feet swell slightly by the end of the day.",
    "Stand on a sheet of paper in the socks you'll wear, with your weight on that foot.",
    "Holding the pencil upright, mark the back of the heel and the tip of the longest toe.",
    "Measure the distance between the marks with a ruler. Repeat for the other foot and use the larger number.",
    "For winter boots and thick socks add about 0.5 cm.",
  ],
};

const measureBlock = (l: Locale): Block => ({ type: "list", ordered: true, title: tt(l, "Как измерить длину стопы", "How to measure your foot"), items: MEASURE[l] });

const brandNote = (l: Locale): Block => ({
  type: "text",
  title: tt(l, "Почему у брендов размеры отличаются", "Why sizes differ between brands"),
  paragraphs: [
    tt(
      l,
      "Таблица рассчитана по длине стопы: EU = 1,5 × длина стопы в см + 2, UK = 3 × длина в дюймах − 23,5, американский мужской размер на 1 больше британского, женский — на 2. Фабрики шьют на колодках с разным припуском, поэтому у конкретной модели размер может отличаться на ½–1 номер.",
      "The chart is calculated from foot length: EU = 1.5 × foot length in cm + 2, UK = 3 × length in inches − 23.5, US men's is UK + 1 and US women's is UK + 2. Factories use lasts with different toe allowances, so a given model can run ½–1 size off.",
    ),
    tt(
      l,
      "Российские размеры в большинстве таблиц на единицу меньше европейских (EU 42 ≈ RU 41), но часть брендов, особенно спортивных, указывает RU равным EU. Самый надёжный ориентир — длина стопы в сантиметрах.",
      "Russian sizes are one less than EU in most charts (EU 42 ≈ RU 41), but some brands, especially sportswear, label RU equal to EU. The most reliable reference is your foot length in centimetres.",
    ),
  ],
});

/* ───────────── variants ───────────── */

interface Built {
  slug: string;
  name: VariantDef["name"];
  props: Record<string, unknown>;
  t: (l: Locale) => { title: string; h1: string; description: string; lead: string };
  blocks: (l: Locale) => Block[];
  faq: (l: Locale) => QA[];
  keywords: VariantDef["keywords"];
}

const variant = (b: Built): VariantDef => {
  const ru = b.t("ru");
  const en = b.t("en");
  return {
    slug: b.slug,
    name: b.name,
    title: { ru: ru.title, en: en.title },
    h1: { ru: ru.h1, en: en.h1 },
    description: { ru: ru.description, en: en.description },
    lead: { ru: ru.lead, en: en.lead },
    props: b.props,
    keywords: b.keywords,
    blocks: b.blocks,
    faq: { ru: b.faq("ru"), en: b.faq("en") },
  };
};

const GROUP_TXT: Record<ShoeGroup, { ru: string; en: string; chip: string }> = {
  men: { ru: "мужской", en: "Men's", chip: "Мужская таблица" },
  women: { ru: "женской", en: "Women's", chip: "Женская таблица" },
  kids: { ru: "детской", en: "Kids'", chip: "Детская таблица" },
};

function chartVariant(g: ShoeGroup): VariantDef {
  const refEu = g === "men" ? 42 : g === "women" ? 38 : 25;
  const rows = chartRows(g);
  const r = rows.find((x) => x.eu === refEu)!;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const ref = (l: Locale) =>
    g === "kids"
      ? `EU ${sz(l, r.eu)} = UK ${shoeLabel(l, "uk", r.uk, g)} = US ${shoeLabel(l, "us", r.us, g)}`
      : `EU ${sz(l, r.eu)} = RU ${sz(l, r.ru)} = UK ${sz(l, r.uk)} = US ${sz(l, r.us)}`;
  const faq = (l: Locale): QA[] => {
    const common: QA[] = [
      {
        q: tt(l, `Какому размеру соответствует EU ${refEu}?`, `What does EU ${refEu} convert to?`),
        a: tt(l, `${ref(l)}; длина стопы — ${footRangeText(l, r.range)}.`, `${ref(l)}; foot length ${footRangeText(l, r.range)}.`),
      },
    ];
    if (g === "kids")
      return [
        ...common,
        {
          q: tt(l, "Какой запас нужен в детской обуви?", "How much room should kids' shoes have?"),
          a: tt(
            l,
            "Обычно 1–1,5 см к длине стопы: на рост и на движение стопы при ходьбе. Слишком большой запас мешает — ребёнок спотыкается, а обувь натирает. Стопу у малышей стоит перемерять каждые 2–3 месяца.",
            "Usually 1–1.5 cm over the foot length — room to grow and for the foot to move while walking. Too much room makes children trip and causes rubbing. Re-measure young children's feet every 2–3 months.",
          ),
        },
        {
          q: tt(l, "Что означают буквы C и Y в американских размерах?", "What do C and Y mean in US kids' sizes?"),
          a: tt(
            l,
            "C (child) — детская шкала до 13½C, Y (youth) — подростковая, она начинается заново с 1Y. Британская детская шкала тоже идёт до 13½, после чего начинаются взрослые размеры 1, 2, 3.",
            "C (child) is the children's scale up to 13½C, and Y (youth) starts again from 1Y. The UK children's scale also goes up to 13½, followed by adult sizes 1, 2, 3.",
          ),
        },
      ];
    return [
      ...common,
      {
        q: tt(l, "Российский размер на 1 меньше европейского?", "Is the Russian size one less than EU?"),
        a: tt(
          l,
          "В большинстве российских таблиц — да: RU = EU − 1. Обе системы штихмассовые (1 штих = 2/3 см), но по ГОСТ 11373-88 размеры рассчитывались иначе и выходили на ½–1 номер меньше международных. Некоторые бренды пишут RU равным EU — сверяйтесь с длиной стопы.",
          "In most Russian charts, yes: RU = EU − 1. Both use the Paris point (2/3 cm), but the Soviet GOST 11373-88 tables came out ½–1 size smaller than international ones. Some brands label RU equal to EU — check the foot length.",
        ),
      },
      {
        q: tt(l, "Какой размер брать, если стопа между размерами?", "Which size if my foot is between sizes?"),
        a: tt(
          l,
          "Берите больший, особенно для закрытой, зимней и спортивной обуви. Широкой или высокой стопе тоже чаще подходит размер больше.",
          "Go up, especially for closed shoes, winter boots and running shoes. Wide feet or high insteps also usually need the larger size.",
        ),
      },
    ];
  };
  return variant({
    slug: g,
    name: { ru: GROUP_TXT[g].chip, en: `${GROUP_TXT[g].en} chart` },
    props: { group: g, system: "eu", value: refEu },
    keywords: {
      ru: [`таблица размеров ${GROUP_TXT[g].ru} обуви`, "размеры обуви", "длина стопы"],
      en: [`${GROUP_TXT[g].en.toLowerCase()} shoe size chart`, "shoe size conversion"],
    },
    t: (l) => ({
      title: tt(l, `Таблица размеров ${GROUP_TXT[g].ru} обуви: RU, EU, US, UK, см`, `${GROUP_TXT[g].en} shoe size chart: EU, US, UK, RU and cm`),
      h1: tt(l, `Таблица размеров ${GROUP_TXT[g].ru} обуви`, `${GROUP_TXT[g].en} shoe size chart`),
      description: tt(
        l,
        `Размеры ${GROUP_TXT[g].ru} обуви от EU ${sz(l, first.eu)} до ${sz(l, last.eu)} в российской, британской, американской системах и по длине стопы. ${ref(l)}, стопа ${footRangeText(l, r.range)}.`,
        `${GROUP_TXT[g].en} shoe sizes from EU ${sz(l, first.eu)} to ${sz(l, last.eu)} in Russian, UK and US systems and by foot length. ${ref(l)} for a ${footRangeText(l, r.range)} foot.`,
      ),
      lead: tt(l, `${ref(l)} — при длине стопы ${footRangeText(l, r.range)}.`, `${ref(l)} — for a foot length of ${footRangeText(l, r.range)}.`),
    }),
    blocks: (l) => [chartTable(l, g), g === "kids" ? kidsNote(l) : brandNote(l), measureBlock(l)],
    faq,
  });
}

const kidsNote = (l: Locale): Block => ({
  type: "text",
  title: tt(l, "Как читать детскую таблицу", "How to read the kids' chart"),
  paragraphs: [
    tt(
      l,
      "Детская обувь в России маркируется теми же штихмассовыми номерами, что и европейская, поэтому RU = EU. Британская детская шкала: UK = 3 × длина стопы в дюймах − 10,5; американская на ½ больше британской и обозначается буквой C, после 13½C идут подростковые размеры Y.",
      "In Russia children's shoes use the same Paris-point numbers as EU, so RU = EU. The UK children's scale is UK = 3 × foot length in inches − 10.5; US kids' sizes are ½ larger and marked C, and after 13½C come youth (Y) sizes.",
    ),
    tt(
      l,
      "Выбирайте обувь по длине стопы плюс запас 1–1,5 см. У брендов размеры отличаются, поэтому сверяйтесь с длиной стельки конкретной модели.",
      "Choose by foot length plus 1–1.5 cm of room. Brands differ, so compare with the insole length of the specific model.",
    ),
  ],
});

function neighbourTable(l: Locale, eu: number): Block {
  const rows = [eu - 2, eu - 1, eu, eu + 1, eu + 2].map((e) => {
    const f = footFromEu(e);
    const m = allSizes(f, "men");
    return [sz(l, e), sz(l, m.ru), sz(l, m.uk), sz(l, m.us), sz(l, sizeIn("us", f, "women")), footRangeText(l, footRangeForEu(e))];
  });
  return {
    type: "table",
    title: tt(l, "Соседние размеры", "Neighbouring sizes"),
    head: ["EU", "RU", "UK", tt(l, "US (муж.)", "US men"), tt(l, "US (жен.)", "US women"), tt(l, "Длина стопы", "Foot length")],
    rows,
  };
}

function euVariant(eu: number): VariantDef {
  const f = footFromEu(eu);
  const m = allSizes(f, "men");
  const usW = sizeIn("us", f, "women");
  const range = footRangeForEu(eu);
  const last = (eu * 2) / 3;
  return variant({
    slug: `eu-${eu}`,
    name: { ru: `EU ${eu}`, en: `EU ${eu}` },
    props: { group: eu <= 39 ? "women" : "men", system: "eu", value: eu },
    keywords: { ru: [`${eu} размер обуви`, `${eu} размер обуви в см`, `${eu} размер us`], en: [`eu ${eu} shoe size`, `size ${eu} in us`, `eu ${eu} to uk`] },
    t: (l) => ({
      title: tt(l, `${eu} размер обуви (EU): RU, US, UK и длина стопы`, `EU ${eu} shoe size: US, UK, RU and foot length`),
      h1: tt(l, `${eu} европейский размер обуви`, `EU ${eu} shoe size`),
      description: tt(
        l,
        `EU ${eu} — это RU ${sz(l, m.ru)}, UK ${sz(l, m.uk)}, US ${sz(l, m.us)} мужской и US ${sz(l, usW)} женский. Длина стопы ${footRangeText(l, range)}, Mondopoint ${nf(l, m.cm, 1)}. Таблица соседних размеров.`,
        `EU ${eu} equals RU ${sz(l, m.ru)}, UK ${sz(l, m.uk)}, US ${sz(l, m.us)} men's and US ${sz(l, usW)} women's. Foot length ${footRangeText(l, range)}, Mondopoint ${nf(l, m.cm, 1)}. Neighbouring sizes chart.`,
      ),
      lead: tt(
        l,
        `EU ${eu} ≈ RU ${sz(l, m.ru)} ≈ UK ${sz(l, m.uk)} ≈ US ${sz(l, m.us)} (муж.) ≈ US ${sz(l, usW)} (жен.); длина стопы — ${footRangeText(l, range)}.`,
        `EU ${eu} ≈ RU ${sz(l, m.ru)} ≈ UK ${sz(l, m.uk)} ≈ US ${sz(l, m.us)} (men's) ≈ US ${sz(l, usW)} (women's); foot length ${footRangeText(l, range)}.`,
      ),
    }),
    blocks: (l) => [
      {
        type: "facts",
        title: tt(l, `EU ${eu} в других системах`, `EU ${eu} in other systems`),
        rows: [
          [tt(l, "Российский (RU)", "Russian (RU)"), tt(l, `${sz(l, m.ru)} (в части таблиц — ${eu})`, `${sz(l, m.ru)} (${eu} in some charts)`)],
          [tt(l, "Британский (UK)", "UK"), sz(l, m.uk)],
          [tt(l, "Американский мужской", "US men's"), sz(l, m.us)],
          [tt(l, "Американский женский", "US women's"), sz(l, usW)],
          [tt(l, "Длина стопы", "Foot length"), footRangeText(l, range)],
          [tt(l, "Mondopoint / японский", "Mondopoint / Japan"), `${nf(l, m.cm, 1)} ${tt(l, "см", "cm")}`],
          [tt(l, "Длина колодки (EU × 2/3 см)", "Last length (EU × 2/3 cm)"), `${nf(l, last, 1)} ${tt(l, "см", "cm")}`],
        ],
      },
      neighbourTable(l, eu),
      brandNote(l),
    ],
    faq: (l) => [
      {
        q: tt(l, `${eu} размер обуви EU — это какой российский?`, `What Russian size is EU ${eu}?`),
        a: tt(
          l,
          `Чаще всего RU ${sz(l, m.ru)}: в большинстве российских таблиц RU = EU − 1. Некоторые бренды, особенно спортивные, пишут RU ${eu}, поэтому сверяйтесь с длиной стопы: ${footRangeText(l, range)}.`,
          `Usually RU ${sz(l, m.ru)}: most Russian charts use RU = EU − 1. Some brands, especially sportswear, label it RU ${eu}, so check the foot length: ${footRangeText(l, range)}.`,
        ),
      },
      {
        q: tt(l, `EU ${eu} — это какой американский размер?`, `What US size is EU ${eu}?`),
        a: tt(
          l,
          `Мужской US ${sz(l, m.us)}, женский US ${sz(l, usW)}. У Nike, Adidas и ряда других брендов женская шкала отличается от мужской на 1,5, поэтому женский размер может быть указан как US ${sz(l, m.us + 1.5)}.`,
          `US ${sz(l, m.us)} men's and US ${sz(l, usW)} women's. Nike, Adidas and some other brands offset women's sizes by 1.5, so the women's size may read US ${sz(l, m.us + 1.5)}.`,
        ),
      },
      {
        q: tt(l, `Какая длина стопы у ${eu} размера?`, `What foot length fits EU ${eu}?`),
        a: tt(
          l,
          `EU ${eu} рассчитан на стопу ${footRangeText(l, range)}. Европейский размер — это длина колодки в штихах по 2/3 см (${nf(l, last, 1)} см), колодка примерно на 1,3 см длиннее стопы.`,
          `EU ${eu} is meant for a ${footRangeText(l, range)} foot. The EU number is the last length in Paris points of 2/3 cm (${nf(l, last, 1)} cm); the last is about 1.3 cm longer than the foot.`,
        ),
      },
    ],
  });
}

function usVariant(g: "men" | "women", us: number): VariantDef {
  const f = footFromUs(us, g);
  const a = allSizes(f, g);
  const other = g === "men" ? "women" : "men";
  const usOther = sizeIn("us", f, other);
  const gRu = g === "men" ? "мужской" : "женский";
  const gRuOther = g === "men" ? "женский" : "мужской";
  const gEn = g === "men" ? "men's" : "women's";
  const gEnOther = g === "men" ? "women's" : "men's";
  const cmTxt = (l: Locale) => `${nf(l, f, 1)} ${tt(l, "см", "cm")}`;
  return variant({
    slug: `us-${g}-${us}`,
    name: { ru: `US ${us} ${g === "men" ? "муж." : "жен."}`, en: `US ${gEn} ${us}` },
    props: { group: g, system: "us", value: us },
    keywords: { ru: [`${us} us ${gRu} размер обуви`, `us ${us} в русский размер`], en: [`us ${gEn} size ${us}`, `us ${us} to eu`, `us ${us} in cm`] },
    t: (l) => ({
      title: tt(l, `Размер обуви US ${us} ${gRu}: EU, RU, UK и см`, `US ${gEn} shoe size ${us}: EU, UK, RU and cm`),
      h1: tt(l, `Размер обуви US ${us} (${gRu})`, `US ${gEn} shoe size ${us}`),
      description: tt(
        l,
        `${g === "men" ? "Мужской" : "Женский"} US ${us} — это EU ${sz(l, a.eu)}, RU ${sz(l, a.ru)}, UK ${sz(l, a.uk)} и ${gRuOther} US ${sz(l, usOther)}. Длина стопы около ${cmTxt(l)}, Mondopoint ${nf(l, a.cm, 1)}. Полная таблица ${g === "men" ? "мужских" : "женских"} размеров.`,
        `US ${gEn} ${us} equals EU ${sz(l, a.eu)}, RU ${sz(l, a.ru)}, UK ${sz(l, a.uk)} and US ${gEnOther} ${sz(l, usOther)}. Foot length about ${cmTxt(l)}, Mondopoint ${nf(l, a.cm, 1)}. Full ${gEn} size chart.`,
      ),
      lead: tt(
        l,
        `US ${us} (${g === "men" ? "муж." : "жен."}) ≈ EU ${sz(l, a.eu)} ≈ RU ${sz(l, a.ru)} ≈ UK ${sz(l, a.uk)}; стопа около ${cmTxt(l)}.`,
        `US ${gEn} ${us} ≈ EU ${sz(l, a.eu)} ≈ RU ${sz(l, a.ru)} ≈ UK ${sz(l, a.uk)}; foot about ${cmTxt(l)}.`,
      ),
    }),
    blocks: (l) => [
      {
        type: "facts",
        title: tt(l, `US ${us} (${gRu}) в других системах`, `US ${gEn} ${us} in other systems`),
        rows: [
          ["EU", sz(l, a.eu)],
          ["RU", sz(l, a.ru)],
          ["UK", sz(l, a.uk)],
          [tt(l, `US ${gRuOther}`, `US ${gEnOther}`), sz(l, usOther)],
          [tt(l, "Длина стопы", "Foot length"), tt(l, `около ${cmTxt(l)}`, `about ${cmTxt(l)}`)],
          [tt(l, "Mondopoint / японский", "Mondopoint / Japan"), `${nf(l, a.cm, 1)} ${tt(l, "см", "cm")}`],
        ],
      },
      chartTable(l, g),
      brandNote(l),
    ],
    faq: (l) => [
      {
        q: tt(l, `US ${us} ${gRu} — это какой российский размер?`, `What Russian size is US ${gEn} ${us}?`),
        a: tt(
          l,
          `Примерно RU ${sz(l, a.ru)} (EU ${sz(l, a.eu)}). Если бренд указывает российский размер равным европейскому, это будет RU ${sz(l, a.eu)}. Надёжнее ориентироваться на длину стопы — около ${cmTxt(l)}.`,
          `About RU ${sz(l, a.ru)} (EU ${sz(l, a.eu)}). If a brand labels RU equal to EU it will read RU ${sz(l, a.eu)}. The foot length — about ${cmTxt(l)} — is the safer reference.`,
        ),
      },
      {
        q: tt(l, `Чем ${gRu} US ${us} отличается от ${gRuOther === "женский" ? "женского" : "мужского"}?`, `How does US ${gEn} ${us} compare with ${gEnOther} sizes?`),
        a: tt(
          l,
          `В США у мужчин и женщин разные шкалы. По классической схеме женский размер на 1 больше мужского, поэтому ${gRu} US ${us} соответствует ${gRuOther === "женский" ? "женскому" : "мужскому"} US ${sz(l, usOther)}. У Nike и Adidas разница 1,5 размера.`,
          `The US uses different scales for men and women. Classically women's sizes are 1 larger than men's, so US ${gEn} ${us} matches US ${gEnOther} ${sz(l, usOther)}. Nike and Adidas use a 1.5-size offset.`,
        ),
      },
    ],
  });
}

/* ───────────── tool ───────────── */

export const shoesTool: ToolDef = {
  slug: "shoe-size-chart",
  component: "sizes/shoes",
  icon: "Footprints",
  popular: true,
  name: { ru: "Размеры обуви", en: "Shoe sizes" },
  title: { ru: "Таблица размеров обуви: RU, EU, US, UK и длина стопы", en: "Shoe size chart and converter: EU, US, UK, RU, cm" },
  h1: { ru: "Таблица размеров обуви", en: "Shoe size chart" },
  description: {
    ru: "Конвертер размеров обуви: российские, европейские, британские и американские размеры и длина стопы в см. Мужская, женская и детская таблицы; EU 42 ≈ RU 41 ≈ US 9.",
    en: "Shoe size converter for EU, Russian, UK and US sizes and foot length in cm. Men's, women's and kids' charts; EU 42 ≈ UK 8 ≈ US men's 9 ≈ 26.3–27 cm foot.",
  },
  lead: {
    ru: "Выберите систему и размер — конвертер покажет российский, европейский, британский и американский размер и длину стопы.",
    en: "Pick a system and a size to see the EU, Russian, UK and US equivalents and the matching foot length.",
  },
  keywords: {
    ru: ["размеры обуви", "перевод размеров обуви", "таблица размеров обуви", "американский размер обуви", "размер обуви в см"],
    en: ["shoe size converter", "shoe size chart", "eu to us shoe size", "uk shoe size", "foot length"],
  },
  props: { group: "men", system: "eu", value: 42 },
  howTo: {
    ru: [
      "Выберите таблицу: мужская, женская или детская обувь.",
      "Укажите систему, в которой вы знаете размер: EU, RU, UK, US или длина стопы в сантиметрах.",
      "Выберите размер — остальные системы пересчитаются сразу.",
      "Сверьтесь с длиной стопы: у разных брендов размеры отличаются на ½–1 номер.",
    ],
    en: [
      "Choose the chart: men's, women's or kids' shoes.",
      "Pick the system you know your size in: EU, RU, UK, US or foot length in centimetres.",
      "Select the size — every other system updates instantly.",
      "Check the foot length: brands differ by ½–1 size.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Чем российский размер обуви отличается от европейского?",
        a: "Обе системы штихмассовые: 1 штих = 2/3 см длины колодки. В большинстве российских таблиц RU = EU − 1 (EU 42 ≈ RU 41), но ряд брендов, особенно спортивных, указывает российский размер равным европейскому. Надёжнее сравнивать длину стопы в сантиметрах.",
      },
      {
        q: "Как узнать свой размер обуви?",
        a: "Измерьте длину стопы от пятки до кончика самого длинного пальца (инструкция ниже) и выберите в конвертере систему «См» — он покажет размер во всех системах.",
      },
      {
        q: "Почему американский женский размер больше мужского?",
        a: "В США мужская и женская обувь размечается по разным шкалам: женский размер обычно на 1 больше мужского, у Nike, Adidas и некоторых других брендов — на 1,5. Британская и европейская шкалы для мужчин и женщин общие.",
      },
      {
        q: "Что такое Mondopoint и японский размер?",
        a: "Mondopoint (ISO 9407) — длина стопы в миллиметрах, японский размер — то же в сантиметрах. На нём основан и российский ГОСТ Р 58149-2018, пришедший на смену ГОСТ 11373-88.",
      },
      {
        q: "Насколько точна таблица?",
        a: "Это ориентир: формулы по длине стопы дают средние значения, а у брендов разные колодки. Перед покупкой сверяйтесь с размерной сеткой конкретного магазина.",
      },
    ],
    en: [
      {
        q: "What is the difference between Russian and EU shoe sizes?",
        a: "Both use the Paris point: 1 point = 2/3 cm of last length. Most Russian charts give RU = EU − 1 (EU 42 ≈ RU 41), but some brands, especially sportswear, label Russian sizes equal to EU. Comparing foot length in centimetres is the safest way.",
      },
      {
        q: "How do I find my shoe size?",
        a: "Measure your foot from the heel to the tip of the longest toe (instructions below) and choose the “cm” system in the converter — it shows the size in every system.",
      },
      {
        q: "Why are US women's sizes larger than men's?",
        a: "The US uses separate scales: women's sizes are usually 1 larger than men's, and 1.5 larger at Nike, Adidas and some other brands. UK and EU scales are the same for men and women.",
      },
      {
        q: "What are Mondopoint and Japanese sizes?",
        a: "Mondopoint (ISO 9407) is the foot length in millimetres; Japanese sizes are the same in centimetres. Russia's GOST R 58149-2018, which replaced GOST 11373-88, is also based on Mondopoint.",
      },
      {
        q: "How accurate is the chart?",
        a: "It is a guide: formulas based on foot length give average values, and brands use different lasts. Check the size chart of the specific store before buying.",
      },
    ],
  },
  about: {
    ru: [
      "Все системы пересчитываются через длину стопы. Европейский (штихмассовый) размер: EU = 1,5 × длина стопы в см + 2 — колодка длиннее стопы примерно на 2 штиха (1,33 см). Британский: UK = 3 × длина стопы в дюймах − 23,5, шаг — треть дюйма. Американский мужской на 1 больше британского, женский — на 2.",
      "Российские магазины чаще всего указывают RU = EU − 1. ГОСТ 11373-88 размечал обувь по длине стопы в миллиметрах, а приведённые в нём штихмассовые номера на ½–1 размер меньше рекомендованных ISO — отсюда и расхождения в таблицах разных продавцов. Если источники противоречат друг другу, ориентируйтесь на сантиметры.",
      "Детская обувь в России маркируется теми же номерами, что и европейская. Британские и американские детские размеры идут по отдельной шкале до 13½, после чего начинается взрослая (UK) или подростковая Y (US).",
    ],
    en: [
      "Every system is converted through foot length. The EU (Paris point) size is EU = 1.5 × foot length in cm + 2 — the last is about 2 points (1.33 cm) longer than the foot. UK: UK = 3 × foot length in inches − 23.5, in steps of a third of an inch. US men's is UK + 1, US women's is UK + 2.",
      "Russian stores most often use RU = EU − 1. The Soviet GOST 11373-88 sized shoes by foot length in millimetres, and its Paris-point numbers came out ½–1 size smaller than ISO recommendations, which is why charts from different sellers disagree. When sources conflict, trust centimetres.",
      "In Russia children's shoes carry the same numbers as EU. UK and US children's sizes follow a separate scale up to 13½, after which the adult UK scale or the US youth (Y) scale begins.",
    ],
  },
  related: ["convert/centimeters-to-inches", "convert/inches-to-centimeters"],
  variants: {
    title: { ru: "Таблицы и размеры", en: "Charts and sizes" },
    list: () => [
      chartVariant("men"),
      chartVariant("women"),
      chartVariant("kids"),
      ...Array.from({ length: 13 }, (_, i) => euVariant(35 + i)),
      ...Array.from({ length: 7 }, (_, i) => usVariant("men", 7 + i)),
      ...Array.from({ length: 6 }, (_, i) => usVariant("women", 5 + i)),
    ],
  },
  blocks: (l) => [measureBlock(l), chartTable(l, "men"), chartTable(l, "women"), chartTable(l, "kids")],
};
