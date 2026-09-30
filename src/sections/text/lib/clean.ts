/**
 * Text cleaning operations. Letters of every script are always preserved;
 * emoji ZWJ sequences (👨‍👩‍👧) are never broken.
 */
import { graphemes, normalizeNewlines } from "./textOps";

/** Invisible / formatting characters removed by "remove invisible characters". */
export const INVISIBLE_CHARS: { cp: number; name: string }[] = [
  { cp: 0x00ad, name: "SOFT HYPHEN" },
  { cp: 0x034f, name: "COMBINING GRAPHEME JOINER" },
  { cp: 0x061c, name: "ARABIC LETTER MARK" },
  { cp: 0x115f, name: "HANGUL CHOSEONG FILLER" },
  { cp: 0x1160, name: "HANGUL JUNGSEONG FILLER" },
  { cp: 0x180e, name: "MONGOLIAN VOWEL SEPARATOR" },
  { cp: 0x200b, name: "ZERO WIDTH SPACE" },
  { cp: 0x200c, name: "ZERO WIDTH NON-JOINER" },
  { cp: 0x200d, name: "ZERO WIDTH JOINER (outside emoji)" },
  { cp: 0x200e, name: "LEFT-TO-RIGHT MARK" },
  { cp: 0x200f, name: "RIGHT-TO-LEFT MARK" },
  { cp: 0x202a, name: "LEFT-TO-RIGHT EMBEDDING" },
  { cp: 0x202b, name: "RIGHT-TO-LEFT EMBEDDING" },
  { cp: 0x202c, name: "POP DIRECTIONAL FORMATTING" },
  { cp: 0x202d, name: "LEFT-TO-RIGHT OVERRIDE" },
  { cp: 0x202e, name: "RIGHT-TO-LEFT OVERRIDE" },
  { cp: 0x2060, name: "WORD JOINER" },
  { cp: 0x2061, name: "FUNCTION APPLICATION" },
  { cp: 0x2062, name: "INVISIBLE TIMES" },
  { cp: 0x2063, name: "INVISIBLE SEPARATOR" },
  { cp: 0x2064, name: "INVISIBLE PLUS" },
  { cp: 0x2066, name: "LEFT-TO-RIGHT ISOLATE" },
  { cp: 0x2067, name: "RIGHT-TO-LEFT ISOLATE" },
  { cp: 0x2068, name: "FIRST STRONG ISOLATE" },
  { cp: 0x2069, name: "POP DIRECTIONAL ISOLATE" },
  { cp: 0x2800, name: "BRAILLE PATTERN BLANK" },
  { cp: 0x3164, name: "HANGUL FILLER" },
  { cp: 0xfeff, name: "ZERO WIDTH NO-BREAK SPACE (BOM)" },
  { cp: 0xffa0, name: "HALFWIDTH HANGUL FILLER" },
];
const INVISIBLE_SET = new Set(INVISIBLE_CHARS.map((c) => String.fromCodePoint(c.cp)));
const INVISIBLE_RE = new RegExp(`[${INVISIBLE_CHARS.map((c) => `\\u{${c.cp.toString(16)}}`).join("")}]`, "gu");

/** Spaces that look like a normal space but aren't (NBSP, thin, figure, ideographic…). */
const SPECIAL_SPACES_RE = /[   -   　]/g;

/** Count invisible characters that `removeInvisible` would delete. */
export function countInvisible(s: string): number {
  let n = 0;
  for (const g of graphemes(s)) {
    if (/\p{Extended_Pictographic}/u.test(g)) continue;
    for (const ch of g) if (INVISIBLE_SET.has(ch)) n++;
  }
  return n;
}

/** Remove invisible characters, but keep ZWJ/VS16 inside emoji sequences. */
export function removeInvisible(s: string): string {
  let out = "";
  for (const g of graphemes(s)) out += /\p{Extended_Pictographic}/u.test(g) ? g : g.replace(INVISIBLE_RE, "");
  return out;
}

/* ───────────── HTML ───────────── */

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", laquo: "«", raquo: "»", ldquo: "“", rdquo: "”", bdquo: "„", lsquo: "‘", rsquo: "’",
  mdash: "—", ndash: "–", hellip: "…", copy: "©", reg: "®", trade: "™", deg: "°", plusmn: "±", times: "×", divide: "÷", euro: "€", pound: "£", yen: "¥",
  sect: "§", para: "¶", middot: "·", bull: "•", shy: "­", thinsp: " ", ensp: " ", emsp: " ", zwj: "‍", zwnj: "‌", numero: "№",
  frac12: "½", frac14: "¼", frac34: "¾", sup2: "²", sup3: "³", larr: "←", rarr: "→", uarr: "↑", darr: "↓", hearts: "♥", laquo2: "«",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const cp = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
    }
    return NAMED_ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Strip HTML to plain text: drops script/style/comments, turns block tags into line breaks, decodes entities. */
export function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(script|style|noscript|template|head)\b[\s\S]*?<\/\1\s*>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|pre|section|article|header|footer|ul|ol|table)\s*>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "• ")
      .replace(/<\/?[a-z][^>]*>/gi, ""),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ───────────── quotes ───────────── */

