import type { ToolDef } from "@/registry/types";

export const budgetTool: ToolDef = {
  slug: "budget-calculator",
  component: "finance/budget",
  icon: "ChartPie",
  name: { ru: "Калькулятор бюджета 50/30/20", en: "Budget calculator 50/30/20" },
  title: { ru: "Калькулятор бюджета 50/30/20 — планировщик расходов", en: "50/30/20 budget calculator — monthly budget planner" },
  h1: { ru: "Калькулятор бюджета по правилу 50/30/20", en: "50/30/20 budget calculator" },
  description: {
    ru: "Распределите доход по правилу 50/30/20: необходимое, желания и накопления. Свои категории расходов, сравнение с планом и диаграмма. Данные хранятся в браузере.",
    en: "Split your income with the 50/30/20 rule: needs, wants and savings. Your own spending categories, plan vs actual and a chart. Data stays in your browser.",
  },
  lead: {
    ru: "При доходе 450 000 ₸ правило 50/30/20 даёт 225 000 ₸ на необходимое, 135 000 ₸ на желания и 90 000 ₸ на накопления.",
    en: "On a $4,500 income the 50/30/20 rule gives $2,250 for needs, $1,350 for wants and $900 for savings.",
  },
  keywords: {
    ru: ["бюджет 50/30/20", "планировщик бюджета", "семейный бюджет", "распределение дохода", "учёт расходов"],
    en: ["50/30/20 rule", "budget calculator", "budget planner", "monthly budget", "spending plan"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите доход за месяц после налогов.",
      "Отредактируйте категории расходов и суммы, для каждой выберите группу: необходимое, желания или накопления.",
      "Сравните фактическое распределение с планом 50/30/20 на полосах и диаграмме.",
      "Данные сохраняются в этом браузере — можно вернуться к бюджету позже.",
    ],
    en: [
      "Enter your monthly income after tax.",
      "Edit the spending categories and amounts, assigning each to needs, wants or savings.",
      "Compare your actual split with the 50/30/20 plan on the bars and the chart.",
      "Your data is saved in this browser, so you can come back to it later.",
    ],
  },
  about: {
    ru: [
      "Правило 50/30/20 — простой способ навести порядок в бюджете: 50 % дохода на обязательные расходы (жильё, продукты, транспорт, платежи по кредитам), 30 % на желания (кафе, путешествия, покупки) и 20 % на накопления и досрочное погашение долгов.",
      "Калькулятор показывает, сколько приходится на каждую группу по плану и сколько вы тратите на самом деле, и сколько дохода осталось нераспределённым. Бюджет хранится только в вашем браузере и никуда не передаётся.",
    ],
    en: [
      "The 50/30/20 rule is a simple way to organise a budget: 50% of income for needs (housing, groceries, transport, loan payments), 30% for wants (eating out, travel, shopping) and 20% for savings and extra debt repayment.",
      "The calculator shows the planned amount for each group, what you actually spend and how much income is left unallocated. Your budget stays in your browser and is never sent anywhere.",
    ],
  },
  faq: {
    ru: [
      { q: "Что такое правило 50/30/20?", a: "Способ распределять доход после налогов: 50 % — на необходимое, 30 % — на желания, 20 % — на накопления. При доходе 300 000 ₸ это 150 000, 90 000 и 60 000 ₸." },
      { q: "Что делать, если на необходимое уходит больше 50 %?", a: "Это частая ситуация при аренде жилья или ипотеке. Сократите долю желаний, но старайтесь сохранить хотя бы 10–20 % на накопления." },
      { q: "Где хранятся мои данные?", a: "Только в этом браузере (localStorage). Они не отправляются на сервер; кнопка «Очистить всё» удаляет их." },
    ],
    en: [
      { q: "What is the 50/30/20 rule?", a: "A way to split after-tax income: 50% for needs, 30% for wants, 20% for savings. On $3,000 that is $1,500, $900 and $600." },
      { q: "What if needs take more than 50%?", a: "Common with high rent or a mortgage. Cut back on wants, but try to keep at least 10–20% for savings." },
      { q: "Where is my data stored?", a: "Only in this browser (localStorage). Nothing is sent to a server; 'Clear all' deletes it." },
    ],
  },
  related: ["savings-goal-calculator", "kazakhstan-salary-calculator", "loan-calculator", "percentage-calculator"],
};
