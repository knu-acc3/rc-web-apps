/**
 * Russian numbers in words: cardinal (with gender), ordinal (nominative, with gender)
 * and decimal fractions ("одна целая пять десятых"). Integers up to 10^18 − 1
 * (квадриллионы) are handled exactly via BigInt.
 */

export type Gender = "m" | "f" | "n";

const UNITS: Record<Gender, string[]> = {
  m: ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"],
  f: ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"],
  n: ["", "одно", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"],
};
const TEENS = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
const TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const HUNDREDS = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

/** Scale words: [one, few, many], gender of the scale noun. */
const SCALES: { forms: [string, string, string]; gender: Gender }[] = [
  { forms: ["", "", ""], gender: "m" },
  { forms: ["тысяча", "тысячи", "тысяч"], gender: "f" },
  { forms: ["миллион", "миллиона", "миллионов"], gender: "m" },
  { forms: ["миллиард", "миллиарда", "миллиардов"], gender: "m" },
  { forms: ["триллион", "триллиона", "триллионов"], gender: "m" },
  { forms: ["квадриллион", "квадриллиона", "квадриллионов"], gender: "m" },
];

export const RU_MAX = 10n ** 18n - 1n;

/** Index of the Russian plural form for an integer: 0 = один, 1 = два–четыре, 2 = пять/ноль/11–14. */
export function ruPluralIndex(n: bigint | number): 0 | 1 | 2 {
  const v = typeof n === "bigint" ? (n < 0n ? -n : n) : BigInt(Math.abs(Math.trunc(n)));
  const d100 = Number(v % 100n);
  const d10 = d100 % 10;
  if (d100 >= 11 && d100 <= 14) return 2;
  if (d10 === 1) return 0;
  if (d10 >= 2 && d10 <= 4) return 1;
  return 2;
}

export function ruPlural(n: bigint | number, forms: readonly [string, string, string]): string {
  return forms[ruPluralIndex(n)];
}

function triad(n: number, gender: Gender): string[] {
  const out: string[] = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  if (h) out.push(HUNDREDS[h]);
  if (t === 1) out.push(TEENS[u]);
  else {
    if (t) out.push(TENS[t]);
    if (u) out.push(UNITS[gender][u]);
  }
  return out;
}

function triads(v: bigint): number[] {
  const out: number[] = [];
  let x = v;
  do {
    out.push(Number(x % 1000n));
    x /= 1000n;
  } while (x > 0n);
  return out; // least significant first
}

function assertRange(v: bigint) {
  if (v > RU_MAX || v < -RU_MAX) throw new RangeError("Number is too large");
}

/** "две тысячи двадцать четыре"; gender applies to the units (один/одна/одно, два/две). */
export function ruCardinal(value: bigint | number, gender: Gender = "m"): string {
  const v = typeof value === "bigint" ? value : BigInt(value);
  assertRange(v);
  if (v === 0n) return "ноль";
  if (v < 0n) return `минус ${ruCardinal(-v, gender)}`;
  const parts = triads(v);
  const words: string[] = [];
  for (let i = parts.length - 1; i >= 0; i--) {
    const t = parts[i];
    if (!t) continue;
    words.push(...triad(t, i === 0 ? gender : SCALES[i].gender));
    if (i > 0) words.push(ruPlural(t, SCALES[i].forms));
  }
  return words.join(" ");
}

/* ───────────── ordinals ───────────── */

type Ending = "h" | "s" | "t"; // hard -ый, stressed -ой, третий -ий
const END: Record<Ending, Record<Gender, string>> = {
  h: { m: "ый", f: "ая", n: "ое" },
  s: { m: "ой", f: "ая", n: "ое" },
  t: { m: "ий", f: "ья", n: "ье" },
};

const ORD_UNITS: [string, Ending][] = [
  ["", "h"],
  ["перв", "h"],
  ["втор", "s"],
  ["трет", "t"],
  ["четвёрт", "h"],
  ["пят", "h"],
  ["шест", "s"],
  ["седьм", "s"],
  ["восьм", "s"],
  ["девят", "h"],
];
const ORD_TEENS = ["десят", "одиннадцат", "двенадцат", "тринадцат", "четырнадцат", "пятнадцат", "шестнадцат", "семнадцат", "восемнадцат", "девятнадцат"];
const ORD_TENS: [string, Ending][] = [
  ["", "h"],
  ["", "h"],
  ["двадцат", "h"],
  ["тридцат", "h"],
  ["сороков", "s"],
  ["пятидесят", "h"],
  ["шестидесят", "h"],
  ["семидесят", "h"],
  ["восьмидесят", "h"],
  ["девяност", "h"],
];
const ORD_HUNDREDS = ["", "сот", "двухсот", "трёхсот", "четырёхсот", "пятисот", "шестисот", "семисот", "восьмисот", "девятисот"];
const ORD_SCALES = ["", "тысячн", "миллионн", "миллиардн", "триллионн", "квадриллионн"];

/* Genitive combining forms used in one-word ordinals: двухтысячный, сорокатысячный. */
const GEN_UNITS = ["", "одно", "двух", "трёх", "четырёх", "пяти", "шести", "семи", "восьми", "девяти"];
const GEN_TEENS = ["десяти", "одиннадцати", "двенадцати", "тринадцати", "четырнадцати", "пятнадцати", "шестнадцати", "семнадцати", "восемнадцати", "девятнадцати"];
const GEN_TENS = ["", "", "двадцати", "тридцати", "сорока", "пятидесяти", "шестидесяти", "семидесяти", "восьмидесяти", "девяноста"];
const GEN_HUNDREDS = ["", "сто", "двухсот", "трёхсот", "четырёхсот", "пятисот", "шестисот", "семисот", "восьмисот", "девятисот"];

function combining(n: number): string {
  if (n === 1) return "";
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  let s = GEN_HUNDREDS[h];
  if (t === 1) s += GEN_TEENS[u];
  else {
    s += GEN_TENS[t];
    s += GEN_UNITS[u];
  }
  return s;
}

/** Ordinal of 1–999 with the preceding components kept cardinal: "сто двадцать четвёртый". */
function ordinalTriad(n: number, gender: Gender): string[] {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  const out: string[] = [];
  if (t === 0 && u === 0) {
    out.push(ORD_HUNDREDS[h] + END.h[gender]);
    return out;
  }
  if (h) out.push(HUNDREDS[h]);
  if (t === 1) {
    out.push(ORD_TEENS[u] + END.h[gender]);
  } else if (u === 0) {
    const [stem, e] = ORD_TENS[t];
    out.push(stem + END[e][gender]);
  } else {
    if (t) out.push(TENS[t]);
    const [stem, e] = ORD_UNITS[u];
    out.push(stem + END[e][gender]);
  }
  return out;
}

/** "две тысячи двадцать четвёртый", "двухтысячный", "сорокатысячная". Nominative singular. */
export function ruOrdinal(value: bigint | number, gender: Gender = "m"): string {
  const v = typeof value === "bigint" ? value : BigInt(value);
  assertRange(v);
  if (v === 0n) return "нулев" + END.s[gender];
  if (v < 0n) return `минус ${ruOrdinal(-v, gender)}`;
  const parts = triads(v);
  const k = parts.findIndex((t) => t !== 0);
  const words: string[] = [];
  for (let i = parts.length - 1; i > k; i--) {
    const t = parts[i];
    if (!t) continue;
    words.push(...triad(t, i === 0 ? "m" : SCALES[i].gender));
    words.push(ruPlural(t, SCALES[i].forms));
  }
  if (k === 0) words.push(...ordinalTriad(parts[0], gender));
  else words.push(combining(parts[k]) + ORD_SCALES[k] + END.h[gender]);
  return words.join(" ");
}

/* ───────────── decimal fractions ───────────── */

const FRACTION_STEMS = [
  "",
  "десят",
  "сот",
  "тысячн",
  "десятитысячн",
  "стотысячн",
  "миллионн",
  "десятимиллионн",
  "стомиллионн",
  "миллиардн",
  "десятимиллиардн",
  "стомиллиардн",
  "триллионн",
  "десятитриллионн",
  "стотриллионн",
  "квадриллионн",
];
export const RU_MAX_FRACTION_DIGITS = FRACTION_STEMS.length - 1;

/**
 * "1.25" → "одна целая двадцать пять сотых". `frac` is the digit string after the
 * decimal separator exactly as written (trailing zeros are kept: 1,50 → пятьдесят сотых).
 */
export function ruDecimal(int: bigint, frac: string, negative = false): string {
  const sign = negative ? "минус " : "";
  if (!frac) return sign + ruCardinal(int);
  if (frac.length > RU_MAX_FRACTION_DIGITS) throw new RangeError("Too many fraction digits");
  const num = BigInt(frac);
  const intWords = `${ruCardinal(int, "f")} ${ruPlural(int, ["целая", "целых", "целых"])}`;
  const stem = FRACTION_STEMS[frac.length];
  const den = ruPluralIndex(num) === 0 ? `${stem}ая` : `${stem}ых`;
  return `${sign}${intWords} ${ruCardinal(num, "f")} ${den}`;
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
