/**
 * Fancy-text engine. Pure functions, no React and no DOM, safe on the server.
 *
 * Every mapping is built from exact code points: Mathematical Alphanumeric
 * Symbols (U+1D400–U+1D7FF) by arithmetic plus an explicit table of "holes"
 * (letters that were encoded earlier in Letterlike Symbols), the other styles
 * from explicit code point tables. Combining-mark styles work per grapheme
 * cluster, so they apply to any script (Cyrillic included) and never split
 * emoji sequences.
 */

export const STYLE_IDS = [
  "bold",
  "italic",
  "bold-italic",
  "script",
  "bold-script",
  "fraktur",
  "bold-fraktur",
  "double-struck",
  "monospace",
  "sans",
  "sans-bold",
  "sans-italic",
  "sans-bold-italic",
  "small-caps",
  "superscript",
  "subscript",
  "circled",
  "circled-negative",
  "bubble",
  "squared",
  "squared-negative",
  "parenthesized",
  "fullwidth",
  "upside-down",
  "mirror",
  "strikethrough",
  "slash-through",
  "underline",
  "double-underline",
  "overline",
  "zalgo",
  "glitch",
] as const;

export type StyleId = (typeof STYLE_IDS)[number];

/** How a style treats Cyrillic letters. */
export type CyrSupport = "full" | "partial" | "none";
export type ZalgoLevel = "light" | "medium" | "heavy";
export const ZALGO_LEVELS: readonly ZalgoLevel[] = ["light", "medium", "heavy"];

export interface StyleOptions {
  /** Seed for zalgo/glitch. The same seed always gives the same output. */
  seed?: number;
  zalgo?: ZalgoLevel;
}

export type StyleKind = "math" | "letters" | "enclosed" | "flip" | "combining" | "random";

export interface StyleInfo {
  id: StyleId;
  kind: StyleKind;
  cyr: CyrSupport;
  /** Are all 52 Latin letters transformed ("all") or only some ("partial")? */
  latin: "all" | "partial";
  /** Are digits 0–9 transformed? */
  digits: "all" | "partial" | "none";
  /** Output changes with the seed (zalgo, glitch). */
  random?: boolean;
  /** Combining mark appended to every grapheme (combining styles). */
  mark?: number;
}

/** Deterministic seed used for the server render and the first client render. */
export const DEFAULT_SEED = 0x5eed_1234;

/* ───────────── helpers ───────────── */

type CharMap = Map<string, string>;

const chr = (cp: number) => String.fromCodePoint(cp);

/** "U+1D400" */
export function codePoint(ch: string): string {
  return `U+${(ch.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`;
}

const UPPER = Array.from({ length: 26 }, (_, i) => String.fromCharCode(0x41 + i));
const LOWER = Array.from({ length: 26 }, (_, i) => String.fromCharCode(0x61 + i));
const DIGITS = Array.from({ length: 10 }, (_, i) => String(i));

