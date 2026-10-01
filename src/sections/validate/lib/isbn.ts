/* ISBN-10 and ISBN-13 check digits and conversion. */

function isbn10Check(first9: string): string {
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(first9[i]) * (10 - i);
  const c = (11 - (sum % 11)) % 11;
  return c === 10 ? "X" : String(c);
}

function isbn13Check(first12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
  return String((10 - (sum % 10)) % 10);
}

export type IsbnError = "empty" | "chars" | "length" | "checksum" | "prefix";

interface IsbnResult {
  valid: boolean;
  errors: IsbnError[];
  kind?: 10 | 13;
  normalized: string;
  isbn10?: string;
  isbn13?: string;
  expected?: string;
}

export function validateIsbn(input: string): IsbnResult {
  const s = input.replace(/^ISBN(?:-1[03])?:?\s*/i, "").replace(/[\s-]/g, "").toUpperCase();
  if (!s) return { valid: false, errors: ["empty"], normalized: s };
  if (s.length === 10) {
    if (!/^\d{9}[\dX]$/.test(s)) return { valid: false, errors: ["chars"], normalized: s };
    const c = isbn10Check(s.slice(0, 9));
    const ok = c === s[9];
    const body13 = `978${s.slice(0, 9)}`;
    return { valid: ok, errors: ok ? [] : ["checksum"], kind: 10, normalized: s, isbn10: ok ? s : undefined, isbn13: ok ? body13 + isbn13Check(body13) : undefined, expected: ok ? undefined : s.slice(0, 9) + c };
  }
  if (s.length === 13) {
    if (!/^\d{13}$/.test(s)) return { valid: false, errors: ["chars"], normalized: s };
    const errors: IsbnError[] = [];
    if (!s.startsWith("978") && !s.startsWith("979")) errors.push("prefix");
    const c = isbn13Check(s.slice(0, 12));
    if (c !== s[12]) errors.push("checksum");
    const ok = errors.length === 0;
    return {
      valid: ok,
      errors,
      kind: 13,
      normalized: s,
      isbn13: ok ? s : undefined,
      isbn10: ok && s.startsWith("978") ? s.slice(3, 12) + isbn10Check(s.slice(3, 12)) : undefined,
      expected: errors.includes("checksum") ? s.slice(0, 12) + c : undefined,
    };
  }
  if (!/^[\dX]+$/.test(s)) return { valid: false, errors: ["chars"], normalized: s };
  return { valid: false, errors: ["length"], normalized: s };
}
