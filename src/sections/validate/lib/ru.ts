/* Russian identifiers: ИНН (taxpayer number), СНИЛС (pension insurance number), ОГРН/ОГРНИП (state registration numbers). */

const clean = (s: string) => s.replace(/[\s\-]/g, "");
const digits = (s: string) => Array.from(s, Number);
const weighted = (d: number[], w: number[]) => w.reduce((s, x, i) => s + x * d[i], 0);

export type RuError = "empty" | "chars" | "length" | "checksum" | "checksum2" | "zero";

export interface InnResult {
  valid: boolean;
  errors: RuError[];
  kind?: "legal" | "person";
  region?: string;
  expected?: string;
}

const W10 = [2, 4, 10, 3, 5, 9, 4, 6, 8];
const W11 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
const W12 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];

export function innCheck10(first9: string): number {
  return (weighted(digits(first9), W10) % 11) % 10;
}
export function innCheck12(first10: string): [number, number] {
  const a = (weighted(digits(first10), W11) % 11) % 10;
  const b = (weighted(digits(first10 + a), W12) % 11) % 10;
  return [a, b];
}

export function validateInn(input: string): InnResult {
  const s = clean(input);
  if (!s) return { valid: false, errors: ["empty"] };
  if (!/^\d+$/.test(s)) return { valid: false, errors: ["chars"] };
  if (s.length === 10) {
    const c = innCheck10(s.slice(0, 9));
    const ok = c === Number(s[9]);
    return { valid: ok, errors: ok ? [] : ["checksum"], kind: "legal", region: s.slice(0, 2), expected: ok ? undefined : s.slice(0, 9) + c };
  }
  if (s.length === 12) {
    const [a, b] = innCheck12(s.slice(0, 10));
    const errors: RuError[] = [];
    if (a !== Number(s[10])) errors.push("checksum");
    if (b !== Number(s[11])) errors.push("checksum2");
    return { valid: errors.length === 0, errors, kind: "person", region: s.slice(0, 2), expected: errors.length ? `${s.slice(0, 10)}${a}${b}` : undefined };
  }
  return { valid: false, errors: ["length"] };
}

export interface SnilsResult {
  valid: boolean;
  errors: RuError[];
  formatted?: string;
  /** Numbers up to 001-001-998 have no checksum. */
  noChecksum?: boolean;
  expected?: string;
}

export function snilsCheck(first9: string): string {
  const d = digits(first9);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += d[i] * (9 - i);
  let c: number;
  if (sum < 100) c = sum;
  else if (sum === 100 || sum === 101) c = 0;
  else {
    c = sum % 101;
    if (c === 100) c = 0;
  }
  return String(c).padStart(2, "0");
}

export function formatSnils(s: string): string {
  return `${s.slice(0, 3)}-${s.slice(3, 6)}-${s.slice(6, 9)} ${s.slice(9, 11)}`;
}

export function validateSnils(input: string): SnilsResult {
  const s = clean(input);
  if (!s) return { valid: false, errors: ["empty"] };
  if (!/^\d+$/.test(s)) return { valid: false, errors: ["chars"] };
  if (s.length !== 11) return { valid: false, errors: ["length"] };
  const formatted = formatSnils(s);
  if (/^0+$/.test(s)) return { valid: false, errors: ["zero"], formatted };
  if (Number(s.slice(0, 9)) <= 1001998) return { valid: true, errors: [], formatted, noChecksum: true };
  const c = snilsCheck(s.slice(0, 9));
  const ok = c === s.slice(9);
  return { valid: ok, errors: ok ? [] : ["checksum"], formatted, expected: ok ? undefined : formatSnils(s.slice(0, 9) + c) };
}

export interface OgrnResult {
  valid: boolean;
  errors: RuError[];
  kind?: "ogrn" | "ogrnip";
  /** First digit: 1/5 — legal entity (OGRN), 3 — sole proprietor (OGRNIP), others — other state registration numbers */
  sign?: number;
  year?: number;
  region?: string;
  expected?: string;
}

/** Control digit: (number formed by the first n−1 digits mod (11 or 13)) mod 10, using BigInt for 14 digits. */
export function ogrnCheck(body: string): number {
  const mod = body.length === 12 ? 11n : 13n;
  return Number((BigInt(body) % mod) % 10n);
}

export function validateOgrn(input: string): OgrnResult {
  const s = clean(input);
  if (!s) return { valid: false, errors: ["empty"] };
  if (!/^\d+$/.test(s)) return { valid: false, errors: ["chars"] };
  if (s.length !== 13 && s.length !== 15) return { valid: false, errors: ["length"] };
  const kind = s.length === 13 ? "ogrn" : "ogrnip";
  const body = s.slice(0, -1);
  const c = ogrnCheck(body);
  const ok = c === Number(s[s.length - 1]);
  const yy = Number(s.slice(1, 3));
  return {
    valid: ok,
    errors: ok ? [] : ["checksum"],
    kind,
    sign: Number(s[0]),
    // OGRN numbers are assigned since 2002, so the two digits are always 20YY
    year: 2000 + yy,
    region: s.slice(3, 5),
    expected: ok ? undefined : body + c,
  };
}