let segmenter: Intl.Segmenter | null | undefined;
/** Split into user-perceived characters (grapheme clusters). */
export function graphemes(text: string): string[] {
  if (segmenter === undefined) {
    segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("en", { granularity: "grapheme" }) : null;
  }
  if (!segmenter) return Array.from(text);
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

const EMOJI_RE = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u{20E3}|\u{FE0F}/u;
/** Emoji graphemes (incl. ZWJ sequences, flags and keycaps) are never modified. */
export const isEmoji = (g: string) => EMOJI_RE.test(g);
const isSpace = (g: string) => /^\s+$/u.test(g);
const isLineBreak = (g: string) => /^[\r\n\u{2028}\u{2029}]+$/u.test(g);
const CYR_RE = /\p{Script=Cyrillic}/u;
export const hasCyrillic = (text: string) => CYR_RE.test(text);
const COMBINING_RE = /^\p{M}+$/u;

/** Map one grapheme through a char map. Latin letters with diacritics keep them (é → bold e + U+0301). */
function mapGrapheme(g: string, map: CharMap): string {
  const direct = map.get(g);
  if (direct !== undefined) return direct;
  let out = "";
  for (const ch of g) {
    const m = map.get(ch);
    if (m !== undefined) {
      out += m;
      continue;
    }
    if (ch.charCodeAt(0) > 0x7f) {
      const d = ch.normalize("NFD");
      const base = String.fromCodePoint(d.codePointAt(0) ?? 0);
      const rest = d.slice(base.length);
      const mb = map.get(base);
      if (mb !== undefined && rest && COMBINING_RE.test(rest)) {
        out += mb + rest;
        continue;
      }
    }
    out += ch;
  }
  return out;
}

function mapText(text: string, map: CharMap): string {
  let out = "";
  for (const g of graphemes(text)) out += isEmoji(g) ? g : mapGrapheme(g, map);
  return out;
}

/* ───────────── Mathematical Alphanumeric Symbols ───────────── */

export type MathStyleId =
  | "bold"
  | "italic"
  | "bold-italic"
  | "script"
  | "bold-script"
  | "fraktur"
  | "bold-fraktur"
  | "double-struck"
  | "monospace"
  | "sans"
  | "sans-bold"
  | "sans-italic"
  | "sans-bold-italic";

export interface MathDef {
  /** Code point of capital A (small a is always capital A + 26). */
  upper: number;
  /** Code point of digit zero, when the style has digits. */
  digits?: number;
  /**
   * Letters whose slot in U+1D400–U+1D7FF is reserved (unassigned) because the
   * character already existed in Letterlike Symbols (U+2100–U+214F).
   */
  holes?: Record<string, number>;
}

export const MATH: Record<MathStyleId, MathDef> = {
  bold: { upper: 0x1d400, digits: 0x1d7ce },
  italic: { upper: 0x1d434, holes: { h: 0x210e } },
  "bold-italic": { upper: 0x1d468 },
  script: {
    upper: 0x1d49c,
    holes: { B: 0x212c, E: 0x2130, F: 0x2131, H: 0x210b, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211b, e: 0x212f, g: 0x210a, o: 0x2134 },
  },
  "bold-script": { upper: 0x1d4d0 },
  fraktur: { upper: 0x1d504, holes: { C: 0x212d, H: 0x210c, I: 0x2111, R: 0x211c, Z: 0x2128 } },
  "double-struck": { upper: 0x1d538, digits: 0x1d7d8, holes: { C: 0x2102, H: 0x210d, N: 0x2115, P: 0x2119, Q: 0x211a, R: 0x211d, Z: 0x2124 } },
  "bold-fraktur": { upper: 0x1d56c },
  sans: { upper: 0x1d5a0, digits: 0x1d7e2 },
  "sans-bold": { upper: 0x1d5d4, digits: 0x1d7ec },
  "sans-italic": { upper: 0x1d608 },
  "sans-bold-italic": { upper: 0x1d63c },
  monospace: { upper: 0x1d670, digits: 0x1d7f6 },
};

function mathMap(def: MathDef): CharMap {
  const m: CharMap = new Map();
  UPPER.forEach((c, i) => m.set(c, chr(def.upper + i)));
  LOWER.forEach((c, i) => m.set(c, chr(def.upper + 26 + i)));
  if (def.digits !== undefined) DIGITS.forEach((c, i) => m.set(c, chr(def.digits! + i)));
  for (const [c, cp] of Object.entries(def.holes ?? {})) m.set(c, chr(cp));
  return m;
}

/* ───────────── Small caps ───────────── */

/** a–z → small capitals. q has no widely supported small capital (ꞯ U+A7AF is rare in fonts), x has none at all. */
export const SMALL_CAPS_CP = [
  0x1d00, 0x0299, 0x1d04, 0x1d05, 0x1d07, 0xa730, 0x0262, 0x029c, 0x026a, 0x1d0a, 0x1d0b, 0x029f, 0x1d0d, 0x0274, 0x1d0f, 0x1d18, 0x01eb, 0x0280,
  0xa731, 0x1d1b, 0x1d1c, 0x1d20, 0x1d21, 0x0078, 0x028f, 0x1d22,
];

/**
 * Cyrillic: most lowercase Cyrillic letters are already drawn as small
 * capitals (в, к, м, н, т, п, л…), so capitals are lowercased; а е о р с і
 * are replaced by the matching Latin small capitals. б, д, у, ф, ц, щ keep
 * their ascenders/descenders — support is partial.
 */
const CYR_SMALL_CAPS: Record<string, string> = { а: "ᴀ", е: "ᴇ", ё: "ᴇ\u{0308}", о: "ᴏ", р: "ᴘ", с: "ᴄ", і: "ɪ" };

function smallCapsMap(): CharMap {
  const m: CharMap = new Map();
  LOWER.forEach((c, i) => {
    m.set(c, chr(SMALL_CAPS_CP[i]));
    m.set(UPPER[i], chr(SMALL_CAPS_CP[i]));
  });
  for (let cp = 0x400; cp <= 0x52f; cp++) {
    const ch = chr(cp);
    if (!CYR_RE.test(ch)) continue;
    const lower = ch.toLowerCase();
    const target = CYR_SMALL_CAPS[lower] ?? lower;
    if (target !== ch) m.set(ch, target);
  }
  return m;
}

/* ───────────── Superscript / subscript ───────────── */

/** Letters and digits with a superscript form. Missing: q/Q (only the rare 𐞥 U+107A5 exists). */
export const SUPERSCRIPT: Record<string, number> = {
  a: 0x1d43, b: 0x1d47, c: 0x1d9c, d: 0x1d48, e: 0x1d49, f: 0x1da0, g: 0x1d4d, h: 0x02b0, i: 0x2071, j: 0x02b2, k: 0x1d4f, l: 0x02e1, m: 0x1d50,
  n: 0x207f, o: 0x1d52, p: 0x1d56, r: 0x02b3, s: 0x02e2, t: 0x1d57, u: 0x1d58, v: 0x1d5b, w: 0x02b7, x: 0x02e3, y: 0x02b8, z: 0x1dbb,
  A: 0x1d2c, B: 0x1d2e, D: 0x1d30, E: 0x1d31, G: 0x1d33, H: 0x1d34, I: 0x1d35, J: 0x1d36, K: 0x1d37, L: 0x1d38, M: 0x1d39, N: 0x1d3a, O: 0x1d3c,
  P: 0x1d3e, R: 0x1d3f, T: 0x1d40, U: 0x1d41, V: 0x2c7d, W: 0x1d42,
  "0": 0x2070, "1": 0x00b9, "2": 0x00b2, "3": 0x00b3, "4": 0x2074, "5": 0x2075, "6": 0x2076, "7": 0x2077, "8": 0x2078, "9": 0x2079,
  "+": 0x207a, "-": 0x207b, "=": 0x207c, "(": 0x207d, ")": 0x207e,
};
/** Capitals without a superscript capital: written with the small superscript letter instead. */
export const SUPERSCRIPT_CAPS_AS_SMALL = ["C", "F", "S", "X", "Y", "Z"];
/** No superscript form at all — left unchanged. */
export const SUPERSCRIPT_MISSING = ["Q", "q"];

/** Letters with a subscript form (only 17 exist); capitals use the same small subscripts. */
export const SUBSCRIPT: Record<string, number> = {
  a: 0x2090, e: 0x2091, h: 0x2095, i: 0x1d62, j: 0x2c7c, k: 0x2096, l: 0x2097, m: 0x2098, n: 0x2099, o: 0x2092, p: 0x209a, r: 0x1d63, s: 0x209b,
  t: 0x209c, u: 0x1d64, v: 0x1d65, x: 0x2093,
  "0": 0x2080, "1": 0x2081, "2": 0x2082, "3": 0x2083, "4": 0x2084, "5": 0x2085, "6": 0x2086, "7": 0x2087, "8": 0x2088, "9": 0x2089,
  "+": 0x208a, "-": 0x208b, "=": 0x208c, "(": 0x208d, ")": 0x208e,
};
/** Latin letters that have no subscript form — left unchanged. */
export const SUBSCRIPT_MISSING = ["b", "c", "d", "f", "g", "q", "w", "y", "z"];

function superMap(): CharMap {
  const m: CharMap = new Map();
  for (const [c, cp] of Object.entries(SUPERSCRIPT)) m.set(c, chr(cp));
  for (const c of SUPERSCRIPT_CAPS_AS_SMALL) m.set(c, chr(SUPERSCRIPT[c.toLowerCase()]));
  return m;
}

function subMap(): CharMap {
  const m: CharMap = new Map();
  for (const [c, cp] of Object.entries(SUBSCRIPT)) {
    m.set(c, chr(cp));
    if (/[a-z]/.test(c)) m.set(c.toUpperCase(), chr(cp));
  }
  return m;
}

/* ───────────── Enclosed alphanumerics ───────────── */

function enclosedMap(upper: number | null, lower: number | null, digit0: number | null, digit1: number | null): CharMap {
  const m: CharMap = new Map();
  UPPER.forEach((c, i) => {
    if (upper !== null) m.set(c, chr(upper + i));
    const lo = lower ?? upper;
    if (lo !== null) m.set(LOWER[i], chr(lo + i));
  });
  if (digit0 !== null) m.set("0", chr(digit0));
  if (digit1 !== null) for (let d = 1; d <= 9; d++) m.set(String(d), chr(digit1 + d - 1));
  return m;
}

function fullwidthMap(): CharMap {
  const m: CharMap = new Map([[" ", "\u{3000}"]]);
  for (let cp = 0x21; cp <= 0x7e; cp++) m.set(chr(cp), chr(cp + 0xfee0));
  return m;
}

/* ───────────── Upside down / mirror ───────────── */

const FLIP_LATIN: [string, string][] = [
  ["a", "ɐ"], ["b", "q"], ["c", "ɔ"], ["d", "p"], ["e", "ǝ"], ["f", "ɟ"], ["g", "ƃ"], ["h", "ɥ"], ["i", "ᴉ"], ["j", "ɾ"], ["k", "ʞ"], ["m", "ɯ"],
  ["n", "u"], ["p", "d"], ["q", "b"], ["r", "ɹ"], ["t", "ʇ"], ["u", "n"], ["v", "ʌ"], ["w", "ʍ"], ["y", "ʎ"],
  ["A", "∀"], ["B", "ꓭ"], ["C", "Ɔ"], ["D", "ꓷ"], ["E", "Ǝ"], ["F", "Ⅎ"], ["G", "⅁"], ["J", "ſ"], ["K", "ꓘ"], ["L", "˥"], ["M", "W"], ["P", "Ԁ"],
  ["Q", "Ό"], ["R", "ᴚ"], ["T", "⊥"], ["U", "∩"], ["V", "Λ"], ["W", "M"], ["Y", "⅄"],
  ["1", "Ɩ"], ["2", "↊"], ["3", "Ɛ"], ["4", "ㄣ"], ["5", "ϛ"], ["6", "9"], ["7", "ㄥ"], ["9", "6"],
  [".", "˙"], [",", "'"], ["'", ","], ['"', "„"], ["„", '"'], ["?", "¿"], ["¿", "?"], ["!", "¡"], ["¡", "!"], ["(", ")"], [")", "("], ["[", "]"],
  ["]", "["], ["{", "}"], ["}", "{"], ["<", ">"], [">", "<"], ["«", "»"], ["»", "«"], ["_", "‾"], ["‾", "_"], ["&", "⅋"], ["‿", "⁀"], ["⁀", "‿"],
];
/**
 * Cyrillic letters with a convincing turned look-alike. о х ж и н ф (and
 * their capitals) look the same when turned and stay as they are; б в д й л ц
 * щ ъ ы ь ю я and a few capitals have no good look-alike and stay unchanged.
 */
export const FLIP_CYRILLIC: [string, string][] = [
  ["а", "ɐ"], ["г", "˩"], ["е", "ǝ"], ["з", "ɛ"], ["к", "ʞ"], ["м", "w"], ["п", "u"], ["р", "d"], ["с", "ɔ"], ["т", "ʇ"], ["у", "ʎ"], ["ч", "һ"],
  ["һ", "ч"], ["ш", "m"], ["э", "є"], ["є", "э"], ["і", "ᴉ"],
  ["А", "∀"], ["В", "ꓭ"], ["Г", "˩"], ["Е", "Ǝ"], ["З", "Ɛ"], ["К", "ꓘ"], ["Л", "V"], ["М", "W"], ["П", "⊔"], ["Р", "Ԁ"], ["С", "Ɔ"], ["Т", "⊥"],
  ["У", "⅄"], ["Ч", "Һ"], ["Һ", "Ч"], ["Э", "Є"], ["Є", "Э"],
];

function flipMap(): CharMap {
  const m: CharMap = new Map(FLIP_LATIN);
  // Make the Latin table an involution so flipping twice restores the text.
  for (const [k, v] of FLIP_LATIN) if (!m.has(v)) m.set(v, k);
  for (const [k, v] of FLIP_CYRILLIC) if (!m.has(k)) m.set(k, v);
  return m;
}

const MIRROR_PAIRS: [string, string][] = [
  ["a", "ɒ"], ["b", "d"], ["c", "ɔ"], ["d", "b"], ["e", "ɘ"], ["p", "q"], ["q", "p"], ["r", "ɿ"], ["s", "ƨ"],
  ["C", "Ɔ"], ["E", "Ǝ"], ["F", "ꟻ"], ["K", "ꓘ"], ["L", "⅃"], ["N", "И"], ["P", "ꟼ"], ["R", "Я"], ["S", "Ƨ"], ["3", "Ɛ"],
  ["(", ")"], [")", "("], ["[", "]"], ["]", "["], ["{", "}"], ["}", "{"], ["<", ">"], [">", "<"], ["«", "»"], ["»", "«"], ["/", "\\"], ["\\", "/"],
  ["?", "⸮"],
];
/** Cyrillic mirror look-alikes; symmetric letters (А Д Ж Н О П Т Ф Х Ш…) need no change. */
export const MIRROR_CYRILLIC: [string, string][] = [
  ["Я", "R"], ["я", "ʀ"], ["И", "N"], ["и", "ᴎ"], ["Е", "Ǝ"], ["е", "ɘ"], ["С", "Ɔ"], ["с", "ɔ"], ["З", "Ɛ"], ["з", "ɛ"], ["Э", "Є"], ["э", "є"],
  ["Є", "Э"], ["є", "э"], ["Р", "ꟼ"], ["р", "q"], ["Г", "⅂"], ["К", "ꓘ"],
];

function mirrorMap(): CharMap {
  return new Map([...MIRROR_PAIRS, ...MIRROR_CYRILLIC]);
}

/* ───────────── Combining marks & randomness ───────────── */

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const ZALGO_UP = [
  0x030d, 0x030e, 0x0304, 0x0305, 0x033f, 0x0311, 0x0306, 0x0310, 0x0352, 0x0357, 0x0351, 0x0307, 0x0308, 0x030a, 0x0342, 0x0343, 0x0344, 0x034a,
  0x034b, 0x034c, 0x0303, 0x0302, 0x030c, 0x0350, 0x0300, 0x0301, 0x030b, 0x030f, 0x0312, 0x0313, 0x0314, 0x033d, 0x0309, 0x033e, 0x035b, 0x0346,
  0x031a, ...range(0x0363, 0x036f),
];
const ZALGO_MID = [0x0315, 0x031b, 0x0340, 0x0341, 0x0358, 0x0321, 0x0322, 0x0327, 0x0328, 0x0334, 0x0335, 0x0336, 0x035c, 0x035d, 0x035e, 0x035f, 0x0360, 0x0362, 0x0338, 0x0337, 0x0361];
const ZALGO_DOWN = [
  0x0316, 0x0317, 0x0318, 0x0319, 0x031c, 0x031d, 0x031e, 0x031f, 0x0320, 0x0324, 0x0325, 0x0326, 0x0329, 0x032a, 0x032b, 0x032c, 0x032d, 0x032e,
  0x032f, 0x0330, 0x0331, 0x0332, 0x0333, 0x0339, 0x033a, 0x033b, 0x033c, 0x0345, 0x0347, 0x0348, 0x0349, 0x034d, 0x034e, 0x0353, 0x0354, 0x0355,
  0x0356, 0x0359, 0x035a, 0x0323,
];
const GLITCH_OVERLAY = [0x0334, 0x0335, 0x0336, 0x0337, 0x0338, 0x20d2, 0x20d3, 0x20e5, 0x20d8];

/** Marks per grapheme: [up, mid, down] as [min, max] ranges. */
export const ZALGO_AMOUNT: Record<ZalgoLevel, [number, number][]> = {
  light: [[1, 2], [0, 0], [1, 2]],
  medium: [[2, 5], [0, 1], [2, 5]],
  heavy: [[6, 12], [1, 2], [6, 12]],
};

/** mulberry32 — small deterministic PRNG returning uint32 values. */
function prng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
}

