import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { fmtMoney, fmtPct } from "../../calc/kit/fmt";
import { futureCost, presentValue } from "../engines/growth";

const kzt = (v: number) => fmtMoney("ru", v, "KZT", 0);
const usd = (v: number) => fmtMoney("en", v, "USD", 0);

function table(locale: Locale): Block {
  const ru = locale === "ru";
  const years = [1, 3, 5, 10, 20];
  const rates = ru ? [3, 5, 7, 8, 10, 12, 15] : [2, 3, 4, 5, 7, 10];
  const base = ru ? 100_000 : 1_000;
  return {
    type: "table",
    title: ru ? "Сколько будут стоить сегодняшние 100 000 ₸" : "What $1,000 today will cost",
    head: [ru ? "Инфляция" : "Inflation", ...years.map((y) => (ru ? `${y} ${y === 1 ? "год" : y < 5 ? "года" : "лет"}` : `${y} yr`))],
    rows: rates.map((r) => [fmtPct(locale, r), ...years.map((y) => fmtMoney(locale, futureCost(base, r, y), ru ? "KZT" : "USD", 0))]),
  };
}

export const inflationTool: ToolDef = {
  slug: "inflation-calculator",
  component: "finance/inflation",
  icon: "TrendingDown",
  name: { ru: "Калькулятор инфляции", en: "Inflation calculator" },
  title: { ru: "Калькулятор инфляции — сколько будут стоить деньги", en: "Inflation calculator — future cost and purchasing power" },
  h1: { ru: "Калькулятор инфляции", en: "Inflation calculator" },
  description: {
    ru: "Сколько будет стоить покупка через N лет, сколько стоят будущие деньги сегодня и какой была средняя инфляция по двум ценам. Ставку инфляции задаёте вы сами.",
    en: "Find what something will cost in N years, what future money is worth today and the average inflation between two prices. You enter the inflation rate yourself.",
  },
  lead: {
    ru: `При инфляции 8 % в год то, что сегодня стоит 100 000 ₸, через 10 лет будет стоить ${kzt(futureCost(100_000, 8, 10))}.`,
    en: `At 3% inflation, what costs $1,000 today will cost ${usd(futureCost(1_000, 3, 10))} in 10 years.`,
  },
  keywords: {
    ru: ["калькулятор инфляции", "покупательная способность", "рост цен", "обесценивание денег", "средняя инфляция"],
    en: ["inflation calculator", "purchasing power", "future value of money", "price increase", "average inflation rate"],
  },
  props: {},
  howTo: {
    ru: [
      "Выберите режим: цена в будущем, средняя инфляция по двум ценам или расчёт по годам.",
      "Введите сумму и свою оценку инфляции — калькулятор не подставляет официальную статистику.",
      "Укажите число лет или список годовых ставок через точку с запятой.",
      "Результат, покупательная способность и график роста цены обновляются сразу.",
    ],
    en: [
      "Choose a mode: future price, average inflation from two prices, or year by year.",
      "Enter the amount and your inflation estimate — no official statistics are filled in.",
      "Enter the number of years or a list of yearly rates separated by semicolons.",
      "The result, purchasing power and the price chart update instantly.",
    ],
  },
  about: {
    ru: [
      `Инфляция накапливается по формуле сложных процентов: при 8 % в год цены удваиваются примерно за 9 лет, а 100 000 ₸, полученные через 10 лет, по покупательной способности равны сегодняшним ${kzt(presentValue(100_000, 8, 10))}.`,
      "Режим «По годам» позволяет ввести разную инфляцию для каждого года — например, данные из официальной статистики, которые вы берёте сами, или собственный сценарий. Калькулятор перемножит их и покажет накопленный рост цен.",
      "Режим «Средняя инфляция» отвечает на вопрос, на сколько процентов в год дорожал товар: если хлеб подорожал с 250 до 400 ₸ за 5 лет, средний рост — около 9,86 % в год.",
    ],
    en: [
      `Inflation compounds like interest: at 3% a year prices double in about 24 years, and $1,000 received in 10 years is worth ${usd(presentValue(1_000, 3, 10))} in today's money.`,
      "The year-by-year mode lets you enter a different rate for each year — official figures you look up yourself or your own scenario. The calculator multiplies them into cumulative price growth.",
      "The average inflation mode shows how fast an item got more expensive per year: from $2.50 to $3.60 over 5 years is about 7.57% a year.",
    ],
  },
  faq: {
    ru: [
      { q: "Как посчитать, сколько будут стоить деньги через несколько лет?", a: "Умножьте сумму на (1 + инфляция)^лет. При 10 % в год 100 000 ₸ через 3 года превратятся в 133 100 ₸ по ценам будущего." },
      { q: "Почему 10 % инфляции за два года — это 21 %, а не 20 %?", a: "Во второй год цены растут уже от подорожавшего уровня: 1,1 × 1,1 = 1,21. Поэтому инфляцию складывают умножением, а не сложением." },
      { q: "Где взять ставку инфляции?", a: "Для прошлых периодов — в официальной статистике (в Казахстане её публикует Бюро национальной статистики, в России — Росстат). Для прогноза используйте цель центрального банка или свою оценку." },
    ],
    en: [
      { q: "How do I calculate what money will be worth in the future?", a: "Multiply the amount by (1 + inflation)^years. At 10% a year, 100 becomes 133.10 in future prices after 3 years." },
      { q: "Why is 10% inflation over two years 21% and not 20%?", a: "In the second year prices rise from an already higher level: 1.1 × 1.1 = 1.21. Inflation compounds by multiplication, not addition." },
      { q: "Where do I get the inflation rate?", a: "For past periods, from your national statistics office. For forecasts, use the central bank's target or your own estimate." },
    ],
  },
  related: ["compound-interest-calculator", "investment-calculator", "savings-goal-calculator", "deposit-calculator", "percentage-calculator"],
  blocks: (locale) => [table(locale)],
};
