import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { fmtPct } from "../../calc/kit/fmt";
import { KZ, SALARY_PAGES, salaryKz } from "../engines/salary-kz";
import { employeeLines, employerLines, tg } from "./content";

const n = (locale: Locale, v: number) => formatNumber(locale, v, { maximumFractionDigits: 0 });
/** Plain-space variant for titles/descriptions ("500 000 ₸"). */
const T = (locale: Locale, v: number) => tg(locale, v);

function breakdownTable(locale: Locale, gross: number): Block {
  const ru = locale === "ru";
  const b = salaryKz(gross, 2026);
  const rows: string[][] = [
    [ru ? "Оклад (начислено)" : "Gross salary", "", T(locale, b.gross)],
    ...employeeLines(locale, b).map((l) => [`− ${l.label}`, l.how, T(locale, l.value)]),
    [ru ? "На руки" : "Take-home pay", "", T(locale, b.net)],
    ...employerLines(locale, b).map((l) => [`+ ${l.label}`, l.how, T(locale, l.value)]),
    [ru ? "Полная стоимость для работодателя" : "Total employer cost", "", T(locale, b.employerTotal)],
  ];
  return {
    type: "table",
    title: ru ? `Расчёт зарплаты ${T(locale, gross)} в 2026 году` : `Salary breakdown for ${T(locale, gross)} in 2026`,
    head: [ru ? "Статья" : "Item", ru ? "Как считается" : "How it is calculated", ru ? "Сумма" : "Amount"],
    rows,
  };
}

function variantFacts(locale: Locale, gross: number): Block {
  const ru = locale === "ru";
  const b26 = salaryKz(gross, 2026);
  const b25 = salaryKz(gross, 2025);
  const diff = b26.net - b25.net;
  return {
    type: "facts",
    title: ru ? "Коротко" : "Key figures",
    rows: [
      [ru ? "На руки в 2026 году" : "Take-home pay in 2026", T(locale, b26.net)],
      [ru ? "На руки в 2025 году" : "Take-home pay in 2025", `${T(locale, b25.net)} (${diff >= 0 ? "+" : "−"}${T(locale, Math.abs(diff))} ${ru ? "в 2026" : "in 2026"})`],
      [ru ? "На руки за год (×12)" : "Take-home per year (×12)", T(locale, b26.net * 12)],
      [ru ? "Удержано из зарплаты" : "Withheld from salary", `${T(locale, b26.gross - b26.net)} (${fmtPct(locale, ((b26.gross - b26.net) / b26.gross) * 100, 1)})`],
      [ru ? "Налоги и взносы работодателя" : "Employer taxes and contributions", T(locale, b26.employerTotal - b26.gross)],
      [ru ? "Все налоги и взносы" : "All taxes and contributions", `${T(locale, b26.burden)} (${fmtPct(locale, (b26.burden / b26.employerTotal) * 100, 1)} ${ru ? "от стоимости сотрудника" : "of the employee's cost"})`],
    ],
  };
}

