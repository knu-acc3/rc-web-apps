import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { healthyRange, IDEAL_FORMULAS, idealWeight, weightForBmi, type IdealFormula } from "../engines/body";

const n1 = (locale: Locale, v: number) => formatNumber(locale, v, { maximumFractionDigits: 1 });
const kg = (locale: Locale, v: number) => `${n1(locale, v)} ${locale === "ru" ? "кг" : "kg"}`;
const FORMULA_NAME: Record<Locale, Record<IdealFormula, string>> = {
  ru: { devine: "Девайн", robinson: "Робинсон", miller: "Миллер", hamwi: "Хамви" },
  en: { devine: "Devine", robinson: "Robinson", miller: "Miller", hamwi: "Hamwi" },
};
const HEIGHTS = Array.from({ length: 51 }, (_, i) => 150 + i);

function bmiTable(locale: Locale, h: number): Block {
  const ru = locale === "ru";
  const rows: [number, string][] = ru
    ? [
        [16, "выраженный дефицит"],
        [17, "умеренный дефицит"],
        [18.5, "нижняя граница нормы"],
        [20, "норма"],
        [22, "середина нормы"],
        [24.9, "верхняя граница нормы"],
        [25, "избыточный вес"],
        [27.5, "избыточный вес"],
        [30, "ожирение I степени"],
        [35, "ожирение II степени"],
        [40, "ожирение III степени"],
      ]
    : [
        [16, "severe thinness"],
        [17, "moderate thinness"],
        [18.5, "lower end of normal"],
        [20, "normal"],
        [22, "middle of normal"],
        [24.9, "upper end of normal"],
        [25, "overweight"],
        [27.5, "overweight"],
        [30, "obesity class I"],
        [35, "obesity class II"],
        [40, "obesity class III"],
      ];
  return {
    type: "table",
    title: ru ? `Вес при росте ${h} см по индексу массы тела` : `Weight at ${h} cm by body mass index`,
    head: ru ? ["ИМТ", "Вес", "Категория"] : ["BMI", "Weight", "Category"],
    rows: rows.map(([b, label]) => [n1(locale, b), kg(locale, weightForBmi(b, h)), label]),
  };
}

function formulaTable(locale: Locale, h: number): Block {
  const ru = locale === "ru";
  return {
    type: "table",
    title: ru ? `Идеальный вес при росте ${h} см по формулам` : `Ideal weight at ${h} cm by formula`,
    head: ru ? ["Формула", "Мужчины", "Женщины"] : ["Formula", "Men", "Women"],
    rows: IDEAL_FORMULAS.map((f) => [FORMULA_NAME[locale][f], kg(locale, idealWeight(f, "male", h)), kg(locale, idealWeight(f, "female", h))]),
    caption: h < 153 ? (ru ? "Формулы экстраполированы для роста ниже 152,4 см" : "Formulas are extrapolated below 152.4 cm") : undefined,
  };
}

