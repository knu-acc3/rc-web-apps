/**
 * Case conversions. Word splitting understands camelCase humps and acronyms
 * ("XMLHttpRequest" → XML · Http · Request), any delimiter ("hello,_world"),
 * and any script (Cyrillic, Kazakh, Greek…).
 */

export type CaseId =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot"
  | "alternating"
  | "inverse";

export const CASE_IDS: CaseId[] = ["upper", "lower", "title", "sentence", "camel", "pascal", "snake", "kebab", "constant", "dot", "alternating", "inverse"];

const L = "\\p{L}\\p{M}";
const LOWER = "\\p{Ll}";
const UPPER = "\\p{Lu}";

/**
 * Split an identifier or phrase into words for programmer cases.
 * Apostrophes inside words are dropped ("don't" → "dont").
 */
export function splitWords(s: string): string[] {
  const cleaned = s
    .normalize("NFC")
    .replace(new RegExp(`([${L}])['’]([${L}])`, "gu"), "$1$2")
    // lower/digit → Upper: "helloWorld", "v2Update"
    .replace(new RegExp(`([${LOWER}\\p{N}])([${UPPER}])`, "gu"), "$1 $2")
    // ACRONYM → Word: "XMLHttp" → "XML Http"
    .replace(new RegExp(`([${UPPER}])([${UPPER}][${LOWER}])`, "gu"), "$1 $2");
  return cleaned.split(new RegExp(`[^${L}\\p{N}]+`, "u")).filter(Boolean);
}

const lowerW = (w: string, loc?: string) => w.toLocaleLowerCase(loc);
const upperW = (w: string, loc?: string) => w.toLocaleUpperCase(loc);
const capW = (w: string, loc?: string) => {
  const chars = [...w];
  return chars.length ? upperW(chars[0], loc) + lowerW(chars.slice(1).join(""), loc) : w;
};

/** A word written in capitals (2–6 letters), e.g. NASA, США, HTML5. */
function isCaps(w: string): boolean {
  const letters = w.replace(/[^\p{L}]/gu, "");
  return letters.length >= 2 && letters === letters.toUpperCase() && letters !== letters.toLowerCase();
}

/**
 * Indexes of words that look like acronyms: short all-caps words that are not
 * part of a run of all-caps words ("КАК ДЕЛА" is shouting, "NASA и США" are acronyms).
 */
function acronymSet(words: string[]): Set<number> {
  const caps = words.map(isCaps);
  const out = new Set<number>();
  words.forEach((w, i) => {
    const letters = w.replace(/[^\p{L}]/gu, "").length;
    if (caps[i] && letters <= 6 && !caps[i - 1] && !caps[i + 1]) out.add(i);
  });
  return out;
}

/** Text is (almost) entirely in capitals — acronyms can't be told apart then. */
function isShouting(s: string): boolean {
  const letters = s.replace(/[^\p{L}]/gu, "");
  if (letters.length < 4) return false;
  const upper = letters.replace(/[^\p{Lu}]/gu, "").length;
  return upper / letters.length > 0.8;
}

export const EN_SMALL_WORDS = new Set(
  "a an and as at but by en for from if in into nor of on onto or per so the to up upon via vs vs. with yet".split(" "),
);

export interface CaseOptions {
  locale?: string;
  /** Title case: keep English articles/short prepositions in lowercase (AP/Chicago style). */
  smallWords?: boolean;
  /** Title/sentence case: keep words written in capitals (NASA, США). */
  keepAcronyms?: boolean;
}

const WORD_RE = new RegExp(`[${L}\\p{N}]+(?:['’][${L}]+)*`, "gu");