function variantFaq(locale: Locale, gross: number): QA[] {
  const b = salaryKz(gross, 2026);
  const b25 = salaryKz(gross, 2025);
  if (locale === "ru")
    return [
      { q: `Сколько на руки с зарплаты ${T(locale, gross)} в 2026 году?`, a: `${T(locale, b.net)}. Из оклада удерживаются ОПВ ${T(locale, b.opv)}, ВОСМС ${T(locale, b.vosms)} и ИПН ${T(locale, b.ipn)} (при стандартном вычете 30 МРП = ${T(locale, b.deduction)}).` },
      { q: `Сколько платит работодатель за сотрудника с окладом ${T(locale, gross)}?`, a: `Сверх оклада — ${T(locale, b.employerTotal - b.gross)}: СО ${T(locale, b.so)}, ОПВР ${T(locale, b.opvr)}, ООСМС ${T(locale, b.oosms)} и социальный налог ${T(locale, b.sn)}. Полная стоимость — ${T(locale, b.employerTotal)} в месяц.` },
      {
        q: "Почему в 2026 году на руки получается иначе, чем в 2025?",
        a: `По новому Налоговому кодексу стандартный вычет вырос с 14 до 30 МРП, а корректировка 90 % отменена. Для оклада ${T(locale, gross)} это ${b.net >= b25.net ? "плюс" : "минус"} ${T(locale, Math.abs(b.net - b25.net))} на руки (${T(locale, b25.net)} в 2025 году).`,
      },
    ];
  return [
    { q: `What is the take-home pay on ${T(locale, gross)} in 2026?`, a: `${T(locale, b.net)}. Deducted from the gross: OPV ${T(locale, b.opv)}, VOSMS ${T(locale, b.vosms)} and IPN ${T(locale, b.ipn)} (with the 30 MRP standard deduction of ${T(locale, b.deduction)}).` },
    { q: `How much does the employer pay on top of ${T(locale, gross)}?`, a: `${T(locale, b.employerTotal - b.gross)}: SO ${T(locale, b.so)}, OPVR ${T(locale, b.opvr)}, OOSMS ${T(locale, b.oosms)} and social tax ${T(locale, b.sn)}. The total cost is ${T(locale, b.employerTotal)} a month.` },
    { q: "Why is 2026 different from 2025?", a: `The new Tax Code raised the standard deduction from 14 to 30 MRP and removed the 90% adjustment. For ${T(locale, gross)} this changes take-home pay by ${T(locale, Math.abs(b.net - b25.net))} (${T(locale, b25.net)} in 2025).` },
  ];
}

function variants(): VariantDef[] {
  return SALARY_PAGES.map((gross) => {
    const b = salaryKz(gross, 2026);
    const w = b.gross - b.net;
    const share = (w / b.gross) * 100;
    return {
      slug: String(gross),
      name: { ru: T("ru", gross), en: T("en", gross) },
      title: { ru: `Зарплата ${T("ru", gross)} на руки в 2026 году — ${T("ru", b.net)}`, en: `${T("en", gross)} salary after tax in Kazakhstan, 2026` },
      h1: { ru: `Зарплата ${T("ru", gross)}: сколько на руки в 2026 году`, en: `${T("en", gross)} gross salary: take-home pay in 2026` },
      description: {
        ru: `Оклад ${T("ru", gross)} в Казахстане в 2026 году: на руки ${T("ru", b.net)}, ИПН ${T("ru", b.ipn)}, ОПВ ${T("ru", b.opv)}, ВОСМС ${T("ru", b.vosms)}. Затраты работодателя — ${T("ru", b.employerTotal)}.`,
        en: `A ${T("en", gross)} salary in Kazakhstan in 2026: take-home ${T("en", b.net)}, IPN ${T("en", b.ipn)}, OPV ${T("en", b.opv)}, VOSMS ${T("en", b.vosms)}. Employer cost ${T("en", b.employerTotal)}.`,
      },
      lead: {
        ru: `С оклада ${T("ru", gross)} на руки выходит ${T("ru", b.net)} — удерживается ${T("ru", w)} (${fmtPct("ru", share, 1)}).`,
        en: `A gross salary of ${T("en", gross)} gives ${T("en", b.net)} take-home pay — ${T("en", w)} (${fmtPct("en", share, 1)}) is withheld.`,
      },
      keywords: { ru: [`зарплата ${n("ru", gross)}`, `${n("ru", gross)} на руки`, "оклад на руки"], en: [`${n("en", gross)} tenge salary`, "take-home pay kazakhstan"] },
      props: { gross, year: 2026 },
      blocks: (locale) => [breakdownTable(locale, gross), variantFacts(locale, gross)],
      faq: { ru: variantFaq("ru", gross), en: variantFaq("en", gross) },
    };
  });
}

