import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { mapToGround } from "../numbers/engines";

function scaleTable(locale: Locale): Block {
  const ru = locale === "ru";
  const scales = [1000, 5000, 10000, 25000, 50000, 100000, 200000, 1000000];
  const nf = new Intl.NumberFormat(ru ? "ru-RU" : "en-US");
  return {
    type: "table",
    title: ru ? "Сколько на местности в 1 см карты" : "Ground distance per 1 cm of map",
    head: ru ? ["Масштаб", "1 см на карте", "10 см на карте"] : ["Scale", "1 cm on map", "10 cm on map"],
    rows: scales.map((s) => {
      const m1 = mapToGround(1, s);
      const m10 = mapToGround(10, s);
      const t = (m: number) => (m >= 1000 ? `${nf.format(m / 1000)} ${ru ? "км" : "km"}` : `${nf.format(m)} ${ru ? "м" : "m"}`);
      return [`1 : ${nf.format(s)}`, t(m1), t(m10)];
    }),
  };
}

export const proportionTool: ToolDef = {
  slug: "proportion-calculator",
  component: "calc/proportion",
  icon: "Scale3d",
  name: { ru: "Калькулятор пропорций", en: "Proportion calculator" },
  title: { ru: "Калькулятор пропорций — правило трёх онлайн", en: "Proportion calculator — rule of three" },
  h1: { ru: "Калькулятор пропорций", en: "Proportion calculator (rule of three)" },
  description: {
    ru: "Решите пропорцию по трём известным числам: прямая (цена и вес) и обратная (рабочие и срок) пропорция, пересчёт по масштабу карты в метры и километры.",
    en: "Solve a proportion from three known numbers: direct (price and weight) and inverse (workers and days) proportions, plus map scale conversions to metres and kilometres.",
  },
  lead: {
    ru: "3 кг стоят 450 ₸ — значит, 5 кг стоят 450 × 5 / 3 = 750 ₸.",
    en: "If 3 kg cost $4.50, then 5 kg cost 4.50 × 5 / 3 = $7.50.",
  },
  keywords: {
    ru: ["пропорция", "калькулятор пропорций", "правило трёх", "обратная пропорция", "масштаб карты"],
    en: ["proportion calculator", "rule of three", "inverse proportion", "map scale calculator"],
  },
  props: { mode: "direct" },
  howTo: {
    ru: ["Выберите тип: прямая, обратная пропорция или масштаб карты.", "Введите три известных значения.", "Ответ и формула с вашими числами появятся сразу."],
    en: ["Choose the type: direct, inverse proportion or map scale.", "Enter the three known values.", "The answer and the formula with your numbers appear instantly."],
  },
  about: {
    ru: [
      "Пропорция — равенство двух отношений: a / b = c / d. Если известны три числа, четвёртое находится крест-накрест: d = b × c / a. Так пересчитывают рецепты, цены, расход материалов и проценты.",
      "В обратной пропорции произведение величин постоянно: если 4 рабочих справляются за 6 дней, то 3 рабочим понадобится 4 × 6 / 3 = 8 дней. Режим масштаба переводит расстояния с карты на местность и обратно в правильных единицах.",
    ],
    en: [
      "A proportion is an equality of two ratios: a / b = c / d. Knowing three numbers, the fourth is found by cross-multiplication: d = b × c / a. It is how recipes, prices and material quantities are scaled.",
      "In an inverse proportion the product stays constant: if 4 workers need 6 days, 3 workers need 4 × 6 / 3 = 8 days. The map scale mode converts map distances to ground distances and back in the correct units.",
    ],
  },
  faq: {
    ru: [
      { q: "Как решить пропорцию?", a: "Перемножьте крест-накрест: в пропорции 3 / 4 = x / 10 получаем x = 3 × 10 / 4 = 7,5." },
      { q: "Чем прямая пропорция отличается от обратной?", a: "В прямой величины растут вместе (больше товара — больше цена), в обратной одна растёт, а другая уменьшается (больше рабочих — меньше срок)." },
      { q: "Как перевести расстояние по масштабу карты?", a: "Умножьте расстояние на карте на знаменатель масштаба: 4 см при масштабе 1 : 25 000 — это 100 000 см, то есть 1 км." },
    ],
    en: [
      { q: "How do I solve a proportion?", a: "Cross-multiply: in 3 / 4 = x / 10, x = 3 × 10 / 4 = 7.5." },
      { q: "What is the difference between direct and inverse proportion?", a: "In a direct proportion both values grow together (more goods, higher price); in an inverse one, one grows while the other shrinks (more workers, fewer days)." },
      { q: "How do I use a map scale?", a: "Multiply the map distance by the scale denominator: 4 cm at 1 : 25,000 is 100,000 cm, i.e. 1 km." },
    ],
  },
  related: ["percentage-calculator", "ratio-calculator", "fraction-calculator", "unit-price-calculator"],
  blocks: (locale) => [scaleTable(locale)],
};
