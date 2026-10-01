/**
 * Cyrillic → Latin transliteration by published standards, plus reverse
 * direction where the standard is reversible and a URL slug mode.
 *
 * Capitalisation: a multi-letter result keeps the case of the word —
 * "Щукин" → "Shchukin", "ЩУКИН" → "SHCHUKIN".
 */

export type StandardId = "gost-a" | "gost-b" | "icao" | "bgn" | "scientific" | "informal" | "kazakh-2021" | "ukrainian-2010";
export type Lang = "ru" | "uk" | "kk";
export type LangOption = Lang | "auto";

export const STANDARD_IDS: StandardId[] = ["icao", "gost-a", "gost-b", "bgn", "scientific", "informal", "kazakh-2021", "ukrainian-2010"];

/** A mapping value: lower-case output, or [lower, Title] when the capital is not a simple toUpperCase. */
type Out = string | readonly [string, string];

interface Ctx {
  /** Lower-case previous source character ("" at text start). */
  prev: string;
  /** Lower-case next source character. */
  next: string;
  /** The character starts a word. */
  wordStart: boolean;
  /** Lower-case transliteration of the next character (for GOST B "ц"). */
  nextOut: () => string;
}
type Rule = Out | ((c: Ctx) => Out);
type Table = Record<string, Rule>;

/* ───────────── shared pieces ───────────── */

const RU_BASE: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", з: "z", и: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
};

/** Kazakh letters in the 2021 Latin alphabet (used as a documented fallback by diacritic standards). */
const KK_LATIN: Table = { ә: "ä", ғ: "ğ", қ: "q", ң: "ñ", ө: "ö", ұ: "ū", ү: "ü", һ: "h", і: ["ı", "I"] };
/** ASCII fallback for Kazakh letters in ASCII-only standards. */
const KK_ASCII: Table = { ә: "a", ғ: "g", қ: "q", ң: "n", ө: "o", ұ: "u", ү: "u", һ: "h", і: "i" };

const VOWELS = new Set([..."аеёиоуыэюяєіїәөұүі"]);

/* ───────────── standards ───────────── */

/** GOST 7.79-2000 System A = ISO 9:1995, one letter → one letter. */
const GOST_A: Table = {
  ...RU_BASE,
  ё: "ë", ж: "ž", й: "j", х: "h", ц: "c", ч: "č", ш: "š", щ: "ŝ", ъ: "ʺ", ы: "y", ь: "ʹ", э: "è", ю: "û", я: "â",
  ґ: "g̀", є: "ê", і: "ì", ї: "ï", ў: "ǔ", "’": "ʼ", "'": "ʼ",
};

/** GOST 7.79-2000 System B (ASCII). "ц" → c before i, e, y, j, otherwise cz. */
const GOST_B: Table = {
  ...RU_BASE,
  ё: "yo", ж: "zh", й: "j", х: "x", ч: "ch", ш: "sh", щ: "shh", ъ: "``", ы: "y`", ь: "`", э: "e`", ю: "yu", я: "ya",
  ц: (c) => (/^[ieyj]/.test(c.nextOut()) ? "c" : "cz"),
  ґ: "g`", є: "ye", і: "i", ї: "yi", ў: "u`",
};
const GOST_B_UK: Table = { ...GOST_B, и: "y`", "’": "'", "'": "'" };

/** ICAO Doc 9303 (7th ed.) — Russian international passports since 2013. */
const ICAO: Table = {
  ...RU_BASE,
  ё: "e", ж: "zh", й: "i", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "ie", ы: "y", ь: "", э: "e", ю: "iu", я: "ia",
  ґ: "g", є: "ie", і: "i", ї: "i", ў: "u",
};

const afterSoft = (c: Ctx) => c.wordStart || VOWELS.has(c.prev) || c.prev === "й" || c.prev === "ъ" || c.prev === "ь";

/** BGN/PCGN 1947 for Russian (the optional middle dot is not used). */
const BGN: Table = {
  ...RU_BASE,
  е: (c) => (afterSoft(c) ? "ye" : "e"),
  ё: (c) => (afterSoft(c) ? "yë" : "ë"),
  ж: "zh", й: "y", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "”", ы: "y", ь: "’", э: "e", ю: "yu", я: "ya",
  ў: "w",
};