/** Unbiased integer in [0, n) using rejection sampling. */
function randInt(next: () => number, n: number): number {
  const limit = 0x100000000 - (0x100000000 % n);
  let x = next();
  while (x >= limit) x = next();
  return x % n;
}

const pick = (next: () => number, list: number[]) => chr(list[randInt(next, list.length)]);
const between = (next: () => number, [min, max]: [number, number]) => min + randInt(next, max - min + 1);

/** A fresh random seed from the CSPRNG. Call only in event handlers/effects. */
export function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}

/** Apply `decorate` to every grapheme except line breaks and emoji (and spaces unless `spaces`). */
function perGrapheme(text: string, spaces: boolean, decorate: (g: string, index: number) => string): string {
  let out = "";
  let i = 0;
  for (const g of graphemes(text)) {
    if (isLineBreak(g) || isEmoji(g) || (!spaces && isSpace(g)) || g === "\t") out += g;
    else out += decorate(g, i);
    i++;
  }
  return out;
}

/** Per-grapheme PRNG so editing the end of the text doesn't reshuffle the beginning. */
const rngAt = (seed: number, index: number) => prng(seed ^ Math.imul(index + 1, 0x9e3779b1));

function zalgo(text: string, seed: number, level: ZalgoLevel): string {
  const [up, mid, down] = ZALGO_AMOUNT[level];
  return perGrapheme(text, false, (g, i) => {
    const next = rngAt(seed, i);
    let s = g;
    for (let k = between(next, up); k > 0; k--) s += pick(next, ZALGO_UP);
    for (let k = between(next, mid); k > 0; k--) s += pick(next, ZALGO_MID);
    for (let k = between(next, down); k > 0; k--) s += pick(next, ZALGO_DOWN);
    return s;
  });
}

