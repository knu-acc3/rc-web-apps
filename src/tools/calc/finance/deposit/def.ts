import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { fmtMoney, fmtPct } from "../../shared/fmt";
import { effectiveRate } from "../lib/deposit";

const kzt = (v: number) => fmtMoney("ru", v, "KZT", 0);
/** Nominal-month approximation used only for the texts (the tool itself counts exact days). */
const approxIncome = (amount: number, rate: number, cap: "monthly" | "quarterly" | "end") => (amount * effectiveRate(rate, cap)) / 100;

function table(locale: Locale): Block {
  const ru = locale === "ru";
  const amount = ru ? 1_000_000 : 10_000;
  const rates = ru ? [8, 10, 12, 14, 16, 18] : [2, 3, 4, 5, 6, 8];
  const cur = ru ? "KZT" : "USD";
  return {
    type: "table",
    title: ru ? "Доход за год по вкладу 1 000 000 ₸" : "One-year interest on a $10,000 deposit",
    head: [ru ? "Ставка" : "Rate", ru ? "Без капитализации" : "No capitalization", ru ? "Ежеквартально" : "Quarterly", ru ? "Ежемесячно" : "Monthly", ru ? "Эфф. ставка (ежемес.)" : "Effective rate (monthly)"],
    rows: rates.map((r) => [
      fmtPct(locale, r),
      fmtMoney(locale, approxIncome(amount, r, "end"), cur, 0),
      fmtMoney(locale, approxIncome(amount, r, "quarterly"), cur, 0),
      fmtMoney(locale, approxIncome(amount, r, "monthly"), cur, 0),
      fmtPct(locale, effectiveRate(r, "monthly"), 2),
    ]),
  };
}

export const depositTool: ToolDef = {
  slug: "deposit-calculator",
  component: "finance/deposit",
  icon: "PiggyBank",
  popular: true,
  name: { ru: "Калькулятор вкладов", en: "Deposit calculator" },
  title: { ru: "Калькулятор вкладов с капитализацией и пополнением", en: "Deposit calculator with capitalization and top-ups" },
  h1: { ru: "Калькулятор вкладов", en: "Deposit calculator" },
  description: {
    ru: "Доход по вкладу с ежемесячной или ежеквартальной капитализацией, пополнениями и снятиями. Точный расчёт по дням, эффективная ставка и начисления по месяцам.",
    en: "Deposit interest with monthly or quarterly capitalization, top-ups and withdrawals. Exact day-count calculation, effective annual rate and a month-by-month table.",
  },
  lead: {
    ru: `Вклад 1 000 000 ₸ под 14 % на год с ежемесячной капитализацией приносит около ${kzt(approxIncome(1_000_000, 14, "monthly"))} — эффективная ставка ${fmtPct("ru", effectiveRate(14, "monthly"), 2)}.`,
    en: `A $10,000 deposit at 4.5% for a year with monthly capitalization earns about ${fmtMoney("en", approxIncome(10_000, 4.5, "monthly"), "USD", 0)} — an effective rate of ${fmtPct("en", effectiveRate(4.5, "monthly"), 2)}.`,
  },
  keywords: {
    ru: ["калькулятор вкладов", "депозит", "капитализация", "доход по вкладу", "эффективная ставка", "пополнение вклада"],
    en: ["deposit calculator", "savings account interest", "capitalization", "effective annual rate", "certificate of deposit"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите сумму вклада, годовую ставку и срок в месяцах или годах.",
      "Выберите капитализацию: ежемесячно, ежеквартально или без неё (проценты в конце срока).",
      "Если нужно, укажите дату открытия и ежемесячные пополнения или снятия.",
      "Смотрите итоговую сумму, доход, эффективную ставку и начисления по каждому месяцу.",
    ],
    en: [
      "Enter the deposit amount, the annual rate and the term in months or years.",
      "Choose capitalization: monthly, quarterly or none (interest paid at maturity).",
      "Optionally set the start date and monthly top-ups or withdrawals.",
      "See the final balance, the interest earned, the effective rate and the interest for each month.",
    ],
  },
  about: {
    ru: [
      "Капитализация — это прибавление начисленных процентов к сумме вклада: в следующем периоде проценты начисляются уже и на них. Поэтому при одной и той же ставке ежемесячная капитализация даёт больше, чем ежеквартальная, а та — больше, чем выплата в конце срока. Разницу показывает эффективная ставка: 14 % с ежемесячной капитализацией равны 14,93 % годовых без неё.",
      "Калькулятор считает проценты по дням, как банки: остаток × ставка / 365 за каждый день, в високосном году — / 366. Поэтому доход за январь (31 день) больше, чем за февраль. Пополнения и снятия учитываются в даты ежемесячных начислений.",
      "В Казахстане банки обязаны указывать годовую эффективную ставку вознаграждения (ГЭСВ), в России — эффективную ставку тоже раскрывают в условиях вклада. Сравнивайте вклады именно по ней.",
    ],
    en: [
      "Capitalization adds the interest earned to the deposit, so the next period earns interest on it too. At the same nominal rate, monthly capitalization earns more than quarterly, which earns more than interest paid at maturity. The effective annual rate shows the difference: 4.5% compounded monthly equals 4.59% simple.",
      "The calculator accrues interest daily, like banks do: balance × rate / 365 per day, or / 366 in a leap year, so January (31 days) earns more than February. Top-ups and withdrawals are applied on the monthly anniversary dates.",
      "When comparing deposits, compare their effective annual rates (APY) rather than the nominal rates.",
    ],
  },
  faq: {
    ru: [
      { q: "Что такое капитализация вклада?", a: "Это когда начисленные проценты прибавляются к вкладу и в следующем периоде тоже приносят доход. При ставке 12 % ежемесячная капитализация даёт эффективную ставку 12,68 % годовых." },
      { q: "Как рассчитать доход по вкладу?", a: "Без капитализации: сумма × ставка × дни / 365. Например, 1 000 000 ₸ × 12 % × 365 / 365 = 120 000 ₸. С капитализацией проценты каждого месяца добавляются к сумме, и доход растёт." },
      { q: "Что выгоднее — ежемесячная или ежеквартальная капитализация?", a: "При одинаковой ставке — ежемесячная: проценты начинают работать раньше. На 1 000 000 ₸ под 14 % на год разница около 1 800 ₸ (149 342 ₸ против 147 523 ₸)." },
      { q: "Учитывается ли налог на доход по вкладу?", a: "Нет. Правила налогообложения процентов различаются в Казахстане и России и зависят от суммы дохода — калькулятор показывает доход до налогов." },
    ],
    en: [
      { q: "What is capitalization?", a: "Interest earned is added to the deposit and earns interest itself in the following periods. At 12%, monthly capitalization gives an effective annual rate of 12.68%." },
      { q: "How is deposit interest calculated?", a: "Without capitalization: amount × rate × days / 365. For example, 10,000 × 4.5% × 365 / 365 = 450. With capitalization each month's interest is added to the balance and the total grows." },
      { q: "Is monthly or quarterly capitalization better?", a: "At the same rate, monthly — the interest starts earning sooner. The difference grows with the rate and the term." },
      { q: "Is tax on interest included?", a: "No. Tax rules on interest differ between countries and depend on your income — the calculator shows interest before tax." },
    ],
  },
  related: ["compound-interest-calculator", "savings-goal-calculator", "inflation-calculator", "loan-calculator", "investment-calculator"],
  blocks: (locale) => [table(locale)],
};
