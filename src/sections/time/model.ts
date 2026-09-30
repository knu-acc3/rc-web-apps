/**
 * Server-side model of the world-time catalogue: cities, countries, zones and
 * build-time descriptive facts (offsets, DST dates of the current year).
 * Nothing here is "now" for the visitor — live values are computed in the browser.
 */
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { fmtDate } from "@/sections/calendar/lib/dates";
import citiesJson from "./data/cities.json";
import countriesJson from "./data/countries.json";
import zoneNamesJson from "./data/zone-names.json";
import { ZONES, type ZoneDef } from "./data/zones";
import { durationWords } from "./lib/text";
import { fmtOffset, offsetSlug, tzOffset, zoned, zoneYear, type Transition, type ZoneYearInfo } from "./lib/tz";

export interface City {
  slug: string;
  en: string;
  ru: string;
  ruIn: string;
  cc: string;
  tz: string;
  lat: number;
  lon: number;
  pop: number;
  capital?: boolean;
}

export interface Country {
  cc: string;
  en: string;
  ru: string;
  ruIn: string;
  main: string;
  /** All IANA zones of the country (current names). */
  zones: string[];
  slug: string;
  /** false when the country is a city-state whose page is the city page. */
  hasPage: boolean;
}

export const CITIES: City[] = citiesJson as City[];
export const cityBySlug = new Map(CITIES.map((c) => [c.slug, c]));

const kebab = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const COUNTRIES: Country[] = (countriesJson as Omit<Country, "slug" | "hasPage">[]).map((c) => {
  const slug = kebab(c.en);
  return { ...c, slug, hasPage: !cityBySlug.has(slug) };
});
export const countryByCc = new Map(COUNTRIES.map((c) => [c.cc, c]));
export const countryBySlug = new Map(COUNTRIES.filter((c) => c.hasPage).map((c) => [c.slug, c]));

const byCountry = new Map<string, City[]>();
for (const c of CITIES) {
  const list = byCountry.get(c.cc) ?? [];
  list.push(c);
  byCountry.set(c.cc, list);
}
/** Cities of a country, most populous first. */
export const citiesOf = (cc: string): City[] => byCountry.get(cc) ?? [];

/** English country names that take "the": "in the United States", "the Netherlands". */
const EN_THE = new Set(["US", "GB", "AE", "NL", "PH", "BS", "MV", "SC", "MH", "SB", "FO", "CD", "CG", "CF", "DO", "GM", "KM"]);
/** "the United States" / "Kazakhstan" (lowercase article, for use inside a sentence). */
export const enCountry = (c: { cc: string; en: string }): string => (EN_THE.has(c.cc) ? `the ${c.en}` : c.en);

/** Path of the page that describes a country (the city page for city-states). */
export function countryPath(c: Country): string[] {
  return c.hasPage ? ["time", c.slug] : ["time", c.main];
}

/* ───────────── names ───────────── */

const ZONE_NAMES = zoneNamesJson as unknown as Record<string, [string, string]>;
/** Exemplar city of an IANA zone from CLDR: «Среднеколымск» / "Srednekolymsk". */
export function zoneCityName(tz: string, locale: Locale): string {
  const n = ZONE_NAMES[tz];
  return n ? n[locale === "ru" ? 0 : 1] : tz.split("/").pop()!.replace(/_/g, " ");
}

const ruNameCount = new Map<string, number>();
for (const c of CITIES) ruNameCount.set(c.ru, (ruNameCount.get(c.ru) ?? 0) + 1);
const enNameCount = new Map<string, number>();
for (const c of CITIES) enNameCount.set(c.en, (enNameCount.get(c.en) ?? 0) + 1);
const countryRuIn = new Set(COUNTRIES.filter((c) => c.hasPage).map((c) => c.ruIn));

export function cityName(c: City, locale: Locale): string {
  return locale === "ru" ? c.ru : c.en;
}
export function countryName(cc: string, locale: Locale): string {
  const c = countryByCc.get(cc);
  return c ? (locale === "ru" ? c.ru : c.en) : cc;
}

/** Qualifier for ambiguous names: «Хайдарабад (Пакистан)», «Тунис (город)». */
export function cityQualifier(c: City, locale: Locale): string {
  const dupName = locale === "ru" ? (ruNameCount.get(c.ru) ?? 0) > 1 : (enNameCount.get(c.en) ?? 0) > 1;
  if (dupName) return countryName(c.cc, locale);
  if (locale === "ru" && countryRuIn.has(c.ruIn)) return "город";
  return "";
}

/** «в Москве», «в Хайдарабаде (Пакистан)» / "in Moscow" */
export function cityIn(c: City, locale: Locale): string {
  const q = cityQualifier(c, locale);
  if (locale === "ru") return q ? `${c.ruIn} (${q})` : c.ruIn;
  return q ? `in ${c.en} (${q})` : `in ${c.en}`;
}

/** Display label with a qualifier when needed. */
export function cityLabel(c: City, locale: Locale): string {
  const q = cityQualifier(c, locale);
  const n = cityName(c, locale);
  return q ? `${n} (${q})` : n;
}