function glitch(text: string, seed: number): string {
  return perGrapheme(text, false, (g, i) => {
    const next = rngAt(seed, i);
    let s = g;
    if (randInt(next, 100) < 60) s += pick(next, GLITCH_OVERLAY);
    if (randInt(next, 100) < 30) s += pick(next, ZALGO_UP);
    if (randInt(next, 100) < 30) s += pick(next, ZALGO_DOWN);
    return s;
  });
}

/* ───────────── style registry ───────────── */

export const STYLES: Record<StyleId, StyleInfo> = {
  bold: { id: "bold", kind: "math", cyr: "none", latin: "all", digits: "all" },
  italic: { id: "italic", kind: "math", cyr: "none", latin: "all", digits: "none" },
  "bold-italic": { id: "bold-italic", kind: "math", cyr: "none", latin: "all", digits: "none" },
  script: { id: "script", kind: "math", cyr: "none", latin: "all", digits: "none" },
  "bold-script": { id: "bold-script", kind: "math", cyr: "none", latin: "all", digits: "none" },
  fraktur: { id: "fraktur", kind: "math", cyr: "none", latin: "all", digits: "none" },
  "bold-fraktur": { id: "bold-fraktur", kind: "math", cyr: "none", latin: "all", digits: "none" },
  "double-struck": { id: "double-struck", kind: "math", cyr: "none", latin: "all", digits: "all" },
  monospace: { id: "monospace", kind: "math", cyr: "none", latin: "all", digits: "all" },
  sans: { id: "sans", kind: "math", cyr: "none", latin: "all", digits: "all" },
  "sans-bold": { id: "sans-bold", kind: "math", cyr: "none", latin: "all", digits: "all" },
  "sans-italic": { id: "sans-italic", kind: "math", cyr: "none", latin: "all", digits: "none" },
  "sans-bold-italic": { id: "sans-bold-italic", kind: "math", cyr: "none", latin: "all", digits: "none" },
  "small-caps": { id: "small-caps", kind: "letters", cyr: "partial", latin: "partial", digits: "none" },
  superscript: { id: "superscript", kind: "letters", cyr: "none", latin: "partial", digits: "all" },
  subscript: { id: "subscript", kind: "letters", cyr: "none", latin: "partial", digits: "all" },
  circled: { id: "circled", kind: "enclosed", cyr: "none", latin: "all", digits: "all" },
  "circled-negative": { id: "circled-negative", kind: "enclosed", cyr: "none", latin: "all", digits: "all" },
  bubble: { id: "bubble", kind: "combining", cyr: "full", latin: "all", digits: "all", mark: 0x20dd },
  squared: { id: "squared", kind: "enclosed", cyr: "none", latin: "all", digits: "none" },
  "squared-negative": { id: "squared-negative", kind: "enclosed", cyr: "none", latin: "all", digits: "none" },
  parenthesized: { id: "parenthesized", kind: "enclosed", cyr: "none", latin: "all", digits: "partial" },
  fullwidth: { id: "fullwidth", kind: "letters", cyr: "none", latin: "all", digits: "all" },
  "upside-down": { id: "upside-down", kind: "flip", cyr: "partial", latin: "all", digits: "all" },
  mirror: { id: "mirror", kind: "flip", cyr: "partial", latin: "partial", digits: "partial" },
  strikethrough: { id: "strikethrough", kind: "combining", cyr: "full", latin: "all", digits: "all", mark: 0x0336 },
  "slash-through": { id: "slash-through", kind: "combining", cyr: "full", latin: "all", digits: "all", mark: 0x0338 },
  underline: { id: "underline", kind: "combining", cyr: "full", latin: "all", digits: "all", mark: 0x0332 },
  "double-underline": { id: "double-underline", kind: "combining", cyr: "full", latin: "all", digits: "all", mark: 0x0333 },
  overline: { id: "overline", kind: "combining", cyr: "full", latin: "all", digits: "all", mark: 0x0305 },
  zalgo: { id: "zalgo", kind: "random", cyr: "full", latin: "all", digits: "all", random: true },
  glitch: { id: "glitch", kind: "random", cyr: "full", latin: "all", digits: "all", random: true },
};

