import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { inchWord, tt } from "../lib/shared";
import { BANDS, EU_CUPS, braSize, cupDiff, frBand, sisterSizes, ukBand, type EuCup } from "./engine";

const rng = (r: [number, number]) => `${r[0]}–${r[1]}`;

const cupTable = (l: Locale): Block => ({
  type: "table",
  title: tt(l, "Чашки: соответствие букв", "Cup letters by country"),
  head: [tt(l, "EU / RU / FR", "EU / RU / FR"), "UK", "US", tt(l, "Разница обхватов, см", "Bust − underbust, cm")],
  rows: EU_CUPS.map((c) => {
    const s = braSize(75, c);
    return [c, s.uk.replace(/^\d+/, ""), s.us.replace(/^\d+/, ""), rng(cupDiff(c))];
  }),
});

const bandTable = (l: Locale): Block => ({
  type: "table",
  title: tt(l, "Обхват пояса", "Band size"),
  head: [tt(l, "EU / RU", "EU / RU"), "UK / US", "FR", tt(l, "Обхват под грудью, см", "Underbust, cm")],
  rows: BANDS.map((b) => [String(b), String(ukBand(b)), String(frBand(b)), `${b - 2}–${b + 2}`]),
});

const MEASURE: Record<Locale, string[]> = {
  ru: [
    "Обхват под грудью — лента плотно прилегает к телу горизонтально сразу под грудью, на выдохе.",
    "Обхват груди — по самым выступающим точкам, не сдавливая; удобнее в бюстгальтере без поролона.",
    "Вычтите первое число из второго: разница определяет чашку (каждые 2 см — следующая буква).",
    "Пояс округляется до ближайших 5 см: 73–77 см — это 75.",
  ],
  en: [
    "Underbust — keep the tape snug and level just under the bust, after breathing out.",
    "Bust — around the fullest part without squeezing; easiest in an unpadded bra.",
    "Subtract the first number from the second: the difference sets the cup (every 2 cm is the next letter).",
    "The band rounds to the nearest 5 cm: 73–77 cm is band 75.",
  ],
};
const measureBlock = (l: Locale): Block => ({ type: "list", ordered: true, title: tt(l, "Как снять мерки", "How to measure"), items: MEASURE[l] });

