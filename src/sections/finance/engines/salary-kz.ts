/**
 * Kazakhstan payroll: employee deductions (OPV, VOSMS, IPN) and employer charges
 * (SO, OPVR, OOSMS, SN) for a monthly salary, for 2025 and 2026.
 * Every constant is explicit below and shown on the page. All amounts are rounded to whole tenge.
 *
 * Sources (verify against current law — rates change):
 * - MRP/MZP: republican budget laws (2025: MRP 3 932, MZP 85 000; 2026: MRP 4 325, MZP 85 000).
 * - OPV 10 % (cap 50 MZP), OPVR 1.5 % in 2025 → 2.5 % in 2026 (cap 50 MZP) — Social Code.
 * - VOSMS 2 % (cap 20 MZP), OOSMS 3 % (cap 40 MZP) — law on compulsory social health insurance.
 * - SO 5 % of (income − OPV), base 1…7 MZP — Social Code (from 2025).
 * - IPN 10 %; 2025: standard deduction 14 MRP and the 90 % adjustment for income ≤ 25 MRP (old Tax Code);
 *   2026: standard deduction 30 MRP, no 90 % adjustment, 15 % on annual taxable income above 8 500 MRP (new Tax Code).
 * - SN: 2025 — 9.5 % × (income − OPV − VOSMS) − SO; 2026 — 6 % × (income − OPV − VOSMS) without deducting SO
 *   (new Tax Code; the base is assumed unchanged — verify).
 */

export type SalaryYear = 2025 | 2026;
export const SALARY_YEARS: readonly SalaryYear[] = [2026, 2025];

export interface KzConstants {
  year: SalaryYear;
  mrp: number;
  mzp: number;
  opvRate: number;
  opvCapMzp: number;
  vosmsRate: number;
  vosmsCapMzp: number;
  ipnRate: number;
  /** Higher IPN rate on annual taxable income above `ipnHighThresholdMrp` MRP (null = flat). */
  ipnHighRate: number | null;
  ipnHighThresholdMrp: number | null;
  deductionMrp: number;
  /** 90 % adjustment of taxable income when monthly income ≤ `adjustmentLimitMrp` MRP (null = none). */
  adjustmentLimitMrp: number | null;
  soRate: number;
  soMinMzp: number;
  soMaxMzp: number;
  opvrRate: number;
  opvrCapMzp: number;
  oosmsRate: number;
  oosmsCapMzp: number;
  snRate: number;
  /** Whether SO is subtracted from SN. */
  snMinusSo: boolean;
  snMinMzp: number;
}

export const KZ: Record<SalaryYear, KzConstants> = {
  2025: {
    year: 2025,
    mrp: 3932,
    mzp: 85000,
    opvRate: 0.1,
    opvCapMzp: 50,
    vosmsRate: 0.02,
    vosmsCapMzp: 20,
    ipnRate: 0.1,
    ipnHighRate: null,
    ipnHighThresholdMrp: null,
    deductionMrp: 14,
    adjustmentLimitMrp: 25,
    soRate: 0.05,
    soMinMzp: 1,
    soMaxMzp: 7,
    opvrRate: 0.015,
    opvrCapMzp: 50,
    oosmsRate: 0.03,
    oosmsCapMzp: 40,
    snRate: 0.095,
    snMinusSo: true,
    snMinMzp: 1,
  },
  2026: {
    year: 2026,
    mrp: 4325,
    mzp: 85000,
    opvRate: 0.1,
    opvCapMzp: 50,
    vosmsRate: 0.02,
    vosmsCapMzp: 20,
    ipnRate: 0.1,
    ipnHighRate: 0.15,
    ipnHighThresholdMrp: 8500,
    deductionMrp: 30,
    adjustmentLimitMrp: null,
    soRate: 0.05,
    soMinMzp: 1,
    soMaxMzp: 7,
    opvrRate: 0.025,
    opvrCapMzp: 50,
    oosmsRate: 0.03,
    oosmsCapMzp: 40,
    snRate: 0.06,
    snMinusSo: false,
    snMinMzp: 1,
  },
};

export interface SalaryOptions {
  /** Standard deduction (only at the main place of work, on the employee's application). */
  deduction?: boolean;
}

export interface SalaryBreakdown {
  year: SalaryYear;
  gross: number;
  opv: number;
  vosms: number;
  deduction: number;
  /** Taxable income after deductions and (2025) the 90 % adjustment. */
  taxable: number;
  adjusted: boolean;
  ipn: number;
  net: number;
  so: number;
  opvr: number;
  oosms: number;
  sn: number;
  employerTotal: number;
  /** Everything withheld and paid on top: (gross − net) + employer charges. */
  burden: number;
}

