import type { ToolDef } from "@/registry/types";
import { fmtPct } from "../../shared/fmt";
import { cagr } from "../lib/money";

const C = cagr(1_000_000, 1_500_000, 5)!;

export const roiTool: ToolDef = {
  slug: "roi-calculator",
  component: "finance/roi",
  icon: "BadgePercent",
  name: { ru: "Калькулятор ROI", en: "ROI calculator" },
  title: { ru: "Калькулятор ROI — рентабельность инвестиций онлайн", en: "ROI calculator — return on investment online" },
  h1: { ru: "Калькулятор ROI (рентабельность инвестиций)", en: "ROI calculator (return on investment)" },
  description: {
    ru: "ROI — окупаемость вложений в процентах: (получено − вложено) / вложено. Вложили 1 000 000 ₸, получили 1 500 000 ₸ — ROI 50 %. Плюс среднегодовая доходность.",
    en: "ROI is the return on an investment in percent: (final − invested) / invested. Invest 10,000 and get 15,000 back — ROI is 50%. Annualised return included.",
  },
  lead: {
    ru: `Вложили 1 000 000 ₸, получили 1 500 000 ₸ — ROI 50 %; за 5 лет это ${fmtPct("ru", C, 2)} в год.`,
    en: `Invest $10,000, get $15,000 back — a 50% ROI; over 5 years that is ${fmtPct("en", C, 2)} a year.`,
  },
  keywords: {
    ru: ["ROI", "рентабельность инвестиций", "окупаемость", "доходность вложений", "возврат инвестиций"],
    en: ["roi calculator", "return on investment", "investment return", "annualized roi"],
  },
  props: { mode: "roi" },
  howTo: {
    ru: [
      "Введите, сколько вложили и сколько получили в итоге (стоимость или выручку от продажи).",
      "При желании укажите срок в годах — калькулятор покажет среднегодовую доходность.",
      "ROI и прибыль (или убыток) пересчитываются сразу.",
    ],
    en: [
      "Enter how much you invested and what you got back (final value or sale proceeds).",
      "Optionally enter the time in years to see the annualised return.",
      "ROI and the profit (or loss) update instantly.",
    ],
  },
  about: {
    ru: [
      "ROI (return on investment) — отношение прибыли к вложениям. Он удобен для сравнения проектов, но не учитывает время: 50 % за год и 50 % за пять лет — совсем разные результаты. Поэтому калькулятор показывает и среднегодовую доходность — CAGR.",
      "Для расчёта ROI маркетинговой кампании в «Получено» указывайте выручку, а в «Вложено» — все затраты. Если нужен рост за несколько лет, откройте режим CAGR.",
    ],
    en: [
      "ROI is profit relative to the amount invested. It is handy for comparing projects but ignores time: 50% in one year and 50% over five years are very different, so the calculator also shows the annualised return (CAGR).",
      "For a marketing campaign enter revenue as the final value and all costs as the investment. For multi-year growth switch to CAGR.",
    ],
  },
  faq: {
    ru: [
      { q: "Как рассчитать ROI?", a: "ROI = (получено − вложено) / вложено × 100 %. Вложили 200 000 ₸, получили 260 000 ₸: (260 000 − 200 000) / 200 000 = 30 %." },
      { q: "Каким бывает хороший ROI?", a: "Зависит от риска и срока. Сравнивайте ROI с доходностью безрисковых вложений (депозита) за тот же срок и учитывайте время — лучше в пересчёте на год." },
      { q: "Может ли ROI быть отрицательным?", a: "Да, если получено меньше вложенного: вложили 100 000, получили 80 000 — ROI −20 %." },
    ],
    en: [
      { q: "How do I calculate ROI?", a: "ROI = (final − invested) / invested × 100%. Invest 2,000, get 2,600: (2,600 − 2,000) / 2,000 = 30%." },
      { q: "What is a good ROI?", a: "It depends on risk and time. Compare it with a risk-free return (a savings deposit) over the same period, ideally on an annual basis." },
      { q: "Can ROI be negative?", a: "Yes, if you get back less than you invested: invest 100, get 80 — ROI is −20%." },
    ],
  },
  related: ["cagr-calculator", "investment-calculator", "break-even-calculator", "markup-margin-calculator", "compound-interest-calculator"],
};

