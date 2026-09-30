import { INTL_LOCALE, type Locale } from "./config";

const pluralCache = new Map<Locale, Intl.PluralRules>();

/**
 * Pick a plural form.
 * ru: [one, few, many, other?] — 1 файл, 2 файла, 5 файлов, 1,5 файла
 *     (`other` is used for fractions and defaults to `few`)
 * en: [one, other]              — 1 file, 2 files
 */
export function plural(locale: Locale, n: number, forms: readonly string[]): string {
  let rules = pluralCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(INTL_LOCALE[locale]);
    pluralCache.set(locale, rules);
  }
  const cat = rules.select(Math.abs(n));
  if (locale === "ru") {
    if (cat === "one") return forms[0];
    if (cat === "few") return forms[1] ?? forms[0];
    if (cat === "many") return forms[2] ?? forms[1] ?? forms[0];
    return forms[3] ?? forms[1] ?? forms[0];
  }
  return cat === "one" ? forms[0] : (forms[1] ?? forms[0]);
}

/** "5 файлов" / "5 files" */
export function count(locale: Locale, n: number, forms: readonly string[]): string {
  return `${formatNumber(locale, n)} ${plural(locale, n, forms)}`;
}

const nfCache = new Map<string, Intl.NumberFormat>();

export function formatNumber(locale: Locale, n: number, options: Intl.NumberFormatOptions = {}): string {
  const key = locale + JSON.stringify(options);
  let nf = nfCache.get(key);
  if (!nf) {
    nf = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 10, ...options });
    nfCache.set(key, nf);
  }
  return nf.format(n);
}

/**
 * Format a number with up to `digits` significant decimals, never using
 * exponent notation for everyday magnitudes and never stripping integer zeros.
 */
export function formatSmart(locale: Locale, n: number, maxFraction = 6): string {
  if (!Number.isFinite(n)) return n > 0 ? "∞" : n < 0 ? "−∞" : "—";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-6)) {
    const [m, e] = n.toExponential(Math.min(maxFraction, 8)).split("e");
    const mant = formatNumber(locale, Number(m), { maximumFractionDigits: 8 });
    return `${mant}×10${toSuperscript(Number(e))}`;
  }
  let frac = maxFraction;
  if (abs >= 1) {
    const intDigits = Math.floor(Math.log10(abs)) + 1;
    frac = Math.max(0, Math.min(maxFraction, 12 - intDigits));
  } else if (abs > 0) {
    const leadingZeros = -Math.floor(Math.log10(abs)) - 1;
    frac = Math.min(12, leadingZeros + maxFraction);
  }
  return formatNumber(locale, n, { maximumFractionDigits: frac });
}

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
function toSuperscript(n: number): string {
  return String(n).split("").map((c) => SUP[c] ?? c).join("");
}

/**
 * Parse a user-typed number: "1 000,5", "1,000.5", "1.000.000", "−5", "1e3".
 * With `locale: "en"` a lone comma group ("1,000") is a thousands separator; otherwise it is a decimal comma.
 */
export function parseNumber(input: string, locale?: Locale): number | null {
  let s = input.trim().replace(/[  \s']/g, "").replace(/[−–]/g, "-");
  if (!s) return null;
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  if (hasDot && hasComma) {
    // The last separator is the decimal one.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (hasComma) {
    // "1,000,000" → thousands separators; "1,5" → decimal comma
    const groups = locale === "en" ? /^[-+]?\d{1,3}(,\d{3})+$/ : /^[-+]?\d{1,3}(,\d{3}){2,}$/;
    s = groups.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (hasDot && /^[-+]?\d{1,3}(\.\d{3}){2,}$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function formatDate(locale: Locale, d: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], options).format(d);
}

export function formatBytes(locale: Locale, bytes: number): string {
  const units = locale === "ru" ? ["Б", "КБ", "МБ", "ГБ", "ТБ"] : ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${formatNumber(locale, v, { maximumFractionDigits: i === 0 ? 0 : v < 10 ? 2 : 1 })} ${units[i]}`;
}