/** Round half up to whole tenge (robust to float noise). */
export function tenge(x: number): number {
  return Math.round(Number(x.toPrecision(15)) + 1e-9);
}

export function salaryKz(grossIn: number, year: SalaryYear = 2026, opts: SalaryOptions = {}): SalaryBreakdown {
  const c = KZ[year];
  const gross = Math.max(0, Math.round(grossIn));
  const opv = tenge(Math.min(gross, c.opvCapMzp * c.mzp) * c.opvRate);
  const vosms = tenge(Math.min(gross, c.vosmsCapMzp * c.mzp) * c.vosmsRate);
  const deduction = opts.deduction === false ? 0 : c.deductionMrp * c.mrp;
  let taxable = Math.max(0, gross - opv - vosms - deduction);
  let adjusted = false;
  if (c.adjustmentLimitMrp !== null && gross > 0 && gross <= c.adjustmentLimitMrp * c.mrp) {
    taxable = taxable * 0.1; // 90 % adjustment: only 10 % of the taxable income is taxed
    adjusted = true;
  }
  let ipnRaw = taxable * c.ipnRate;
  if (c.ipnHighRate !== null && c.ipnHighThresholdMrp !== null) {
    // Annualised: the monthly threshold is 1/12 of the annual limit (constant salary assumed).
    const monthlyThreshold = (c.ipnHighThresholdMrp * c.mrp) / 12;
    if (taxable > monthlyThreshold) ipnRaw = monthlyThreshold * c.ipnRate + (taxable - monthlyThreshold) * c.ipnHighRate;
  }
  const ipn = tenge(ipnRaw);
  const net = gross - opv - vosms - ipn;

  const soBase = Math.min(Math.max(gross - opv, c.soMinMzp * c.mzp), c.soMaxMzp * c.mzp);
  const so = gross > 0 ? tenge(soBase * c.soRate) : 0;
  const opvr = tenge(Math.min(gross, c.opvrCapMzp * c.mzp) * c.opvrRate);
  const oosms = tenge(Math.min(gross, c.oosmsCapMzp * c.mzp) * c.oosmsRate);
  const snBase = Math.max(gross - opv - vosms, c.snMinMzp * c.mzp);
  const sn = gross > 0 ? Math.max(0, tenge(snBase * c.snRate) - (c.snMinusSo ? so : 0)) : 0;
  const employerTotal = gross + so + opvr + oosms + sn;
  return {
    year,
    gross,
    opv,
    vosms,
    deduction,
    taxable: Math.round(taxable * 100) / 100,
    adjusted,
    ipn,
    net,
    so,
    opvr,
    oosms,
    sn,
    employerTotal,
    burden: gross - net + so + opvr + oosms + sn,
  };
}

/**
 * Smallest whole-tenge gross salary whose net is at least `net`.
 * Net grows with gross except at the 2025 90 %-adjustment limit (25 MRP), where it drops once —
 * so each monotone piece is searched separately.
 */
export function grossFromNet(net: number, year: SalaryYear = 2026, opts: SalaryOptions = {}): SalaryBreakdown {
  const target = Math.max(0, Math.round(net));
  const c = KZ[year];
  const search = (lo: number, hi: number): number | null => {
    if (salaryKz(hi, year, opts).net < target) return null;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (salaryKz(mid, year, opts).net >= target) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  };
  const limit = c.adjustmentLimitMrp !== null ? c.adjustmentLimitMrp * c.mrp : null;
  if (limit !== null) {
    const low = search(0, limit);
    if (low !== null) return salaryKz(low, year, opts);
  }
  let from = limit !== null ? limit + 1 : 0;
  let hi = Math.max(from + 1, target * 2 + 200_000);
  while (salaryKz(hi, year, opts).net < target) {
    from = hi;
    hi *= 2;
  }
  return salaryKz(search(from, hi) ?? hi, year, opts);
}

/** Curated gross amounts for the variant pages. */
export const SALARY_PAGES = [
  85000, 90000, 100000, 110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000, 200000, 220000, 250000, 280000, 300000, 330000, 350000, 380000, 400000, 450000, 500000,
  550000, 600000, 650000, 700000, 750000, 800000, 900000, 1000000, 1100000, 1200000, 1300000, 1500000, 1700000, 2000000, 2200000, 2500000, 2800000, 3000000,
] as const;
