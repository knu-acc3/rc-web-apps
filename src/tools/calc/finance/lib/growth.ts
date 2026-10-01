/**
 * Growth engine shared by compound interest, investment, retirement, savings goal and inflation.
 * Everything is simulated month by month with a monthly growth factor derived from the annual
 * rate and compounding frequency, so contributions and compounding of any frequency combine
 * consistently. Money values are plain floats here; the UI rounds for display.
 */

export type Compounding = "yearly" | "semiannual" | "quarterly" | "monthly" | "daily" | "continuous";
export const COMPOUNDINGS: readonly Compounding[] = ["yearly", "semiannual", "quarterly", "monthly", "daily", "continuous"];
const PERIODS_PER_YEAR: Record<Exclude<Compounding, "continuous">, number> = { yearly: 1, semiannual: 2, quarterly: 4, monthly: 12, daily: 365 };

/** Monthly growth factor for a nominal annual rate (percent) compounded `comp` times a year. */
export function monthlyFactor(ratePct: number, comp: Compounding = "monthly"): number {
  const r = ratePct / 100;
  if (comp === "continuous") return Math.exp(r / 12);
  const n = PERIODS_PER_YEAR[comp];
  return Math.pow(1 + r / n, n / 12);
}

/** Monthly factor from an effective annual return (percent), e.g. 7 % a year → 1.07^(1/12). */
function monthlyFromAnnual(ratePct: number): number {
  return Math.pow(1 + ratePct / 100, 1 / 12);
}

/* ───────────── Compound interest ───────────── */

interface CompoundInput {
  principal: number;
  rate: number;
  years: number;
  comp: Compounding;
  contribution?: number;
  contribFreq?: "monthly" | "yearly";
  /** Contributions at the start or end of each period. */
  timing?: "start" | "end";
}

interface YearRow {
  year: number;
  /** Cumulative money put in (principal + contributions). */
  invested: number;
  /** Cumulative interest earned. */
  interest: number;
  balance: number;
}

interface CompoundResult {
  rows: YearRow[];
  final: number;
  invested: number;
  interest: number;
}

export function compound(input: CompoundInput): CompoundResult {
  const months = Math.max(1, Math.min(1200, Math.round(input.years * 12)));
  const g = monthlyFactor(input.rate, input.comp);
  const c = input.contribution ?? 0;
  const freq = input.contribFreq ?? "monthly";
  const timing = input.timing ?? "end";
  let balance = input.principal;
  let invested = input.principal;
  const rows: YearRow[] = [];
  for (let m = 1; m <= months; m++) {
    const due = c !== 0 && (freq === "monthly" || (timing === "start" ? (m - 1) % 12 === 0 : m % 12 === 0));
    if (due && timing === "start") {
      balance += c;
      invested += c;
    }
    balance *= g;
    if (due && timing === "end") {
      balance += c;
      invested += c;
    }
    if (m % 12 === 0 || m === months) rows.push({ year: Math.ceil(m / 12), invested, interest: balance - invested, balance });
  }
  return { rows, final: balance, invested, interest: balance - invested };
}

/* ───────────── Investment ───────────── */

interface InvestInput {
  initial: number;
  monthly: number;
  /** Yearly increase of the monthly contribution, percent. */
  increase?: number;
  /** Expected annual return, percent (may be negative, > −100). */
  rate: number;
  /** Annual fees, percent of assets. */
  fee?: number;
  /** Annual inflation, percent. */
  inflation?: number;
  years: number;
}

interface InvestRow extends YearRow {
  /** Balance in today's money. */
  real: number;
}

export function invest(input: InvestInput): { rows: InvestRow[]; final: number; real: number; invested: number } {
  const months = Math.max(1, Math.min(1200, Math.round(input.years * 12)));
  const g = monthlyFromAnnual(Math.max(-99.99, input.rate)) * Math.pow(1 - Math.min(99.99, Math.max(0, input.fee ?? 0)) / 100, 1 / 12);
  const infl = monthlyFromAnnual(input.inflation ?? 0);
  let balance = input.initial;
  let invested = input.initial;
  let contrib = input.monthly;
  const rows: InvestRow[] = [];
  for (let m = 1; m <= months; m++) {
    balance = balance * g + contrib;
    invested += contrib;
    if (m % 12 === 0) contrib *= 1 + (input.increase ?? 0) / 100;
    if (m % 12 === 0 || m === months) rows.push({ year: Math.ceil(m / 12), invested, interest: balance - invested, balance, real: balance / Math.pow(infl, m) });
  }
  return { rows, final: balance, real: balance / Math.pow(infl, months), invested };
}

/* ───────────── Retirement ───────────── */

interface RetirementInput {
  age: number;
  retireAge: number;
  endAge: number;
  savings: number;
  monthly: number;
  /** Yearly increase of contributions, percent. */
  increase: number;
  /** Annual return before / after retirement, percent. */
  returnPre: number;
  returnPost: number;
  inflation: number;
  /** Desired monthly income in today's money. */
  income: number;
}