export function quotesToStraight(s: string): string {
  return s.replace(/[“”„‟«»″]/g, '"').replace(/[‘’‚‛′‹›]/g, "'");
}

/** Straight quotes → English curly quotes (“double”, ‘single’, apostrophe ’). */
export function quotesToCurly(s: string): string {
  return s
    .replace(/(^|[\s([{—–-])"/g, "$1“")
    .replace(/"/g, "”")
    .replace(/(\p{L})'(\p{L})/gu, "$1’$2")
    .replace(/(^|[\s([{—–-])'/g, "$1‘")
    .replace(/'/g, "’");
}

/** Straight quotes → Russian «ёлочки» with „лапками“ inside. */
export function quotesToGuillemets(s: string): string {
  let depth = 0;
  let out = "";
  const chars = [...s];
  chars.forEach((c, i) => {
    if (c !== '"' && c !== "“" && c !== "”" && c !== "„" && c !== "«" && c !== "»") {
      out += c;
      return;
    }
    const prev = chars[i - 1];
    const opening = c === "«" || c === "„" || (c !== "»" && c !== "”" && (prev === undefined || /[\s([{—–-]/.test(prev) || ((prev === "«" || prev === "„") && depth > 0)));
    if (opening) {
      out += depth === 0 ? "«" : "„";
      depth++;
    } else {
      depth = Math.max(0, depth - 1);
      out += depth === 0 ? "»" : "“";
    }
  });
  return out;
}

/**
 * Remove accents: "café" → "cafe", "за́мок" → "замок". Letters that are
 * separate letters of their alphabet (й, ё, ї, ў) are kept.
 */
export function removeDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/(\p{Script=Cyrillic})?(\p{M}+)/gu, (_m, base: string | undefined, marks: string) =>
      base ? base + marks.replace(/[^̆̈]/gu, "") : "",
    )
    .normalize("NFC");
}

/* ───────────── cleaner ───────────── */

export interface CleanOptions {
  trimLines?: boolean;
  collapseSpaces?: boolean;
  /** "none" | join lines inside paragraphs | join everything into one line */
  lineBreaks?: "keep" | "paragraphs" | "all";
  emptyLines?: "keep" | "collapse" | "remove";
  tabs?: "keep" | "spaces" | "remove";
  tabWidth?: number;
  stripHtml?: boolean;
  invisible?: boolean;
  specialSpaces?: boolean;
  quotes?: "keep" | "straight" | "curly" | "guillemets";
  dashes?: boolean;
  yo?: boolean;
  /** Remove punctuation and symbols; letters of all alphabets and digits are kept. */
  punctuation?: boolean;
  emoji?: boolean;
  diacritics?: boolean;
}

export function cleanText(input: string, o: CleanOptions): string {
  let s = normalizeNewlines(input);
  if (o.stripHtml) s = stripHtml(s);
  if (o.invisible) s = removeInvisible(s);
  if (o.specialSpaces) s = s.replace(SPECIAL_SPACES_RE, " ");
  if (o.tabs === "spaces") {
    const w = Math.max(1, Math.min(16, o.tabWidth ?? 4));
    // Expand tabs to the next tab stop, like an editor does.
    s = s
      .split("\n")
      .map((line) => {
        let col = 0;
        let res = "";
        for (const ch of line) {
          if (ch === "\t") {
            const n = w - (col % w);
            res += " ".repeat(n);
            col += n;
          } else {
            res += ch;
            col++;
          }
        }
        return res;
      })
      .join("\n");
  } else if (o.tabs === "remove") s = s.replace(/\t/g, " ");
  if (o.emoji) {
    s = graphemes(s)
      .filter((g) => !(/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(g) && (g.codePointAt(0)! > 0xff || /️/.test(g))))
      .join("");
  }
  if (o.diacritics) s = removeDiacritics(s);
  if (o.yo) s = s.replace(/ё/g, "е").replace(/Ё/g, "Е");
  if (o.punctuation) s = s.replace(/[^\p{L}\p{M}\p{N}\s]/gu, "");
  if (o.dashes) s = s.replace(/[‒–—―−]/g, "-");
  if (o.quotes === "straight") s = quotesToStraight(s);
  else if (o.quotes === "curly") s = quotesToCurly(quotesToStraight(s));
  else if (o.quotes === "guillemets") s = quotesToGuillemets(quotesToStraight(s));
  if (o.collapseSpaces) s = s.replace(/[^\S\n]{2,}/g, " ");
  if (o.trimLines) s = s.split("\n").map((l) => l.trim()).join("\n");
  if (o.lineBreaks === "all") s = s.replace(/\s*\n\s*/g, " ").trim();
  else if (o.lineBreaks === "paragraphs") {
    s = s
      .split(/\n[^\S\n]*\n\s*/)
      .map((p) => p.replace(/-\n(?=\p{Ll})/gu, "").replace(/[^\S\n]*\n[^\S\n]*/g, " "))
      .join("\n\n");
  }
  if (o.emptyLines === "remove") s = s.split("\n").filter((l) => l.trim() !== "").join("\n");
  else if (o.emptyLines === "collapse") s = s.replace(/\n[^\S\n]*(?:\n[^\S\n]*)+\n/g, "\n\n");
  return s;
}
