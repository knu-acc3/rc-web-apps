/**
 * Roman numerals: standard notation (1–3999) and vinculum notation
 * (an overline multiplies by 1000) up to 3 999 999.
 * Pure functions — shared by the server (variant pages) and the client tool.
 */

export const ROMAN_MAX = 3999;
export const VINCULUM_MAX = 3_999_999;
/** Combining overline used for vinculum letters in copyable text. */
export const BAR = "̅";

const PLACES: [string, string, string][] = [
  // [one, five, ten] for units, tens, hundreds; thousands use M only
  ["I", "V", "X"],
  ["X", "L", "C"],
  ["C", "D", "M"],
];

const VALUE: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

export const ROMAN_SYMBOLS: [string, number][] = [
  ["I", 1],
  ["V", 5],
  ["X", 10],
  ["L", 50],
  ["C", 100],
  ["D", 500],
  ["M", 1000],
];

/** Roman digit for 0–9 at a decimal place (0 = units, 1 = tens, 2 = hundreds, 3 = thousands). */
function digit(d: number, place: number): string {
  if (place === 3) return "M".repeat(d);
  const [one, five, ten] = PLACES[place];
  if (d === 9) return one + ten;
  if (d >= 5) return five + one.repeat(d - 5);
  if (d === 4) return one + five;
  return one.repeat(d);
}

/** Standard notation for 1–3999. Returns "" for anything else. */
export function toRomanStandard(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > ROMAN_MAX) return "";
  let out = "";
  let rest = n;
  for (let place = 3; place >= 0; place--) {
    const p = 10 ** place;
    out += digit(Math.floor(rest / p), place);
    rest %= p;
  }
  return out;
}

const bar = (s: string) => s.split("").map((c) => c + BAR).join("");

/**
 * Roman numeral. With `vinculum`, numbers from 4000 to 3 999 999 get an overlined
 * thousands part (4000 = I̅V̅, 2 024 000 = M̅M̅X̅X̅I̅V̅); up to 3999 the result is standard.
 * Returns "" when the number can't be written.
 */
export function toRoman(n: number, vinculum = false): string {
  if (!Number.isInteger(n) || n < 1) return "";
  if (n <= ROMAN_MAX) return toRomanStandard(n);
  if (!vinculum || n > VINCULUM_MAX) return "";
  return bar(toRomanStandard(Math.floor(n / 1000))) + toRomanStandard(n % 1000);
}

export interface RomanPart {
  /** Roman chunk as plain letters (without overline). */
  roman: string;
  value: number;
  /** Chunk is overlined (×1000). */
  barred?: boolean;
}

/** Split into place-value chunks: 2024 → MM (2000) + XX (20) + IV (4). */
export function romanParts(n: number, vinculum = false): RomanPart[] {
  if (!Number.isInteger(n) || n < 1) return [];
  const out: RomanPart[] = [];
  let low = n;
  if (n > ROMAN_MAX) {
    if (!vinculum || n > VINCULUM_MAX) return [];
    for (const p of romanParts(Math.floor(n / 1000))) out.push({ roman: p.roman, value: p.value * 1000, barred: true });
    low = n % 1000;
  }
  for (let place = 3; place >= 0; place--) {
    const p = 10 ** place;
    const d = Math.floor(low / p);
    if (d) out.push({ roman: digit(d, place), value: d * p });
    low %= p;
  }
  return out;
}

/** Plain-text chunk with overline marks, for copying. */
export function partText(p: RomanPart): string {
  return p.barred ? bar(p.roman) : p.roman;
}

/* ───────────── parsing & validation ───────────── */

export type RomanIssue =
  | { kind: "repeat"; letter: string; count: number }
  | { kind: "repeat-five"; letter: string }
  | { kind: "bad-subtract"; pair: string }
  | { kind: "order" }
  | { kind: "too-big" };

export type RomanParse =
  | { ok: true; value: number; canonical: string; vinculum: boolean }
  | { ok: false; error: "empty" }
  | { ok: false; error: "chars"; chars: string }
  | { ok: false; error: "noncanonical"; value: number; canonical: string; issue: RomanIssue };

