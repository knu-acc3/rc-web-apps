/* Check digits for retail and book codes. Pure, unit-tested. */

/** GS1 mod-10 check digit for EAN-8, UPC-A (12), EAN-13 and GTIN-14: weights 3,1,3,… from the right. */
export function gs1Check(body: string): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const d = body.charCodeAt(body.length - 1 - i) - 48;
    sum += d * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

export interface CheckStep {
  digit: number;
  weight: number;
  product: number;
}

/** Step-by-step GS1 computation (left to right) for display. */
export function gs1Steps(body: string): { steps: CheckStep[]; sum: number; check: number } {
  const steps: CheckStep[] = [];
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const digit = body.charCodeAt(i) - 48;
    const weight = (body.length - i) % 2 === 1 ? 3 : 1;
    steps.push({ digit, weight, product: digit * weight });
    sum += digit * weight;
  }
  return { steps, sum, check: (10 - (sum % 10)) % 10 };
}

export function isbn10Check(body9: string): string {
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (body9.charCodeAt(i) - 48) * (10 - i);
  const c = (11 - (sum % 11)) % 11;
  return c === 10 ? "X" : String(c);
}

export function isbn10Steps(body9: string): { steps: CheckStep[]; sum: number; check: string } {
  const steps: CheckStep[] = [];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = body9.charCodeAt(i) - 48;
    steps.push({ digit, weight: 10 - i, product: digit * (10 - i) });
    sum += digit * (10 - i);
  }
  return { steps, sum, check: isbn10Check(body9) };
}

/** MSI (Modified Plessey) mod-10 check digit: Luhn-style doubling of alternate digits from the right. */
export function msiMod10(body: string): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    let d = body.charCodeAt(body.length - 1 - i) - 48;
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

/** Expand a UPC-E (number system 0/1 + 6 digits) to its UPC-A body (11 digits, without check). */
export function upcEToA(ns: string, six: string): string | null {
  if (!/^[01]$/.test(ns) || !/^\d{6}$/.test(six)) return null;
  const [d1, d2, d3, d4, d5, d6] = six;
  let m: string;
  switch (d6) {
    case "0":
    case "1":
    case "2":
      m = `${d1}${d2}${d6}0000${d3}${d4}${d5}`;
      break;
    case "3":
      m = `${d1}${d2}${d3}00000${d4}${d5}`;
      break;
    case "4":
      m = `${d1}${d2}${d3}${d4}00000${d5}`;
      break;
    default:
      m = `${d1}${d2}${d3}${d4}${d5}0000${d6}`;
  }
  return ns + m;
}

/** Validate a full GS1 code (last digit is the check digit). */
export function gs1Valid(code: string): boolean {
  return /^\d{8}$|^\d{12,14}$/.test(code) && gs1Check(code.slice(0, -1)) === Number(code[code.length - 1]);
}