interface RetirementResult {
  /** Balance at retirement (nominal). */
  nestEgg: number;
  /** Nest egg in today's money. */
  nestEggReal: number;
  /** First monthly withdrawal (nominal, income indexed by inflation until retirement). */
  firstWithdrawal: number;
  /** Age at which money runs out (null when it lasts until endAge). */
  depletedAge: number | null;
  /** Balance needed at retirement to fund the income until endAge (nominal). */
  required: number;
  /** 4 % rule: safe monthly withdrawal in the first year (nominal and in today's money). */
  rule4Monthly: number;
  rule4MonthlyReal: number;
  /** Yearly balance points for the chart. */
  points: { age: number; balance: number }[];
  contributed: number;
}

export function retirement(input: RetirementInput): RetirementResult {
  const accMonths = Math.max(0, Math.round((input.retireAge - input.age) * 12));
  const decMonths = Math.max(0, Math.round((input.endAge - input.retireAge) * 12));
  const g1 = monthlyFromAnnual(input.returnPre);
  const g2 = monthlyFromAnnual(input.returnPost);
  const infl = monthlyFromAnnual(input.inflation);
  let balance = input.savings;
  let contrib = input.monthly;
  let contributed = input.savings;
  const points: { age: number; balance: number }[] = [{ age: input.age, balance }];
  for (let m = 1; m <= accMonths; m++) {
    balance = balance * g1 + contrib;
    contributed += contrib;
    if (m % 12 === 0) {
      contrib *= 1 + input.increase / 100;
      points.push({ age: input.age + m / 12, balance });
    }
  }
  if (accMonths % 12) points.push({ age: input.retireAge, balance });
  const nestEgg = balance;
  const inflToRetire = Math.pow(infl, accMonths);
  const firstWithdrawal = input.income * inflToRetire;

  // Withdrawal phase: withdraw at the start of each month, income indexed yearly by inflation.
  let depletedAge: number | null = null;
  let w = firstWithdrawal;
  let required = 0;
  let disc = 1;
  for (let m = 0; m < decMonths; m++) {
    if (m > 0 && m % 12 === 0) w *= Math.pow(infl, 12);
    required += w / disc;
    disc *= g2;
    if (depletedAge === null) {
      if (balance < w) {
        depletedAge = input.retireAge + m / 12;
        balance = 0;
      } else balance = (balance - w) * g2;
    }
    if ((m + 1) % 12 === 0) points.push({ age: input.retireAge + (m + 1) / 12, balance: depletedAge === null ? balance : 0 });
  }
  const rule4Monthly = (nestEgg * 0.04) / 12;
  return {
    nestEgg,
    nestEggReal: nestEgg / inflToRetire,
    firstWithdrawal,
    depletedAge,
    required,
    rule4Monthly,
    rule4MonthlyReal: rule4Monthly / inflToRetire,
    points,
    contributed,
  };
}

/* ───────────── Savings goal ───────────── */

/** Monthly deposit (end of month) needed to reach `target` from `current` in `months`. */
export function monthlyNeeded(target: number, current: number, ratePct: number, months: number): number {
  const n = Math.max(1, Math.round(months));
  const g = monthlyFromAnnual(ratePct);
  const fvCurrent = current * Math.pow(g, n);
  const gap = target - fvCurrent;
  if (gap <= 0) return 0;
  if (Math.abs(g - 1) < 1e-12) return gap / n;
  return (gap * (g - 1)) / (Math.pow(g, n) - 1);
}

/** Months needed to reach `target` with a monthly deposit (null if not reachable within 100 years). */
export function monthsNeeded(target: number, current: number, ratePct: number, monthly: number): number | null {
  const g = monthlyFromAnnual(ratePct);
  let b = current;
  if (b >= target) return 0;
  for (let m = 1; m <= 1200; m++) {
    b = b * g + monthly;
    if (b >= target - 1e-9) return m;
  }
  return null;
}

/** Balance path month by month (for charts). */
export function savingsPath(current: number, ratePct: number, monthly: number, months: number): number[] {
  const g = monthlyFromAnnual(ratePct);
  const out = [current];
  let b = current;
  for (let m = 1; m <= months; m++) {
    b = b * g + monthly;
    out.push(b);
  }
  return out;
}

/* ───────────── Inflation ───────────── */

/** What `amount` today will cost after `years` at `ratePct` a year. */
export function futureCost(amount: number, ratePct: number, years: number): number {
  return amount * Math.pow(1 + ratePct / 100, years);
}

/** Purchasing power today of `amount` received after `years`. */
export function presentValue(amount: number, ratePct: number, years: number): number {
  return amount / Math.pow(1 + ratePct / 100, years);
}

/** Average annual rate (percent) that turns price p1 into p2 over `years`. */
export function averageRate(p1: number, p2: number, years: number): number {
  return (Math.pow(p2 / p1, 1 / years) - 1) * 100;
}

/** Cumulative inflation (percent) of consecutive yearly rates. */
export function cumulative(ratesPct: number[]): number {
  return (ratesPct.reduce((f, r) => f * (1 + r / 100), 1) - 1) * 100;
}
