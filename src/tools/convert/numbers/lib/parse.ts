/** Exact decimal number typed by a user, kept as digits (no floating point). */
interface DecimalInput {
  neg: boolean;
  int: bigint;
  /** Digits after the decimal separator exactly as typed ("" if none). */
  frac: string;
}

/**
 * Parse "1 234 567,89", "1,234,567.89", "−12.5", "1'000" into exact digits.
 * A single comma is a decimal comma; commas in 3-digit groups (1,000,000) are thousands.
 */
export function parseDecimalInput(input: string): DecimalInput | null {
  let s = input.trim().replace(/[\s  '’_]/g, "").replace(/^[−–]/, "-");
  if (!s) return null;
  let neg = false;
  if (s[0] === "-" || s[0] === "+") {
    neg = s[0] === "-";
    s = s.slice(1);
  }
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  if (hasDot && hasComma) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (hasComma) {
    s = /^\d{1,3}(,\d{3}){2,}$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (hasDot && /^\d{1,3}(\.\d{3}){2,}$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  const m = /^(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m || (!m[1] && !m[2])) return null;
  const int = BigInt(m[1] || "0");
  const frac = m[2] ?? "";
  if (int === 0n && !/[1-9]/.test(frac)) neg = false;
  return { neg, int, frac };
}

/** Group an integer digit string by thousands with a narrow no-break space ("1 234 567"). */
export function groupThousands(digits: string, sep = " "): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}