function variant(h: number): VariantDef {
  const [lo, hi] = healthyRange(h);
  const dm = idealWeight("devine", "male", h);
  const dw = idealWeight("devine", "female", h);
  const men = IDEAL_FORMULAS.map((f) => idealWeight(f, "male", h));
  const women = IDEAL_FORMULAS.map((f) => idealWeight(f, "female", h));
  const range = (locale: Locale, xs: number[]) => `${n1(locale, Math.min(...xs))}–${kg(locale, Math.max(...xs))}`;
  const short = h < 153;
  const faq = (locale: Locale): QA[] =>
    locale === "ru"
      ? [
          { q: `Какой нормальный вес при росте ${h} см?`, a: `По классификации ВОЗ — от ${kg("ru", lo)} до ${kg("ru", hi)} (ИМТ от 18,5 до 24,9). Середина диапазона (ИМТ 22) — ${kg("ru", weightForBmi(22, h))}.` },
          { q: `Сколько должна весить женщина при росте ${h} см?`, a: `Нормальный вес — ${n1("ru", lo)}–${kg("ru", hi)}, как и для мужчин. Формулы идеального веса для женщин дают ${range("ru", women)}.${short ? " Для такого роста формулы экстраполированы и менее точны." : ""}` },
          { q: `Сколько должен весить мужчина при росте ${h} см?`, a: `По ИМТ — ${n1("ru", lo)}–${kg("ru", hi)}. Формулы идеального веса для мужчин дают ${range("ru", men)}, по Девайну — ${kg("ru", dm)}.` },
          { q: `С какого веса начинается ожирение при росте ${h} см?`, a: `С ${kg("ru", weightForBmi(30, h))} (ИМТ 30). Избыточный вес — от ${kg("ru", weightForBmi(25, h))} (ИМТ 25).` },
        ]
      : [
          { q: `What is a healthy weight at ${h} cm?`, a: `According to the WHO, ${kg("en", lo)} to ${kg("en", hi)} (BMI 18.5 to 24.9). The middle of the range (BMI 22) is ${kg("en", weightForBmi(22, h))}.` },
          { q: `How much should a woman weigh at ${h} cm?`, a: `The healthy range is ${n1("en", lo)}–${kg("en", hi)}, the same as for men. Ideal-weight formulas for women give ${range("en", women)}.${short ? " At this height the formulas are extrapolated and less reliable." : ""}` },
          { q: `How much should a man weigh at ${h} cm?`, a: `By BMI, ${n1("en", lo)}–${kg("en", hi)}. Ideal-weight formulas for men give ${range("en", men)}; Devine gives ${kg("en", dm)}.` },
          { q: `At what weight does obesity start at ${h} cm?`, a: `At ${kg("en", weightForBmi(30, h))} (BMI 30). Overweight starts at ${kg("en", weightForBmi(25, h))} (BMI 25).` },
        ];
  return {
    slug: `${h}-cm`,
    name: { ru: `${h} см`, en: `${h} cm` },
    title: { ru: `Идеальный вес при росте ${h} см — норма для мужчин и женщин`, en: `Ideal weight for ${h} cm — healthy range for men and women` },
    h1: { ru: `Идеальный вес при росте ${h} см`, en: `Ideal weight for ${h} cm height` },
    description: {
      ru: `Нормальный вес при росте ${h} см — ${n1("ru", lo)}–${kg("ru", hi)} (ИМТ 18,5–24,9). По формуле Девайна: ${kg("ru", dm)} для мужчин, ${kg("ru", dw)} для женщин.`,
      en: `A healthy weight at ${h} cm is ${n1("en", lo)}–${kg("en", hi)} (BMI 18.5–24.9). The Devine formula gives ${kg("en", dm)} for men and ${kg("en", dw)} for women.`,
    },
    lead: {
      ru: `При росте ${h} см нормальный вес — от ${kg("ru", lo)} до ${kg("ru", hi)}; избыточный — от ${kg("ru", weightForBmi(25, h))}.`,
      en: `At ${h} cm a healthy weight is ${kg("en", lo)} to ${kg("en", hi)}; overweight starts at ${kg("en", weightForBmi(25, h))}.`,
    },
    keywords: { ru: [`вес при росте ${h}`, `рост ${h} вес`, `идеальный вес ${h} см`], en: [`ideal weight ${h} cm`, `healthy weight ${h} cm`] },
    props: { height: h },
    blocks: (locale) => [bmiTable(locale, h), formulaTable(locale, h)],
    faq: { ru: faq("ru"), en: faq("en") },
  };
}