/* ───────────── build-time facts ───────────── */

/** Build instant: used only for descriptive texts ("in 2026 DST starts on …"). */
export const BUILD_NOW = Date.now();
export const BUILD_YEAR = new Date(BUILD_NOW).getUTCFullYear();

const yearCache = new Map<string, ZoneYearInfo>();
export function zoneInfo(tz: string, year = BUILD_YEAR): ZoneYearInfo {
  const k = `${tz}|${year}`;
  let v = yearCache.get(k);
  if (!v) {
    v = zoneYear(tz, year);
    yearCache.set(k, v);
  }
  return v;
}

/** Offset of a zone at build time. */
export const offsetAtBuild = (tz: string): number => tzOffset(tz, BUILD_NOW);

export { diffShort, durationWords } from "./lib/text";

/** Offset label for both seasons: "UTC+3" or "UTC+0 / UTC+1". */
export function offsetsLabel(info: ZoneYearInfo): string {
  return info.std === info.dst ? fmtOffset(info.std) : `${fmtOffset(info.std)} / ${fmtOffset(info.dst)}`;
}

/** Common abbreviation of a zone at a given offset (English CLDR short names for US/EU/AU zones, our table otherwise). */
const ABBR_BY_TZ: Record<string, Record<number, string>> = {
  "Europe/Moscow": { 180: "MSK" },
  "Europe/London": { 0: "GMT", 60: "BST" },
  "Europe/Dublin": { 0: "GMT", 60: "IST" },
  "Asia/Kolkata": { 330: "IST" },
  "Asia/Tokyo": { 540: "JST" },
  "Asia/Seoul": { 540: "KST" },
  "Asia/Hong_Kong": { 480: "HKT" },
  "Asia/Singapore": { 480: "SGT" },
  "Asia/Karachi": { 300: "PKT" },
  "Asia/Dubai": { 240: "GST" },
  "Asia/Jakarta": { 420: "WIB" },
  "Asia/Makassar": { 480: "WITA" },
  "Asia/Jayapura": { 540: "WIT" },
  "Asia/Shanghai": { 480: "CST" },
  "Pacific/Honolulu": { [-600]: "HST" },
  "Pacific/Auckland": { 720: "NZST", 780: "NZDT" },
  "Australia/Perth": { 480: "AWST" },
  "Australia/Darwin": { 570: "ACST" },
  "Australia/Adelaide": { 570: "ACST", 630: "ACDT" },
  "Australia/Brisbane": { 600: "AEST" },
  "Australia/Sydney": { 600: "AEST", 660: "AEDT" },
  "Australia/Melbourne": { 600: "AEST", 660: "AEDT" },
  "Australia/Hobart": { 600: "AEST", 660: "AEDT" },
  "Europe/Samara": { 240: "SAMT" },
  "Asia/Yekaterinburg": { 300: "YEKT" },
  "Asia/Omsk": { 360: "OMST" },
  "Asia/Krasnoyarsk": { 420: "KRAT" },
  "Asia/Irkutsk": { 480: "IRKT" },
  "Asia/Yakutsk": { 540: "YAKT" },
  "Asia/Vladivostok": { 600: "VLAT" },
  "Asia/Magadan": { 660: "MAGT" },
  "Asia/Kamchatka": { 720: "PETT" },
};
const US_ABBR: Record<number, string> = { [-300]: "EST", [-240]: "EDT", [-360]: "CST", [-420]: "MST", [-480]: "PST", [-540]: "AKST", [-600]: "HST" };
const US_DST: Record<number, string> = { [-240]: "EDT", [-300]: "CDT", [-360]: "MDT", [-420]: "PDT", [-480]: "AKDT" };
const EU_ABBR: Record<number, string> = { 0: "WET", 60: "CET", 120: "EET" };
const EU_DST: Record<number, string> = { 60: "WEST", 120: "CEST", 180: "EEST" };

export function zoneAbbr(tz: string, off: number, info: ZoneYearInfo): string {
  const own = ABBR_BY_TZ[tz]?.[off];
  if (own) return own;
  const isDst = info.hasDst && off === info.dst;
  if (tz.startsWith("America/") && (cityByZoneCc(tz) === "US" || cityByZoneCc(tz) === "CA")) return (isDst ? US_DST[off] : US_ABBR[off]) ?? "";
  if (tz.startsWith("Europe/") && tz !== "Europe/Moscow" && info.hasDst) return (isDst ? EU_DST[off] : EU_ABBR[off]) ?? "";
  return "";
}
function cityByZoneCc(tz: string): string | undefined {
  return CITIES.find((c) => c.tz === tz)?.cc;
}

/* ───────────── DST texts ───────────── */

export interface DstText {
  /** one-line summary for leads/descriptions */
  short: string;
  /** full sentence(s) for facts */
  long: string;
}

function wallTime(t: number, off: number): string {
  const p = zoned(off, t);
  return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}

