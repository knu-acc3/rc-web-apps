import type { Locale } from "@/i18n/config";
import type { Place } from "../types";
import { fmtOffset } from "./tz";

/**
 * Client-side place search (cities, countries, zone abbreviations, UTC offsets).
 * The data is loaded lazily on first use so pages don't ship the whole catalogue.
 * Accepts Russian and English names, countries, IANA ids, "MSK", "UTC+5", "GMT-3:30".
 */
export interface PlaceEntry extends Place {
  /** Normalised names (Russian, English, abbreviation) — matched first. */
  names: string[];
  /** Everything else searchable: country names, IANA id. */
  hay: string;
  rank: number;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[−–—]/g, "-")
    .replace(/[_/,.()'’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const cache = new Map<Locale, Promise<PlaceEntry[]>>();

interface CityRow {
  slug: string;
  en: string;
  ru: string;
  cc: string;
  tz: string;
  lat: number;
  lon: number;
  pop: number;
  capital?: boolean;
}
interface CountryRow {
  cc: string;
  en: string;
  ru: string;
}

export function loadPlaces(locale: Locale): Promise<PlaceEntry[]> {
  let p = cache.get(locale);
  if (!p) {
    p = (async () => {
      const [cities, countries, zones] = await Promise.all([import("../data/cities.json"), import("../data/countries.json"), import("../data/zones")]);
      const cRows = cities.default as CityRow[];
      const kRows = countries.default as CountryRow[];
      const country = new Map(kRows.map((k) => [k.cc, k]));
      const ruCount = new Map<string, number>();
      for (const c of cRows) ruCount.set(locale === "ru" ? c.ru : c.en, (ruCount.get(locale === "ru" ? c.ru : c.en) ?? 0) + 1);
      const out: PlaceEntry[] = cRows.map((c) => {
        const k = country.get(c.cc);
        const kName = k ? (locale === "ru" ? k.ru : k.en) : c.cc;
        const base = locale === "ru" ? c.ru : c.en;
        const name = (ruCount.get(base) ?? 0) > 1 ? `${base} (${kName})` : base;
        return {
          key: c.slug,
          name,
          sub: kName,
          tz: c.tz,
          offset: null,
          lat: c.lat,
          lon: c.lon,
          names: [norm(c.ru), norm(c.en)],
          hay: norm(`${k?.ru ?? ""} ${k?.en ?? ""} ${c.tz}`),
          rank: c.pop * (c.capital ? 2 : 1),
        };
      });
      for (const z of zones.ZONES) {
        if (z.kind === "offset" && z.slug !== "utc") continue; // plain offsets are matched by parseOffsetQuery
        const label = z.abbr ?? fmtOffset(z.offset);
        out.push({
          key: `zone:${z.slug}`,
          name: label,
          sub: locale === "ru" ? (z.ru ?? z.full ?? "") : (z.full ?? ""),
          tz: z.tz ?? null,
          offset: z.tz ? null : z.offset,
          names: [norm(label), norm(z.slug), ...(z.slug === "msk" ? ["мск"] : [])],
          hay: norm(`${z.full ?? ""} ${z.ru ?? ""} ${fmtOffset(z.offset)} ${z.slug === "msk" ? "москва" : ""} ${z.slug === "utc" ? "universal coordinated всемирное" : ""}`),
          rank: 5e7,
        });
      }
      return out;
    })();
    cache.set(locale, p);
  }
  return p;
}

/** "UTC+5", "gmt-3:30", "+5:45", "utc 3" → a fixed-offset place. */
export function parseOffsetQuery(q: string, locale: Locale): Place | null {
  const m = /^(?:utc|gmt|мск|msk)?\s*([+-−])\s*(\d{1,2})(?::?(\d{2}))?$/i.exec(q.trim().replace("−", "-"));
  if (!m) return null;
  const isMsk = /^(мск|msk)/i.test(q.trim());
  const h = Number(m[2]);
  const mm = m[3] ? Number(m[3]) : 0;
  if (h > 14 || mm >= 60) return null;
  let off = (m[1] === "-" ? -1 : 1) * (h * 60 + mm);
  if (isMsk) off += 180;
  if (off < -12 * 60 || off > 14 * 60) return null;
  const label = fmtOffset(off);
  return { key: `off:${off}`, name: label, sub: locale === "ru" ? "Смещение от UTC" : "UTC offset", tz: null, offset: off };
}

export function searchPlaces(list: PlaceEntry[], query: string, locale: Locale, limit = 10): Place[] {
  const q = norm(query);
  if (!q) return [];
  const out: { p: Place; s: number }[] = [];
  const off = parseOffsetQuery(query, locale);
  if (off) out.push({ p: off, s: 1e12 });
  for (const e of list) {
    let s = 0;
    if (e.names.some((n) => n === q)) s = 5;
    else if (e.names.some((n) => n.startsWith(q))) s = 4;
    else if (e.names.some((n) => n.split(" ").some((w) => w.startsWith(q)))) s = 3;
    else if (e.hay.split(" ").some((w) => w.startsWith(q))) s = 2;
    else if (e.names.some((n) => n.includes(q)) || e.hay.includes(q)) s = 1;
    if (s) out.push({ p: e, s: s * 1e10 + e.rank });
  }
  out.sort((a, b) => b.s - a.s);
  return out.slice(0, limit).map(({ p }) => ({ key: p.key, name: p.name, sub: p.sub, tz: p.tz, offset: p.offset, lat: p.lat, lon: p.lon }));
}
