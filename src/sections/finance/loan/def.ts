import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import type { Block, ToolDef } from "@/registry/types";
import { fmtMoney, fmtPct } from "../../calc/kit/fmt";
import { annuityPayment, loanSchedule } from "../engines/loan";

const money = (locale: Locale, v: number, digits = 2) => fmtMoney(locale, v, locale === "ru" ? "KZT" : "USD", digits);

/* Worked example used in texts (computed at build time). */
const RU_EX = loanSchedule({ principal: 5_000_000, annualRate: 18, months: 60, type: "annuity" });
const RU_DIFF = loanSchedule({ principal: 5_000_000, annualRate: 18, months: 60, type: "diff" });
const EN_EX = loanSchedule({ principal: 50_000, annualRate: 8, months: 60, type: "annuity" });
const EN_DIFF = loanSchedule({ principal: 50_000, annualRate: 8, months: 60, type: "diff" });

function rateTable(locale: Locale): Block {
  const ru = locale === "ru";
  const amount = ru ? 1_000_000 : 10_000;
  const terms = [12, 24, 36, 60, 84];
  const rates = ru ? [10, 14, 16, 18, 20, 22, 25, 30] : [4, 6, 8, 10, 12, 15, 18, 20];
  return {
    type: "table",
    title: ru ? "Ежемесячный платёж по кредиту 1 000 000 ₸ (аннуитет)" : "Monthly payment on a $10,000 loan (annuity)",
    head: [ru ? "Ставка" : "Rate", ...terms.map((m) => `${m / 12} ${plural(locale, m / 12, ru ? ["год", "года", "лет"] : ["year", "years"])}`)],
    rows: rates.map((r) => [fmtPct(locale, r), ...terms.map((m) => money(locale, annuityPayment(amount, r, m), 0))]),
  };
}

