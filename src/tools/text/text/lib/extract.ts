/**
 * Extract structured items from free text. Pure functions (phone numbers need
 * libphonenumber-js, passed in by the caller so it can be loaded lazily).
 * "Not preceded by" conditions use execAllNotAfter: regex lookbehind breaks old Safari.
 */
import { execAllNotAfter } from "@/lib/lookbehind";

export type ExtractKind = "emails" | "urls" | "phones" | "numbers" | "hashtags" | "mentions" | "dates";
export const EXTRACT_KINDS: ExtractKind[] = ["emails", "urls", "phones", "numbers", "hashtags", "mentions", "dates"];

const EMAIL_RE = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.\p{L}{2,}(?![\p{L}\p{N}-])/gu;
const EMAIL_NOT_AFTER = /[\p{L}\p{N}._%+-]/u;
const emailMatches = (s: string) => execAllNotAfter(s, EMAIL_RE, EMAIL_NOT_AFTER);

export function extractEmails(s: string): string[] {
  return emailMatches(s).map((m) => m[0].replace(/^\.+|\.+$/g, "")).filter((e) => !e.includes(".."));
}

const URL_RE = /\b(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>"'«»“”]+/giu;
const BARE_DOMAIN_NOT_AFTER = /[\p{L}\p{N}@./-]/u;
const BARE_DOMAIN_RE =
  /(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+(?:com|net|org|ru|kz|рф|қаз|su|by|ua|uz|kg|io|dev|app|me|co|info|biz|pro|online|site|store|tech|ai|tv|gg|de|uk|us|eu|fr|it|es)(?![\p{L}\p{N}-])(?:\/[^\s<>"'«»“”]*)?/giu;

/** Trim trailing punctuation that belongs to the sentence, keeping balanced brackets. */
function trimUrl(u: string): string {
  let url = u;
  for (;;) {
    const last = url.slice(-1);
    if (/[.,;:!?'"»”]/.test(last)) url = url.slice(0, -1);
    else if (last === ")" && (url.match(/\(/g) ?? []).length < (url.match(/\)/g) ?? []).length) url = url.slice(0, -1);
    else if (last === "]" && (url.match(/\[/g) ?? []).length < (url.match(/]/g) ?? []).length) url = url.slice(0, -1);
    else return url;
  }
}

export function extractUrls(s: string, bareDomains = false): string[] {
  const out: { i: number; v: string }[] = [];
  const taken: [number, number][] = [];
  for (const m of s.matchAll(URL_RE)) {
    const v = trimUrl(m[0]);
    out.push({ i: m.index!, v });
    taken.push([m.index!, m.index! + v.length]);
  }
  if (bareDomains) {
    // e-mail domains are not links
    const emails = emailMatches(s).map((m) => [m.index, m.index + m[0].length] as [number, number]);
    for (const m of execAllNotAfter(s, BARE_DOMAIN_RE, BARE_DOMAIN_NOT_AFTER)) {
      const a = m.index!;
      if ([...taken, ...emails].some(([x, y]) => a >= x && a < y)) continue;
      out.push({ i: a, v: trimUrl(m[0]) });
    }
  }
  return out.sort((a, b) => a.i - b.i).map((x) => x.v);
}

/** Numbers as written, keeping thousands separators together: "1,000,000", "1 000 000", "−3,5". */
const NUMBER_NOT_AFTER = /[\p{L}\p{N}_.,]/u;
const NUMBER_RE = /[-−+]?(?:\d{1,3}(?:(?:,\d{3})+|(?:[  ]\d{3})+)(?:\.\d+)?|\d{1,3}(?:(?:\.\d{3}){2,})(?:,\d+)?|\d+(?:[.,]\d+)?)(?![\p{L}_]|[.,]\d)/gu;

export function extractNumbers(s: string): string[] {
  return execAllNotAfter(s, NUMBER_RE, NUMBER_NOT_AFTER).map((m) => m[0].replace(/−/g, "-"));
}

const HASHTAG_NOT_AFTER = /[\p{L}\p{N}_&/#]/u;
const HASHTAG_RE = /#([\p{L}\p{N}_]*\p{L}[\p{L}\p{N}_]*)/gu;

export function extractHashtags(s: string): string[] {
  return execAllNotAfter(s, HASHTAG_RE, HASHTAG_NOT_AFTER).map((m) => `#${m[1]}`);
}

/** @mentions — but not the "@domain" part of an e-mail address. */
const MENTION_NOT_AFTER = /[\p{L}\p{N}_.+\-@]/u;
const MENTION_RE = /@([\p{L}\p{N}_](?:[\p{L}\p{N}_.]*[\p{L}\p{N}_])?)(?![\p{L}\p{N}_@]|\.[\p{L}]{2,}\b)/gu;

export function extractMentions(s: string): string[] {
  return execAllNotAfter(s, MENTION_RE, MENTION_NOT_AFTER).map((m) => `@${m[1]}`);
}

const MONTHS_RU = "января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря|янв|фев|мар|апр|июн|июл|авг|сен|сент|окт|ноя|дек";
const MONTHS_EN = "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";
const DATE_RES: [RegExp, RegExp][] = [
  // 2024-03-15, 2024/03/15
  [/(?:19|20)\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])(?![\d\-/])/g, /[\d.\-/]/],
  // 15.03.2024, 15/03/2024, 15-03-24
  [/(?:0?[1-9]|[12]\d|3[01])[./-](?:0?[1-9]|1[0-2])[./-](?:\d{4}|\d{2})(?![\d.\-/]\d)/g, /[\d.\-/]/],
  // 15 марта 2024 (года), 1 мая
  [new RegExp(`(?:0?[1-9]|[12]\\d|3[01])\\s+(?:${MONTHS_RU})\\.?(?:\\s+(?:19|20)\\d{2}(?:\\s*(?:г\\.|года|г(?![\\p{L}])))?)?(?![\\p{L}])`, "giu"), /[\p{L}\p{N}]/u],
  // 15 March 2024, March 15, 2024
  [new RegExp(`(?:(?:0?[1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?\\s+(?:${MONTHS_EN})\\.?(?:,?\\s+(?:19|20)\\d{2})?|(?:${MONTHS_EN})\\.?\\s+(?:0?[1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?(?:,?\\s+(?:19|20)\\d{2})?)(?![\\p{L}\\p{N}])`, "giu"), /[\p{L}\p{N}]/u],
];

export function extractDates(s: string): string[] {
  const found: { i: number; v: string }[] = [];
  for (const [re, notAfter] of DATE_RES) {
    for (const m of execAllNotAfter(s, re, notAfter)) {
      const a = m.index;
      const b = a + m[0].length;
      if (found.some((f) => a < f.i + f.v.length && b > f.i)) continue;
      found.push({ i: a, v: m[0].trim() });
    }
  }
  return found.sort((x, y) => x.i - y.i).map((x) => x.v);
}

/* ───────────── phones ───────────── */

export type PhoneFormat = "international" | "e164" | "national";

interface PhoneLib {
  findPhoneNumbersInText: (text: string, defaultCountry?: never) => { number: { number: string; formatInternational(): string; formatNational(): string; country?: string }; startsAt: number; endsAt: number }[];
}

/**
 * Phone numbers validated by libphonenumber-js. Dates, IP addresses and bank
 * account numbers are rejected by the validator; anything that also looks like
 * a date or IP is dropped as an extra safety net.
 */
export function extractPhones(s: string, lib: unknown, defaultCountry = "KZ", format: PhoneFormat = "international"): string[] {
  const { findPhoneNumbersInText } = lib as PhoneLib;
  const out: string[] = [];
  for (const r of findPhoneNumbersInText(s, defaultCountry as never)) {
    const raw = s.slice(r.startsAt, r.endsAt).trim();
    if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(raw) || /^\d{1,3}(\.\d{1,3}){3}$/.test(raw)) continue;
    out.push(format === "e164" ? r.number.number : format === "national" ? r.number.formatNational() : r.number.formatInternational());
  }
  return out;
}

export function extractSync(kind: Exclude<ExtractKind, "phones">, s: string, opts: { bareDomains?: boolean } = {}): string[] {
  switch (kind) {
    case "emails":
      return extractEmails(s);
    case "urls":
      return extractUrls(s, opts.bareDomains);
    case "numbers":
      return extractNumbers(s);
    case "hashtags":
      return extractHashtags(s);
    case "mentions":
      return extractMentions(s);
    case "dates":
      return extractDates(s);
  }
}

export function uniqueList(items: string[], ignoreCase = true): string[] {
  const seen = new Set<string>();
  return items.filter((x) => {
    const k = ignoreCase ? x.toLowerCase() : x;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
