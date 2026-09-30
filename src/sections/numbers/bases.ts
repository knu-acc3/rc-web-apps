/**
 * Number base conversion (2–36) with exact BigInt arithmetic:
 * integers of any length, fractional parts (with repeating-period detection),
 * 0x/0b/0o prefixes and two's complement for 8/16/32/64 bits.
 */

export const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
export const MAX_INPUT_DIGITS = 4096;

/** value = ±(int + num/den), 0 ≤ num < den. */
export interface BaseValue {
  neg: boolean;
  int: bigint;
  num: bigint;
  den: bigint;
}

export type BaseParse =
  | { ok: true; value: BaseValue; base: number; prefix: string | null; hasFrac: boolean }
  | { ok: false; error: "empty" | "digit" | "too-long" | "format"; char?: string; base: number };

const PREFIX_BASE: Record<string, number> = { x: 16, b: 2, o: 8 };

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) [x, y] = [y, x % y];
  return x;
}

/**
 * Parse a number written in `base`. A 0x / 0b / 0o prefix switches the base in any mode,
 * unless its letter is a valid digit of the current base (in hex, "0b1" is the hex number B1).
 * Accepts "-" / "−", spaces, underscores and apostrophes as group separators,
 * "." or "," as the fraction separator (in base 10, 1,000,000 is read as thousands).
 */
