import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { fmtMoney, fmtPct } from "../../shared/fmt";
import { annuityPayment, loanSchedule } from "../lib/loan";

const kzt = (v: number, d = 0) => fmtMoney("ru", v, "KZT", d);
const usd = (v: number, d = 0) => fmtMoney("en", v, "USD", d);

const RU = loanSchedule({ principal: 24_000_000, annualRate: 16, months: 240, type: "annuity" });
const RU_D = loanSchedule({ principal: 24_000_000, annualRate: 16, months: 240, type: "diff" });
const EN = loanSchedule({ principal: 320_000, annualRate: 6.5, months: 360, type: "annuity" });

function table(locale: Locale): Block {
  const ru = locale === "ru";
  const amount = ru ? 20_000_000 : 300_000;
  const years = [10, 15, 20, 25, 30];
  const rates = ru ? [5, 7, 10, 12, 14, 16, 18, 20] : [3, 4, 5, 5.5, 6, 6.5, 7, 8];
  return {
    type: "table",
    title: ru ? "Платёж по ипотеке 20 000 000 ₸ при разных ставках и сроках" : "Monthly payment on a $300,000 mortgage by rate and term",
    head: [ru ? "Ставка" : "Rate", ...years.map((y) => (ru ? `${y} лет` : `${y} years`))],
    rows: rates.map((r) => [fmtPct(locale, r), ...years.map((y) => fmtMoney(locale, annuityPayment(amount, r, y * 12), ru ? "KZT" : "USD", 0))]),
  };
}

export const mortgageTool: ToolDef = {
  slug: "mortgage-calculator",
  component: "finance/mortgage",
  icon: "House",
  popular: true,
  name: { ru: "Ипотечный калькулятор", en: "Mortgage calculator" },
  title: { ru: "Ипотечный калькулятор онлайн с первоначальным взносом", en: "Mortgage calculator with down payment and schedule" },
  h1: { ru: "Ипотечный калькулятор", en: "Mortgage calculator" },
  description: {
    ru: "Расчёт ипотеки: взнос в процентах или суммой, аннуитетный и дифференцированный платёж, страховка и налог, график платежей по месяцам и экспорт в CSV.",
    en: "Mortgage payment calculator: down payment as a percent or amount, annuity or differentiated payments, insurance and property tax, monthly schedule and CSV export.",
  },
  lead: {
    ru: `Квартира за 30 000 000 ₸ со взносом 20 % под 16 % на 20 лет — платёж ${kzt(RU.firstPayment, 2)} в месяц.`,
    en: `A $400,000 home with 20% down at 6.5% for 30 years costs ${usd(EN.firstPayment, 2)} a month in principal and interest.`,
  },
  keywords: {
    ru: ["ипотечный калькулятор", "расчёт ипотеки", "первоначальный взнос", "платёж по ипотеке", "ипотека Казахстан", "7-20-25"],
    en: ["mortgage calculator", "mortgage payment", "down payment", "home loan", "amortization"],
  },
  props: {},
  howTo: {
    ru: [
      "Укажите стоимость жилья и первоначальный взнос — в процентах или суммой, переключатель пересчитает значение.",
      "Введите ставку и срок в годах или месяцах, выберите аннуитетный или дифференцированный платёж.",
      "При желании добавьте страхование (% от остатка в год) и налог на имущество — они появятся отдельными строками.",
      "Посмотрите график, переплату и полную стоимость покупки; скачайте график в CSV.",
    ],
    en: [
      "Enter the property price and the down payment — as a percent or an amount; the toggle converts the value.",
      "Enter the rate and the term in years or months, then choose annuity or differentiated payments.",
      "Optionally add insurance (% of the balance per year) and property tax — they appear as separate lines.",
      "Review the schedule, the total interest and the full cost of the purchase; download the schedule as CSV.",
    ],
  },
  about: {
    ru: [
      `Сумма ипотеки — это стоимость жилья минус первоначальный взнос. Даже небольшая разница в ставке заметно меняет переплату на длинном сроке: у кредита 24 000 000 ₸ на 20 лет под 16 % проценты составят ${kzt(RU.totalInterest)} — больше самой суммы кредита.`,
      `Дифференцированная схема снижает переплату (в том же примере — ${kzt(RU_D.totalInterest)}), но первый платёж выше: ${kzt(RU_D.firstPayment, 2)} против ${kzt(RU.firstPayment, 2)}. Банк оценивает, потянете ли вы именно первый платёж.`,
      "Кнопки с примерами заполняют ставку, взнос и срок типичными параметрами программ. Условия программ меняются, поэтому примеры можно править — перед решением уточните актуальные ставки в банке.",
    ],
    en: [
      `The mortgage amount is the property price minus the down payment. Small rate differences matter a lot over long terms: on a $320,000 loan at 6.5% for 30 years you pay ${usd(EN.totalInterest)} in interest — more than the amount borrowed.`,
      "Differentiated payments cut the total interest, but the first payment is much higher, and lenders check whether you can afford that first payment.",
      "The example buttons fill in typical programme parameters. Programme terms change, so the examples are editable — check current rates with your lender before deciding.",
    ],
  },
  faq: {
    ru: [
      { q: "Как рассчитать платёж по ипотеке?", a: `Вычтите взнос из стоимости жилья — это сумма кредита — и примените формулу аннуитета P = S × i / (1 − (1 + i)^−n). Для 24 000 000 ₸ под 16 % на 240 месяцев платёж ${kzt(RU.firstPayment, 2)}.` },
      { q: "Какой первоначальный взнос нужен?", a: "Минимальный взнос зависит от банка и программы: обычно от 10–20 % стоимости жилья. Чем больше взнос, тем меньше сумма кредита, платёж и переплата." },
      { q: "Что входит в полную стоимость покупки?", a: "Первоначальный взнос, все платежи по кредиту (долг и проценты), а также страховка и налог, если вы их указали. Комиссии банка и оценка жилья в расчёт не входят." },
      { q: "Как учитывается страховка?", a: "Страховой тариф в процентах годовых применяется к остатку долга на начало каждого месяца, поэтому со временем страховка дешевеет. Точный порядок расчёта задаёт страховая компания." },
    ],
    en: [
      { q: "How do I calculate a mortgage payment?", a: `Subtract the down payment from the price to get the loan amount, then apply the annuity formula P = S × i / (1 − (1 + i)^−n). For $320,000 at 6.5% over 360 months the payment is ${usd(EN.firstPayment, 2)}.` },
      { q: "How big should the down payment be?", a: "It depends on the lender and the programme, typically from 10–20% of the price. A bigger down payment lowers the loan amount, the payment and the total interest." },
      { q: "What is included in the total cost?", a: "The down payment, all loan payments (principal and interest) and the insurance and property tax you entered. Lender fees and appraisal costs are not included." },
      { q: "How is insurance calculated?", a: "The annual insurance rate is applied to the balance at the start of each month, so insurance gets cheaper over time. Your insurer sets the exact method." },
    ],
  },
  related: ["loan-calculator", "deposit-calculator", "savings-goal-calculator", "inflation-calculator", "percentage-calculator"],
  blocks: (locale) => [table(locale)],
};
