import type { ToolDef } from "@/registry/types";
import { fmtMoney } from "../../shared/fmt";
import { monthlyNeeded } from "../lib/growth";

const RU = monthlyNeeded(5_000_000, 500_000, 12, 36);
const EN = monthlyNeeded(50_000, 5_000, 4, 36);
const kzt = (v: number) => fmtMoney("ru", v, "KZT", 0);
const usd = (v: number) => fmtMoney("en", v, "USD", 0);

export const savingsGoalTool: ToolDef = {
  slug: "savings-goal-calculator",
  component: "finance/savings-goal",
  icon: "Target",
  name: { ru: "Калькулятор накоплений", en: "Savings goal calculator" },
  title: { ru: "Калькулятор накоплений — сколько откладывать в месяц", en: "Savings goal calculator — how much to save a month" },
  h1: { ru: "Калькулятор накоплений на цель", en: "Savings goal calculator" },
  description: {
    ru: "Сколько откладывать каждый месяц, чтобы накопить нужную сумму к сроку, или за сколько месяцев вы соберёте её при заданном взносе — с учётом процентов.",
    en: "Find how much to save each month to reach a goal by a date, or how long it takes at a given monthly amount — with interest on your savings included.",
  },
  lead: {
    ru: `Чтобы накопить 5 000 000 ₸ за 3 года, имея 500 000 ₸, при 12 % годовых откладывайте ${kzt(RU)} в месяц.`,
    en: `To reach $50,000 in 3 years from $5,000 at 4% a year, save ${usd(EN)} a month.`,
  },
  keywords: {
    ru: ["калькулятор накоплений", "накопить на цель", "сколько откладывать", "финансовая цель", "накопить на квартиру"],
    en: ["savings goal calculator", "how much to save", "savings plan", "save for a house", "monthly savings"],
  },
  props: {},
  howTo: {
    ru: [
      "Выберите, что посчитать: ежемесячный взнос к сроку или срок при заданном взносе.",
      "Введите сумму цели и срок (или сумму, которую готовы откладывать).",
      "Укажите, сколько уже накоплено, и доходность вклада или инвестиций — 0 %, если деньги просто лежат.",
      "Результат и график накоплений обновляются сразу.",
    ],
    en: [
      "Choose what to calculate: the monthly amount for a deadline or the time needed for a monthly amount.",
      "Enter the goal and the time frame (or the amount you can save each month).",
      "Enter what you have already saved and the expected return — 0% if the money just sits in cash.",
      "The result and the savings chart update instantly.",
    ],
  },
  about: {
    ru: [
      "Калькулятор решает две задачи накоплений: сколько откладывать, чтобы успеть к сроку, и сколько времени займёт цель при посильном взносе. Уже накопленная сумма и каждый взнос растут с указанной доходностью.",
      "Проценты заметно помогают на длинном сроке: при 12 % годовых на цель 5 000 000 ₸ за 3 года они дают около 17 % суммы, за 10 лет — около половины. На коротком сроке главное — регулярность взносов.",
      "Если копите на покупку (квартиру, машину), помните, что её цена тоже растёт. Заложите инфляцию в сумму цели — калькулятор инфляции подскажет, сколько она будет стоить через несколько лет.",
    ],
    en: [
      "The calculator answers two savings questions: how much to put aside to make a deadline, and how long a goal takes at an affordable amount. Existing savings and every deposit grow at the return you enter.",
      "Interest matters more the longer you save: over 3 years it covers a modest share of the goal, over 10 years a much larger one. Over short periods regular saving is what counts.",
      "If you are saving for a purchase, its price will rise too — use the inflation calculator to adjust the goal.",
    ],
  },
  faq: {
    ru: [
      { q: "Как рассчитать, сколько откладывать в месяц?", a: `Без процентов: (цель − уже есть) / число месяцев. С процентами взнос меньше: для 5 000 000 ₸ за 36 месяцев при 500 000 ₸ на старте и 12 % годовых — ${kzt(RU)} вместо 125 000 ₸.` },
      { q: "Какую доходность указать?", a: "Ставку вашего вклада или ожидаемую доходность инвестиций после налогов. Если деньги хранятся без процентов, укажите 0." },
      { q: "Учитывается ли инфляция?", a: "Нет. Если цель — покупка, увеличьте сумму цели на ожидаемый рост цен, например с помощью калькулятора инфляции." },
    ],
    en: [
      { q: "How do I work out how much to save a month?", a: `Without interest: (goal − saved) / months. With interest you need less: for $50,000 in 36 months starting from $5,000 at 4% it is ${usd(EN)} instead of $1,250.` },
      { q: "What return should I enter?", a: "Your savings account rate or the expected investment return after taxes. Enter 0 if the money earns nothing." },
      { q: "Is inflation included?", a: "No. If the goal is a purchase, raise the goal by the expected price increase, for example with the inflation calculator." },
    ],
  },
  related: ["deposit-calculator", "compound-interest-calculator", "budget-calculator", "inflation-calculator", "investment-calculator"],
};
