import type { Locale } from "@/i18n/config";
import type { SearchEntry, SectionDef } from "@/registry/types";
import { ABBR_ZONES, OFFSET_ZONES } from "./data/zones";
import { fmtOffset } from "./lib/tz";
import { CITIES, COUNTRIES, cityBySlug, cityIn, cityLabel, countryBySlug, countryName, enCountry, zonePath } from "./model";
import { cityPage } from "./pages/city";
import { HUE } from "./pages/common";
import { countryPage } from "./pages/country";
import { pairKeys, pairPage } from "./pages/pair";
import { TIME_TOOLS, TOOL_BY_SLUG, timeToolPage, toolLink } from "./pages/tools";
import { zonePage, zoneSlugs, zonesHub } from "./pages/zone";

const NAME = { ru: "Мировое время", en: "World time" };
const DESC = {
  ru: "Точное время в городах и странах, часовые пояса, конвертер времени и часы онлайн",
  en: "Exact time in cities and countries, time zones, time converter and online clocks",
};

/** Cities prebuilt at build time (the rest render on first request and are cached). */
const PREBUILD_CITIES = 320;

export const timeSection: SectionDef = {
  id: "time",
  name: NAME,
  description: DESC,
  icon: "Globe",
  hue: HUE,
  category: "time",
  order: 1,
  absolute: true,
  hubPath: ["time"],

  mounts() {
    return [...TIME_TOOLS.map((t) => t.slug), "time-zones"];
  },

  paths() {
    return [
      ...TIME_TOOLS.map((t) => [t.slug]),
      ...CITIES.map((c) => ["time", c.slug]),
      ...COUNTRIES.filter((c) => c.hasPage).map((c) => ["time", c.slug]),
      ["time-zones"],
      ...zoneSlugs().map((s) => ["time-zones", s]),
      ...pairKeys().map((k) => ["time-zone-converter", k]),
    ];
  },

  prebuild() {
    const top = new Set(
      [...CITIES]
        .sort((a, b) => b.pop - a.pop)
        .slice(0, PREBUILD_CITIES)
        .map((c) => c.slug),
    );
    for (const c of CITIES) if (c.cc === "KZ" || c.cc === "RU" || c.capital) top.add(c.slug);
    return [
      ...TIME_TOOLS.map((t) => [t.slug]),
      ...CITIES.filter((c) => top.has(c.slug)).map((c) => ["time", c.slug]),
      ...COUNTRIES.filter((c) => c.hasPage).map((c) => ["time", c.slug]),
      ["time-zones"],
      ...zoneSlugs().map((s) => ["time-zones", s]),
      ...pairKeys().map((k) => ["time-zone-converter", k]),
    ];
  },

  resolve(locale, segs) {
    const [a, b, c] = segs;
    if (c !== undefined) return null;
    if (a === "time" && b) {
      const city = cityBySlug.get(b);
      if (city) return cityPage(city, locale);
      const country = countryBySlug.get(b);
      return country ? countryPage(country, locale) : null;
    }
    if (a === "time-zones") return b ? zonePage(b, locale) : zonesHub(locale);
    if (a === "time-zone-converter" && b) return pairPage(b, locale);
    const tool = TOOL_BY_SLUG.get(a);
    return tool && !b ? timeToolPage(tool, locale) : null;
  },

  search(locale) {
    const ru = locale === "ru";
    const out: SearchEntry[] = [];
    const hint = NAME[locale];
    for (const t of TIME_TOOLS) out.push({ path: [t.slug], title: t.name[locale], hint, keywords: [...(t.keywords?.[locale] ?? []), t.title[locale]].join(" "), weight: 3 });
    out.push({ path: ["time-zones"], title: ru ? "Часовые пояса мира" : "World time zones", hint, keywords: "utc gmt часовые пояса time zones", weight: 3 });
    for (const c of CITIES) {
      out.push({
        path: ["time", c.slug],
        title: ru ? `Время ${cityIn(c, locale)}` : `Time in ${cityLabel(c, locale)}`,
        hint: countryName(c.cc, locale),
        keywords: `${c.ru} ${c.en} ${countryName(c.cc, "ru")} ${countryName(c.cc, "en")} ${c.tz}`,
        weight: c.capital || c.pop > 3e6 ? 2 : 1,
      });
    }
    for (const c of COUNTRIES) {
      if (!c.hasPage) continue;
      out.push({ path: ["time", c.slug], title: ru ? `Время ${c.ruIn}` : `Time in ${enCountry(c)}`, hint: ru ? "Часовые пояса страны" : "Country time zones", keywords: `${c.ru} ${c.en}`, weight: 2 });
    }
    for (const z of [...OFFSET_ZONES, ...ABBR_ZONES]) {
      if (z.slug === "utc") continue;
      const label = z.abbr ?? fmtOffset(z.offset);
      out.push({ path: zonePath(z), title: z.kind === "abbr" ? `${label} — ${ru ? (z.ru ?? z.full) : z.full}` : label, hint: ru ? "Часовой пояс" : "Time zone", keywords: `${z.slug} ${fmtOffset(z.offset)} ${fmtOffset(z.offset).replace("UTC", "GMT")}`, weight: 1 });
    }
    for (const k of pairKeys()) {
      const page = pairPage(k, locale);
      if (page) out.push({ path: page.path, title: page.h1, hint: ru ? "Разница во времени" : "Time difference", weight: 1 });
    }
    return out;
  },

  featured(locale) {
    return ["time", "world-clock", "time-zone-converter", "online-clock"].map((s) => toolLink(TOOL_BY_SLUG.get(s)!, locale));
  },

  tools(locale: Locale) {
    return [
      ...TIME_TOOLS.map((t) => toolLink(t, locale)),
      { path: ["time-zones"], label: locale === "ru" ? "Часовые пояса мира" : "World time zones", hint: locale === "ru" ? "Все пояса от UTC−12 до UTC+14" : "Every zone from UTC−12 to UTC+14", icon: "Globe", hue: HUE },
    ];
  },
};

