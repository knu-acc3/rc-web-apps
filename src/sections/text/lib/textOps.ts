/**
 * textOps — the single text library used by every text tool (counter, notes,
 * word frequency, sort, dedupe…). Pure functions, no DOM, safe on the server.
 *
 * Graphemes, words and sentences come from Intl.Segmenter, so emoji with ZWJ,
 * flags, combining marks and CJK text are counted the way people read them.
 */

type Granularity = "grapheme" | "word" | "sentence";
const segCache = new Map<string, Intl.Segmenter>();

function segmenter(granularity: Granularity, locale = "ru"): Intl.Segmenter {
  const key = `${granularity}:${locale}`;
  let s = segCache.get(key);
  if (!s) {
    s = new Intl.Segmenter(locale, { granularity });
    segCache.set(key, s);
  }
  return s;
}

/* ───────────── line endings ───────────── */

export const EOL_RE = /\r\n|\r|\n/;

/** Convert CRLF / CR line endings to LF. */
export function normalizeNewlines(s: string): string {
  return s.replace(/\r\n?/g, "\n");
}

/** Split into lines on any line ending (\r\n, \r, \n). An empty string has no lines. */
export function splitLines(s: string): string[] {
  if (s === "") return [];
  return s.split(EOL_RE);
}

/* ───────────── graphemes ───────────── */

export function graphemes(s: string): string[] {
  const out: string[] = [];
  for (const { segment } of segmenter("grapheme").segment(s)) out.push(segment);
  return out;
}

export function graphemeCount(s: string): number {
  let n = 0;

  for (const _ of segmenter("grapheme").segment(s)) n++;
  return n;
}

/** Reverse a string by grapheme clusters: emoji, flags and accents survive. */
export function reverseGraphemes(s: string): string {
  return graphemes(s).reverse().join("");
}

const WS_RE = /^\s+$/u;
const EMOJI_RE = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

export function isEmojiGrapheme(g: string): boolean {
  return EMOJI_RE.test(g) || /⃣/.test(g);
}

/* ───────────── words ───────────── */

export interface WordToken {
  word: string;
  index: number;
}

/** Word-like segments (letters/digits in any script; CJK split by dictionary). */
export function wordTokens(s: string, locale = "ru"): WordToken[] {
  const out: WordToken[] = [];
  for (const seg of segmenter("word", locale).segment(s)) {
    if (seg.isWordLike) out.push({ word: seg.segment, index: seg.index });
  }
  return out;
}

export function words(s: string, locale = "ru"): string[] {
  return wordTokens(s, locale).map((t) => t.word);
}

export function wordCount(s: string, locale = "ru"): number {
  let n = 0;
  for (const seg of segmenter("word", locale).segment(s)) if (seg.isWordLike) n++;
  return n;
}

/* ───────────── sentences & paragraphs ───────────── */

const HAS_WORD_RE = /[\p{L}\p{N}]/u;

export function sentences(s: string, locale = "ru"): string[] {
  const out: string[] = [];
  for (const { segment } of segmenter("sentence", locale).segment(s)) {
    // Segmenter keeps paragraph breaks inside segments; split them so a heading
    // without a full stop is its own sentence.
    for (const part of segment.split(/\n\s*\n/)) {
      const t = part.trim();
      if (t && HAS_WORD_RE.test(t)) out.push(t);
    }
  }
  return out;
}