/** Combining styles that also mark spaces, so the line stays continuous. */
const LINE_STYLES = new Set<StyleId>(["strikethrough", "underline", "double-underline", "overline"]);

const mapCache = new Map<StyleId, CharMap>();
function charMap(id: StyleId): CharMap | null {
  const cached = mapCache.get(id);
  if (cached) return cached;
  let m: CharMap | null = null;
  if (id in MATH) m = mathMap(MATH[id as MathStyleId]);
  else if (id === "small-caps") m = smallCapsMap();
  else if (id === "superscript") m = superMap();
  else if (id === "subscript") m = subMap();
  else if (id === "circled") m = enclosedMap(0x24b6, 0x24d0, 0x24ea, 0x2460);
  else if (id === "circled-negative") m = enclosedMap(0x1f150, null, 0x24ff, 0x2776);
  else if (id === "squared") m = enclosedMap(0x1f130, null, null, null);
  else if (id === "squared-negative") m = enclosedMap(0x1f170, null, null, null);
  else if (id === "parenthesized") m = enclosedMap(0x1f110, 0x249c, null, 0x2474);
  else if (id === "fullwidth") m = fullwidthMap();
  else if (id === "upside-down") m = flipMap();
  else if (id === "mirror") m = mirrorMap();
  if (m) mapCache.set(id, m);
  return m;
}

