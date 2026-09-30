import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { ui } from "@/i18n/ui";
import type { Crumb, LinkItem } from "@/registry/types";
import { fmtOffset } from "../lib/tz";
import { cityBySlug, cityLabel, countryName, type City } from "../model";

export const SECTION_ID = "time";
export const HUE = 195;

export const home = (locale: Locale): Crumb => ({ name: ui(locale).home, path: [] });
export const timeCrumb = (locale: Locale): Crumb => ({ name: locale === "ru" ? "Точное время" : "Exact time", path: ["time"] });

export function cityLink(c: City, locale: Locale, hint?: string): LinkItem {
  return { path: ["time", c.slug], label: cityLabel(c, locale), hint: hint ?? countryName(c.cc, locale) };
}

export const citiesBySlugs = (slugs: string[]): City[] => slugs.map((s) => cityBySlug.get(s)).filter((c): c is City => !!c);

export function fmtCoords(c: City, locale: Locale): string {
  const f = (v: number) => formatNumber(locale, Math.abs(v), { maximumFractionDigits: 2 });
  if (locale === "ru") return `${f(c.lat)}° ${c.lat >= 0 ? "с. ш." : "ю. ш."}, ${f(c.lon)}° ${c.lon >= 0 ? "в. д." : "з. д."}`;
  return `${f(c.lat)}° ${c.lat >= 0 ? "N" : "S"}, ${f(c.lon)}° ${c.lon >= 0 ? "E" : "W"}`;
}

export function fmtPopulation(n: number, locale: Locale): string {
  if (n >= 1e6) {
    const v = formatNumber(locale, n / 1e6, { maximumFractionDigits: 1 });
    return locale === "ru" ? `≈ ${v} млн` : `≈ ${v} million`;
  }
  if (locale === "ru") return `≈ ${formatNumber(locale, Math.round(n / 1000))} тыс.`;
  return `≈ ${formatNumber(locale, Math.round(n / 1000) * 1000)}`;
}

/** "UTC+3" / "UTC+0 (GMT)" */
export const offWithAbbr = (off: number, abbr: string): string => (abbr ? `${fmtOffset(off)} (${abbr})` : fmtOffset(off));

/** «12:00» wall time at offset for a given UTC hour grid. */
export function hm(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
