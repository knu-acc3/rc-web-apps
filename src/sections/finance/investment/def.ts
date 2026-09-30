import type { ToolDef } from "@/registry/types";
import { fmtMoney } from "../../calc/kit/fmt";
import { invest } from "../engines/growth";

const RU = invest({ initial: 500_000, monthly: 50_000, rate: 12, years: 15, inflation: 8 });
const EN = invest({ initial: 5_000, monthly: 500, rate: 7, years: 15, inflation: 3 });
const kzt = (v: number) => fmtMoney("ru", v, "KZT", 0);
const usd = (v: number) => fmtMoney("en", v, "USD", 0);

export const investmentTool: ToolDef = {
  slug: "investment-calculator",
  component: "finance/investment",
  icon: "ChartLine",
  name: { ru: "Инвестиционный калькулятор", en: "Investment calculator" },
  title: { ru: "Инвестиционный калькулятор онлайн с учётом инфляции", en: "Investment calculator with inflation and fees" },
  h1: { ru: "Инвестиционный калькулятор", en: "Investment calculator" },
  description: {
    ru: "Рассчитайте рост капитала при регулярных взносах: доходность (в том числе отрицательная), комиссии, инфляция и рост взносов. График и таблица по годам.",
    en: "See how regular investing grows: expected return (negative allowed), annual fees, inflation and growing contributions, with a chart and a year-by-year table.",
  },
  lead: {
    ru: `500 000 ₸ сразу и 50 000 ₸ в месяц при 12 % годовых за 15 лет превратятся в ${kzt(RU.final)} — это ${kzt(RU.real)} в сегодняшних деньгах при инфляции 8 %.`,
    en: `$5,000 plus $500 a month at 7% a year becomes ${usd(EN.final)} in 15 years — ${usd(EN.real)} in today's money at 3% inflation.`,
  },
  keywords: {
    ru: ["инвестиционный калькулятор", "доходность инвестиций", "рост капитала", "регулярные инвестиции", "реальная доходность"],
    en: ["investment calculator", "investment growth", "monthly investing", "real return", "portfolio calculator"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите начальную сумму и ежемесячный взнос.",
      "Укажите ожидаемую среднегодовую доходность и срок в годах — доходность может быть и отрицательной.",
      "В дополнительных параметрах задайте инфляцию, комиссии и ежегодный рост взноса.",
      "Сравните номинальный капитал, сумму в сегодняшних деньгах и вложенные средства на графике и в таблице.",
    ],
    en: [
      "Enter the initial investment and the monthly contribution.",
      "Set the expected average annual return and the term — the return may be negative.",
      "In the extra options, set inflation, fees and a yearly increase of the contribution.",
      "Compare the nominal balance, its value in today's money and the amount invested on the chart and in the table.",
    ],
  },
  about: {
    ru: [
      "Калькулятор показывает, как регулярные взносы и доходность складываются во времени. Важны три поправки: комиссии (даже 1 % в год заметно снижает итог за 15–20 лет), инфляция (номинальные тенге через 15 лет стоят меньше сегодняшних) и рост взносов вместе с доходами.",
      "Сумма «в сегодняшних деньгах» — это капитал, делённый на накопленную инфляцию. Именно она показывает, что вы сможете купить на эти деньги.",
      "Доходность в калькуляторе постоянная, а реальные рынки колеблются: годы роста сменяются просадками. Результат — ориентир, а не прогноз и не инвестиционная рекомендация.",
    ],
    en: [
      "The calculator shows how regular contributions and returns add up over time. Three adjustments matter: fees (even 1% a year noticeably reduces the result over 15–20 years), inflation, and contributions that grow with your income.",
      "The value in today's money is the balance divided by cumulative inflation — it shows what the money will actually buy.",
      "The return here is constant, while real markets fluctuate. Treat the result as a guide, not a forecast or investment advice.",
    ],
  },
  faq: {
    ru: [
      { q: "Какую доходность указывать?", a: "Среднегодовую ожидаемую доходность вашего портфеля после вычета налогов. Консервативная оценка лучше оптимистичной: результат при 8 % и 12 % на 15 лет отличается почти в полтора раза." },
      { q: "Можно ли указать отрицательную доходность?", a: "Да. Например, −10 % в год за 2 года превратят 10 000 в 8 100 — калькулятор покажет, как убытки влияют на итог." },
      { q: "Зачем учитывать инфляцию?", a: "Чтобы понять реальную стоимость капитала. При инфляции 8 % цены за 15 лет вырастают примерно в 3,2 раза, и номинальная сумма покупает втрое меньше." },
      { q: "Как учитываются комиссии?", a: "Годовая комиссия в процентах от стоимости портфеля списывается ежемесячно пропорционально. Она уменьшает эффективную доходность почти на свою величину." },
    ],
    en: [
      { q: "What return should I enter?", a: "The average annual return you expect from your portfolio after taxes. Be conservative: 15 years at 5% versus 8% differ by a large margin." },
      { q: "Can the return be negative?", a: "Yes. For example, −10% a year for 2 years turns 10,000 into 8,100 — the calculator shows how losses affect the result." },
      { q: "Why account for inflation?", a: "To see the real value of your money. At 3% inflation prices rise by about 56% over 15 years." },
      { q: "How are fees handled?", a: "The annual fee, as a percent of the portfolio, is deducted monthly. It reduces your effective return by almost its full size." },
    ],
  },
  related: ["compound-interest-calculator", "retirement-calculator", "inflation-calculator", "savings-goal-calculator", "deposit-calculator"],
};
