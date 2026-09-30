import type { ToolDef } from "@/registry/types";
import { fmtMoney } from "../../calc/kit/fmt";
import { retirement } from "../engines/growth";

const RU = retirement({ age: 30, retireAge: 60, endAge: 85, savings: 1_000_000, monthly: 50_000, increase: 5, returnPre: 10, returnPost: 6, inflation: 7, income: 300_000 });
const EN = retirement({ age: 30, retireAge: 65, endAge: 90, savings: 10_000, monthly: 500, increase: 2, returnPre: 7, returnPost: 4, inflation: 3, income: 3_000 });
const kzt = (v: number) => fmtMoney("ru", v, "KZT", 0);
const usd = (v: number) => fmtMoney("en", v, "USD", 0);

export const retirementTool: ToolDef = {
  slug: "retirement-calculator",
  component: "finance/retirement",
  icon: "Armchair",
  name: { ru: "Пенсионный калькулятор", en: "Retirement calculator" },
  title: { ru: "Пенсионный калькулятор накоплений — сколько нужно на пенсию", en: "Retirement calculator — how much you need to retire" },
  h1: { ru: "Пенсионный калькулятор накоплений", en: "Retirement calculator" },
  description: {
    ru: "Сколько вы накопите к пенсии и надолго ли хватит денег: взносы, доходность до и после пенсии, инфляция, желаемый доход и правило 4 %. График по возрасту.",
    en: "How much you will have at retirement and how long it lasts: contributions, returns before and after retiring, inflation, desired income and the 4% rule.",
  },
  lead: {
    ru: `50 000 ₸ в месяц с 30 до 60 лет при доходности 10 % дают к пенсии около ${kzt(RU.nestEgg)} — это ${kzt(RU.nestEggReal)} в сегодняшних деньгах.`,
    en: `Saving $500 a month from 30 to 65 at 7% builds about ${usd(EN.nestEgg)} — ${usd(EN.nestEggReal)} in today's money.`,
  },
  keywords: {
    ru: ["пенсионный калькулятор", "накопления на пенсию", "правило 4 процентов", "сколько нужно на пенсию", "финансовая независимость"],
    en: ["retirement calculator", "retirement savings", "4% rule", "how much to retire", "FIRE calculator"],
  },
  props: {},
  howTo: {
    ru: [
      "Укажите свой возраст и возраст, в котором хотите выйти на пенсию.",
      "Введите текущие накопления, ежемесячный взнос и желаемый доход на пенсии в сегодняшних деньгах.",
      "Проверьте допущения: доходность до и после пенсии и инфляцию — они видны и редактируются.",
      "Смотрите накопления к пенсии, до какого возраста хватит денег и сколько нужно накопить; ниже — график капитала по возрасту.",
    ],
    en: [
      "Enter your age and the age you want to retire at.",
      "Enter your current savings, the monthly contribution and the desired retirement income in today's money.",
      "Check the assumptions — returns before and after retirement and inflation are visible and editable.",
      "See your savings at retirement, how long they last and how much you need; the chart shows the balance by age.",
    ],
  },
  about: {
    ru: [
      "Расчёт идёт в два этапа. До пенсии капитал растёт за счёт взносов и доходности, после — из него ежемесячно снимается желаемый доход, проиндексированный на инфляцию, а остаток продолжает приносить доход по более консервативной ставке.",
      "Все допущения на виду: доходность до пенсии, на пенсии и инфляция заданы явно и влияют на результат сильнее всего. Разница в 2 процентных пункта доходности за 30 лет меняет итог почти вдвое.",
      "Правило 4 % — простой ориентир: в первый год пенсии снимайте 4 % капитала и дальше индексируйте сумму на инфляцию. Государственная пенсия и обязательные пенсионные взносы не учитываются.",
    ],
    en: [
      "The calculation has two phases. Before retirement the balance grows with contributions and returns; after it, the desired income — indexed to inflation — is withdrawn every month while the rest keeps earning a more conservative return.",
      "Every assumption is visible: returns before and after retirement and inflation drive the result more than anything else. A 2-point difference in returns over 30 years changes the outcome almost twofold.",
      "The 4% rule is a simple guide: withdraw 4% of the portfolio in the first year of retirement and adjust for inflation after that. State pensions are not included.",
    ],
  },
  faq: {
    ru: [
      { q: "Сколько нужно накопить на пенсию?", a: "Зависит от желаемого дохода и срока. По правилу 4 % нужен капитал примерно в 25 годовых расходов: для 300 000 ₸ в месяц (3,6 млн ₸ в год) — около 90 млн ₸ в сегодняшних деньгах." },
      { q: "Что такое правило 4 %?", a: "Правило из исследований 1990-х: если в первый год пенсии снять 4 % портфеля, а дальше индексировать сумму на инфляцию, сбалансированный портфель исторически выдерживал около 30 лет. Это ориентир, а не гарантия." },
      { q: "Какую доходность указывать?", a: "Реалистичную среднегодовую доходность после налогов и комиссий. На пенсии обычно выбирают более консервативный портфель, поэтому ставка после пенсии ниже." },
      { q: "Почему доход указывается в сегодняшних деньгах?", a: "Так проще понять уровень жизни. Калькулятор сам пересчитывает сумму с учётом инфляции к моменту выхода на пенсию и индексирует её каждый год." },
    ],
    en: [
      { q: "How much do I need to retire?", a: "It depends on your income target and horizon. By the 4% rule you need about 25 times your annual spending: $3,000 a month ($36,000 a year) needs roughly $900,000 in today's money." },
      { q: "What is the 4% rule?", a: "A guideline from 1990s research: withdraw 4% of the portfolio in the first year, then adjust for inflation; a balanced portfolio historically lasted about 30 years. It is a guide, not a guarantee." },
      { q: "What returns should I assume?", a: "Realistic average annual returns after taxes and fees. Retirement portfolios are usually more conservative, so the post-retirement return is lower." },
      { q: "Why is the income in today's money?", a: "It makes the lifestyle easier to picture. The calculator indexes it to inflation until retirement and every year after that." },
    ],
  },
  related: ["investment-calculator", "savings-goal-calculator", "compound-interest-calculator", "inflation-calculator", "deposit-calculator"],
};
