import type { ToolDef } from "@/registry/types";

export const breakEvenTool: ToolDef = {
  slug: "break-even-calculator",
  component: "finance/break-even",
  icon: "Crosshair",
  name: { ru: "Калькулятор точки безубыточности", en: "Break-even calculator" },
  title: { ru: "Точка безубыточности — калькулятор онлайн с графиком", en: "Break-even point calculator with chart" },
  h1: { ru: "Калькулятор точки безубыточности", en: "Break-even point calculator" },
  description: {
    ru: "Сколько нужно продать, чтобы выйти в ноль: постоянные расходы / (цена − переменные расходы). Выручка в точке, маржинальный доход, запас прочности и график.",
    en: "How many units you must sell to break even: fixed costs / (price − variable cost). Break-even revenue, contribution margin, margin of safety and a chart.",
  },
  lead: {
    ru: "При расходах 1 500 000 ₸ в месяц, цене 5 000 ₸ и себестоимости 2 000 ₸ нужно продавать 500 единиц в месяц.",
    en: "With $15,000 of monthly fixed costs, a $50 price and a $20 variable cost you need to sell 500 units a month.",
  },
  keywords: {
    ru: ["точка безубыточности", "безубыточность", "маржинальный доход", "запас финансовой прочности"],
    en: ["break-even calculator", "break-even point", "contribution margin", "margin of safety"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите постоянные расходы за месяц: аренду, зарплаты, подписки.",
      "Укажите цену продажи и переменные расходы на единицу (закупка, материалы, доставка, комиссия).",
      "При желании задайте плановый объём продаж — калькулятор покажет запас прочности и прибыль.",
      "На графике видно, где линия выручки пересекает линию расходов.",
    ],
    en: [
      "Enter your fixed monthly costs: rent, salaries, subscriptions.",
      "Enter the selling price and the variable cost per unit (purchase, materials, shipping, fees).",
      "Optionally set the planned sales volume to see the margin of safety and profit.",
      "The chart shows where the revenue line crosses the cost line.",
    ],
  },
  about: {
    ru: [
      "Точка безубыточности — объём продаж, при котором выручка покрывает все расходы, а прибыль равна нулю. Каждая проданная единица приносит маржинальный доход (цена минус переменные расходы), который идёт на покрытие постоянных расходов.",
      "Запас прочности показывает, на сколько процентов могут упасть продажи от плана, прежде чем бизнес уйдёт в убыток. Если план 800 единиц, а точка — 500, запас прочности 37,5 %.",
    ],
    en: [
      "The break-even point is the sales volume at which revenue covers all costs and profit is zero. Each unit sold brings a contribution (price minus variable cost) that goes towards the fixed costs.",
      "The margin of safety shows how far sales can fall below plan before you make a loss: with a plan of 800 units and a break-even of 500, it is 37.5%.",
    ],
  },
  faq: {
    ru: [
      { q: "Как рассчитать точку безубыточности?", a: "Разделите постоянные расходы на маржинальный доход с единицы (цена − переменные расходы): 1 500 000 / (5 000 − 2 000) = 500 единиц." },
      { q: "Что такое маржинальный доход?", a: "Часть цены, которая остаётся после переменных расходов и покрывает постоянные. При цене 5 000 ₸ и себестоимости 2 000 ₸ это 3 000 ₸, или 60 % цены." },
      { q: "Что делать, если цена ниже переменных расходов?", a: "Тогда точки безубыточности нет: каждая продажа увеличивает убыток. Нужно поднимать цену или снижать себестоимость." },
    ],
    en: [
      { q: "How do I calculate the break-even point?", a: "Divide fixed costs by the contribution per unit (price − variable cost): 15,000 / (50 − 20) = 500 units." },
      { q: "What is the contribution margin?", a: "The part of the price left after variable costs, which pays for fixed costs. With a $50 price and $20 variable cost it is $30, or 60% of the price." },
      { q: "What if the price is below the variable cost?", a: "Then there is no break-even point: every sale increases the loss. Raise the price or cut the unit cost." },
    ],
  },
  related: ["markup-margin-calculator", "roi-calculator", "percentage-calculator", "vat-calculator"],
};