/** Unicode Roman numeral code points (Ⅰ…Ⅿ) → ASCII letters. */
const UNICODE: Record<string, string> = {
  "Ⅰ": "I", "Ⅱ": "II", "Ⅲ": "III", "Ⅳ": "IV", "Ⅴ": "V", "Ⅵ": "VI", "Ⅶ": "VII", "Ⅷ": "VIII", "Ⅸ": "IX", "Ⅹ": "X", "Ⅺ": "XI", "Ⅻ": "XII",
  "Ⅼ": "L", "Ⅽ": "C", "Ⅾ": "D", "Ⅿ": "M",
  "ⅰ": "I", "ⅱ": "II", "ⅲ": "III", "ⅳ": "IV", "ⅴ": "V", "ⅵ": "VI", "ⅶ": "VII", "ⅷ": "VIII", "ⅸ": "IX", "ⅹ": "X", "ⅺ": "XI", "ⅻ": "XII",
  "ⅼ": "L", "ⅽ": "C", "ⅾ": "D", "ⅿ": "M",
};

interface Token {
  letter: string;
  barred: boolean;
}

function tokenize(input: string): { tokens: Token[] } | { bad: string } {
  const s = input
    .normalize("NFD")
    .replace(/[\s.]/g, "")
    .replace(/[Ⅰ-ↈ]/g, (c) => UNICODE[c] ?? c)
    .toUpperCase();
  const tokens: Token[] = [];
  const bad = new Set<string>();
  for (const c of s) {
    if (c === BAR || c === "̄") {
      if (tokens.length) tokens[tokens.length - 1].barred = true;
      else bad.add("¯");
      continue;
    }
    if (VALUE[c] === undefined) bad.add(c);
    else tokens.push({ letter: c, barred: false });
  }
  return bad.size ? { bad: [...bad].join(" ") } : { tokens };
}

/** Lenient value of a letter run (a letter smaller than the next one is subtracted). */
function lenientValue(letters: string): number {
  let total = 0;
  for (let i = 0; i < letters.length; i++) {
    const v = VALUE[letters[i]];
    const next = i + 1 < letters.length ? VALUE[letters[i + 1]] : 0;
    total += v < next ? -v : v;
  }
  return total;
}

function diagnose(letters: string): RomanIssue {
  const run = /(I{4,}|X{4,}|C{4,}|M{4,})/.exec(letters);
  if (run) return { kind: "repeat", letter: run[0][0], count: run[0].length };
  const five = /(VV|LL|DD)/.exec(letters);
  if (five) return { kind: "repeat-five", letter: five[0][0] };
  for (let i = 0; i + 1 < letters.length; i++) {
    const pair = letters[i] + letters[i + 1];
    if (VALUE[letters[i]] < VALUE[letters[i + 1]] && !["IV", "IX", "XL", "XC", "CD", "CM"].includes(pair)) return { kind: "bad-subtract", pair };
  }
  return { kind: "order" };
}

/**
 * Parse a Roman numeral strictly. Non-canonical forms (IIII, VV, IC, XIIX…) are
 * reported together with the value they would be read as and the correct spelling.
 * Overlined letters (combining U+0305 or U+0304) are read as ×1000.
 */
export function parseRoman(input: string): RomanParse {
  if (!input.trim()) return { ok: false, error: "empty" };
  const t = tokenize(input);
  if ("bad" in t) return { ok: false, error: "chars", chars: t.bad };
  const { tokens } = t;
  if (!tokens.length) return { ok: false, error: "empty" };

  let split = tokens.findIndex((x) => !x.barred);
  if (split === -1) split = tokens.length;
  const high = tokens.slice(0, split).map((x) => x.letter).join("");
  const low = tokens.slice(split).map((x) => x.letter).join("");
  const misplacedBar = tokens.slice(split).some((x) => x.barred);

  const value = (high ? lenientValue(high) * 1000 : 0) + (low ? lenientValue(low) : 0);
  const written = bar(high) + low;
  const canonical = toRoman(value, true);
  if (!misplacedBar && canonical && canonical === written) return { ok: true, value, canonical, vinculum: high.length > 0 };

  let issue: RomanIssue;
  if (!canonical) issue = { kind: "too-big" };
  else if (misplacedBar) issue = { kind: "order" };
  else {
    const h = high ? diagnose(high) : ({ kind: "order" } as RomanIssue);
    issue = h.kind !== "order" ? h : diagnose(low);
  }
  return { ok: false, error: "noncanonical", value, canonical, issue };
}

/** Split a numeral with combining overlines into display glyphs. */
export function romanGlyphs(s: string): { ch: string; barred: boolean }[] {
  const out: { ch: string; barred: boolean }[] = [];
  for (const c of s) {
    if (c === BAR) {
      if (out.length) out[out.length - 1].barred = true;
    } else out.push({ ch: c, barred: false });
  }
  return out;
}
