import type { ToolDef } from "@/registry/types";

export const markupMarginTool: ToolDef = {
  slug: "markup-margin-calculator",
  component: "finance/markup-margin",
  icon: "Scale",
  name: { ru: "Калькулятор наценки и маржи", en: "Markup and margin calculator" },
  title: { ru: "Калькулятор наценки и маржи — разница и перевод", en: "Markup and margin calculator — convert and compare" },
  h1: { ru: "Калькулятор наценки и маржи", en: "Markup and margin calculator" },
  description: {
    ru: "Наценка и маржа по себестоимости и цене, цена продажи по нужной наценке или марже. Наценка 25 % = маржа 20 %, 100 % = 50 %. Таблица соответствия.",
    en: "Markup and margin from cost and price, or the selling price for a target markup or margin. A 25% markup is a 20% margin; 100% markup is 50%. Conversion table.",
  },
  lead: {
    ru: "Закупка 8 000 ₸, продажа 10 000 ₸: наценка 25 %, маржа 20 %, прибыль 2 000 ₸ с единицы.",
    en: "Cost $80, price $100: 25% markup, 20% margin and $20 profit per unit.",
  },
  keywords: {
    ru: ["наценка и маржа", "калькулятор наценки", "маржинальность", "разница наценки и маржи", "цена с наценкой"],
    en: ["markup calculator", "margin calculator", "markup vs margin", "profit margin", "selling price"],
  },
  props: {},
  howTo: {
    ru: [
      "Выберите, что вам известно: цена продажи, желаемая наценка или желаемая маржа.",
      "Введите себестоимость (цену закупки) и второе значение.",
      "Смотрите наценку, маржу, цену и прибыль с единицы — пересчёт мгновенный.",
      "Таблица ниже помогает быстро перевести наценку в маржу.",
    ],
    en: [
      "Choose what you know: the selling price, the target markup or the target margin.",
      "Enter the cost and the second value.",
      "See the markup, margin, price and profit per unit instantly.",
      "Use the table below to convert markup to margin at a glance.",
    ],
  },
  about: {
    ru: [
      "Наценка и маржа описывают одну и ту же прибыль, но от разной базы. Наценка — процент от себестоимости, маржа — процент от цены продажи. Товар за 8 000 ₸ продают за 10 000 ₸: прибыль 2 000 ₸ — это 25 % наценки и 20 % маржи.",
      "Путаница стоит денег: если нужна маржа 30 %, наценки 30 % не хватит — нужна наценка около 42,86 %. Маржа не может достичь 100 %, наценка ограничений не имеет.",
    ],
    en: [
      "Markup and margin describe the same profit against different bases. Markup is a percentage of cost, margin a percentage of the selling price: buying at $80 and selling at $100 is a 25% markup and a 20% margin.",
      "Mixing them up costs money: to earn a 30% margin you need a markup of about 42.86%, not 30%. Margin can never reach 100%, while markup has no limit.",
    ],
  },
  faq: {
    ru: [
      { q: "Чем наценка отличается от маржи?", a: "Наценка — прибыль в процентах от себестоимости, маржа — прибыль в процентах от цены продажи. Поэтому при одной прибыли маржа всегда меньше: 25 % наценки = 20 % маржи." },
      { q: "Как посчитать цену с нужной маржой?", a: "Цена = себестоимость / (1 − маржа / 100). Для маржи 30 % при себестоимости 7 000 ₸: 7 000 / 0,7 = 10 000 ₸." },
      { q: "Как перевести наценку в маржу?", a: "Маржа = наценка / (100 + наценка) × 100 %. Наценка 50 % — это маржа 33,33 %, наценка 100 % — маржа 50 %." },
    ],
    en: [
      { q: "What is the difference between markup and margin?", a: "Markup is profit as a percentage of cost; margin is profit as a percentage of the selling price. For the same profit the margin is always lower: a 25% markup is a 20% margin." },
      { q: "How do I price for a target margin?", a: "Price = cost / (1 − margin / 100). For a 30% margin on a $70 cost: 70 / 0.7 = $100." },
      { q: "How do I convert markup to margin?", a: "Margin = markup / (100 + markup) × 100%. A 50% markup is a 33.33% margin; 100% markup is 50%." },
    ],
  },
  related: ["percentage-calculator", "break-even-calculator", "discount-calculator", "vat-calculator", "roi-calculator"],
};
