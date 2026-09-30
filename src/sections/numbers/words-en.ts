/**
 * English numbers in words (short scale): cardinal, ordinal, decimals.
 * American style by default ("one hundred twenty-three"); British style adds
 * "and" ("one hundred and twenty-three", "one thousand and five").
 */

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES = ["", "thousand", "million", "billion", "trillion", "quadrillion"];

export const EN_MAX = 10n ** 18n - 1n;

export interface EnOptions {
  /** British "and" after hundreds and before a final 1–99. */
  british?: boolean;
}

function below100(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u ? `${TENS[t]}-${ONES[u]}` : TENS[t];
}

function triad(n: number, british: boolean): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (!h) return below100(r);
  const head = `${ONES[h]} hundred`;
  if (!r) return head;
  return `${head}${british ? " and" : ""} ${below100(r)}`;
}

export function enCardinal(value: bigint | number, opts: EnOptions = {}): string {
  const v = typeof value === "bigint" ? value : BigInt(value);
  if (v > EN_MAX || v < -EN_MAX) throw new RangeError("Number is too large");
  if (v === 0n) return "zero";
  if (v < 0n) return `minus ${enCardinal(-v, opts)}`;
  const parts: number[] = [];
  let x = v;
  while (x > 0n) {
    parts.push(Number(x % 1000n));
    x /= 1000n;
  }
  const british = !!opts.british;
  const words: string[] = [];
  for (let i = parts.length - 1; i >= 0; i--) {
    const t = parts[i];
    if (!t) continue;
    if (i === 0 && british && t < 100 && parts.length > 1) words.push("and");
    words.push(triad(t, british) + (i ? ` ${SCALES[i]}` : ""));
  }
  return words.join(" ");
}

const IRREGULAR: Record<string, string> = {
  zero: "zeroth",
  one: "first",
  two: "second",
  three: "third",
  five: "fifth",
  eight: "eighth",
  nine: "ninth",
  twelve: "twelfth",
};

function ordinalWord(w: string): string {
  if (IRREGULAR[w]) return IRREGULAR[w];
  if (w.endsWith("y")) return `${w.slice(0, -1)}ieth`;
  return `${w}th`;
}

/** "one hundred twenty-third", "two thousandth". */
export function enOrdinal(value: bigint | number, opts: EnOptions = {}): string {
  const words = enCardinal(value, opts);
  const m = /^(.*?)([a-z]+)$/.exec(words);
  if (!m) return words;
  return m[1] + ordinalWord(m[2]);
}

/** "1st", "2nd", "3rd", "11th", "22nd" */
export function enOrdinalSuffix(value: bigint | number): string {
  const v = typeof value === "bigint" ? value : BigInt(value);
  const a = v < 0n ? -v : v;
  const d100 = Number(a % 100n);
  const d10 = d100 % 10;
  const suf = d100 >= 11 && d100 <= 13 ? "th" : d10 === 1 ? "st" : d10 === 2 ? "nd" : d10 === 3 ? "rd" : "th";
  return `${v}${suf}`;
}

/** "3.14" → "three point one four" (fraction digits are read one by one). */
export function enDecimal(int: bigint, frac: string, negative = false, opts: EnOptions = {}): string {
  const sign = negative ? "minus " : "";
  const head = enCardinal(int, opts);
  if (!frac) return sign + head;
  return `${sign}${head} point ${frac.split("").map((d) => ONES[Number(d)]).join(" ")}`;
}
