import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { fmtMoney, fmtPct, fmtRound } from "../../calc/kit/fmt";
import { compound } from "../engines/growth";

const RU = compound({ principal: 1_000_000, rate: 12, years: 10, comp: "monthly" });
const RU_Y = compound({ principal: 1_000_000, rate: 12, years: 10, comp: "yearly" });
const EN = compound({ principal: 10_000, rate: 7, years: 10, comp: "monthly" });
const kzt = (v: number) => fmtMoney("ru", v, "KZT", 0);
const usd = (v: number) => fmtMoney("en", v, "USD", 0);

function table(locale: Locale): Block {
  const ru = locale === "ru";
  const years = [5, 10, 15, 20, 30];
  const rates = [3, 5, 7, 10, 12, 15, 20];
  return {
    type: "table",
    title: ru ? "Во сколько раз вырастет сумма (ежемесячная капитализация)" : "Growth multiple with monthly compounding",
    head: [ru ? "Ставка" : "Rate", ...years.map((y) => (ru ? `${y} лет` : `${y} years`))],
    rows: rates.map((r) => [fmtPct(locale, r), ...years.map((y) => `× ${fmtRound(locale, compound({ principal: 1, rate: r, years: y, comp: "monthly" }).final, 2)}`)]),
  };
}

export const compoundInterestTool: ToolDef = {
  slug: "compound-interest-calculator",
  component: "finance/compound-interest",
  icon: "TrendingUp",
  name: { ru: "Калькулятор сложных процентов", en: "Compound interest calculator" },
  title: { ru: "Калькулятор сложных процентов онлайн с пополнением", en: "Compound interest calculator with contributions" },
  h1: { ru: "Калькулятор сложных процентов", en: "Compound interest calculator" },
  description: {
    ru: "Сложные проценты с капитализацией раз в год, квартал, месяц, день или непрерывно, с регулярными пополнениями. Итоговая сумма, доход и рост по годам.",
    en: "Compound interest with yearly, quarterly, monthly, daily or continuous compounding and regular contributions. Future value, interest earned and a yearly breakdown.",
  },
  lead: {
    ru: `1 000 000 ₸ под 12 % с ежемесячной капитализацией за 10 лет вырастут до ${kzt(RU.final)}.`,
    en: `$10,000 at 7% compounded monthly grows to ${usd(EN.final)} in 10 years.`,
  },
  keywords: {
    ru: ["сложные проценты", "капитализация", "формула сложных процентов", "рост капитала", "проценты на проценты"],
    en: ["compound interest", "future value", "compounding", "interest on interest", "compound interest formula"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите начальную сумму, годовую ставку и срок в годах.",
      "Выберите, как часто начисляются проценты: от раза в год до непрерывного начисления.",
      "При необходимости добавьте регулярные пополнения — каждый месяц или раз в год, в начале или в конце периода.",
      "Итоговая сумма и доход пересчитываются сразу; ниже — диаграмма и таблица по годам.",
    ],
    en: [
      "Enter the initial amount, the annual rate and the term in years.",
      "Choose how often interest is compounded, from yearly to continuously.",
      "Optionally add regular contributions — monthly or yearly, at the start or end of each period.",
      "The future value and interest update instantly; the chart and table below show each year.",
    ],
  },
  about: {
    ru: [
      `Сложные проценты — это начисление процентов не только на вложенную сумму, но и на уже полученный доход. На длинном сроке эффект огромен: 1 000 000 ₸ под 12 % за 10 лет при ежегодной капитализации превращаются в ${kzt(RU_Y.final)}, а при ежемесячной — в ${kzt(RU.final)}.`,
      "Правило 72 помогает прикинуть срок удвоения: разделите 72 на ставку. При 12 % годовых сумма удваивается примерно за 6 лет, при 7 % — примерно за 10 лет.",
      "Калькулятор не учитывает налоги, комиссии и инфляцию — для реальной покупательной способности используйте калькулятор инфляции или инвестиций.",
    ],
    en: [
      "Compound interest is interest earned on both the original amount and the interest already earned. Over long periods the effect is large, and more frequent compounding adds a little extra each year.",
      "The rule of 72 estimates the doubling time: divide 72 by the rate. At 7% a year money doubles in about 10 years, at 12% in about 6 years.",
      "Taxes, fees and inflation are not included — use the inflation or investment calculator for real purchasing power.",
    ],
  },
  faq: {
    ru: [
      { q: "Какая формула сложных процентов?", a: `A = P × (1 + r/n)^(n×t), где P — начальная сумма, r — годовая ставка в долях, n — число начислений в год, t — срок в годах. Для 1 000 000 ₸ под 12 % на 10 лет с n = 12: A ≈ ${kzt(RU.final)}.` },
      { q: "Чем сложные проценты отличаются от простых?", a: "Простые проценты начисляются только на исходную сумму: 1 000 000 ₸ под 12 % за 10 лет дадут 1 200 000 ₸ дохода. Сложные — ещё и на накопленный доход, поэтому итог больше." },
      { q: "Что такое непрерывное начисление?", a: "Предельный случай, когда проценты начисляются бесконечно часто: A = P × e^(r×t). На практике разница с ежедневным начислением — доли процента." },
      { q: "Как учитываются пополнения?", a: "Каждое пополнение начинает приносить проценты с момента внесения. Взносы в начале периода дают чуть больше, чем в конце." },
    ],
    en: [
      { q: "What is the compound interest formula?", a: "A = P × (1 + r/n)^(n×t), where P is the initial amount, r the annual rate as a decimal, n the compounding periods per year and t the years." },
      { q: "How is compound interest different from simple interest?", a: "Simple interest is paid only on the original amount; compound interest is also paid on the interest already earned, so the total grows faster." },
      { q: "What is continuous compounding?", a: "The limit of compounding infinitely often: A = P × e^(r×t). In practice it differs from daily compounding by a tiny fraction." },
      { q: "How are contributions handled?", a: "Each contribution starts earning interest when it is made. Contributions at the start of a period earn slightly more than those at the end." },
    ],
  },
  related: ["deposit-calculator", "investment-calculator", "savings-goal-calculator", "retirement-calculator", "inflation-calculator"],
  blocks: (locale) => [table(locale)],
};
