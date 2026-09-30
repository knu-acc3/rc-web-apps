/**
 * Typograph: prepares text for publication by the rules of Russian (or
 * English) typography — quotes, dashes, non-breaking spaces, ellipsis,
 * symbols and digit grouping.
 */
import { normalizeNewlines } from "./textOps";
import { replaceNotAfter } from "@/lib/lookbehind";

export const NBSP = " ";
/** Narrow no-break space — used for thousands grouping. */
export const NNBSP = " ";

export type TypoLang = "ru" | "en";

export interface TypoOptions {
  lang?: TypoLang;
  quotes?: boolean;
  dashes?: boolean;
  nbsp?: boolean;
  /** Group thousands in numbers of 5+ digits with a narrow no-break space. */
  digits?: boolean;
  symbols?: boolean;
  spaces?: boolean;
}

/** Prepositions, conjunctions and pronouns of 1–2 letters plus short prepositions. */
const RU_SHORT = "а|в|и|к|о|с|у|я|во|да|до|за|из|ко|на|не|ни|но|об|от|по|со|то|ты|мы|вы|он|её|их|им|уж|или|для|без|над|под|при|про|обо|изо|ото";
const RU_SHORT_RE = new RegExp(`(^|[\\s«„(\\[—])(${RU_SHORT})[ \\t]+(?=[\\p{L}\\p{N}«„(])`, "giu");
const RU_PARTICLES_RE = /(\p{L})[ \t]+(же|ли|ль|бы|б)(?=[\s.,!?:;…»“)]|$)/giu;
const EN_SHORT_RE = /(^|[\s“‘(])(a|an|the|I|of|to|in|on|at|by|or|and)[ \t]+(?=[\p{L}\p{N}])/giu;

const DOUBLE_QUOTES = new Set(['"', "«", "»", "„", "“", "”"]);

function fixQuotes(s: string, lang: TypoLang): string {
  const [o1, c1, o2, c2] = lang === "ru" ? ["«", "»", "„", "“"] : ["“", "”", "‘", "’"];
  let out = "";
  let depth = 0;
  const chars = [...s];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const prev = chars[i - 1];
    const next = chars[i + 1];
    if (lang === "en" && (c === "'" || c === "’" || c === "‘")) {
      if (prev && /[\p{L}\p{N}]/u.test(prev)) out += "’"; // don't, dogs'
      else if (next && /\d/.test(next)) out += "’"; // the '90s
      else out += !prev || /[\s(\[{“—–-]/.test(prev) ? "‘" : "’";
      continue;
    }
    if (!DOUBLE_QUOTES.has(c)) {
      out += c;
      continue;
    }
    // inch mark after a number outside quotations: 15" → 15″
    if (c === '"' && depth === 0 && prev && /\d/.test(prev)) {
      out += "″";
      continue;
    }
    let open: boolean;
    if (c === "«" || c === "„") open = true;
    else if (c === "»" || c === "”") open = false;
    else if (c === "“") open = lang === "en" || depth === 0;
    else open = !prev || /[\s(\[{—–\-/]/.test(prev) || out.endsWith(o1) || out.endsWith(o2);
    if (open) {
      out += depth % 2 === 0 ? o1 : o2;
      depth++;
    } else {
      depth = Math.max(0, depth - 1);
      out += depth % 2 === 0 ? c1 : c2;
    }
  }
  return out;
}

function fixDashes(s: string, lang: TypoLang): string {
  let t = s;
  // dialogue dash at the start of a line
  t = t.replace(/^([^\S\n]*)(?:--?|–|—)[ \t]+/gm, lang === "ru" ? `$1—${NBSP}` : "$1— ");
  // word - word, word -- word, word – word  → em dash
  t = t.replace(/([^\s\n])[ \t]+(?:--?|–|—)[ \t]+/g, lang === "ru" ? `$1${NBSP}— ` : "$1 — ");
  // number ranges 10-20 → 10–20 (not dates or phone numbers with more parts)
  t = replaceNotAfter(t, /(\d+)-(\d+)(?![\d\-–.:/])/g, /[\d\-–.:/]/, (m) => `${m[1]}–${m[2]}`);
  return t;
}

function fixNbsp(s: string, lang: TypoLang): string {
  let t = s;
  if (lang === "ru") {
    // twice: "и в доме" — both short words must be bound
    t = t.replace(RU_SHORT_RE, `$1$2${NBSP}`).replace(RU_SHORT_RE, `$1$2${NBSP}`);
    t = t.replace(RU_PARTICLES_RE, `$1${NBSP}$2`);
    // initials: А. С. Пушкин
    t = replaceNotAfter(t, /(\p{Lu}\.)[ \t]*(\p{Lu}\.)[ \t]*(\p{Lu}\p{Ll}+)/gu, /\p{L}/u, (m) => `${m[1]}${NBSP}${m[2]}${NBSP}${m[3]}`);
    t = replaceNotAfter(t, /(\p{Lu}\p{Ll}+)[ \t]+(\p{Lu}\.)[ \t]*(\p{Lu}\.)/gu, /\p{L}/u, (m) => `${m[1]}${NBSP}${m[2]}${NBSP}${m[3]}`);
    // abbreviations: т. е., т. д., т. п., и т. д.
    t = t.replace(/(^|[\s(])(т|и)\.[ \t]*(е|д|п|к)\./gu, `$1$2.${NBSP}$3.`);
    t = t.replace(/(^|[\s(])и[ \t]+т\./gu, `$1и${NBSP}т.`);
  } else {
    t = t.replace(EN_SHORT_RE, `$1$2${NBSP}`);
  }
  // number + unit / word: 5 кг, 100 рублей, 10 %
  t = t.replace(/(\d)[ \t]+(?=[\p{L}%‰°₸₽$€£])/gu, `$1${NBSP}`);
  // № 5, § 3
  t = t.replace(/([№§])[ \t]*(?=\d)/g, `$1${NBSP}`);
  return t;
}

function groupDigits(s: string): string {
  return replaceNotAfter(s, /(\d{5,})(?![\d\p{L}/:_])/gu, /[\d.,:/\-+#№\p{L}_]/u, (m) => {
    const digits = m[1];
    // don't touch the fractional part (3,14159) or leading-zero codes
    if (digits.startsWith("0")) return m[0];
    const before = s.slice(Math.max(0, m.index - 2), m.index);
    if (/\d[.,]$/.test(before)) return m[0];
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
  });
}

function fixSymbols(s: string, lang: TypoLang): string {
  let t = s
    .replace(/\.{3}/g, "…")
    .replace(/\((c|с)\)/gi, "©")
    .replace(/\(r\)/gi, "®")
    .replace(/\(tm\)/gi, "™")
    .replace(/\+-/g, "±")
    .replace(/(\s)->(\s)/g, "$1→$2")
    .replace(/(\s)<-(\s)/g, "$1←$2");
  // 1920x1080 → 1920×1080 (but not hex like 0x1F)
  t = replaceNotAfter(t, /(\d+)[ \t]*[xх][ \t]*(\d+)(?![\p{L}])/gu, /[\p{L}\p{N}]/u, (m) => (m[1] === "0" ? m[0] : `${m[1]}×${m[2]}`));
  // m2, м3, км2 → m², м³, км²
  t = replaceNotAfter(t, /((?:к|с|д|м)?м|(?:k|c|d|m)?m|ft|in)([23])(?![\p{L}\p{N}])/gu, /\p{L}/u, (m) => m[1] + (m[2] === "2" ? "²" : "³"));
  if (lang === "ru") t = t.replace(/(\d)[ \t]*(?:гр\.|град\.)/g, "$1°");
  return t;
}

function fixSpaces(s: string): string {
  return s
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,!?;:…»“)\]])/g, (m, p: string) => (p === "“" ? m : p))
    .replace(/([«„(\[])[ \t]+/g, "$1")
    .replace(/[ \t]+$/gm, "");
}

export function typograph(input: string, opts: TypoOptions = {}): string {
  const { lang = "ru", quotes = true, dashes = true, nbsp = true, digits = true, symbols = true, spaces = true } = opts;
  let s = normalizeNewlines(input);
  if (spaces) s = fixSpaces(s);
  if (symbols) s = fixSymbols(s, lang);
  if (quotes) s = fixQuotes(s, lang);
  if (dashes) s = fixDashes(s, lang);
  if (digits && lang === "ru") s = groupDigits(s);
  if (nbsp) s = fixNbsp(s, lang);
  return s;
}

const ENTITY: Record<string, string> = {
  " ": "&nbsp;", " ": "&#8239;", "«": "&laquo;", "»": "&raquo;", "„": "&bdquo;", "“": "&ldquo;", "”": "&rdquo;", "‘": "&lsquo;", "’": "&rsquo;",
  "—": "&mdash;", "–": "&ndash;", "…": "&hellip;", "©": "&copy;", "®": "&reg;", "™": "&trade;", "±": "&plusmn;", "×": "&times;", "→": "&rarr;", "←": "&larr;",
  "²": "&sup2;", "³": "&sup3;", "°": "&deg;", "″": "&Prime;", "&": "&amp;", "<": "&lt;", ">": "&gt;",
};

/** Encode typographic characters as HTML entities (for pasting into HTML source). */
export function toHtmlEntities(s: string): string {
  return s.replace(/[  «»„“”‘’—–…©®™±×→←²³°″&<>]/g, (c) => ENTITY[c] ?? c);
}