/** Paragraph = a run of non-blank lines separated by one or more blank lines. */
export function paragraphs(s: string): string[] {
  return normalizeNewlines(s)
    .split(/\n[^\S\n]*\n\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/* ───────────── statistics ───────────── */

export interface TextStats {
  /** User-perceived characters (grapheme clusters). */
  chars: number;
  /** Characters without any whitespace. */
  charsNoSpaces: number;
  /** Whitespace characters (spaces, tabs, line breaks). */
  spaces: number;
  letters: number;
  digits: number;
  /** Punctuation and symbols. */
  punctuation: number;
  emoji: number;
  words: number;
  uniqueWords: number;
  sentences: number;
  paragraphs: number;
  /** Number of lines (0 for empty text). */
  lines: number;
  nonEmptyLines: number;
  /** UTF-16 code units (what JavaScript `length` and many limits count). */
  codeUnits: number;
  codePoints: number;
  bytesUtf8: number;
  /** Reading time in seconds (200 words/min, 500 CJK characters/min). */
  readingSeconds: number;
  /** Speaking time in seconds (130 words/min, 250 CJK characters/min). */
  speakingSeconds: number;
  avgWordLength: number;
}

export const READING_WPM = 200;
export const SPEAKING_WPM = 130;
const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

export function utf8Bytes(s: string): number {
  let n = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    n += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }
  return n;
}

export function textStats(s: string, locale = "ru"): TextStats {
  let chars = 0;
  let spaces = 0;
  let letters = 0;
  let digits = 0;
  let punctuation = 0;
  let emoji = 0;
  for (const { segment: g } of segmenter("grapheme").segment(s)) {
    chars++;
    if (WS_RE.test(g)) spaces++;
    else if (isEmojiGrapheme(g)) emoji++;
    else if (/\p{L}/u.test(g)) letters++;
    else if (/\p{N}/u.test(g)) digits++;
    else if (/[\p{P}\p{S}]/u.test(g)) punctuation++;
  }
  const toks = words(s, locale);
  let cjkChars = 0;
  let plainWords = 0;
  let wordLen = 0;
  const uniq = new Set<string>();
  for (const w of toks) {
    uniq.add(w.toLocaleLowerCase(locale));
    if (CJK_RE.test(w)) cjkChars += graphemeCount(w);
    else {
      plainWords++;
      wordLen += graphemeCount(w);
    }
  }
  const ls = splitLines(s);
  let codePoints = 0;

  for (const _ of s) codePoints++;
  return {
    chars,
    charsNoSpaces: chars - spaces,
    spaces,
    letters,
    digits,
    punctuation,
    emoji,
    words: toks.length,
    uniqueWords: uniq.size,
    sentences: sentences(s, locale).length,
    paragraphs: paragraphs(s).length,
    lines: ls.length,
    nonEmptyLines: ls.filter((l) => l.trim() !== "").length,
    codeUnits: s.length,
    codePoints,
    bytesUtf8: utf8Bytes(s),
    readingSeconds: Math.round(((plainWords / READING_WPM) + cjkChars / 500) * 60),
    speakingSeconds: Math.round(((plainWords / SPEAKING_WPM) + cjkChars / 250) * 60),
    avgWordLength: plainWords ? wordLen / plainWords : 0,
  };
}

/* ───────────── word frequency ───────────── */

export const STOP_WORDS: Record<"ru" | "en", ReadonlySet<string>> = {
  ru: new Set(
    "а без более бы был была были было быть в вам вас весь во вот все всего всех вы где да даже для до его ее её если есть ещё еще же за здесь и из или им их к как ко когда кто ли либо меня мне может мы на над надо наш не него нее неё нет ни них но ну о об однако он она они оно от очень по под при про с со так также такой там те тем то того тоже той только том ты у уже хотя чего чей чем что чтобы чье чья эта эти это этого этой этом этот я".split(
      " ",
    ),
  ),
  en: new Set(
    "a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves".split(
      " ",
    ),
  ),
};

export interface FrequencyOptions {
  locale?: string;
  ignoreCase?: boolean;
  excludeStopWords?: boolean;
  minLength?: number;
  includeNumbers?: boolean;
  /** 1 = words, 2 = two-word phrases, 3 = three-word phrases. */
  ngram?: 1 | 2 | 3;
}

export interface FrequencyRow {
  word: string;
  count: number;
  /** Share of all counted tokens, 0..1 */
  share: number;
}

export function wordFrequency(s: string, opts: FrequencyOptions = {}): { rows: FrequencyRow[]; total: number } {
  const { locale = "ru", ignoreCase = true, excludeStopWords = false, minLength = 1, includeNumbers = false, ngram = 1 } = opts;
  const stop = new Set([...STOP_WORDS.ru, ...STOP_WORDS.en]);
  // Phrases never cross sentence boundaries.
  const units = ngram === 1 ? [s] : sentences(s, locale);
  const counts = new Map<string, { word: string; count: number }>();
  let total = 0;
  for (const unit of units) {
    let toks = words(unit, locale);
    if (!includeNumbers) toks = toks.filter((w) => /\p{L}/u.test(w));
    const norm = toks.map((w) => (ignoreCase ? w.toLocaleLowerCase(locale) : w));
    for (let i = 0; i + ngram <= norm.length; i++) {
      const parts = norm.slice(i, i + ngram);
      if (ngram === 1) {
        if (graphemeCount(parts[0]) < minLength) continue;
        if (excludeStopWords && stop.has(parts[0].toLocaleLowerCase(locale))) continue;
      } else if (excludeStopWords && (stop.has(parts[0].toLocaleLowerCase(locale)) || stop.has(parts[ngram - 1].toLocaleLowerCase(locale)))) continue;
      const key = parts.join(" ");
      const cur = counts.get(key);
      if (cur) cur.count++;
      else counts.set(key, { word: key, count: 1 });
      total++;
    }
  }
  const collator = new Intl.Collator(locale);
  const rows = [...counts.values()]
    .sort((a, b) => b.count - a.count || collator.compare(a.word, b.word))
    .map((r) => ({ ...r, share: total ? r.count / total : 0 }));
  return { rows, total };
}

/* ───────────── remove duplicates ───────────── */

export type BlankMode = "keep" | "dedupe" | "remove";
export type DedupeMode = "first" | "unique" | "duplicates";

export interface DedupeOptions {
  ignoreCase?: boolean;
  /** Compare lines ignoring leading/trailing whitespace; output is trimmed too. */
  trim?: boolean;
  /** Treat runs of spaces as one when comparing. */
  collapseSpaces?: boolean;
  /** keep: every blank line stays; dedupe: blank lines are deduplicated like others; remove: drop all blank lines. */
  blank?: BlankMode;
  /** first: keep the first occurrence; unique: keep only lines that occur once; duplicates: list repeated lines once. */
  mode?: DedupeMode;
  locale?: string;
}

export interface DedupeResult {
  text: string;
  inputLines: number;
  outputLines: number;
  removed: number;
  /** Distinct lines that appear more than once. */
  repeated: number;
}

export function removeDuplicateLines(s: string, opts: DedupeOptions = {}): DedupeResult {
  const { ignoreCase = false, trim = true, collapseSpaces = false, blank = "keep", mode = "first", locale = "ru" } = opts;
  const lines = splitLines(s);
  const keyOf = (line: string) => {
    let k = line.normalize("NFC");
    if (trim) k = k.trim();
    if (collapseSpaces) k = k.replace(/[^\S\n]+/g, " ");
    if (ignoreCase) k = k.toLocaleLowerCase(locale);
    return k;
  };
  const counts = new Map<string, number>();
  for (const l of lines) {
    const k = keyOf(l);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    const line = trim ? raw.trim() : raw;
    const k = keyOf(raw);
    const isBlank = k.trim() === "";
    if (isBlank) {
      if (blank === "remove") continue;
      if (blank === "keep") {
        if (mode !== "duplicates") out.push(line);
        continue;
      }
    }
    const c = counts.get(k) ?? 0;
    if (mode === "first") {
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(line);
    } else if (mode === "unique") {
      if (c === 1) out.push(line);
    } else if (c > 1 && !seen.has(k)) {
      seen.add(k);
      out.push(line);
    }
  }
  let repeated = 0;
  for (const [k, c] of counts) if (c > 1 && k.trim() !== "") repeated++;
  return { text: out.join("\n"), inputLines: lines.length, outputLines: out.length, removed: lines.length - out.length, repeated };
}

/* ───────────── sorting ───────────── */

export type SortMode = "alpha" | "natural" | "numeric" | "length" | "random" | "reverse";

export interface SortOptions {
  mode?: SortMode;
  descending?: boolean;
  ignoreCase?: boolean;
  /** Collation locale: ru puts Cyrillic first, en puts Latin first. */
  locale?: string;
  removeEmpty?: boolean;
  trim?: boolean;
  unique?: boolean;
  /** Random source for shuffle: returns an integer in [0, n). */
  randomInt?: (n: number) => number;
}

const NUM_RE = /[-−+]?\d+(?:[  ,.]\d{3})*(?:[.,]\d+)?(?:e[-+]?\d+)?/iu;

/** First number in a line, or null. Accepts "1 000,5", "1,000.5", "−3", "2.5e3". */
export function firstNumber(line: string): number | null {
  const m = NUM_RE.exec(line);
  if (!m) return null;
  let t = m[0].replace(/−/g, "-").replace(/[  ]/g, "");
  const hasDot = t.includes(".");
  const hasComma = t.includes(",");
  if (hasDot && hasComma) {
    t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else if (hasComma) {
    // "1,000" / "12,500,000" → thousands; "0,125" / "3,14" → decimal comma
    t = /^[-+]?[1-9]\d{0,2}(,\d{3})+$/.test(t) ? t.replace(/,/g, "") : t.replace(",", ".");
  } else if (hasDot && /^[-+]?\d{1,3}(\.\d{3}){2,}$/.test(t)) {
    t = t.replace(/\./g, "");
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Unbiased integer in [0, n) from crypto.getRandomValues (rejection sampling). */
export function cryptoRandomInt(n: number): number {
  if (n <= 1) return 0;
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / n) * n;
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % n;
  }
}

export function shuffle<T>(arr: readonly T[], randomInt: (n: number) => number = cryptoRandomInt): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Split and pre-filter lines for sorting (trim, drop empty, drop repeats). */
export function prepareLines(s: string, opts: Pick<SortOptions, "trim" | "removeEmpty" | "unique" | "ignoreCase" | "locale"> = {}): string[] {
  const { ignoreCase = true, locale = "ru", removeEmpty = false, trim = false, unique = false } = opts;
  let lines = splitLines(s);
  if (trim) lines = lines.map((l) => l.trim());
  if (removeEmpty) lines = lines.filter((l) => l.trim() !== "");
  if (unique) {
    const seen = new Set<string>();
    lines = lines.filter((l) => {
      const k = ignoreCase ? l.toLocaleLowerCase(locale) : l;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  return lines;
}

export function sortLines(s: string, opts: SortOptions = {}): string[] {
  const { mode = "alpha", descending = false, ignoreCase = true, locale = "ru" } = opts;
  const lines = prepareLines(s, opts);
  if (mode === "random") return shuffle(lines, opts.randomInt);
  if (mode === "reverse") return lines.reverse();

  const collator = new Intl.Collator(locale, {
    numeric: mode === "natural",
    sensitivity: ignoreCase ? "accent" : "variant",
    caseFirst: ignoreCase ? undefined : "upper",
  });
  const dir = descending ? -1 : 1;
  const indexed = lines.map((line, i) => ({ line, i }));
  if (mode === "numeric") {
    const withNum = indexed.map((x) => ({ ...x, n: firstNumber(x.line) }));
    const nums = withNum.filter((x) => x.n !== null) as { line: string; i: number; n: number }[];
    const rest = withNum.filter((x) => x.n === null);
    nums.sort((a, b) => (a.n - b.n) * dir || collator.compare(a.line, b.line) || a.i - b.i);
    // Lines without numbers keep their order and always go last.
    return [...nums.map((x) => x.line), ...rest.map((x) => x.line)];
  }
  if (mode === "length") {
    const withLen = indexed.map((x) => ({ ...x, len: graphemeCount(x.line) }));
    withLen.sort((a, b) => (a.len - b.len) * dir || collator.compare(a.line, b.line) || a.i - b.i);
    return withLen.map((x) => x.line);
  }
  indexed.sort((a, b) => collator.compare(a.line, b.line) * dir || a.i - b.i);
  return indexed.map((x) => x.line);
}

/* ───────────── reverse ───────────── */

export type ReverseMode = "text" | "each-line" | "words" | "letters-in-words" | "lines";

export function reverseText(s: string, mode: ReverseMode, locale = "ru"): string {
  const t = normalizeNewlines(s);
  switch (mode) {
    case "text":
      return reverseGraphemes(t);
    case "each-line":
      return t.split("\n").map(reverseGraphemes).join("\n");
    case "lines":
      return t.split("\n").reverse().join("\n");
    case "words":
      return t
        .split("\n")
        .map((line) => {
          const parts = line.split(/(\s+)/);
          const wordsIdx = parts.map((p, i) => (i % 2 === 0 && p !== "" ? i : -1)).filter((i) => i >= 0);
          const rev = wordsIdx.map((i) => parts[i]).reverse();
          wordsIdx.forEach((i, k) => (parts[i] = rev[k]));
          return parts.join("");
        })
        .join("\n");
    case "letters-in-words": {
      let out = "";
      for (const seg of segmenter("word", locale).segment(t)) out += seg.isWordLike ? reverseGraphemes(seg.segment) : seg.segment;
      return out;
    }
  }
}

/* ───────────── regex helpers ───────────── */

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
}

/** A letter, digit, combining mark or underscore — what "whole word" must not touch (works for any script). */
export const WORD_CHAR = /[\p{L}\p{N}\p{M}_]/u;

/**
 * Pattern for a literal search. "Whole word" adds a Unicode-aware lookahead; the "not preceded by a word
 * character" half is checked with WORD_CHAR by the caller (regex lookbehind breaks old Safari).
 */
export function literalPattern(find: string, wholeWord: boolean): string {
  const core = escapeRegExp(find);
  return wholeWord ? `${core}(?![\\p{L}\\p{N}\\p{M}_])` : core;
}

/** Interpret \n, \t and \\ in a replacement typed by the user. */
export function unescapeReplacement(s: string): string {
  return s.replace(/\\(n|t|r|\\)/g, (_, c: string) => (c === "n" ? "\n" : c === "t" ? "\t" : c === "r" ? "\r" : "\\"));
}