export const loanTool: ToolDef = {
  slug: "loan",
  component: "finance/loan",
  icon: "Landmark",
  popular: true,
  name: { ru: "Кредитный калькулятор", en: "Loan calculator" },
  title: { ru: "Кредитный калькулятор с графиком платежей онлайн", en: "Loan calculator with amortization schedule" },
  h1: { ru: "Кредитный калькулятор", en: "Loan calculator" },
  description: {
    ru: "Рассчитайте ежемесячный платёж по кредиту: аннуитетный и дифференцированный график, досрочное погашение, переплата и выгрузка графика платежей в CSV.",
    en: "Work out your monthly loan payment: annuity and differentiated schedules, early repayments, total interest and a full amortization table you can export to CSV.",
  },
  lead: {
    ru: `Кредит 5 000 000 ₸ под 18 % на 5 лет — ${money("ru", RU_EX.firstPayment)} в месяц, переплата ${money("ru", RU_EX.totalInterest, 0)}.`,
    en: `A $50,000 loan at 8% for 5 years costs ${money("en", EN_EX.firstPayment)} a month, with ${money("en", EN_EX.totalInterest, 0)} of interest in total.`,
  },
  keywords: {
    ru: ["кредитный калькулятор", "расчёт кредита", "аннуитетный платёж", "дифференцированный платёж", "досрочное погашение", "график платежей"],
    en: ["loan calculator", "amortization schedule", "monthly payment", "early repayment", "annuity loan", "differentiated payments"],
  },
  props: { years: 5, type: "annuity" },
  howTo: {
    ru: [
      "Введите сумму кредита, годовую ставку и срок в годах или месяцах.",
      "Выберите тип платежа: аннуитетный (равные платежи) или дифференцированный (платёж уменьшается).",
      "При необходимости добавьте досрочное погашение — разовое или ежемесячное — и выберите, что уменьшать: срок или платёж.",
      "Изучите график платежей, диаграмму и переплату; скачайте график в CSV или поделитесь ссылкой на расчёт.",
    ],
    en: [
      "Enter the loan amount, the annual interest rate and the term in years or months.",
      "Choose the payment type: annuity (equal payments) or differentiated (payments decrease over time).",
      "Optionally add early repayments — one-off or monthly — and choose whether they shorten the term or lower the payment.",
      "Review the schedule, the chart and the total interest; download the schedule as CSV or share a link to the calculation.",
    ],
  },
  about: {
    ru: [
      `Аннуитетный платёж одинаков весь срок: в начале большая часть уходит на проценты, в конце — на основной долг. При дифференцированной схеме долг гасится равными частями, а проценты начисляются на остаток, поэтому платежи снижаются и переплата меньше: для 5 000 000 ₸ под 18 % на 5 лет — ${money("ru", RU_DIFF.totalInterest, 0)} против ${money("ru", RU_EX.totalInterest, 0)} у аннуитета.`,
      "Калькулятор считает график в целых тиынах или копейках, как банк: проценты каждого месяца округляются, а последний платёж выравнивается, чтобы остаток стал нулевым. Досрочное погашение с уменьшением срока экономит больше процентов, чем с уменьшением платежа.",
      "Расчёт использует номинальную ставку. Годовая эффективная ставка (ГЭСВ в Казахстане, ПСК в России) дополнительно учитывает комиссии и страховки — её указывает банк в договоре.",
    ],
    en: [
      `An annuity payment stays the same for the whole term: early payments are mostly interest, later ones mostly principal. With differentiated payments the principal is repaid in equal parts and interest is charged on the remaining balance, so payments fall and the total interest is lower — for $50,000 at 8% over 5 years it is ${money("en", EN_DIFF.totalInterest, 0)} versus ${money("en", EN_EX.totalInterest, 0)} with an annuity.`,
      "The schedule is calculated in whole cents like a bank does: each month's interest is rounded and the last payment is trued up so the balance ends at zero. Early repayments that shorten the term save more interest than those that lower the payment.",
      "The calculation uses the nominal rate. The APR shown by lenders also includes fees and insurance, so check the figure in your loan agreement.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Как рассчитывается аннуитетный платёж?",
        a: `По формуле P = S × i / (1 − (1 + i)^−n), где i — месячная ставка (годовая / 12 / 100), n — срок в месяцах. Для 5 000 000 ₸ под 18 % на 60 месяцев: i = 0,015, платёж ${money("ru", RU_EX.firstPayment)}.`,
      },
      {
        q: "Что выгоднее — аннуитетный или дифференцированный платёж?",
        a: `По переплате выгоднее дифференцированный: в примере выше экономия ${money("ru", RU_EX.totalInterest - RU_DIFF.totalInterest, 0)}. Но первый платёж у него выше — ${money("ru", RU_DIFF.firstPayment)} против ${money("ru", RU_EX.firstPayment)}, поэтому банки чаще предлагают аннуитет.`,
      },
      {
        q: "Что уменьшать при досрочном погашении — срок или платёж?",
        a: "Уменьшение срока экономит больше процентов, потому что долг гасится быстрее при том же платеже. Уменьшение платежа снижает нагрузку на бюджет, но переплата сокращается меньше. Сравните оба варианта в калькуляторе.",
      },
      {
        q: "Почему последний платёж отличается от остальных?",
        a: "Платёж и проценты округляются до тиынов (копеек), и за весь срок набегает разница в несколько тиынов. Банк учитывает её в последнем платеже, чтобы долг был погашен ровно — калькулятор делает так же.",
      },
      {
        q: "Учитывает ли расчёт комиссии и страховку?",
        a: "Нет, только проценты по номинальной ставке. Полную стоимость кредита с комиссиями банк обязан указать в договоре (ГЭСВ в Казахстане, ПСК в России).",
      },
    ],
    en: [
      {
        q: "How is the annuity payment calculated?",
        a: `With P = S × i / (1 − (1 + i)^−n), where i is the monthly rate (annual / 12 / 100) and n is the term in months. For $50,000 at 8% over 60 months, i = 0.00667 and the payment is ${money("en", EN_EX.firstPayment)}.`,
      },
      {
        q: "Which is cheaper — annuity or differentiated payments?",
        a: "Differentiated payments cost less interest because the principal falls faster, but the first payments are higher. Annuities are easier to budget, which is why most lenders offer them.",
      },
      {
        q: "Should an early repayment reduce the term or the payment?",
        a: "Reducing the term saves more interest because the balance is paid off faster at the same payment. Reducing the payment eases your monthly budget but saves less. Compare both options in the calculator.",
      },
      {
        q: "Why is the last payment slightly different?",
        a: "Payments and interest are rounded to cents, and the small differences add up over the term. The lender settles them in the final payment so the balance is exactly zero — the calculator does the same.",
      },
      {
        q: "Are fees and insurance included?",
        a: "No, only interest at the nominal rate. Your lender must disclose the full cost including fees (the APR) in the loan agreement.",
      },
    ],
  },
  related: ["finance/mortgage", "finance/deposit", "finance/inflation", "calc/percent", "finance/salary-kz"],
  blocks: (locale) => [rateTable(locale)],
};
