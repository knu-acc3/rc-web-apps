import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { fmtMoney, fmtMoneyShort, fmtPct } from "../../calc/kit/fmt";
import { discountPrice } from "../engines/money";

function table(locale: Locale): Block {
  const ru = locale === "ru";
  const prices = ru ? [1_000, 5_000, 10_000, 25_000, 50_000, 100_000] : [10, 50, 100, 250, 500, 1_000];
  const pcts = [5, 10, 15, 20, 25, 30, 40, 50, 70];
  const cur = ru ? "KZT" : "USD";
  return {
    type: "table",
    title: ru ? "Цена со скидкой: быстрая таблица" : "Sale price quick table",
    head: [ru ? "Скидка" : "Discount", ...prices.map((p) => fmtMoney(locale, p, cur, 0))],
    rows: pcts.map((d) => [`−${fmtPct(locale, d)}`, ...prices.map((p) => fmtMoneyShort(locale, discountPrice(p, d).final, cur))]),
  };
}

export const discountTool: ToolDef = {
  slug: "discount-calculator",
  component: "finance/discount",
  icon: "Tag",
  popular: true,
  name: { ru: "Калькулятор скидок", en: "Discount calculator" },
  title: { ru: "Калькулятор скидок онлайн — цена со скидкой и процент", en: "Discount calculator — sale price and percent off" },
  h1: { ru: "Калькулятор скидок", en: "Discount calculator" },
  description: {
    ru: "Посчитайте цену со скидкой, исходную цену до скидки или процент скидки по двум ценам. Две скидки подряд: 20 % и 10 % дают 28 %. Таблица частых скидок.",
    en: "Work out the sale price, the original price before a discount or the percent off from two prices. Stacked discounts: 20% and 10% make 28%. Quick table included.",
  },
  lead: {
    ru: "Товар за 25 000 ₸ со скидкой 20 % стоит 20 000 ₸ — экономия 5 000 ₸.",
    en: "A $250 item at 20% off costs $200 — you save $50.",
  },
  keywords: {
    ru: ["калькулятор скидок", "цена со скидкой", "процент скидки", "посчитать скидку", "цена до скидки"],
    en: ["discount calculator", "percent off", "sale price", "original price", "stacked discounts"],
  },
  props: { mode: "final" },
  howTo: {
    ru: [
      "Выберите, что нужно узнать: цену со скидкой, цену до скидки или процент скидки.",
      "Введите цену и процент (или две цены).",
      "Для акций «скидка на скидку» добавьте вторую скидку — калькулятор покажет итоговый процент.",
      "Результат и экономия обновляются сразу.",
    ],
    en: [
      "Choose what you want: the sale price, the original price or the discount percent.",
      "Enter the price and the percentage (or two prices).",
      "For 'extra % off' deals add a second discount — the calculator shows the total percentage.",
      "The result and your savings update instantly.",
    ],
  },
  about: {
    ru: [
      "Цена со скидкой = цена × (1 − скидка / 100): скидка 15 % на 12 000 ₸ — это 10 200 ₸. Обратная задача — найти цену до скидки: разделите цену со скидкой на (1 − скидка / 100), а не прибавляйте процент к ней.",
      "Две скидки подряд не складываются: «−20 % и ещё −10 % на кассе» дают 28 %, потому что вторая скидка считается от уже уменьшенной цены.",
    ],
    en: [
      "Sale price = price × (1 − discount / 100): 15% off $120 is $102. To find the original price, divide the sale price by (1 − discount / 100) — do not add the percentage back.",
      "Two discounts in a row do not add up: '20% off plus an extra 10%' is 28% because the second discount applies to the already reduced price.",
    ],
  },
  faq: {
    ru: [
      { q: "Как посчитать цену со скидкой?", a: "Умножьте цену на (1 − скидка / 100). Например, 25 000 ₸ со скидкой 20 %: 25 000 × 0,8 = 20 000 ₸." },
      { q: "Как узнать цену до скидки?", a: "Разделите цену со скидкой на (1 − скидка / 100). Если после скидки 30 % товар стоит 14 000 ₸, до скидки он стоил 14 000 / 0,7 = 20 000 ₸." },
      { q: "Как посчитать процент скидки?", a: "(Цена до − цена после) / цена до × 100. Было 18 000 ₸, стало 13 500 ₸: скидка 25 %." },
      { q: "Складываются ли две скидки?", a: "Нет, они перемножаются: 20 % и 10 % дают итоговую скидку 1 − 0,8 × 0,9 = 28 %." },
    ],
    en: [
      { q: "How do I calculate a sale price?", a: "Multiply the price by (1 − discount / 100). $250 at 20% off: 250 × 0.8 = $200." },
      { q: "How do I find the original price?", a: "Divide the sale price by (1 − discount / 100). If an item costs $140 after 30% off, it was 140 / 0.7 = $200." },
      { q: "How do I work out the discount percent?", a: "(Original − sale) / original × 100. From $180 down to $135 is 25% off." },
      { q: "Do two discounts add up?", a: "No, they multiply: 20% and 10% make 1 − 0.8 × 0.9 = 28% in total." },
    ],
  },
  related: ["percentage-calculator/subtract-percent", "vat-calculator", "markup-margin-calculator", "unit-price-calculator", "tip-calculator"],
  blocks: (locale) => [table(locale)],
};