export function toTitleCase(s: string, opts: CaseOptions = {}): string {
  const { locale, smallWords = false, keepAcronyms = true } = opts;
  const shouting = isShouting(s);
  const matches = [...s.matchAll(WORD_RE)];
  const acr = acronymSet(matches.map((m) => m[0]));
  let out = "";
  let last = 0;
  matches.forEach((m, i) => {
    const w = m[0];
    const start = m.index!;
    out += s.slice(last, start);
    last = start + w.length;
    const prevChunk = s.slice(i > 0 ? matches[i - 1].index! + matches[i - 1][0].length : 0, start);
    // After a colon, dash or at a line start a small word is capitalised again.
    const boundary = i === 0 || /[:.!?—–]\s*$|\n\s*$/.test(prevChunk);
    const isLast = i === matches.length - 1;
    const lw = lowerW(w, locale);
    if (keepAcronyms && !shouting && acr.has(i)) out += w;
    else if (smallWords && !boundary && !isLast && EN_SMALL_WORDS.has(lw)) out += lw;
    else out += capW(w, locale);
  });
  return out + s.slice(last);
}

export function toSentenceCase(s: string, opts: CaseOptions = {}): string {
  const { locale, keepAcronyms = true } = opts;
  const shouting = isShouting(s);
  const acr = acronymSet([...s.matchAll(WORD_RE)].map((m) => m[0]));
  let k = 0;
  let out = s.replace(WORD_RE, (w) => (keepAcronyms && !shouting && acr.has(k++) ? w : lowerW(w, locale)));
  // English pronoun "I" (i, i'm, i've, i'd, i'll)
  out = out.replace(/(^|[^\p{L}\p{N}])i(?=$|[^\p{L}\p{N}'’]|['’](?:m|ve|d|ll)\b)/gu, "$1I");
  // Capitalise the first letter of the text and of every sentence.
  out = out.replace(/(^|[.!?…]\s+|\n\s*)([^\p{L}\n]*?)(\p{Ll})/gu, (_m, pre: string, mid: string, ch: string) => pre + mid + upperW(ch, locale));
  return out;
}

export function toAlternating(s: string, startUpper = false): string {
  let up = startUpper;
  let out = "";
  for (const ch of s) {
    if (/\p{L}/u.test(ch) && ch.toLowerCase() !== ch.toUpperCase()) {
      out += up ? ch.toUpperCase() : ch.toLowerCase();
      up = !up;
    } else out += ch;
  }
  return out;
}

export function toInverse(s: string): string {
  let out = "";
  for (const ch of s) {
    const lo = ch.toLowerCase();
    const hi = ch.toUpperCase();
    out += ch === lo && ch !== hi ? hi : ch === hi && ch !== lo ? lo : ch;
  }
  return out;
}

/** Apply a programmer case to every line separately (so a list of names converts line by line). */
function perLine(s: string, fn: (line: string) => string): string {
  return s
    .split(/\r\n|\r|\n/)
    .map((line) => (line.trim() ? fn(line) : line))
    .join("\n");
}

export function convertCase(s: string, id: CaseId, opts: CaseOptions = {}): string {
  const loc = opts.locale;
  switch (id) {
    case "upper":
      return upperW(s, loc);
    case "lower":
      return lowerW(s, loc);
    case "title":
      return toTitleCase(s, opts);
    case "sentence":
      return toSentenceCase(s, opts);
    case "alternating":
      return toAlternating(s);
    case "inverse":
      return toInverse(s);
    case "camel":
      return perLine(s, (l) => splitWords(l).map((w, i) => (i === 0 ? lowerW(w, loc) : capW(w, loc))).join(""));
    case "pascal":
      return perLine(s, (l) => splitWords(l).map((w) => capW(w, loc)).join(""));
    case "snake":
      return perLine(s, (l) => splitWords(l).map((w) => lowerW(w, loc)).join("_"));
    case "kebab":
      return perLine(s, (l) => splitWords(l).map((w) => lowerW(w, loc)).join("-"));
    case "constant":
      return perLine(s, (l) => splitWords(l).map((w) => upperW(w, loc)).join("_"));
    case "dot":
      return perLine(s, (l) => splitWords(l).map((w) => lowerW(w, loc)).join("."));
  }
}