export const cagrTool: ToolDef = {
  slug: "cagr-calculator",
  component: "finance/roi",
  icon: "ChartNoAxesCombined",
  name: { ru: "Калькулятор CAGR", en: "CAGR calculator" },
  title: { ru: "Калькулятор CAGR — среднегодовой темп роста", en: "CAGR calculator — compound annual growth rate" },
  h1: { ru: "Калькулятор CAGR (среднегодовой темп роста)", en: "CAGR calculator (compound annual growth rate)" },
  description: {
    ru: "CAGR — среднегодовой темп роста: (конечная / начальная)^(1/лет) − 1. Рост с 1 000 000 до 2 000 000 за 5 лет — это 14,87 % в год. Срок можно указать дробным.",
    en: "CAGR is the compound annual growth rate: (end / start)^(1/years) − 1. Growing from 1,000 to 2,000 in 5 years is 14.87% a year. Fractional years are fine.",
  },
  lead: {
    ru: `Рост с 1 000 000 до 1 500 000 ₸ за 5 лет — это CAGR ${fmtPct("ru", C, 2)} в год.`,
    en: `Growing from 10,000 to 15,000 in 5 years is a CAGR of ${fmtPct("en", C, 2)} a year.`,
  },
  keywords: {
    ru: ["CAGR", "среднегодовой темп роста", "среднегодовая доходность", "совокупный годовой темп роста"],
    en: ["cagr calculator", "compound annual growth rate", "annualized return", "average annual growth"],
  },
  props: { mode: "cagr" },
  howTo: {
    ru: ["Введите начальную и конечную стоимость — капитала, выручки, числа клиентов.", "Укажите срок в годах; можно дробный — 2,5 года.", "CAGR, общий рост и множитель пересчитываются сразу."],
    en: ["Enter the starting and ending values — portfolio, revenue, customers.", "Enter the time in years; fractions are fine — 2.5 years.", "CAGR, total growth and the multiple update instantly."],
  },
  about: {
    ru: [
      "CAGR (compound annual growth rate) — постоянный годовой темп, который за тот же срок дал бы такой же результат. Он сглаживает скачки: если выручка росла на 50 %, потом падала на 20 % и снова росла, CAGR покажет единый средний процент.",
      "Среднее арифметическое годовых изменений завышает рост; CAGR считает правильно, с учётом сложных процентов. Например, +100 % и −50 % в среднем дают +25 %, хотя итог — ноль, а CAGR равен 0 %.",
    ],
    en: [
      "CAGR is the constant yearly rate that would produce the same result over the same period. It smooths out swings: if revenue grew 50%, fell 20% and grew again, CAGR shows one average rate.",
      "The arithmetic mean of yearly changes overstates growth; CAGR compounds correctly. For example +100% and −50% average +25%, yet you end where you started — the CAGR is 0%.",
    ],
  },
  faq: {
    ru: [
      { q: "Как рассчитать CAGR?", a: "CAGR = (конечная / начальная)^(1 / лет) − 1. С 1 000 000 до 2 000 000 за 5 лет: 2^(0,2) − 1 = 14,87 % в год." },
      { q: "Чем CAGR отличается от ROI?", a: "ROI — общий результат за весь срок, CAGR — средний годовой темп с учётом сложных процентов. ROI 100 % за 5 лет соответствует CAGR 14,87 %." },
      { q: "Можно ли посчитать CAGR за неполные годы?", a: "Да, укажите срок дробным числом: 18 месяцев = 1,5 года." },
    ],
    en: [
      { q: "How do I calculate CAGR?", a: "CAGR = (end / start)^(1 / years) − 1. From 1,000 to 2,000 in 5 years: 2^0.2 − 1 = 14.87% a year." },
      { q: "How is CAGR different from ROI?", a: "ROI is the total result over the whole period; CAGR is the average yearly rate with compounding. A 100% ROI over 5 years is a 14.87% CAGR." },
      { q: "Can I use part years?", a: "Yes, enter a fractional number of years: 18 months = 1.5 years." },
    ],
  },
  related: ["roi-calculator", "compound-interest-calculator", "investment-calculator", "inflation-calculator"],
};
