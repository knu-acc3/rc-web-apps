import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { KZ, type SalaryBreakdown, type SalaryYear } from "../engines/salary-kz";

/** Shared by the calculator (client) and the variant pages (server). */

export const tg = (locale: Locale, v: number) => `${formatNumber(locale, v, { maximumFractionDigits: 0 })} ₸`;
const pct = (locale: Locale, r: number) => `${formatNumber(locale, r * 100, { maximumFractionDigits: 2 })}${locale === "ru" ? " %" : "%"}`;

interface LineItem {
  key: string;
  label: string;
  /** Short explanation of the base and rate. */
  how: string;
  value: number;
}

/** Employee deductions (withheld from the gross salary). */
export function employeeLines(locale: Locale, b: SalaryBreakdown): LineItem[] {
  const c = KZ[b.year];
  const ru = locale === "ru";
  const t = (v: number) => tg(locale, v);
  return [
    { key: "opv", label: ru ? "ОПВ — пенсионные взносы" : "OPV — pension contributions", how: `${pct(locale, c.opvRate)} × ${ru ? "доход" : "income"}${b.gross > c.opvCapMzp * c.mzp ? (ru ? `, база ограничена ${t(c.opvCapMzp * c.mzp)}` : `, base capped at ${t(c.opvCapMzp * c.mzp)}`) : ""}`, value: b.opv },
    { key: "vosms", label: ru ? "ВОСМС — медстрахование" : "VOSMS — health insurance", how: `${pct(locale, c.vosmsRate)} × ${ru ? "доход" : "income"}${b.gross > c.vosmsCapMzp * c.mzp ? (ru ? `, база ограничена ${t(c.vosmsCapMzp * c.mzp)}` : `, base capped at ${t(c.vosmsCapMzp * c.mzp)}`) : ""}`, value: b.vosms },
    {
      key: "ipn",
      label: ru ? "ИПН — подоходный налог" : "IPN — personal income tax",
      how: ru
        ? `${pct(locale, c.ipnRate)} × (${t(b.gross)} − ОПВ − ВОСМС − вычет ${t(b.deduction)})${b.adjusted ? " × 10 % (корректировка 90 %)" : ""} = база ${t(b.taxable)}`
        : `${pct(locale, c.ipnRate)} × (${t(b.gross)} − OPV − VOSMS − deduction ${t(b.deduction)})${b.adjusted ? " × 10% (90% adjustment)" : ""} = base ${t(b.taxable)}`,
      value: b.ipn,
    },
  ];
}

/** Employer charges (paid on top of the gross salary). */
export function employerLines(locale: Locale, b: SalaryBreakdown): LineItem[] {
  const c = KZ[b.year];
  const ru = locale === "ru";
  return [
    { key: "so", label: ru ? "СО — социальные отчисления" : "SO — social contributions", how: ru ? `${pct(locale, c.soRate)} × (доход − ОПВ), база от ${c.soMinMzp} до ${c.soMaxMzp} МЗП` : `${pct(locale, c.soRate)} × (income − OPV), base ${c.soMinMzp}–${c.soMaxMzp} × minimum wage`, value: b.so },
    { key: "opvr", label: ru ? "ОПВР — пенсионные взносы работодателя" : "OPVR — employer pension contributions", how: ru ? `${pct(locale, c.opvrRate)} × доход, база до ${c.opvrCapMzp} МЗП` : `${pct(locale, c.opvrRate)} × income, base up to ${c.opvrCapMzp} × minimum wage`, value: b.opvr },
    { key: "oosms", label: ru ? "ООСМС — отчисления на медстрахование" : "OOSMS — employer health insurance", how: ru ? `${pct(locale, c.oosmsRate)} × доход, база до ${c.oosmsCapMzp} МЗП` : `${pct(locale, c.oosmsRate)} × income, base up to ${c.oosmsCapMzp} × minimum wage`, value: b.oosms },
    {
      key: "sn",
      label: ru ? "СН — социальный налог" : "SN — social tax",
      how: c.snMinusSo
        ? ru
          ? `${pct(locale, c.snRate)} × (доход − ОПВ − ВОСМС) − СО`
          : `${pct(locale, c.snRate)} × (income − OPV − VOSMS) − SO`
        : ru
          ? `${pct(locale, c.snRate)} × (доход − ОПВ − ВОСМС), без вычета СО`
          : `${pct(locale, c.snRate)} × (income − OPV − VOSMS), SO not deducted`,
      value: b.sn,
    },
  ];
}

