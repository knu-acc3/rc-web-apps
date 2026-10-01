import { addMonths, daysInYearOf } from "../../calc/kit/dates";

/**
 * Deposit with exact day count: interest accrues every day on the current balance at
 * rate / (365 or 366, by the calendar year of that day). Accrued interest is rounded to the
 * minor unit each month and credited on capitalization dates (monthly, quarterly or at the end).
 * Top-ups and withdrawals happen on monthly anniversaries of the start date (not on the final date).
 */

export type Capitalization = "monthly" | "quarterly" | "end";

interface DepositInput {
  amount: number;
  /** Nominal annual rate, percent. */
  annualRate: number;
  months: number;
  /** Start date as a day number (see kit/dates). */
  start: number;
  cap: Capitalization;
  topUp?: number;
  withdrawal?: number;
}

interface DepositRow {
  month: number;
  /** Day number of the end of this month (anniversary). */
  date: number;
  days: number;
  /** Interest accrued during this month (minor-unit rounded). */
  interest: number;
  /** Interest credited to the balance at the end of this month (0 if not a capitalization date). */
  credited: number;
  topUp: number;
  withdrawal: number;
  /** Balance after crediting and top-ups/withdrawals. */
  balance: number;
}

interface DepositResult {
  rows: DepositRow[];
  end: number;
  days: number;
  totalInterest: number;
  totalTopUps: number;
  totalWithdrawals: number;
  /** Amount at the end of the term (balance + interest paid out at the end). */
  final: number;
  /** Effective annual rate for the chosen capitalization, percent (formula, no top-ups). */
  effectiveRate: number;
}

const r2 = (minor: number) => minor / 100;
const toMinor = (x: number) => Math.sign(x) * Math.round(Number(Math.abs(x * 100).toPrecision(15))) || 0;

/** Effective annual rate for regular capitalization (percent); without capitalization it equals the nominal rate. */
export function effectiveRate(annualRate: number, cap: Capitalization): number {
  const r = annualRate / 100;
  if (cap === "monthly") return (Math.pow(1 + r / 12, 12) - 1) * 100;
  if (cap === "quarterly") return (Math.pow(1 + r / 4, 4) - 1) * 100;
  return annualRate;
}

export function depositSchedule(input: DepositInput): DepositResult {
  const months = Math.max(1, Math.min(600, Math.round(input.months)));
  const r = input.annualRate / 100;
  let balance = toMinor(Math.max(0, input.amount));
  const topUp = toMinor(Math.max(0, input.topUp ?? 0));
  const withdrawal = toMinor(Math.max(0, input.withdrawal ?? 0));
  let periodExact = 0; // interest accrued since the last capitalization, exact (minor units)
  let periodShown = 0; // part of it already shown in monthly rows (rounded)
  let paidAtEnd = 0;
  let totalInterest = 0;
  let totalTop = 0;
  let totalOut = 0;
  const rows: DepositRow[] = [];

  for (let k = 1; k <= months; k++) {
    const from = addMonths(input.start, k - 1);
    const to = addMonths(input.start, k);
    // balance is in minor units, so the accrued amount is in minor units too
    for (let d = from; d < to; d++) periodExact += (balance * r) / daysInYearOf(d);
    // Monthly figures telescope to the rounded period total, so rows always add up.
    const interest = Math.round(periodExact) - periodShown;
    periodShown += interest;
    totalInterest += interest;

    const isCap = input.cap === "monthly" || (input.cap === "quarterly" && k % 3 === 0) || k === months;
    let credited = 0;
    if (isCap) {
      credited = periodShown;
      if (input.cap === "end") paidAtEnd += credited;
      else balance += credited;
      periodExact = 0;
      periodShown = 0;
    }
    let tu = 0;
    let wd = 0;
    if (k < months) {
      tu = topUp;
      balance += tu;
      wd = Math.min(withdrawal, balance);
      balance -= wd;
      totalTop += tu;
      totalOut += wd;
    }
    rows.push({ month: k, date: to, days: to - from, interest: r2(interest), credited: r2(credited), topUp: r2(tu), withdrawal: r2(wd), balance: r2(balance) });
  }

  const end = addMonths(input.start, months);
  return {
    rows,
    end,
    days: end - input.start,
    totalInterest: r2(totalInterest),
    totalTopUps: r2(totalTop),
    totalWithdrawals: r2(totalOut),
    final: r2(balance + paidAtEnd),
    effectiveRate: effectiveRate(input.annualRate, input.cap),
  };
}