function reverseLine(text: string, map: CharMap): string {
  const parts = graphemes(text).map((g) => (isEmoji(g) ? g : mapGrapheme(g, map)));
  return parts.reverse().join("");
}

/** Render `text` in a style. Pure and deterministic for a given seed. */
export function stylize(id: StyleId, text: string, opts: StyleOptions = {}): string {
  const info = STYLES[id];
  const seed = opts.seed ?? DEFAULT_SEED;
  if (id === "zalgo") return zalgo(text, seed, opts.zalgo ?? "medium");
  if (id === "glitch") return glitch(text, seed);
  if (info.mark !== undefined) {
    const mark = chr(info.mark);
    // Enclosing circles only make sense around letters and digits.
    if (id === "bubble") return perGrapheme(text, false, (g) => (/[\p{L}\p{N}]/u.test(g) ? g + mark : g));
    return perGrapheme(text, LINE_STYLES.has(id), (g) => g + mark);
  }
  const map = charMap(id)!;
  // Turned 180°: every grapheme flips and the order reverses (including line order).
  if (id === "upside-down") return reverseLine(text, map);
  // Mirrored: each line reverses, line order stays.
  if (id === "mirror") return text.split("\n").map((line) => reverseLine(line, map)).join("\n");
  return mapText(text, map);
}