/** Rows of the constants table for a year. */
export function constantRows(locale: Locale, year: SalaryYear): [string, string][] {
  const c = KZ[year];
  const ru = locale === "ru";
  const t = (v: number) => tg(locale, v);
  const rows: [string, string][] = [
    [ru ? "МРП" : "MRP (monthly calculation index)", t(c.mrp)],
    [ru ? "МЗП" : "Minimum wage (MZP)", t(c.mzp)],
    [ru ? "ОПВ" : "OPV", ru ? `${pct(locale, c.opvRate)}, база до ${c.opvCapMzp} МЗП (${t(c.opvCapMzp * c.mzp)})` : `${pct(locale, c.opvRate)}, base up to ${c.opvCapMzp} MZP (${t(c.opvCapMzp * c.mzp)})`],
    [ru ? "ВОСМС" : "VOSMS", ru ? `${pct(locale, c.vosmsRate)}, база до ${c.vosmsCapMzp} МЗП (${t(c.vosmsCapMzp * c.mzp)})` : `${pct(locale, c.vosmsRate)}, base up to ${c.vosmsCapMzp} MZP (${t(c.vosmsCapMzp * c.mzp)})`],
    [
      ru ? "ИПН" : "IPN",
      c.ipnHighRate !== null && c.ipnHighThresholdMrp !== null
        ? ru
          ? `${pct(locale, c.ipnRate)}; ${pct(locale, c.ipnHighRate)} с годового облагаемого дохода свыше ${formatNumber(locale, c.ipnHighThresholdMrp)} МРП (${t(c.ipnHighThresholdMrp * c.mrp)})`
          : `${pct(locale, c.ipnRate)}; ${pct(locale, c.ipnHighRate)} on annual taxable income above ${formatNumber(locale, c.ipnHighThresholdMrp)} MRP (${t(c.ipnHighThresholdMrp * c.mrp)})`
        : pct(locale, c.ipnRate),
    ],
    [ru ? "Стандартный вычет" : "Standard deduction", `${c.deductionMrp} ${ru ? "МРП" : "MRP"} = ${t(c.deductionMrp * c.mrp)}`],
    ...(c.adjustmentLimitMrp !== null
      ? [[ru ? "Корректировка 90 %" : "90% adjustment", ru ? `при доходе до ${c.adjustmentLimitMrp} МРП (${t(c.adjustmentLimitMrp * c.mrp)}) в месяц` : `for monthly income up to ${c.adjustmentLimitMrp} MRP (${t(c.adjustmentLimitMrp * c.mrp)})`] as [string, string]]
      : []),
    [ru ? "СО" : "SO", ru ? `${pct(locale, c.soRate)} от (доход − ОПВ), база ${t(c.soMinMzp * c.mzp)} – ${t(c.soMaxMzp * c.mzp)}` : `${pct(locale, c.soRate)} of (income − OPV), base ${t(c.soMinMzp * c.mzp)} – ${t(c.soMaxMzp * c.mzp)}`],
    [ru ? "ОПВР" : "OPVR", ru ? `${pct(locale, c.opvrRate)}, база до ${c.opvrCapMzp} МЗП` : `${pct(locale, c.opvrRate)}, base up to ${c.opvrCapMzp} MZP`],
    [ru ? "ООСМС" : "OOSMS", ru ? `${pct(locale, c.oosmsRate)}, база до ${c.oosmsCapMzp} МЗП (${t(c.oosmsCapMzp * c.mzp)})` : `${pct(locale, c.oosmsRate)}, base up to ${c.oosmsCapMzp} MZP (${t(c.oosmsCapMzp * c.mzp)})`],
    [
      ru ? "СН" : "SN",
      c.snMinusSo
        ? ru
          ? `${pct(locale, c.snRate)} от (доход − ОПВ − ВОСМС) минус СО, база не ниже 1 МЗП`
          : `${pct(locale, c.snRate)} of (income − OPV − VOSMS) minus SO, base at least 1 MZP`
        : ru
          ? `${pct(locale, c.snRate)} от (доход − ОПВ − ВОСМС), СО не вычитаются, база не ниже 1 МЗП`
          : `${pct(locale, c.snRate)} of (income − OPV − VOSMS), SO not deducted, base at least 1 MZP`,
    ],
  ];
  return rows;
}