/** Scholarly (scientific) transliteration used in linguistics. */
const SCIENTIFIC: Table = {
  ...RU_BASE,
  ё: "ë", ж: "ž", й: "j", х: "x", ц: "c", ч: "č", ш: "š", щ: "šč", ъ: "″", ы: "y", ь: "′", э: "è", ю: "ju", я: "ja",
  ґ: "g", є: "je", і: "i", ї: "ji", ў: "ŭ",
};
const SCIENTIFIC_UK: Table = { ...SCIENTIFIC, г: "h", и: "y" };

/** Informal chat translit ("translit") as people type it in messengers. */
const INFORMAL: Table = {
  ...RU_BASE,
  ё: "yo", ж: "zh", й: "y", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "'", э: "e", ю: "yu", я: "ya",
  ґ: "g", є: "ye", і: "i", ї: "yi", ў: "u",
};
const INFORMAL_UK: Table = { ...INFORMAL, г: "h", и: "y", ь: "", "’": "", "'": "" };

/** Ukrainian national system (Cabinet of Ministers resolution No. 55, 27.01.2010). */
const UKRAINIAN_2010: Table = {
  ...RU_BASE,
  г: (c) => (c.prev === "з" ? "gh" : "h"),
  ґ: "g", є: (c) => (c.wordStart ? "ye" : "ie"), ж: "zh", и: "y", і: "i", ї: (c) => (c.wordStart ? "yi" : "i"), й: (c) => (c.wordStart ? "y" : "i"),
  х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: (c) => (c.wordStart ? "yu" : "iu"), я: (c) => (c.wordStart ? "ya" : "ia"),
  "’": "", "'": "", ʼ: "",
  // letters that are not in Ukrainian: conventional values
  ё: "yo", ъ: "", ы: "y", э: "e",
};

/** Kazakh Latin alphabet presented in 2021 (31 letters). */
const KAZAKH_2021: Table = {
  а: "a", ә: "ä", б: "b", в: "v", г: "g", ғ: "ğ", д: "d", е: "e", ж: "j", з: "z", и: ["i", "İ"], й: ["i", "İ"], к: "k", қ: "q", л: "l", м: "m", н: "n", ң: "ñ",
  о: "o", ө: "ö", п: "p", р: "r", с: "s", т: "t", у: "u", ұ: "ū", ү: "ü", ф: "f", х: "h", һ: "h", ш: "ş", ы: "y", і: ["ı", "I"],
  // Letters of Russian loanwords are not part of the 2021 alphabet — conventional values:
  ё: ["io", "İo"], ц: "ts", ч: "ch", щ: "şş", ъ: "", ь: "", э: "e", ю: ["iu", "İu"], я: ["ia", "İa"],
};

interface StandardDef {
  tables: Record<Lang, Table>;
  /** Fallback for letters the standard doesn't define. */
  fallback: Table;
  reversible: boolean;
  ascii: boolean;
}

const STANDARDS: Record<StandardId, StandardDef> = {
  "gost-a": { tables: { ru: GOST_A, uk: GOST_A, kk: GOST_A }, fallback: KK_LATIN, reversible: true, ascii: false },
  "gost-b": { tables: { ru: GOST_B, uk: GOST_B_UK, kk: GOST_B }, fallback: KK_ASCII, reversible: true, ascii: true },
  icao: { tables: { ru: ICAO, uk: ICAO, kk: ICAO }, fallback: KK_ASCII, reversible: false, ascii: true },
  bgn: { tables: { ru: BGN, uk: UKRAINIAN_2010, kk: BGN }, fallback: KK_ASCII, reversible: false, ascii: false },
  scientific: { tables: { ru: SCIENTIFIC, uk: SCIENTIFIC_UK, kk: SCIENTIFIC }, fallback: KK_LATIN, reversible: true, ascii: false },
  informal: { tables: { ru: INFORMAL, uk: INFORMAL_UK, kk: INFORMAL }, fallback: KK_ASCII, reversible: true, ascii: true },
  "kazakh-2021": { tables: { ru: KAZAKH_2021, uk: KAZAKH_2021, kk: KAZAKH_2021 }, fallback: INFORMAL, reversible: true, ascii: false },
  "ukrainian-2010": { tables: { ru: UKRAINIAN_2010, uk: UKRAINIAN_2010, kk: UKRAINIAN_2010 }, fallback: KK_ASCII, reversible: false, ascii: true },
};

/* ───────────── language detection ───────────── */