export const idealWeightTool: ToolDef = {
  slug: "ideal-weight-calculator",
  component: "health/ideal-weight",
  icon: "PersonStanding",
  popular: true,
  name: { ru: "Калькулятор идеального веса", en: "Ideal weight calculator" },
  title: { ru: "Калькулятор идеального веса по росту для мужчин и женщин", en: "Ideal weight calculator by height for men and women" },
  h1: { ru: "Калькулятор идеального веса по росту", en: "Ideal weight calculator by height" },
  description: {
    ru: "Нормальный вес для вашего роста по ИМТ ВОЗ и идеальный вес по формулам Девайна, Робинсона, Миллера и Хамви для мужчин и женщин. Таблицы для роста 150–200 см.",
    en: "Healthy weight for your height by WHO BMI and ideal weight by the Devine, Robinson, Miller and Hamwi formulas for men and women. Tables for heights 150–200 cm.",
  },
  lead: {
    ru: "При росте 170 см нормальный вес — 53,5–72 кг, а формулы идеального веса для мужчин дают 65–67 кг.",
    en: "At 170 cm a healthy weight is 53.5–72 kg, and ideal-weight formulas for men give 65–67 kg.",
  },
  keywords: {
    ru: ["идеальный вес", "нормальный вес по росту", "формула Девайна", "вес и рост таблица", "сколько должен весить"],
    en: ["ideal weight calculator", "ideal body weight", "healthy weight for height", "devine formula"],
  },
  props: { height: 170 },
  howTo: {
    ru: [
      "Введите рост в сантиметрах или в футах и дюймах.",
      "Выберите пол — от него зависят формулы идеального веса.",
      "Сверху — диапазон нормального веса по ИМТ, ниже — результаты четырёх формул.",
      "Для готовых таблиц откройте страницу своего роста — от 150 до 200 см.",
    ],
    en: [
      "Enter your height in centimetres or in feet and inches.",
      "Choose your sex — the ideal-weight formulas depend on it.",
      "The top shows the healthy range by BMI, below are the results of four formulas.",
      "For ready-made tables open the page for your height, from 150 to 200 cm.",
    ],
  },
  about: {
    ru: [
      "Единого «идеального» веса не существует. Надёжный ориентир для взрослых — диапазон нормального ИМТ по ВОЗ: 18,5–24,9. Для роста 170 см это 53,5–72 кг, и любая точка внутри диапазона считается нормой.",
      "Формулы Девайна, Робинсона, Миллера и Хамви дают одно число с учётом пола. Они пришли из клинической практики и расходятся между собой на несколько килограммов, поэтому калькулятор показывает все четыре.",
    ],
    en: [
      "There is no single ideal weight. A reliable guide for adults is the WHO healthy BMI range of 18.5–24.9: at 170 cm that is 53.5–72 kg, and anywhere inside it counts as healthy.",
      "The Devine, Robinson, Miller and Hamwi formulas give one number per sex. They come from clinical practice and differ by several kilograms, so the calculator shows all four.",
    ],
  },
  faq: {
    ru: [
      { q: "Как рассчитать идеальный вес?", a: "Проще всего — через ИМТ: нормальный вес = от 18,5 до 24,9 × рост в метрах в квадрате. Для 175 см это 56,7–76,3 кг." },
      { q: "Какая формула идеального веса точнее?", a: "Ни одна не учитывает телосложение и мышечную массу. Формула Девайна распространена в медицине, но разница между формулами — несколько килограммов; ориентируйтесь на диапазон по ИМТ." },
      { q: "Отличается ли идеальный вес у мужчин и женщин?", a: "Диапазон по ИМТ одинаков для обоих полов. Формулы идеального веса дают женщинам на несколько килограммов меньше, чем мужчинам того же роста: при 170 см — на 3,5–6 кг." },
    ],
    en: [
      { q: "How do I calculate my ideal weight?", a: "The simplest way is BMI: healthy weight = 18.5 to 24.9 × height in metres squared. At 175 cm that is 56.7–76.3 kg." },
      { q: "Which ideal weight formula is most accurate?", a: "None of them accounts for frame or muscle mass. Devine is common in medicine, but the formulas differ by several kilograms — use the BMI range as the main guide." },
      { q: "Is ideal weight different for men and women?", a: "The BMI range is the same for both. Ideal-weight formulas give women a few kilograms less than men of the same height: 3.5–6 kg less at 170 cm." },
    ],
  },
  related: ["bmi-calculator", "body-fat-calculator", "calorie-calculator", "waist-to-height-ratio-calculator"],
  variants: { title: { ru: "Идеальный вес по росту", en: "Ideal weight by height" }, list: () => HEIGHTS.map(variant), limit: 51 },
};