function braVariant(band: number, cup: EuCup): VariantDef {
  const s = braSize(band, cup);
  const sisters = sisterSizes(band, cup).map((x) => `${x.band}${x.cup}`);
  const sistersTxt = (l: Locale) => sisters.join(tt(l, " и ", " and "));
  const t = (l: Locale) => ({
    title: tt(l, `Размер бюстгальтера ${s.eu}: UK, US, FR и обхваты`, `${s.eu} bra size: UK, US, FR and measurements`),
    h1: tt(l, `Размер бюстгальтера ${s.eu}`, `${s.eu} bra size`),
    description: tt(
      l,
      `${s.eu} — обхват под грудью ${rng(s.underbust)} см, обхват груди ${rng(s.bust)} см. В Великобритании это ${s.uk}, в США — ${s.us}, во Франции — ${s.fr}. Сестринские размеры: ${sistersTxt(l)}.`,
      `${s.eu} means a ${rng(s.underbust)} cm underbust and ${rng(s.bust)} cm bust. It is ${s.uk} in the UK, ${s.us} in the US and ${s.fr} in France. Sister sizes: ${sistersTxt(l)}.`,
    ),
    lead: tt(
      l,
      `${s.eu} = UK ${s.uk} = US ${s.us} = FR ${s.fr}; под грудью ${rng(s.underbust)} см, грудь ${rng(s.bust)} см.`,
      `${s.eu} = UK ${s.uk} = US ${s.us} = FR ${s.fr}; underbust ${rng(s.underbust)} cm, bust ${rng(s.bust)} cm.`,
    ),
  });
  const ru = t("ru");
  const en = t("en");
  const faq = (l: Locale): QA[] => [
    {
      q: tt(l, `${s.eu} — это какой размер в США и Великобритании?`, `What is ${s.eu} in UK and US sizes?`),
      a: tt(
        l,
        `${s.uk} в Великобритании и ${s.us} в США: пояс ${band} см ≈ ${ukBand(band)} ${inchWord("ru", ukBand(band))}${EU_CUPS.indexOf(cup) > EU_CUPS.indexOf("D") ? `, а после чашки D буквы расходятся — европейская ${cup} соответствует британской ${s.uk.replace(/^\d+/, "")}` : ", чашки до D обозначаются одинаково"}.`,
        `${s.uk} in the UK and ${s.us} in the US: a ${band} cm band is about ${ukBand(band)} inches${EU_CUPS.indexOf(cup) > EU_CUPS.indexOf("D") ? `, and after D the letters diverge — EU ${cup} is UK ${s.uk.replace(/^\d+/, "")}` : ", and cups up to D use the same letters"}.`,
      ),
    },
    {
      q: tt(l, `Какие обхваты у размера ${s.eu}?`, `What measurements fit ${s.eu}?`),
      a: tt(
        l,
        `Обхват под грудью ${rng(s.underbust)} см, обхват груди ${rng(s.bust)} см. Чашка ${cup} — разница обхватов ${rng(cupDiff(cup))} см.`,
        `Underbust ${rng(s.underbust)} cm, bust ${rng(s.bust)} cm. Cup ${cup} means a ${rng(cupDiff(cup))} cm difference between the two.`,
      ),
    },
    {
      q: tt(l, `Что делать, если ${s.eu} не подходит?`, `What if ${s.eu} doesn't fit?`),
      a: tt(
        l,
        `Если пояс велик, попробуйте сестринский размер ${sisters[0] ?? s.eu} — чашка того же объёма на меньшем поясе; если мал — ${sisters[1] ?? s.eu}. Если чашка морщит или давит, меняйте букву при том же поясе.`,
        `If the band is loose, try the sister size ${sisters[0] ?? s.eu} — the same cup volume on a smaller band; if it's tight, try ${sisters[1] ?? s.eu}. If the cup gapes or cuts in, change the letter on the same band.`,
      ),
    },
  ];
  return {
    slug: `${band}${cup.toLowerCase()}`,
    name: { ru: s.eu, en: s.eu },
    props: { band, cup },
    keywords: { ru: [`${s.eu} размер`, `${s.eu} это какой размер`, `размер ${s.eu}`], en: [`${s.eu} bra size`, `${s.eu} in us`, `${s.eu} in uk`] },
    title: { ru: ru.title, en: en.title },
    h1: { ru: ru.h1, en: en.h1 },
    description: { ru: ru.description, en: en.description },
    lead: { ru: ru.lead, en: en.lead },
    blocks: (l) => [
      {
        type: "facts",
        title: tt(l, `${s.eu} в разных странах`, `${s.eu} in other countries`),
        rows: [
          [tt(l, "Россия и Европа", "Russia and Europe"), s.eu],
          [tt(l, "Великобритания", "UK"), s.uk],
          [tt(l, "США", "US"), s.us],
          [tt(l, "Франция, Бельгия, Испания", "France, Belgium, Spain"), s.fr],
          [tt(l, "Обхват под грудью", "Underbust"), `${rng(s.underbust)} ${tt(l, "см", "cm")}`],
          [tt(l, "Обхват груди", "Bust"), `${rng(s.bust)} ${tt(l, "см", "cm")}`],
          [tt(l, "Сестринские размеры", "Sister sizes"), sisters.join(", ")],
        ],
      },
      cupTable(l),
      measureBlock(l),
    ],
    faq: { ru: faq("ru"), en: faq("en") },
  };
}

const VARIANT_BANDS = [70, 75, 80, 85, 90];
const VARIANT_CUPS: EuCup[] = ["A", "B", "C", "D", "E"];