export function detectLang(s: string): Lang {
  if (/[әғқңөұүһӘҒҚҢӨҰҮҺ]/.test(s)) return "kk";
  if (/[ґєїҐЄЇ]/.test(s)) return "uk";
  if (/[іІ]/.test(s) && !/[ыэъёЫЭЪЁ]/.test(s)) return "uk";
  return "ru";
}

/* ───────────── forward ───────────── */

function lowerOf(out: Out): string {
  return typeof out === "string" ? out : out[0];
}

function applyCase(out: Out, upper: boolean, allCaps: boolean): string {
  const lo = lowerOf(out);
  if (!upper) return lo;
  const title = typeof out === "string" ? (lo ? lo[0].toUpperCase() + lo.slice(1) : lo) : out[1];
  if (allCaps) return title.toUpperCase();
  return title;
}

const isUpperLetter = (c: string | undefined) => !!c && c !== c.toLowerCase() && c === c.toUpperCase();
const isLowerLetter = (c: string | undefined) => !!c && c !== c.toUpperCase() && c === c.toLowerCase();
const isLetter = (c: string | undefined) => !!c && /[\p{L}\p{M}'’ʼ]/u.test(c);

interface TranslitOptions {
  lang?: LangOption;
}

export function transliterate(text: string, standard: StandardId, opts: TranslitOptions = {}): string {
  const lang: Lang = !opts.lang || opts.lang === "auto" ? detectLang(text) : opts.lang;
  const def = STANDARDS[standard];
  const table = def.tables[lang];
  const chars = [...text.normalize("NFC")];

  const ruleFor = (lc: string): Rule | undefined => table[lc] ?? def.fallback[lc];
  const evalAt = (i: number): Out | undefined => {
    const c = chars[i];
    if (c === undefined) return undefined;
    const lc = c.toLowerCase();
    const rule = ruleFor(lc);
    if (rule === undefined) return undefined;
    if (typeof rule !== "function") return rule;
    const prev = i > 0 ? chars[i - 1].toLowerCase() : "";
    return rule({
      prev,
      next: (chars[i + 1] ?? "").toLowerCase(),
      wordStart: !isLetter(chars[i - 1]),
      nextOut: () => {
        const n = evalAt(i + 1);
        return n === undefined ? (chars[i + 1] ?? "").toLowerCase() : lowerOf(n);
      },
    });
  };

  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const res = evalAt(i);
    if (res === undefined) {
      out += c;
      continue;
    }
    const upper = isUpperLetter(c);
    let allCaps = false;
    if (upper) {
      const next = chars[i + 1];
      const prev = chars[i - 1];
      allCaps = isUpperLetter(next) || (isUpperLetter(prev) && !isLowerLetter(next));
    }
    out += applyCase(res, upper, allCaps);
  }
  return out;
}

/* ───────────── reverse (Latin → Cyrillic) ───────────── */

export function isReversible(standard: StandardId): boolean {
  return STANDARDS[standard].reversible;
}

/** Letters whose forward value builds the reverse table (per language, most common first). */
const REVERSE_ORDER: Record<Lang, string> = {
  ru: "абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
  uk: "абвгґдеєжзиіїйклмнопрстуфхцчшщьюя",
  // Russian loan letters (ё ц ч щ ъ ь э ю я) are not part of the 2021 alphabet.
  kk: "аәбвгғдежзийкқлмнңоөпрстуұүфхһшыі",
};

const REVERSE_EXTRA: Partial<Record<StandardId, Record<string, string>>> = {
  "gost-a": { ì: "і", ï: "ї", ê: "є", "g̀": "ґ", ǔ: "ў", "'": "ь", '"': "ъ" },
  "gost-b": { cz: "ц", c: "ц", y: "ы", "'": "ь" },
  scientific: { "'": "ь", '"': "ъ", h: "х" },
  informal: { shch: "щ", sch: "щ", kh: "х", ts: "ц", c: "ц", x: "кс", w: "в", q: "к", j: "й", ye: "е", "`": "ъ" },
  "kazakh-2021": { ts: "ц", ch: "ч", c: "ц", w: "у", x: "х", io: "ио" },
};

const reverseCache = new Map<string, { map: Map<string, string>; maxLen: number }>();

