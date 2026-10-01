/* Password generation with unbiased randomness and exact entropy. Pure: the random source is injected. */

/** Fills the array with uniformly random 32-bit values (crypto.getRandomValues in the browser). */
export type RandomSource = (buf: Uint32Array) => Uint32Array;

export const cryptoSource: RandomSource = (buf) => crypto.getRandomValues(buf);

/** Uniform integer in [0, n) by rejection sampling (no modulo bias). */
export function randomInt(n: number, rng: RandomSource): number {
  if (!Number.isInteger(n) || n <= 0 || n > 2 ** 32) throw new RangeError(`bad range ${n}`);
  if (n === 1) return 0;
  const limit = 2 ** 32 - (2 ** 32 % n); // largest multiple of n that fits
  const buf = new Uint32Array(1);
  for (;;) {
    const x = rng(buf)[0];
    if (x < limit) return x % n;
  }
}

function pick<T>(items: readonly T[], rng: RandomSource): T {
  return items[randomInt(items.length, rng)];
}

/** Fisher–Yates shuffle with unbiased indices. */
export function shuffle<T>(arr: T[], rng: RandomSource): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const LOWER = "abcdefghijklmnopqrstuvwxyz";
export const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const DIGITS = "0123456789";
/** All printable ASCII punctuation (32 characters). */
export const SYMBOLS = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
/** Characters easily confused with each other in many fonts. */
export const AMBIGUOUS = "Il1|O0o";

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  /** Custom symbol set (defaults to SYMBOLS). */
  symbolSet?: string;
  excludeAmbiguous: boolean;
  /** Require at least one character from every selected class. */
  requireEach: boolean;
}

const uniq = (s: string) => [...new Set(s)].join("");

export function classesOf(o: PasswordOptions): string[] {
  const drop = (s: string) => (o.excludeAmbiguous ? [...s].filter((c) => !AMBIGUOUS.includes(c)).join("") : s);
  const out: string[] = [];
  if (o.lower) out.push(drop(LOWER));
  if (o.upper) out.push(drop(UPPER));
  if (o.digits) out.push(drop(DIGITS));
  if (o.symbols) out.push(drop(uniq(o.symbolSet ?? SYMBOLS).replace(/[\sA-Za-z0-9]/g, "")));
  // a character may only belong to one class (custom symbols could repeat letters)
  const seen = new Set<string>();
  return out
    .map((cls) =>
      [...cls]
        .filter((c) => {
          if (seen.has(c)) return false;
          seen.add(c);
          return true;
        })
        .join(""),
    )
    .filter(Boolean);
}

function hasEach(s: string, classes: string[]): boolean {
  return classes.every((cls) => [...s].some((c) => cls.includes(c)));
}

/**
 * Uniform over all strings of the union alphabet that contain every class (when requireEach):
 * generate uniformly and reject until the requirement holds. Exact, unbiased.
 */
export function generatePassword(o: PasswordOptions, rng: RandomSource): string {
  const classes = classesOf(o);
  if (!classes.length || o.length < 1) return "";
  const alphabet = [...classes.join("")];
  const need = o.requireEach && o.length >= classes.length;
  for (let attempt = 0; attempt < 10_000; attempt++) {
    let s = "";
    for (let i = 0; i < o.length; i++) s += alphabet[randomInt(alphabet.length, rng)];
    if (!need || hasEach(s, classes)) return s;
  }
  // practically unreachable; keep correctness by constructing one per class
  const chars = classes.map((c) => pick([...c], rng));
  while (chars.length < o.length) chars.push(pick(alphabet, rng));
  return shuffle(chars, rng).join("");
}

/** log2 of a positive BigInt with double precision. */
export function log2Big(n: bigint): number {
  if (n <= 0n) return 0;
  const bits = n.toString(2).length;
  if (bits <= 52) return Math.log2(Number(n));
  const shift = BigInt(bits - 52);
  return Math.log2(Number(n >> shift)) + Number(shift);
}

/** Number of length-L strings over the classes' union that contain ≥1 char of every class (inclusion–exclusion). */
export function countWithEach(sizes: number[], length: number): bigint {
  const n = sizes.reduce((a, b) => a + b, 0);
  let total = 0n;
  const k = sizes.length;
  for (let mask = 0; mask < 1 << k; mask++) {
    let removed = 0;
    let bitsSet = 0;
    for (let i = 0; i < k; i++)
      if (mask & (1 << i)) {
        removed += sizes[i];
        bitsSet++;
      }
    const term = BigInt(n - removed) ** BigInt(length);
    total += bitsSet % 2 ? -term : term;
  }
  return total;
}

