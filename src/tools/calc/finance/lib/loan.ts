/**
 * Loan schedule engine (annuity & differentiated), shared by the loan and mortgage calculators.
 * All money is handled in integer minor units (kopecks / tiyn / cents) internally:
 * interest is rounded to the minor unit every month and the last payment is trued up
 * so the balance ends at exactly zero.
 * Monthly rate = annual rate / 12 (the usual convention of Russian and Kazakh bank schedules;
 * some banks use the actual number of days — results then differ slightly).
 */

export type LoanType = "annuity" | "diff";
/** What an early repayment reduces: the remaining term (payment stays) or the payment (term stays). */
export type ExtraMode = "term" | "payment";

interface LoanInput {
  /** Amount borrowed, currency units. */
  principal: number;
  /** Nominal annual rate, percent. */
  annualRate: number;
  /** Term in months. */
  months: number;
  type: LoanType;
  /** One-off early repayments: made together with the regular payment of `month` (1-based). */
  extras?: { month: number; amount: number }[];
  /** Regular early repayment added every month. */
  monthlyExtra?: number;
  extraMode?: ExtraMode;
}

export interface LoanRow {
  month: number;
  /** Regular payment (principal + interest), currency units. */
  payment: number;
  principal: number;
  interest: number;
  /** Early repayment made this month. */
  extra: number;
  /** Balance after this month's payment and early repayment. */
  balance: number;
  /** Balance before this month's payment (used for insurance on balance). */
  opening: number;
}

export interface LoanResult {
  rows: LoanRow[];
  /** First regular payment (annuity: the monthly payment). */
  firstPayment: number;
  lastPayment: number;
  maxPayment: number;
  totalInterest: number;
  totalExtra: number;
  /** Everything paid: principal + interest. */
  totalPaid: number;
  /** Actual number of months until the loan is repaid. */
  months: number;
}

const MAX_MONTHS = 1200;

/** Round half away from zero, robust to float noise. */
function rnd(x: number): number {
  return Math.sign(x) * Math.round(Number(Math.abs(x).toPrecision(15))) || 0;
}

/** Annuity payment in minor units for balance `s` (minor units), monthly rate `i`, `n` months. */
function annuityPaymentMinor(s: number, i: number, n: number): number {
  if (n <= 0) return s;
  if (i === 0) return rnd(s / n);
  return rnd((s * i) / (1 - Math.pow(1 + i, -n)));
}

/** Annuity payment in currency units (rounded to the minor unit). */
export function annuityPayment(principal: number, annualRate: number, months: number): number {
  return annuityPaymentMinor(rnd(principal * 100), annualRate / 1200, months) / 100;
}

export function loanSchedule(input: LoanInput): LoanResult {
  const n = Math.min(MAX_MONTHS, Math.max(1, Math.round(input.months)));
  const i = input.annualRate / 1200;
  const mode: ExtraMode = input.extraMode ?? "term";
  const monthlyExtra = rnd(Math.max(0, input.monthlyExtra ?? 0) * 100);
  const extraAt = new Map<number, number>();
  for (const e of input.extras ?? []) {
    if (e.month >= 1 && e.amount > 0) extraAt.set(Math.round(e.month), (extraAt.get(Math.round(e.month)) ?? 0) + rnd(e.amount * 100));
  }

  let balance = rnd(Math.max(0, input.principal) * 100);
  let annuity = annuityPaymentMinor(balance, i, n);
  let diffPart = rnd(balance / n);
  const rows: LoanRow[] = [];

  for (let m = 1; m <= n && balance > 0; m++) {
    const opening = balance;
    const interest = rnd(balance * i);
    let principal: number;
    if (input.type === "annuity") principal = annuity - interest;
    else principal = diffPart;
    // Last scheduled month or the regular payment covers everything: true-up.
    if (m === n || principal >= balance) principal = balance;
    if (principal < 0) principal = 0;
    balance -= principal;

    let extra = Math.min(balance, (extraAt.get(m) ?? 0) + monthlyExtra);
    if (extra < 0) extra = 0;
    balance -= extra;

    rows.push({ month: m, payment: (principal + interest) / 100, principal: principal / 100, interest: interest / 100, extra: extra / 100, balance: balance / 100, opening: opening / 100 });

    if (extra > 0 && balance > 0 && mode === "payment") {
      // Keep the end date, lower the payment.
      annuity = annuityPaymentMinor(balance, i, n - m);
      diffPart = rnd(balance / (n - m));
    }
  }

  const payments = rows.map((r) => r.payment);
  const sumMinor = (f: (r: LoanRow) => number) => rows.reduce((s, r) => s + Math.round(f(r) * 100), 0) / 100;
  const totalInterest = sumMinor((r) => r.interest);
  const totalExtra = sumMinor((r) => r.extra);
  return {
    rows,
    firstPayment: payments[0] ?? 0,
    lastPayment: payments[payments.length - 1] ?? 0,
    maxPayment: payments.length ? Math.max(...payments) : 0,
    totalInterest,
    totalExtra,
    totalPaid: sumMinor((r) => r.payment + r.extra),
    months: rows.length,
  };
}

/** Yearly totals for charts: principal (incl. early repayments) and interest per loan year. */
export function yearlyTotals(rows: LoanRow[]): { year: number; principal: number; interest: number }[] {
  const out: { year: number; principal: number; interest: number }[] = [];
  for (const r of rows) {
    const y = Math.ceil(r.month / 12);
    let slot = out[y - 1];
    if (!slot) {
      slot = { year: y, principal: 0, interest: 0 };
      out[y - 1] = slot;
    }
    slot.principal = Math.round((slot.principal + r.principal + r.extra) * 100) / 100;
    slot.interest = Math.round((slot.interest + r.interest) * 100) / 100;
  }
  return out;
}
