/* Payment card numbers: Luhn checksum and brand detection by IIN (issuer identification number) ranges. */

export type Brand = "visa" | "mastercard" | "mir" | "amex" | "unionpay" | "jcb" | "maestro" | "discover" | "diners";

export interface BrandInfo {
  id: Brand;
  name: string;
  lengths: number[];
  /** Grouping for display, e.g. [4,6,5] for Amex. */
  groups: number[];
  cvcLength: number;
}

export const BRANDS: Record<Brand, BrandInfo> = {
  visa: { id: "visa", name: "Visa", lengths: [13, 16, 19], groups: [4, 4, 4, 4, 3], cvcLength: 3 },
  mastercard: { id: "mastercard", name: "Mastercard", lengths: [16], groups: [4, 4, 4, 4], cvcLength: 3 },
  mir: { id: "mir", name: "Мир", lengths: [16, 17, 18, 19], groups: [4, 4, 4, 4, 3], cvcLength: 3 },
  amex: { id: "amex", name: "American Express", lengths: [15], groups: [4, 6, 5], cvcLength: 4 },
  unionpay: { id: "unionpay", name: "UnionPay", lengths: [16, 17, 18, 19], groups: [4, 4, 4, 4, 3], cvcLength: 3 },
  jcb: { id: "jcb", name: "JCB", lengths: [16, 17, 18, 19], groups: [4, 4, 4, 4, 3], cvcLength: 3 },
  maestro: { id: "maestro", name: "Maestro", lengths: [12, 13, 14, 15, 16, 17, 18, 19], groups: [4, 4, 4, 4, 3], cvcLength: 3 },
  discover: { id: "discover", name: "Discover", lengths: [16, 17, 18, 19], groups: [4, 4, 4, 4, 3], cvcLength: 3 },
  diners: { id: "diners", name: "Diners Club", lengths: [14, 15, 16, 17, 18, 19], groups: [4, 6, 4], cvcLength: 3 },
};

/** [brand, from, to] on a prefix of the given length. Checked longest prefix first. */
const RANGES: [Brand, string, string][] = [
  ["mir", "2200", "2204"],
  ["mastercard", "2221", "2720"],
  ["mastercard", "51", "55"],
  ["amex", "34", "34"],
  ["amex", "37", "37"],
  ["jcb", "3528", "3589"],
  ["diners", "300", "305"],
  ["diners", "3095", "3095"],
  ["diners", "36", "36"],
  ["diners", "38", "39"],
  ["discover", "6011", "6011"],
  ["discover", "644", "649"],
  ["discover", "65", "65"],
  ["unionpay", "62", "62"],
  ["maestro", "5018", "5018"],
  ["maestro", "5020", "5020"],
  ["maestro", "5038", "5038"],
  ["maestro", "5893", "5893"],
  ["maestro", "6304", "6304"],
  ["maestro", "6759", "6759"],
  ["maestro", "6761", "6763"],
  ["visa", "4", "4"],
];
const SORTED = [...RANGES].sort((a, b) => b[1].length - a[1].length);

export function detectBrand(digits: string): BrandInfo | null {
  for (const [brand, from, to] of SORTED) {
    const n = from.length;
    if (digits.length < n) continue;
    const p = digits.slice(0, n);
    if (p >= from && p <= to) return BRANDS[brand];
  }
  return null;
}

/** Luhn (mod 10) check. */
export function luhn(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits.charCodeAt(digits.length - 1 - i) - 48;
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** The digit that completes `partial` to a Luhn-valid number. */
export function luhnCheckDigit(partial: string): number {
  for (let d = 0; d <= 9; d++) if (luhn(partial + d)) return d;
  return 0;
}

export function formatCard(digits: string, brand: BrandInfo | null): string {
  const groups = brand?.groups ?? [4, 4, 4, 4, 4];
  const out: string[] = [];
  let i = 0;
  for (const g of groups) {
    if (i >= digits.length) break;
    out.push(digits.slice(i, i + g));
    i += g;
  }
  if (i < digits.length) out.push(digits.slice(i));
  return out.join(" ");
}

export type CardError = "empty" | "chars" | "short" | "long" | "length" | "luhn";

export interface CardResult {
  digits: string;
  brand: BrandInfo | null;
  valid: boolean;
  errors: CardError[];
  formatted: string;
}

export function validateCard(input: string): CardResult {
  const raw = input.replace(/[\s-]/g, "");
  const base = { digits: raw, brand: null, valid: false, formatted: raw };
  if (!raw) return { ...base, errors: ["empty"] };
  if (!/^\d+$/.test(raw)) return { ...base, errors: ["chars"] };
  const brand = detectBrand(raw);
  const errors: CardError[] = [];
  if (raw.length < 12) errors.push("short");
  else if (raw.length > 19) errors.push("long");
  else if (brand && !brand.lengths.includes(raw.length)) errors.push("length");
  if (raw.length >= 12 && !luhn(raw)) errors.push("luhn");
  return { digits: raw, brand, valid: errors.length === 0, errors, formatted: formatCard(raw, brand) };
}
