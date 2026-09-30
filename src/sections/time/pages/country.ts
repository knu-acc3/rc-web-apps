import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import type { Block, LinkItem, PageModel, QA } from "@/registry/types";
import { fmtOffset } from "../lib/tz";
import {
  BUILD_YEAR,
  cityBySlug,
  cityIn,
  cityLabel,
  citiesOf,
  clientCity,
  dstText,
  enCountry,
  offsetPath,
  zoneCityName,
  zoneInfo,
  type City,
  type Country,
} from "../model";
import type { CountryTimeProps, Place } from "../types";
import { cityLink, home, HUE, SECTION_ID, timeCrumb } from "./common";

export interface ZoneGroup {
  std: number;
  dst: number;
  hasDst: boolean;
  mixedDst: boolean;
  zones: string[];
  cities: City[];
}

/** Zones of a country grouped by standard offset (the usual meaning of "a time zone"). */
export function zoneGroups(c: Country): ZoneGroup[] {
  const map = new Map<number, ZoneGroup>();
  const cities = citiesOf(c.cc);
  for (const tz of c.zones) {
    const i = zoneInfo(tz);
    let g = map.get(i.std);
    if (!g) {
      g = { std: i.std, dst: i.dst, hasDst: false, mixedDst: false, zones: [], cities: [] };
      map.set(i.std, g);
    }
    if (g.zones.length && g.hasDst !== i.hasDst) g.mixedDst = true;
    g.hasDst = g.hasDst || i.hasDst;
    g.dst = Math.max(g.dst, i.dst);
    g.zones.push(tz);
    for (const city of cities) if (city.tz === tz) g.cities.push(city);
  }
  for (const g of map.values()) g.cities.sort((a, b) => b.pop - a.pop);
  return [...map.values()].sort((a, b) => a.std - b.std);
}

function groupPlaces(g: ZoneGroup, locale: Locale): Place[] {
  if (g.cities.length) return g.cities.slice(0, 6).map((x) => clientCity(x, locale));
  return g.zones.slice(0, 3).map((tz) => ({ key: tz, name: zoneCityName(tz, locale), sub: tz, tz, offset: null }));
}

function groupName(g: ZoneGroup, locale: Locale): string {
  return g.cities[0] ? cityLabel(g.cities[0], locale) : zoneCityName(g.zones[0], locale);
}