function transitionText(tr: Transition, locale: Locale): string {
  const p = zoned(tr.to, tr.at);
  const date = fmtDate(locale, { y: p.y, m: p.m, d: p.d }, false);
  const before = wallTime(tr.at, tr.from);
  const after = wallTime(tr.at, tr.to);
  const fwd = tr.to > tr.from;
  const shift = durationWords(Math.abs(tr.to - tr.from), locale, true);
  if (locale === "ru") return `${date} в ${before} — на ${shift} ${fwd ? "вперёд" : "назад"} (станет ${after}, ${fmtOffset(tr.to)})`;
  return `${date} at ${before} — ${shift} ${fwd ? "forward" : "back"} (to ${after}, ${fmtOffset(tr.to)})`;
}

export function dstText(tz: string, locale: Locale, year = BUILD_YEAR): DstText {
  const info = zoneInfo(tz, year);
  if (!info.hasDst) {
    return locale === "ru"
      ? { short: "без перехода на летнее время", long: `Часы не переводят: ${fmtOffset(info.std)} действует круглый год.` }
      : { short: "no daylight saving time", long: `Clocks do not change: ${fmtOffset(info.std)} all year round.` };
  }
  const trs = info.transitions;
  if (!trs.length) {
    return locale === "ru"
      ? { short: `${fmtOffset(info.std)} / ${fmtOffset(info.dst)}`, long: `В ${year} году действуют ${fmtOffset(info.std)} и ${fmtOffset(info.dst)}.` }
      : { short: `${fmtOffset(info.std)} / ${fmtOffset(info.dst)}`, long: `In ${year} both ${fmtOffset(info.std)} and ${fmtOffset(info.dst)} are used.` };
  }
  const lines = trs.map((t) => transitionText(t, locale));
  const short =
    locale === "ru"
      ? `летом ${fmtOffset(info.dst)}, зимой ${fmtOffset(info.std)}`
      : `${fmtOffset(info.dst)} in summer, ${fmtOffset(info.std)} in winter`;
  const long = locale === "ru" ? `Переводы часов в ${year} году: ${lines.join("; ")}.` : `Clock changes in ${year}: ${lines.join("; ")}.`;
  return { short, long };
}

/* ───────────── zones ↔ places ───────────── */

export const zoneBySlugMap = new Map(ZONES.map((z) => [z.slug, z]));

/** Zone page path; "utc" is served by the UTC time tool. */
export function zonePath(z: ZoneDef): string[] {
  return z.slug === "utc" ? ["utc-time"] : ["time-zones", z.slug];
}

/** Page path of a plain offset (if such a page exists). */
export function offsetPath(off: number): string[] | null {
  const slug = offsetSlug(off);
  const z = zoneBySlugMap.get(slug);
  return z ? zonePath(z) : null;
}

/** Cities that use `off` in January and/or July of the build year. */
export function citiesWithOffset(off: number): { all: City[]; winter: City[]; summer: City[] } {
  const all: City[] = [];
  const winter: City[] = [];
  const summer: City[] = [];
  for (const c of CITIES) {
    const i = zoneInfo(c.tz);
    // "winter"/"summer" in the northern sense: January / July offsets.
    if (i.jan === off && i.jul === off) all.push(c);
    else if (i.jan === off) winter.push(c);
    else if (i.jul === off) summer.push(c);
  }
  return { all, winter, summer };
}

/** Distinct countries (in order of first appearance) of a city list. */
export function countriesOfCities(list: City[]): Country[] {
  const seen = new Set<string>();
  const out: Country[] = [];
  for (const c of list) {
    if (seen.has(c.cc)) continue;
    seen.add(c.cc);
    const k = countryByCc.get(c.cc);
    if (k) out.push(k);
  }
  return out;
}

export function joinList(items: string[], locale: Locale, max = 8): string {
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  if (rest > 0) {
    const tail = locale === "ru" ? `ещё ${rest} ${plural("ru", rest, ["страна", "страны", "стран"])}` : `${rest} more`;
    return `${shown.join(", ")} ${locale === "ru" ? "и" : "and"} ${tail}`;
  }
  if (shown.length <= 1) return shown.join("");
  return `${shown.slice(0, -1).join(", ")} ${locale === "ru" ? "и" : "and"} ${shown[shown.length - 1]}`;
}

/** Compact place record passed to client components. */
export interface ClientPlace {
  key: string;
  name: string;
  /** country or hint */
  sub: string;
  tz: string | null;
  /** fixed offset in minutes when tz is null */
  offset: number | null;
  lat?: number;
  lon?: number;
}

export function clientCity(c: City, locale: Locale): ClientPlace {
  return { key: c.slug, name: cityLabel(c, locale), sub: countryName(c.cc, locale), tz: c.tz, offset: null, lat: c.lat, lon: c.lon };
}

export function clientZone(z: ZoneDef, locale: Locale): ClientPlace {
  const name = z.slug === "utc" ? "UTC" : (z.abbr ?? fmtOffset(z.offset));
  const sub = z.kind === "abbr" ? (locale === "ru" ? (z.ru ?? z.full ?? "") : (z.full ?? "")) : locale === "ru" ? "Смещение от UTC" : "UTC offset";
  return { key: `zone:${z.slug}`, name, sub, tz: z.tz ?? null, offset: z.tz ? null : z.offset };
}