/** Does this style leave (some) Cyrillic letters of `text` unchanged? */
export function cyrillicNotice(id: StyleId, text: string): CyrSupport | null {
  const s = STYLES[id].cyr;
  return s !== "full" && hasCyrillic(text) ? s : null;
}

/* ───────────── X (Twitter) weighted length ───────────── */

/**
 * Character count as described by the open-source twitter-text library (v3
 * config): code points in U+0000–U+10FF, U+2000–U+200D, U+2010–U+201F and
 * U+2032–U+2037 weigh 1, everything else (incl. 𝐀, Ⓐ, Ａ, ᴀ) weighs 2, and every
 * emoji sequence weighs 2. Text is NFC-normalized first.
 */
export function xWeightedLength(text: string): number {
  let n = 0;
  for (const g of graphemes(text.normalize("NFC"))) {
    if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(g)) {
      n += 2;
      continue;
    }
    for (const ch of g) {
      const cp = ch.codePointAt(0) ?? 0;
      const light = cp <= 0x10ff || (cp >= 0x2000 && cp <= 0x200d) || (cp >= 0x2010 && cp <= 0x201f) || (cp >= 0x2032 && cp <= 0x2037);
      n += light ? 1 : 2;
    }
  }
  return n;
}
export const X_LIMIT = 280;
