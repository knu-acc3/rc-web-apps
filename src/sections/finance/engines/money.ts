/** Small pure engines: VAT, discounts, tips, markup/margin, break-even, ROI/CAGR, unit prices, budget. */

const cents = (x: number) => Math.sign(x) * Math.round(Number(Math.abs(x * 100).toPrecision(15))) || 0;
const r2 = (x: number) => cents(x) / 100;

/* ───────────── VAT ───────────── */

export interface VatPreset {
  id: string;
  country: "kz" | "ru";
  year: number;
  rate: number;
}

/** Standard VAT rates. Kazakhstan: 12 % until 2025, 16 % from 1 January 2026 (new Tax Code). Russia: 20 % until 2025, 22 % from 2026; 10 % reduced rate. */
export const VAT_PRESETS: VatPreset[] = [
  { id: "kz-2026", country: "kz", year: 2026, rate: 16 },
  { id: "kz-2025", country: "kz", year: 2025, rate: 12 },
  { id: "ru-2026", country: "ru", year: 2026, rate: 22 },
  { id: "ru-2025", country: "ru", year: 2025, rate: 20 },
  { id: "ru-10", country: "ru", year: 2026, rate: 10 },
];

export interface VatResult {
  net: number;
  vat: number;
  gross: number;
}

/** Add VAT to a net amount (rounded to the minor unit). */
export function addVat(net: number, rate: number): VatResult {
  const vat = r2((net * rate) / 100);
  return { net: r2(net), vat, gross: r2(net + vat) };
}

/** Extract VAT from a gross amount: VAT = gross × r / (100 + r). */
export function extractVat(gross: number, rate: number): VatResult {
  const vat = r2((gross * rate) / (100 + rate));
  return { net: r2(gross - vat), vat, gross: r2(gross) };
}

/* ───────────── Discounts ───────────── */

export function discountPrice(price: number, pct: number): { final: number; saved: number } {
  const saved = r2((price * pct) / 100);
  return { final: r2(price - saved), saved };
}

/** Original price from the sale price and the discount percent. */
export function originalPrice(sale: number, pct: number): number | null {
  if (pct >= 100) return null;
  return r2(sale / (1 - pct / 100));
}

/** Discount percent from the original and sale prices. */
export function discountPercent(original: number, sale: number): number | null {
  if (original <= 0) return null;
  return ((original - sale) / original) * 100;
}

/** Effective discount of several consecutive discounts (percent). */
export function stackedDiscount(pcts: number[]): number {
  return (1 - pcts.reduce((f, p) => f * (1 - p / 100), 1)) * 100;
}

/* ───────────── Tips ───────────── */

export interface TipResult {
  tip: number;
  total: number;
  /** What each person pays; the shares always add up to `collected`. */
  shares: number[];
  /** Total actually collected (≥ total when rounding up). */
  collected: number;
  /** Tip actually left (collected − bill). */
  actualTip: number;
  actualPct: number;
}

/**
 * Split a bill with a tip between `people`, rounding each share UP to `step` (currency units).
 * step = 0.01 → exact split: the total is distributed in minor units, the first people pay one
 * minor unit more if it does not divide evenly (100 / 3 → 33.34 + 33.33 + 33.33).
 * Coarser steps → everyone pays the same rounded-up share and the tip grows accordingly.
 */
export function splitTip(bill: number, tipPct: number, people: number, step = 0.01): TipResult {
  const n = Math.max(1, Math.round(people));
  const tip = r2((bill * tipPct) / 100);
  const total = r2(bill + tip);
  const stepMinor = Math.max(1, cents(step));
  let shares: number[];
  if (stepMinor === 1) {
    const totalMinor = cents(total);
    const base = Math.floor(totalMinor / n);
    const extra = totalMinor - base * n;
    shares = Array.from({ length: n }, (_, i) => (base + (i < extra ? 1 : 0)) / 100);
  } else {
    const per = Math.ceil(cents(total) / n / stepMinor) * stepMinor;
    shares = Array.from({ length: n }, () => per / 100);
  }
  const collected = r2(shares.reduce((s, x) => s + x, 0));
  return { tip, total, shares, collected, actualTip: r2(collected - bill), actualPct: bill > 0 ? ((collected - bill) / bill) * 100 : 0 };
}

/* ───────────── Markup & margin ───────────── */

export interface MarginResult {
  cost: number;
  price: number;
  profit: number;
  markup: number | null;
  margin: number | null;
}

export function fromCostPrice(cost: number, price: number): MarginResult {
  const profit = price - cost;
  return { cost, price, profit, markup: cost > 0 ? (profit / cost) * 100 : null, margin: price > 0 ? (profit / price) * 100 : null };
}

export function priceFromMarkup(cost: number, markupPct: number): MarginResult {
  return fromCostPrice(cost, cost * (1 + markupPct / 100));
}

export function priceFromMargin(cost: number, marginPct: number): MarginResult | null {
  if (marginPct >= 100) return null;
  return fromCostPrice(cost, cost / (1 - marginPct / 100));
}

export const markupToMargin = (m: number) => (m / (100 + m)) * 100;
export const marginToMarkup = (m: number) => (m >= 100 ? Infinity : (m / (100 - m)) * 100);

/* ───────────── Break-even ───────────── */

export interface BreakEven {
  units: number;
  /** Units rounded up to a whole item. */
  unitsCeil: number;
  revenue: number;
  contribution: number;
  contributionRatio: number;
}

export function breakEven(fixed: number, variable: number, price: number): BreakEven | null {
  const contribution = price - variable;
  if (contribution <= 0) return null;
  const units = fixed / contribution;
  return { units, unitsCeil: Math.ceil(units - 1e-9), revenue: units * price, contribution, contributionRatio: (contribution / price) * 100 };
}

/* ───────────── ROI & CAGR ───────────── */

export function roi(initial: number, final: number): number | null {
  if (initial <= 0) return null;
  return ((final - initial) / initial) * 100;
}

/** Compound annual growth rate (percent). */
export function cagr(start: number, end: number, years: number): number | null {
  if (start <= 0 || end < 0 || years <= 0) return null;
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}

/* ───────────── Unit price ───────────── */

export type PackUnit = "g" | "kg" | "ml" | "l" | "pcs";
export const PACK_UNITS: readonly PackUnit[] = ["g", "kg", "ml", "l", "pcs"];

/** Price per base unit: per kg (g, kg), per litre (ml, l) or per piece. */
export function unitPrice(price: number, qty: number, unit: PackUnit): { perBase: number; base: "kg" | "l" | "pcs" } | null {
  if (qty <= 0 || price < 0) return null;
  if (unit === "g") return { perBase: (price / qty) * 1000, base: "kg" };
  if (unit === "kg") return { perBase: price / qty, base: "kg" };
  if (unit === "ml") return { perBase: (price / qty) * 1000, base: "l" };
  if (unit === "l") return { perBase: price / qty, base: "l" };
  return { perBase: price / qty, base: "pcs" };
}

/* ───────────── Budget ───────────── */

export type Bucket = "needs" | "wants" | "savings";
export const BUCKETS: readonly Bucket[] = ["needs", "wants", "savings"];

export function rule503020(income: number): Record<Bucket, number> {
  return { needs: r2(income * 0.5), wants: r2(income * 0.3), savings: r2(income * 0.2) };
}
