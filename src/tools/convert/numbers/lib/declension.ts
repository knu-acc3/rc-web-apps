/**
 * Declension of Russian cardinal numerals by case (склонение количественных числительных).
 * Every component of a compound numeral is declined; the scale nouns (тысяча, миллион…)
 * agree with the numeral before them. Accusative is given for inanimate nouns.
 */
import { ruPluralIndex, type Gender } from "./words-ru";

export const CASES = ["nom", "gen", "dat", "acc", "ins", "pre"] as const;
type Case = (typeof CASES)[number];

export const CASE_NAMES: Record<Case, { name: string; q: string }> = {
  nom: { name: "Именительный", q: "есть что?" },
  gen: { name: "Родительный", q: "нет чего?" },
  dat: { name: "Дательный", q: "даю чему?" },
  acc: { name: "Винительный", q: "вижу что?" },
  ins: { name: "Творительный", q: "доволен чем?" },
  pre: { name: "Предложный", q: "думаю о чём?" },
};

type Forms = [string, string, string, string, string, string]; // nom gen dat acc ins pre

const ONE: Record<Gender, Forms> = {
  m: ["один", "одного", "одному", "один", "одним", "одном"],
  f: ["одна", "одной", "одной", "одну", "одной", "одной"],
  n: ["одно", "одного", "одному", "одно", "одним", "одном"],
};
const TWO_M: Forms = ["два", "двух", "двум", "два", "двумя", "двух"];
const TWO_F: Forms = ["две", "двух", "двум", "две", "двумя", "двух"];

const UNITS: Forms[] = [
  ["", "", "", "", "", ""],
  ONE.m,
  TWO_M,
  ["три", "трёх", "трём", "три", "тремя", "трёх"],
  ["четыре", "четырёх", "четырём", "четыре", "четырьмя", "четырёх"],
  ["пять", "пяти", "пяти", "пять", "пятью", "пяти"],
  ["шесть", "шести", "шести", "шесть", "шестью", "шести"],
  ["семь", "семи", "семи", "семь", "семью", "семи"],
  ["восемь", "восьми", "восьми", "восемь", "восемью", "восьми"],
  ["девять", "девяти", "девяти", "девять", "девятью", "девяти"],
];

/** -ать/-ять numerals decline like «пять»: stem + и / ью */
const likeFive = (nom: string): Forms => {
  const stem = nom.slice(0, -1);
  return [nom, `${stem}и`, `${stem}и`, nom, `${stem}ью`, `${stem}и`];
};

const TEENS: Forms[] = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"].map(likeFive);

const TENS: Forms[] = [
  ["", "", "", "", "", ""],
  ["", "", "", "", "", ""],
  likeFive("двадцать"),
  likeFive("тридцать"),
  ["сорок", "сорока", "сорока", "сорок", "сорока", "сорока"],
  ["пятьдесят", "пятидесяти", "пятидесяти", "пятьдесят", "пятьюдесятью", "пятидесяти"],
  ["шестьдесят", "шестидесяти", "шестидесяти", "шестьдесят", "шестьюдесятью", "шестидесяти"],
  ["семьдесят", "семидесяти", "семидесяти", "семьдесят", "семьюдесятью", "семидесяти"],
  ["восемьдесят", "восьмидесяти", "восьмидесяти", "восемьдесят", "восемьюдесятью", "восьмидесяти"],
  ["девяносто", "девяноста", "девяноста", "девяносто", "девяноста", "девяноста"],
];

const HUNDREDS: Forms[] = [
  ["", "", "", "", "", ""],
  ["сто", "ста", "ста", "сто", "ста", "ста"],
  ["двести", "двухсот", "двумстам", "двести", "двумястами", "двухстах"],
  ["триста", "трёхсот", "трёмстам", "триста", "тремястами", "трёхстах"],
  ["четыреста", "четырёхсот", "четырёмстам", "четыреста", "четырьмястами", "четырёхстах"],
  ["пятьсот", "пятисот", "пятистам", "пятьсот", "пятьюстами", "пятистах"],
  ["шестьсот", "шестисот", "шестистам", "шестьсот", "шестьюстами", "шестистах"],
  ["семьсот", "семисот", "семистам", "семьсот", "семьюстами", "семистах"],
  ["восемьсот", "восьмисот", "восьмистам", "восемьсот", "восемьюстами", "восьмистах"],
  ["девятьсот", "девятисот", "девятистам", "девятьсот", "девятьюстами", "девятистах"],
];

/** Scale nouns: singular forms by case, plural forms by case. */
const SCALES: { gender: Gender; sg: Forms; pl: Forms }[] = [
  { gender: "m", sg: ["", "", "", "", "", ""], pl: ["", "", "", "", "", ""] },
  { gender: "f", sg: ["тысяча", "тысячи", "тысяче", "тысячу", "тысячей", "тысяче"], pl: ["тысячи", "тысяч", "тысячам", "тысячи", "тысячами", "тысячах"] },
  ...["миллион", "миллиард", "триллион", "квадриллион"].map((w) => ({
    gender: "m" as Gender,
    sg: [w, `${w}а`, `${w}у`, w, `${w}ом`, `${w}е`] as Forms,
    pl: [`${w}ы`, `${w}ов`, `${w}ам`, `${w}ы`, `${w}ами`, `${w}ах`] as Forms,
  })),
];

const ZERO: Forms = ["ноль", "нуля", "нулю", "ноль", "нулём", "нуле"];

function triad(n: number, c: number, gender: Gender): string[] {
  const out: string[] = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  if (h) out.push(HUNDREDS[h][c]);
  if (t === 1) out.push(TEENS[u][c]);
  else {
    if (t) out.push(TENS[t][c]);
    if (u === 1) out.push(ONE[gender][c]);
    else if (u === 2) out.push((gender === "f" ? TWO_F : TWO_M)[c]);
    else if (u) out.push(UNITS[u][c]);
  }
  return out;
}

/** Scale noun after a triad value in a case. */
function scaleWord(i: number, t: number, c: number): string {
  const s = SCALES[i];
  const k = ruPluralIndex(t);
  if (c === 0 || c === 3) {
    // nominative / accusative: один → sg, 2–4 → gen sg, 5+ → gen pl
    if (k === 0) return s.sg[c];
    return k === 1 ? s.sg[1] : s.pl[1];
  }
  return k === 0 ? s.sg[c] : s.pl[c];
}

/** Cardinal numeral in a grammatical case: ruCardinalCase(2024, "gen") → "двух тысяч двадцати четырёх". */
export function ruCardinalCase(value: bigint | number, kase: Case, gender: Gender = "m"): string {
  let v = typeof value === "bigint" ? value : BigInt(value);
  const c = CASES.indexOf(kase);
  if (v === 0n) return ZERO[c];
  const neg = v < 0n;
  if (neg) v = -v;
  const parts: number[] = [];
  while (v > 0n) {
    parts.push(Number(v % 1000n));
    v /= 1000n;
  }
  if (parts.length > SCALES.length) throw new RangeError("Number is too large");
  const words: string[] = [];
  for (let i = parts.length - 1; i >= 0; i--) {
    const t = parts[i];
    if (!t) continue;
    words.push(...triad(t, c, i === 0 ? gender : SCALES[i].gender));
    if (i > 0) words.push(scaleWord(i, t, c));
  }
  return (neg ? "минус " : "") + words.join(" ");
}