export const braTool: ToolDef = {
  slug: "bra-size-calculator",
  component: "sizes/bra",
  icon: "Ruler",
  name: { ru: "Размер бюстгальтера", en: "Bra size" },
  title: { ru: "Размер бюстгальтера: калькулятор и таблица RU, EU, US, UK", en: "Bra size calculator and chart: EU, UK, US, FR" },
  h1: { ru: "Калькулятор размера бюстгальтера", en: "Bra size calculator" },
  description: {
    ru: "Калькулятор размера бюстгальтера по обхвату под грудью и груди, перевод RU/EU, UK, US и FR. 75B = UK 34B = FR 90B; после чашки D буквы расходятся: EU E = UK DD.",
    en: "Bra size calculator from underbust and bust measurements with EU/RU, UK, US and French conversion. 75B = UK 34B = FR 90B; after D the letters diverge: EU E = UK DD.",
  },
  lead: {
    ru: "Введите обхват под грудью и обхват груди — калькулятор определит размер и покажет его в других системах.",
    en: "Enter your underbust and bust measurements to get your size and its equivalents in other systems.",
  },
  keywords: {
    ru: ["размер бюстгальтера", "калькулятор размера бюстгальтера", "размер лифчика", "размер груди", "75b"],
    en: ["bra size calculator", "bra size chart", "bra size conversion", "uk bra size"],
  },
  props: { band: 75, cup: "B" },
  howTo: {
    ru: [
      "Измерьте обхват под грудью — лента плотно прилегает к телу горизонтально.",
      "Измерьте обхват груди по самым выступающим точкам, не сдавливая.",
      "Введите оба значения — калькулятор определит пояс и чашку.",
      "Знаете размер — выберите его в строке ниже, чтобы увидеть аналоги и сестринские размеры.",
    ],
    en: [
      "Measure your underbust with the tape snug and level.",
      "Measure your bust around the fullest part without squeezing.",
      "Enter both numbers — the calculator finds the band and the cup.",
      "Already know your size? Pick it in the row below to see equivalents and sister sizes.",
    ],
  },
  faq: {
    ru: [
      { q: "Как определить размер чашки?", a: "Вычтите обхват под грудью из обхвата груди: 12–13 см — A, 14–15 — B, 16–17 — C, 18–19 — D, 20–21 — E. Каждая следующая чашка — плюс 2 см." },
      { q: "Российский размер бюстгальтера совпадает с европейским?", a: "Да, в России используется европейская маркировка: число — обхват под грудью в сантиметрах с шагом 5 (70, 75, 80), буква — полнота чашки." },
      { q: "Как перевести 75B в американский размер?", a: "75B = 34B: британский и американский пояс — обхват в дюймах (75 см ≈ 34″). Буквы совпадают до D, дальше расходятся: EU E = UK DD = US DD." },
      { q: "Что такое сестринские размеры?", a: "Размеры с тем же объёмом чашки на соседнем поясе: для 75B это 70C и 80A. Их пробуют, если пояс велик или мал." },
      { q: "Как устроены французские размеры?", a: "Французский пояс на 15 больше европейского: 75B = FR 90B. Буквы чашек такие же, как в европейской системе." },
    ],
    en: [
      { q: "How do I work out my cup size?", a: "Subtract the underbust from the bust: 12–13 cm is A, 14–15 B, 16–17 C, 18–19 D, 20–21 E. Each next cup adds 2 cm." },
      { q: "Are Russian and European bra sizes the same?", a: "Yes, Russia uses European labels: the number is the underbust in centimetres in 5 cm steps (70, 75, 80) and the letter is the cup." },
      { q: "What is 75B in US sizes?", a: "75B = 34B: UK and US bands are the underbust in inches (75 cm ≈ 34″). Letters match up to D and then diverge: EU E = UK DD = US DD." },
      { q: "What are sister sizes?", a: "Sizes with the same cup volume on a neighbouring band: for 75B they are 70C and 80A. Try them when the band is too loose or too tight." },
      { q: "How do French sizes work?", a: "The French band is 15 more than the EU band: 75B = FR 90B. Cup letters are the same as in the EU system." },
    ],
  },
  about: {
    ru: [
      "В европейской системе, принятой и в России, пояс — это обхват под грудью в сантиметрах с шагом 5, а чашка — буква: каждая следующая добавляет около 2 см разницы между обхватом груди и под грудью.",
      "Британские и американские пояса — обхват в дюймах (32, 34, 36…). После D в Великобритании идут DD, E, F, FF, а в США — DD, DDD, G, поэтому один и тот же размер выглядит по-разному: EU 75F = UK 34E = US 34DDD.",
      "Посадка у брендов отличается, поэтому считайте результат отправной точкой для примерки.",
    ],
    en: [
      "In the European system, also used in Russia, the band is the underbust in centimetres in 5 cm steps and the cup is a letter: each next letter adds about 2 cm of difference between bust and underbust.",
      "UK and US bands are in inches (32, 34, 36…). After D the UK continues DD, E, F, FF and the US DD, DDD, G, so the same size looks different: EU 75F = UK 34E = US 34DDD.",
      "Fit differs between brands, so treat the result as a starting point for trying on.",
    ],
  },
  related: ["convert/centimeters-to-inches"],
  variants: {
    title: { ru: "Популярные размеры", en: "Popular sizes" },
    list: () => VARIANT_BANDS.flatMap((b) => VARIANT_CUPS.map((c) => braVariant(b, c))),
  },
  blocks: (l) => [measureBlock(l), bandTable(l), cupTable(l)],
};