export function countryPage(c: Country, locale: Locale): PageModel {
  const ru = locale === "ru";
  const groups = zoneGroups(c);
  const n = groups.length;
  const name = ru ? c.ru : c.en;
  const inName = ru ? c.ruIn : `in ${enCountry(c)}`;
  const enSubj = cap(enCountry(c));
  const anyDst = groups.some((g) => g.hasDst);
  const capital = cityBySlug.get(c.main);
  const cities = citiesOf(c.cc);
  const zonesWord = (k: number) => (ru ? plural("ru", k, ["часовой пояс", "часовых пояса", "часовых поясов"]) : k === 1 ? "time zone" : "time zones");
  const first = groups[0];
  const last = groups[n - 1];
  const dstCity = cities.find((x) => zoneInfo(x.tz).hasDst);
  const dstTz = dstCity?.tz ?? c.zones.find((z) => zoneInfo(z).hasDst) ?? null;
  const dstPlace = dstCity ? cityLabel(dstCity, locale) : dstTz ? zoneCityName(dstTz, locale) : "";

  const title = ru
    ? n === 1
      ? `Время ${inName} сейчас — часовой пояс и города`
      : `Время ${inName} сейчас — ${n} ${zonesWord(n)}`
    : n === 1
      ? `Time ${inName} now — time zone and cities`
      : `Time ${inName} now — ${n} time zones`;
  const h1 = ru ? `Время ${inName}` : `Time ${inName}`;

  let lead: string;
  if (n === 1) {
    const g = first;
    const dst = g.hasDst ? (ru ? `, летом ${fmtOffset(g.dst)}` : `, ${fmtOffset(g.dst)} in summer`) : ru ? ", без перехода на летнее время" : ", no daylight saving time";
    lead = ru ? `${name} живёт по единому времени ${fmtOffset(g.std)}${dst}.` : `${enSubj} uses a single time zone, ${fmtOffset(g.std)}${dst}.`;
    if (c.cc === "KZ") lead = ru ? "С 1 марта 2024 года весь Казахстан живёт по единому времени UTC+5, без перехода на летнее время." : "Since 1 March 2024 all of Kazakhstan uses a single time zone, UTC+5, with no daylight saving time.";
  } else {
    lead = ru
      ? `${cap(inName)} ${n} ${zonesWord(n)}: от ${fmtOffset(first.std)} (${groupName(first, locale)}) до ${fmtOffset(last.std)} (${groupName(last, locale)})${anyDst ? "" : ", часы не переводят"}.`
      : `${enSubj} has ${n} time zones, from ${fmtOffset(first.std)} (${groupName(first, locale)}) to ${fmtOffset(last.std)} (${groupName(last, locale)})${anyDst ? "" : "; clocks do not change"}.`;
  }

  const capitalNote = capital ? (ru ? ` Столица — ${cityLabel(capital, locale)}.` : ` Capital: ${cityLabel(capital, locale)}.`) : "";
  const description = (ru
    ? `Точное время ${inName} онлайн: ${n === 1 ? `часовой пояс ${fmtOffset(first.std)}` : `${n} ${zonesWord(n)} от ${fmtOffset(first.std)} до ${fmtOffset(last.std)}`}, текущее время${n > 1 ? " в каждом поясе" : ""}, города${anyDst ? " и даты перевода часов" : ", летнее время не используется"}.`
    : `Current time ${inName}: ${n === 1 ? `one time zone, ${fmtOffset(first.std)}` : `${n} time zones from ${fmtOffset(first.std)} to ${fmtOffset(last.std)}`}, live clocks${n > 1 ? " for each zone" : ""}, cities${anyDst ? " and daylight saving dates" : "; no daylight saving time"}.`) + capitalNote;

  /* table */
  const rows = groups.map((g) => {
    const dstCell = !g.hasDst
      ? ru
        ? "нет"
        : "no"
      : g.mixedDst
        ? ru
          ? `частично (${fmtOffset(g.dst)})`
          : `in some areas (${fmtOffset(g.dst)})`
        : ru
          ? `да, ${fmtOffset(g.dst)}`
          : `yes, ${fmtOffset(g.dst)}`;
    const citiesCell = g.cities.length ? g.cities.slice(0, 8).map((x) => cityLabel(x, locale)).join(", ") : g.zones.map((z) => zoneCityName(z, locale)).join(", ");
    return [fmtOffset(g.std), dstCell, citiesCell, g.zones.join(", ")];
  });
  const blocks: Block[] = [
    {
      type: "table",
      title: ru ? `Часовые пояса: ${name}` : `Time zones of ${ru ? name : enCountry(c)}`,
      head: ru ? ["Смещение", "Летнее время", "Города", "Зоны IANA"] : ["Offset", "Daylight time", "Cities", "IANA zones"],
      rows,
    },
  ];
  if (anyDst && dstTz) {
    blocks.push({ type: "text", title: ru ? `Перевод часов в ${BUILD_YEAR} году: ${dstPlace}` : `Clock changes in ${BUILD_YEAR}: ${dstPlace}`, paragraphs: [dstText(dstTz, locale).long] });
  }

  const topBlocks: Block[] = [];
  if (cities.length) {
    topBlocks.push({ type: "links", title: ru ? `Время в городах: ${name}` : `Cities of ${enCountry(c)}`, style: "chips", items: cities.slice(0, 50).map((x) => cityLink(x, locale, fmtOffset(zoneInfo(x.tz).std))) });
  }
  const offsetLinks: LinkItem[] = [];
  for (const g of groups) {
    const p = offsetPath(g.std);
    if (p) offsetLinks.push({ path: p, label: fmtOffset(g.std) });
  }
  if (offsetLinks.length) topBlocks.push({ type: "links", title: ru ? "Часовые пояса" : "Time zones", style: "chips", items: offsetLinks });

  const faq: QA[] = [];
  if (ru) {
    faq.push({
      q: `Сколько часовых поясов ${inName}?`,
      a: n === 1 ? `Один: ${fmtOffset(first.std)}${first.hasDst ? ` (летом ${fmtOffset(first.dst)})` : ""}.${c.cc === "KZ" ? " До 1 марта 2024 года большая часть страны, включая Астану и Алматы, жила по UTC+6, а западные области — по UTC+5; теперь время везде одинаковое." : ""}` : `${n} ${zonesWord(n)}: ${groups.map((g) => fmtOffset(g.std)).join(", ")}. Разница между крайними поясами — ${(last.std - first.std) / 60} ч.`,
    });
    faq.push({
      q: `Переводят ли часы ${inName}?`,
      a: anyDst && dstTz ? `Да${groups.some((g) => !g.hasDst || g.mixedDst) ? ", но не везде" : ""}. ${dstText(dstTz, locale).long}` : `Нет, летнее время ${inName} не используется: смещение от UTC одинаково круглый год.`,
    });
    if (capital) faq.push({ q: `Какое время в столице?`, a: `${cityLabel(capital, locale)} — ${fmtOffset(zoneInfo(capital.tz).std)}${zoneInfo(capital.tz).hasDst ? ` (летом ${fmtOffset(zoneInfo(capital.tz).dst)})` : ""}. Точное время ${cityIn(capital, locale)} с секундами — на отдельной странице.` });
  } else {
    faq.push({
      q: `How many time zones does ${enCountry(c)} have?`,
      a: n === 1 ? `One: ${fmtOffset(first.std)}${first.hasDst ? ` (${fmtOffset(first.dst)} in summer)` : ""}.${c.cc === "KZ" ? " Until 1 March 2024 most of the country, including Astana and Almaty, was on UTC+6 and the western regions on UTC+5; now the time is the same everywhere." : ""}` : `${n}: ${groups.map((g) => fmtOffset(g.std)).join(", ")}. The extreme zones are ${(last.std - first.std) / 60} h apart.`,
    });
    faq.push({
      q: `Does ${enCountry(c)} observe daylight saving time?`,
      a: anyDst && dstTz ? `Yes${groups.some((g) => !g.hasDst || g.mixedDst) ? ", but not everywhere" : ""}. ${dstText(dstTz, locale).long}` : `No, ${enCountry(c)} keeps the same UTC offset all year.`,
    });
    if (capital) faq.push({ q: `What time is it in the capital?`, a: `${cityLabel(capital, locale)} is on ${fmtOffset(zoneInfo(capital.tz).std)}${zoneInfo(capital.tz).hasDst ? ` (${fmtOffset(zoneInfo(capital.tz).dst)} in summer)` : ""}. See the exact time ${cityIn(capital, locale)} with seconds on its own page.` });
  }

  const props: Omit<CountryTimeProps, "locale"> = {
    groups: groups.map((g) => ({ label: g.hasDst ? `${fmtOffset(g.std)} / ${fmtOffset(g.dst)}` : fmtOffset(g.std), places: groupPlaces(g, locale) })),
  };

  const related: LinkItem[] = [];
  if (capital) related.push({ path: ["time", capital.slug], label: ru ? `Время ${cityIn(capital, locale)}` : `Time ${cityIn(capital, locale)}`, icon: "Clock" });
  related.push({ path: ["time-zones"], label: ru ? "Часовые пояса мира" : "World time zones", icon: "Globe" }, { path: ["time-zone-converter"], label: ru ? "Конвертер часовых поясов" : "Time zone converter", icon: "ArrowLeftRight" });

  return {
    path: [SECTION_ID, c.slug],
    sectionId: SECTION_ID,
    kind: "entity",
    title,
    h1,
    description,
    lead,
    breadcrumbs: [home(locale), timeCrumb(locale)],
    tool: { id: "time/country", props },
    topBlocks,
    blocks,
    faq,
    related,
    schemaType: "WebPage",
    icon: "Map",
    hue: HUE,
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
