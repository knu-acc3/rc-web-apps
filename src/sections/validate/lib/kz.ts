/* Kazakhstan IIN (individual identification number) and BIN (business identification number). */

/**
 * Check digit for the first 11 digits: weights 1…11, sum mod 11; if 10, weights 3…11,1,2;
 * if 10 again the number is not valid (null).
 */
export function kzCheckDigit(first11: string): number | null {
  const d = Array.from(first11, Number);
  const w1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const w2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];
  let c = d.reduce((s, x, i) => s + x * w1[i], 0) % 11;
  if (c === 10) c = d.reduce((s, x, i) => s + x * w2[i], 0) % 11;
  return c === 10 ? null : c;
}

export type KzError = "empty" | "chars" | "length" | "checksum" | "date" | "century" | "type" | "attr" | "month";

export interface IinInfo {
  kind: "iin";
  valid: boolean;
  errors: KzError[];
  birth?: { y: number; m: number; d: number };
  gender?: "m" | "f";
  century?: 19 | 20 | 21;
  serial?: string;
}

export interface BinInfo {
  kind: "bin";
  valid: boolean;
  errors: KzError[];
  year?: number;
  month?: number;
  /** 4 — resident legal entity, 5 — non-resident legal entity, 6 — IP(S) joint entrepreneurship */
  type?: 4 | 5 | 6;
  /** 0 — head office, 1 — branch, 2 — representative office, 3 — peasant farm (joint) */
  attr?: 0 | 1 | 2 | 3;
  serial?: string;
}

const clean = (s: string) => s.replace(/[\s-]/g, "");

function checksumOk(s: string): boolean {
  const c = kzCheckDigit(s.slice(0, 11));
  return c !== null && c === Number(s[11]);
}

export function isRealDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1) return false;
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= dim;
}

export function parseIin(input: string): IinInfo {
  const s = clean(input);
  const out: IinInfo = { kind: "iin", valid: false, errors: [] };
  if (!s) return { ...out, errors: ["empty"] };
  if (!/^\d+$/.test(s)) return { ...out, errors: ["chars"] };
  if (s.length !== 12) return { ...out, errors: ["length"] };
  const cd = Number(s[6]);
  if (cd < 1 || cd > 6) out.errors.push("century");
  else {
    out.century = cd <= 2 ? 19 : cd <= 4 ? 20 : 21;
    out.gender = cd % 2 === 1 ? "m" : "f";
    const y = (out.century - 1) * 100 + Number(s.slice(0, 2));
    const m = Number(s.slice(2, 4));
    const d = Number(s.slice(4, 6));
    if (isRealDate(y, m, d)) out.birth = { y, m, d };
    else out.errors.push("date");
  }
  out.serial = s.slice(7, 11);
  if (!checksumOk(s)) out.errors.push("checksum");
  out.valid = out.errors.length === 0;
  return out;
}

export function parseBin(input: string): BinInfo {
  const s = clean(input);
  const out: BinInfo = { kind: "bin", valid: false, errors: [] };
  if (!s) return { ...out, errors: ["empty"] };
  if (!/^\d+$/.test(s)) return { ...out, errors: ["chars"] };
  if (s.length !== 12) return { ...out, errors: ["length"] };
  const month = Number(s.slice(2, 4));
  if (month < 1 || month > 12) out.errors.push("month");
  else {
    out.month = month;
    // registrations since Kazakhstan's independence: 91–99 → 1990s, otherwise 2000s
    const yy = Number(s.slice(0, 2));
    out.year = yy >= 91 ? 1900 + yy : 2000 + yy;
  }
  const type = Number(s[4]);
  if (type === 4 || type === 5 || type === 6) out.type = type;
  else out.errors.push("type");
  const attr = Number(s[5]);
  if (attr <= 3) out.attr = attr as 0 | 1 | 2 | 3;
  else out.errors.push("attr");
  out.serial = s.slice(6, 11);
  if (!checksumOk(s)) out.errors.push("checksum");
  out.valid = out.errors.length === 0;
  return out;
}

/** IIN and BIN never overlap: in an IIN the 5th digit is a day's tens (0–3), in a BIN it is 4–6. */
export function detectKz(input: string): "iin" | "bin" {
  const s = clean(input);
  return /^\d{4}[456]/.test(s) ? "bin" : "iin";
}