export function parseBase(input: string, base: number): BaseParse {
  let s = input.trim().replace(/[\s_'’  ]/g, "").replace(/^[−–]/, "-");
  if (!s) return { ok: false, error: "empty", base };
  let neg = false;
  if (s[0] === "-" || s[0] === "+") {
    neg = s[0] === "-";
    s = s.slice(1);
  }
  let b = base;
  let prefix: string | null = null;
  const pm = /^0([xbo])/i.exec(s);
  if (pm) {
    const letter = pm[1].toLowerCase();
    if (DIGITS.indexOf(letter) >= base) {
      b = PREFIX_BASE[letter];
      prefix = `0${letter}`;
      s = s.slice(2);
    }
  }
  if (b === 10 && /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  const seps = s.match(/[.,]/g);
  if (seps && seps.length > 1) return { ok: false, error: "format", base: b };
  const [intStr, fracStr = ""] = s.split(/[.,]/);
  if (!intStr && !fracStr) return { ok: false, error: "empty", base: b };
  if (intStr.length + fracStr.length > MAX_INPUT_DIGITS) return { ok: false, error: "too-long", base: b };
  const B = BigInt(b);
  let int = 0n;
  for (const c of intStr) {
    const d = DIGITS.indexOf(c.toLowerCase());
    if (d < 0 || d >= b) return { ok: false, error: "digit", char: c, base: b };
    int = int * B + BigInt(d);
  }
  let num = 0n;
  let den = 1n;
  for (const c of fracStr) {
    const d = DIGITS.indexOf(c.toLowerCase());
    if (d < 0 || d >= b) return { ok: false, error: "digit", char: c, base: b };
    num = num * B + BigInt(d);
    den *= B;
  }
  const g = gcd(num, den) || 1n;
  num /= g;
  den /= g;
  if (int === 0n && num === 0n) neg = false;
  return { ok: true, value: { neg, int, num, den }, base: b, prefix, hasFrac: fracStr.length > 0 };
}

export interface Formatted {
  neg: boolean;
  int: string;
  /** Non-repeating fraction digits. */
  frac: string;
  /** Repeating period (0.1₁₀ = 0.0(0011)₂), "" if the fraction terminates or was cut. */
  repeat: string;
  /** The fraction neither terminated nor repeated within `maxFrac` digits. */
  truncated: boolean;
}

export function formatBase(v: BaseValue, base: number, maxFrac = 32, upper = true): Formatted {
  const cs = (x: string) => (upper ? x.toUpperCase() : x);
  const int = cs(v.int.toString(base));
  let frac = "";
  let repeat = "";
  let truncated = false;
  if (v.num !== 0n) {
    const B = BigInt(base);
    const seen = new Map<bigint, number>();
    const digits: string[] = [];
    let r = v.num;
    while (r !== 0n) {
      const at = seen.get(r);
      if (at !== undefined) {
        frac = digits.slice(0, at).join("");
        repeat = digits.slice(at).join("");
        break;
      }
      if (digits.length >= maxFrac) {
        truncated = true;
        break;
      }
      seen.set(r, digits.length);
      r *= B;
      digits.push(DIGITS[Number(r / v.den)]);
      r %= v.den;
    }
    if (!repeat) frac = digits.join("");
    frac = cs(frac);
    repeat = cs(repeat);
  }
  return { neg: v.neg, int, frac, repeat, truncated };
}

/** Plain string: "-1A.8", "0.0(0011)", "0.333…" */
export function formattedText(f: Formatted, sep = "."): string {
  let s = (f.neg ? "-" : "") + f.int;
  if (f.frac || f.repeat) s += sep + f.frac + (f.repeat ? `(${f.repeat})` : "");
  if (f.truncated) s += "…";
  return s;
}

/** Group digits from the right: ("11111111", 4) → "1111 1111". */
export function groupDigits(s: string, size: number, sep = " "): string {
  if (size <= 0 || s.length <= size) return s;
  const out: string[] = [];
  for (let i = s.length; i > 0; i -= size) out.unshift(s.slice(Math.max(0, i - size), i));
  return out.join(sep);
}

/** Group fraction digits from the left. */
export function groupFrac(s: string, size: number, sep = " "): string {
  if (size <= 0 || s.length <= size) return s;
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out.join(sep);
}

export const TWOS_BITS = [8, 16, 32, 64] as const;
export type TwosBits = (typeof TWOS_BITS)[number];

export function signedRange(bits: number): [bigint, bigint] {
  const half = 1n << BigInt(bits - 1);
  return [-half, half - 1n];
}

/** Two's complement bit pattern (as an unsigned integer) of a signed value, or null if it doesn't fit. */
export function toTwos(v: bigint, bits: number): bigint | null {
  const [lo, hi] = signedRange(bits);
  if (v < lo || v > hi) return null;
  return v < 0n ? (1n << BigInt(bits)) + v : v;
}

/** Signed value of an n-bit pattern, or null if the pattern is wider than n bits. */
export function fromTwos(u: bigint, bits: number): bigint | null {
  if (u < 0n || u >= 1n << BigInt(bits)) return null;
  return u >= 1n << BigInt(bits - 1) ? u - (1n << BigInt(bits)) : u;
}

export function signedValue(v: BaseValue): bigint {
  return v.neg ? -v.int : v.int;
}

/** Repeated division steps (decimal → base): n = q × base + r. */
export function divisionSteps(n: bigint, base: number, limit = 64): { n: bigint; q: bigint; r: number }[] {
  const out: { n: bigint; q: bigint; r: number }[] = [];
  const B = BigInt(base);
  let x = n;
  while (x > 0n && out.length < limit) {
    out.push({ n: x, q: x / B, r: Number(x % B) });
    x /= B;
  }
  return out;
}

/** Positional expansion terms (base → decimal): digit × base^power. */
export function expansionTerms(digits: string, base: number): { digit: number; power: number; value: bigint }[] {
  const out: { digit: number; power: number; value: bigint }[] = [];
  const B = BigInt(base);
  const n = digits.length;
  for (let i = 0; i < n; i++) {
    const d = DIGITS.indexOf(digits[i].toLowerCase());
    const power = n - 1 - i;
    out.push({ digit: d, power, value: BigInt(d) * B ** BigInt(power) });
  }
  return out;
}

/** Convert a plain integer string between bases (used for SSR tables). */
export function convertInt(text: string, from: number, to: number, upper = true): string {
  const p = parseBase(text, from);
  if (!p.ok) return "";
  const s = formattedText(formatBase(p.value, to, 32, upper));
  return s;
}
