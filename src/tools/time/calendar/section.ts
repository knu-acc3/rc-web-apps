import type { Locale } from "@/i18n/config";
import type { LinkItem, SearchEntry, SectionDef } from "@/registry/types";
import { MONTH_SLUGS, monthName } from "./lib/dates";
import type { HolidayCountry } from "./lib/holidays";
import {
  calendarToolPage,
  COUNTRY_SLUG,
  HUE,
  MONTH_YEARS,
  monthPage,
  PROD_YEARS,
  productionHub,
  productionPage,
  weekToolPage,
  weekYearPage,
  WEEK_YEARS,
  YEARS,
  yearPage,
} from "./content/pages";

const NAME = { ru: "Календарь", en: "Calendar" };
const DESC = {
  ru: "Календари по годам и месяцам, производственный календарь России и Казахстана, номера недель",
  en: "Yearly and monthly calendars, working-day calendars of Russia and Kazakhstan, week numbers",
};

const prodSlug = (c: HolidayCountry, y: number) => `${COUNTRY_SLUG[c]}-${y}`;
const PROD = new Map<string, { c: HolidayCountry; y: number }>();
for (const c of ["ru", "kz"] as HolidayCountry[]) for (const y of PROD_YEARS[c]) PROD.set(prodSlug(c, y), { c, y });

function tool(locale: Locale, path: string[], label: string, hint: string, icon: string): LinkItem {
  return { path, label, hint, icon, hue: HUE };
}

export const calendarSection: SectionDef = {
  id: "calendar",
  name: NAME,
  description: DESC,
  icon: "CalendarDays",
  hue: HUE,
  category: "time",
  order: 4,
  absolute: true,
  hubPath: ["calendar"],

  mounts() {
    return ["calendar", "week-number", "production-calendar"];
  },

  paths() {
    return [
      ["calendar"],
      ...YEARS.map((y) => ["calendar", String(y)]),
      ...MONTH_YEARS.flatMap((y) => MONTH_SLUGS.map((m) => ["calendar", String(y), m])),
      ["week-number"],
      ...WEEK_YEARS.map((y) => ["week-number", String(y)]),
      ["production-calendar"],
      ...[...PROD.keys()].map((k) => ["production-calendar", k]),
    ];
  },

  resolve(locale, segs) {
    const [a, b, c] = segs;
    if (a === "calendar") {
      if (!b) return calendarToolPage(locale);
      if (!/^\d{4}$/.test(b)) return null;
      const y = Number(b);
      if (!c) return YEARS.includes(y) ? yearPage(y, locale) : null;
      const m = MONTH_SLUGS.indexOf(c as (typeof MONTH_SLUGS)[number]);
      return MONTH_YEARS.includes(y) && m >= 0 ? monthPage(y, m + 1, locale) : null;
    }
    if (c !== undefined) return null;
    if (a === "week-number") {
      if (!b) return weekToolPage(locale);
      const y = Number(b);
      return /^\d{4}$/.test(b) && WEEK_YEARS.includes(y) ? weekYearPage(y, locale) : null;
    }
    if (a === "production-calendar") {
      if (!b) return productionHub(locale);
      const p = PROD.get(b);
      return p ? productionPage(p.c, p.y, locale) : null;
    }
    return null;
  },

  search(locale) {
    const ru = locale === "ru";
    const hint = NAME[locale];
    const out: SearchEntry[] = [
      { path: ["calendar"], title: ru ? "Календарь" : "Calendar", hint, keywords: ru ? "календарь на год праздники" : "calendar year holidays", weight: 3 },
      { path: ["week-number"], title: ru ? "Номер недели" : "Week number", hint, keywords: ru ? "какая неделя номер недели iso" : "what week is it iso week", weight: 3 },
      { path: ["production-calendar"], title: ru ? "Производственный календарь" : "Working-day calendar", hint, keywords: ru ? "производственный календарь рабочие дни нормы часов" : "working days norms production calendar", weight: 3 },
    ];
    for (const y of YEARS) out.push({ path: ["calendar", String(y)], title: ru ? `Календарь на ${y} год` : `${y} calendar`, hint, weight: 1 });
    for (const y of MONTH_YEARS) MONTH_SLUGS.forEach((s, i) => out.push({ path: ["calendar", String(y), s], title: ru ? `Календарь: ${monthName(locale, i + 1).toLowerCase()} ${y}` : `${monthName(locale, i + 1)} ${y} calendar`, hint, weight: 1 }));
    for (const y of WEEK_YEARS) out.push({ path: ["week-number", String(y)], title: ru ? `Номера недель ${y}` : `Week numbers ${y}`, hint, weight: 1 });
    for (const [k, { c, y }] of PROD) out.push({ path: ["production-calendar", k], title: ru ? `Производственный календарь ${y}: ${c === "ru" ? "Россия" : "Казахстан"}` : `${c === "ru" ? "Russia" : "Kazakhstan"} working-day calendar ${y}`, hint, weight: 2 });
    return out;
  },

  featured(locale) {
    const ru = locale === "ru";
    return [
      tool(locale, ["calendar"], ru ? "Календарь" : "Calendar", ru ? "Год с праздниками и номерами недель" : "Year with holidays and week numbers", "CalendarDays"),
      tool(locale, ["production-calendar"], ru ? "Производственный календарь" : "Working-day calendar", ru ? "Рабочие дни и нормы часов" : "Working days and hours", "Briefcase"),
      tool(locale, ["week-number"], ru ? "Номер недели" : "Week number", ru ? "Какая сейчас неделя" : "What week it is now", "CalendarRange"),
    ];
  },
};