/** Exact entropy (bits) of generatePassword's output distribution. */
export function passwordEntropy(o: PasswordOptions): number {
  const classes = classesOf(o);
  if (!classes.length || o.length < 1) return 0;
  const sizes = classes.map((c) => [...c].length);
  const n = sizes.reduce((a, b) => a + b, 0);
  const need = o.requireEach && o.length >= classes.length;
  return need ? log2Big(countWithEach(sizes, o.length)) : o.length * Math.log2(n);
}

/* ───── other generators ───── */

export function generatePin(length: number, rng: RandomSource): string {
  let s = "";
  for (let i = 0; i < length; i++) s += DIGITS[randomInt(10, rng)];
  return s;
}

export function randomString(alphabet: string, length: number, rng: RandomSource): string {
  const a = [...uniq(alphabet)];
  if (!a.length) return "";
  let s = "";
  for (let i = 0; i < length; i++) s += a[randomInt(a.length, rng)];
  return s;
}

export function stringEntropy(alphabet: string, length: number): number {
  const n = [...uniq(alphabet)].length;
  return n > 1 ? length * Math.log2(n) : 0;
}

export function randomBytes(n: number, rng: RandomSource): Uint8Array {
  const out = new Uint8Array(n);
  const buf = new Uint32Array(Math.ceil(n / 4));
  rng(buf);
  for (let i = 0; i < n; i++) out[i] = (buf[i >> 2] >>> ((i & 3) * 8)) & 255;
  return out;
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function toBase64(bytes: Uint8Array, url = false): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const s = btoa(bin);
  return url ? s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : s;
}

interface PassphraseOptions {
  words: number;
  separator: string;
  capitalize: boolean;
  /** Append one random digit to one random word. */
  addDigit: boolean;
}

export function generatePassphrase(list: readonly string[], o: PassphraseOptions, rng: RandomSource): string {
  const words = Array.from({ length: o.words }, () => pick(list, rng));
  const shaped = words.map((w) => (o.capitalize ? w.charAt(0).toUpperCase() + w.slice(1) : w));
  if (o.addDigit && shaped.length) {
    const i = randomInt(shaped.length, rng);
    shaped[i] += DIGITS[randomInt(10, rng)];
  }
  return shaped.join(o.separator);
}

export function passphraseEntropy(listSize: number, o: PassphraseOptions): number {
  return o.words * Math.log2(listSize) + (o.addDigit ? Math.log2(10) + Math.log2(o.words) : 0);
}

/* ───── pronounceable ("memorable") passwords ───── */

const CONSONANTS = "bdfghjklmnprstvz";
const VOWELS = "aeiou";

interface MemorableOptions {
  words: number;
  syllables: number;
  digits: number;
  separator: string;
  capitalize: boolean;
}

export function generateMemorable(o: MemorableOptions, rng: RandomSource): string {
  const words: string[] = [];
  for (let w = 0; w < o.words; w++) {
    let s = "";
    for (let i = 0; i < o.syllables; i++) s += CONSONANTS[randomInt(CONSONANTS.length, rng)] + VOWELS[randomInt(VOWELS.length, rng)];
    words.push(o.capitalize ? s[0].toUpperCase() + s.slice(1) : s);
  }
  const tail = o.digits ? generatePin(o.digits, rng) : "";
  return [...words, ...(tail ? [tail] : [])].join(o.separator);
}

export function memorableEntropy(o: MemorableOptions): number {
  return o.words * o.syllables * Math.log2(CONSONANTS.length * VOWELS.length) + o.digits * Math.log2(10);
}

/* ───── crack-time estimates ───── */

export const ATTACKS = [
  { id: "online-throttled", perSecond: 100 / 3600 },
  { id: "online", perSecond: 10 },
  { id: "offline-slow", perSecond: 1e4 },
  { id: "offline-fast", perSecond: 1e10 },
] as const;

/** Average seconds to find a secret with `bits` of entropy (half of the search space). */
export function averageCrackSeconds(bits: number, perSecond: number): number {
  return 2 ** Math.max(0, bits - 1) / perSecond;
}

export type Strength = "very-weak" | "weak" | "fair" | "strong" | "very-strong";
export function strengthOf(bits: number): Strength {
  if (bits < 28) return "very-weak";
  if (bits < 36) return "weak";
  if (bits < 60) return "fair";
  if (bits < 100) return "strong";
  return "very-strong";
}