function overviewTable(locale: Locale): Block {
  const ru = locale === "ru";
  const amounts = [85_000, 150_000, 200_000, 300_000, 400_000, 500_000, 700_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000];
  return {
    type: "table",
    title: ru ? "Сколько на руки в 2026 году: популярные оклады" : "Take-home pay in 2026 for common salaries",
    head: ru ? ["Оклад", "На руки", "ИПН", "ОПВ + ВОСМС", "Стоимость для работодателя"] : ["Gross", "Take-home", "IPN", "OPV + VOSMS", "Employer cost"],
    rows: amounts.map((g) => {
      const b = salaryKz(g, 2026);
      return [T(locale, g), T(locale, b.net), T(locale, b.ipn), T(locale, b.opv + b.vosms), T(locale, b.employerTotal)];
    }),
  };
}

const EX = salaryKz(500_000, 2026);

export const salaryKzTool: ToolDef = {
  slug: "kazakhstan-salary-calculator",
  component: "finance/salary-kz",
  icon: "Wallet",
  popular: true,
  name: { ru: "Калькулятор зарплаты в Казахстане", en: "Kazakhstan salary calculator" },
  title: { ru: "Калькулятор зарплаты Казахстан 2026 — на руки и налоги", en: "Kazakhstan salary calculator 2026 — net pay and taxes" },
  h1: { ru: "Калькулятор зарплаты в Казахстане", en: "Kazakhstan salary calculator" },
  description: {
    ru: "Расчёт зарплаты в Казахстане на 2026 и 2025 годы: из оклада на руки и обратно, ОПВ, ВОСМС, ИПН, а также СО, ОПВР, ООСМС и соцналог работодателя.",
    en: "Kazakhstan payroll for 2026 and 2025: gross to net and back, OPV, VOSMS and IPN withheld, plus the employer's SO, OPVR, OOSMS and social tax.",
  },
  lead: {
    ru: `С оклада 500 000 ₸ в 2026 году на руки — ${T("ru", EX.net)}, работодатель тратит ${T("ru", EX.employerTotal)}.`,
    en: `On a 500,000 ₸ gross salary in 2026 you take home ${T("en", EX.net)}; the employer spends ${T("en", EX.employerTotal)}.`,
  },
  keywords: {
    ru: ["калькулятор зарплаты", "зарплата на руки", "ИПН", "ОПВ", "ВОСМС", "социальный налог", "налоги с зарплаты Казахстан", "МРП 2026"],
    en: ["kazakhstan salary calculator", "net salary kazakhstan", "IPN", "OPV", "payroll tax kazakhstan"],
  },
  props: { gross: 500_000, year: 2026 },
  howTo: {
    ru: [
      "Выберите направление: из оклада на руки или из суммы на руки — в оклад.",
      "Введите сумму и год: 2026 (новый Налоговый кодекс) или 2025.",
      "Оставьте стандартный вычет, если это основное место работы, или снимите галочку для совместительства.",
      "Смотрите удержания сотрудника, взносы работодателя и все константы года — каждая строка с формулой.",
    ],
    en: [
      "Choose the direction: gross to net, or net to gross.",
      "Enter the amount and the year: 2026 (new Tax Code) or 2025.",
      "Keep the standard deduction for your main job or untick it for a second job.",
      "Review the employee deductions, the employer charges and every constant of the year, each line with its formula.",
    ],
  },
  about: {
    ru: [
      `Из зарплаты сотрудника удерживаются пенсионные взносы ОПВ (10 %), взносы на медстрахование ВОСМС (2 %) и индивидуальный подоходный налог ИПН (10 %). Сверх оклада работодатель платит социальные отчисления, свои пенсионные взносы ОПВР, отчисления ООСМС и социальный налог. Для оклада 500 000 ₸ в 2026 году это ${T("ru", EX.net)} на руки и ${T("ru", EX.employerTotal)} расходов работодателя.`,
      `С 2026 года действует новый Налоговый кодекс: стандартный вычет — 30 МРП (${T("ru", KZ[2026].deductionMrp * KZ[2026].mrp)}) вместо 14, корректировка 90 % для низких доходов отменена, соцналог — 6 % без вычета социальных отчислений, а ОПВР вырос до 2,5 %. Калькулятор считает оба года, чтобы можно было сравнить.`,
      "Все ставки, лимиты и формулы показаны на странице. Законодательство меняется, поэтому перед начислением зарплаты сверьте константы с действующими нормами или с бухгалтером.",
    ],
    en: [
      `Kazakhstan withholds pension contributions OPV (10%), health insurance VOSMS (2%) and personal income tax IPN (10%) from the employee's salary. On top of it the employer pays social contributions SO, employer pension contributions OPVR, health insurance OOSMS and social tax. For 500,000 ₸ in 2026 that means ${T("en", EX.net)} take-home and ${T("en", EX.employerTotal)} total employer cost.`,
      "From 2026 the new Tax Code applies: a 30 MRP standard deduction instead of 14, no 90% adjustment for low incomes, 6% social tax without deducting social contributions, and OPVR up to 2.5%. The calculator covers both years for comparison.",
      "Every rate, limit and formula is shown on the page. Rules change, so verify the constants against current law or with an accountant before running payroll.",
    ],
  },
  faq: {
    ru: [
      { q: "Какие налоги удерживаются из зарплаты в Казахстане?", a: "ОПВ 10 % (с дохода до 50 МЗП), ВОСМС 2 % (до 20 МЗП) и ИПН 10 % с дохода за минусом ОПВ, ВОСМС и стандартного вычета. В 2026 году вычет — 30 МРП = 129 750 ₸." },
      { q: "Сколько получится на руки с 500 000 ₸?", a: `В 2026 году — ${T("ru", EX.net)}: ОПВ ${T("ru", EX.opv)}, ВОСМС ${T("ru", EX.vosms)}, ИПН ${T("ru", EX.ipn)}.` },
      { q: "Что платит работодатель сверх оклада?", a: "Социальные отчисления 5 % (база от 1 до 7 МЗП), ОПВР 2,5 % в 2026 году (1,5 % в 2025), ООСМС 3 % (до 40 МЗП) и социальный налог: 6 % в 2026 году, 9,5 % минус СО в 2025 году." },
      { q: "Как посчитать оклад, если известна сумма на руки?", a: "Переключите направление «Из «на руки» в оклад» — калькулятор подберёт минимальный оклад в целых тенге, который даёт нужную сумму на руки." },
      { q: "Когда применяется ставка ИПН 15 %?", a: "По новому Налоговому кодексу — к части годового облагаемого дохода свыше 8 500 МРП (36 762 500 ₸ в 2026 году). Это примерно больше 3 млн ₸ облагаемого дохода в месяц; калькулятор применяет порог помесячно, как 1/12 годового." },
    ],
    en: [
      { q: "Which taxes are withheld from a salary in Kazakhstan?", a: "OPV 10% (on income up to 50 minimum wages), VOSMS 2% (up to 20) and IPN 10% of income minus OPV, VOSMS and the standard deduction — 30 MRP = 129,750 ₸ in 2026." },
      { q: "What is the take-home pay on 500,000 ₸?", a: `In 2026 — ${T("en", EX.net)}: OPV ${T("en", EX.opv)}, VOSMS ${T("en", EX.vosms)}, IPN ${T("en", EX.ipn)}.` },
      { q: "What does the employer pay on top?", a: "Social contributions of 5% (base 1–7 minimum wages), OPVR of 2.5% in 2026 (1.5% in 2025), OOSMS of 3% (up to 40 minimum wages) and social tax: 6% in 2026, 9.5% minus SO in 2025." },
      { q: "How do I get the gross from the net amount?", a: "Switch to 'Net to gross' — the calculator finds the smallest whole-tenge gross salary that gives the net amount." },
      { q: "When does the 15% IPN rate apply?", a: "Under the new Tax Code, to the part of annual taxable income above 8,500 MRP (36,762,500 ₸ in 2026) — roughly over 3 million ₸ of taxable income a month. The calculator applies the threshold monthly as 1/12 of the annual one." },
    ],
  },
  related: ["vat-calculator", "loan-calculator", "mortgage-calculator", "budget-calculator", "percentage-calculator"],
  blocks: (locale) => [overviewTable(locale)],
  variants: { title: { ru: "Зарплата на руки по окладу", en: "Take-home pay by gross salary" }, list: variants },
};