function reverseTable(standard: StandardId, lang: Lang) {
  const key = `${standard}:${lang}`;
  const cached = reverseCache.get(key);
  if (cached) return cached;
  const map = new Map<string, string>();
  const table = STANDARDS[standard].tables[lang];
  for (const cyr of REVERSE_ORDER[lang]) {
    const rule = table[cyr];
    if (rule === undefined || typeof rule === "function") continue;
    const lat = lowerOf(rule).normalize("NFC");
    if (lat && !map.has(lat)) map.set(lat, cyr);
  }
  for (const [lat, cyr] of Object.entries(REVERSE_EXTRA[standard] ?? {})) map.set(lat.normalize("NFC"), cyr);
  let maxLen = 1;
  for (const k of map.keys()) maxLen = Math.max(maxLen, [...k].length);
  const res = { map, maxLen };
  reverseCache.set(key, res);
  return res;
}

export function reverseTransliterate(text: string, standard: StandardId): string {
  const lang: Lang = standard === "kazakh-2021" ? "kk" : "ru";
  const { map, maxLen } = reverseTable(standard, lang);
  const chars = [...text.normalize("NFC")];
  let out = "";
  let i = 0;
  while (i < chars.length) {
    let matched = false;
    for (let len = Math.min(maxLen, chars.length - i); len >= 1; len--) {
      const chunk = chars.slice(i, i + len).join("");
      // "İ".toLowerCase() is "i̇" — fold it to a plain "i" for lookup.
      const lc = chunk.replace(/İ/g, "i").toLowerCase();
      let cyr = map.get(lc);
      if (cyr === undefined) continue;
      if (standard === "informal" && lc === "y") {
        // "moy" → "мой": y after a vowel is й, otherwise ы
        cyr = /[aeiouy]/i.test(chars[i - 1] ?? "") ? "й" : "ы";
      }
      const first = chars[i];
      if (isUpperLetter(first) || first === "İ") {
        const allUpper =
          len > 1
            ? chars.slice(i + 1, i + len).some((c) => isUpperLetter(c)) && !chars.slice(i + 1, i + len).some((c) => isLowerLetter(c))
            : isUpperLetter(chars[i + 1]) || (isUpperLetter(chars[i - 1]) && !isLowerLetter(chars[i + 1]));
        cyr = allUpper ? cyr.toUpperCase() : cyr[0].toUpperCase() + cyr.slice(1);
      }
      out += cyr;
      i += len;
      matched = true;
      break;
    }
    if (!matched) {
      out += chars[i];
      i++;
    }
  }
  return out;
}

/* ───────────── slug ───────────── */

/** Everyday URL transliteration for Russian and Kazakh (Yandex-style, ASCII only). */
const SLUG_RU: Table = {
  ...RU_BASE,
  ё: "yo", ж: "zh", й: "y", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  ...KK_ASCII,
  ґ: "g", є: "ye", ї: "yi", ў: "u",
};

const LATIN_FOLD: Record<string, string> = { ß: "ss", æ: "ae", œ: "oe", ø: "o", ł: "l", đ: "d", ð: "d", þ: "th", ı: "i", ħ: "h" };

interface SlugOptions {
  lang?: LangOption;
  separator?: "-" | "_";
  /** Cut at a word boundary to at most this many characters (0 = no limit). */
  maxLength?: number;
  lowercase?: boolean;
}

export function slugify(text: string, opts: SlugOptions = {}): string {
  const { separator = "-", maxLength = 0, lowercase = true } = opts;
  const lang: Lang = !opts.lang || opts.lang === "auto" ? detectLang(text) : opts.lang;
  let s: string;
  if (lang === "uk") s = transliterate(text, "ukrainian-2010", { lang: "uk" });
  else {
    s = "";
    for (const c of text.normalize("NFC")) {
      const rule = SLUG_RU[c.toLowerCase()];
      s += rule === undefined || typeof rule === "function" ? c : lowerOf(rule);
    }
  }
  let t = s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[ßæœøłđðþıħ]/giu, (m) => LATIN_FOLD[m.toLowerCase()] ?? m)
    .replace(/&/g, " and ")
    .replace(/[’'ʼ`"]/g, "");
  if (lowercase) t = t.toLowerCase();
  const sep = separator === "_" ? "_" : "-";
  t = t.replace(/[^A-Za-z0-9]+/g, sep).replace(new RegExp(`^${sep}+|${sep}+$`, "g"), "");
  if (maxLength > 0 && t.length > maxLength) {
    const cut = t.slice(0, maxLength + 1);
    const at = cut.lastIndexOf(sep);
    t = (at > 0 ? cut.slice(0, at) : t.slice(0, maxLength)).replace(new RegExp(`${sep}+$`), "");
  }
  return t;
}

