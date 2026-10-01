import type { Locale } from "@/i18n/config";
import type { Block, LinkItem, PageModel, QA } from "@/registry/types";
import { fmtDate } from "@/tools/time/calendar/lib/dates";
import { COMPARE, WORLD_12 } from "../data/zones";
import { fmtOffset, zoned } from "../lib/tz";
import { sunDay } from "../lib/sun";
import {
  BUILD_YEAR,
  CITIES,
  cityBySlug,
  cityIn,
  cityLabel,
  cityName,
  citiesOf,
  clientCity,
  countryByCc,
  countryName,
  countryPath,
  diffShort,
  dstText,
  enCountry,
  durationWords,
  zoneAbbr,
  zoneInfo,
  type City,
} from "../lib/model";
import type { CityTimeProps } from "../lib/types";
import { citiesBySlugs, cityLink, fmtCoords, fmtPopulation, home, HUE, hm, offWithAbbr, SECTION_ID, timeCrumb } from "./common";
import { pairsWith } from "./pair";

/** Solar events of the build year at a city: equinoxes and solstices (approximate days). */
const SUN_DATES: [number, number][] = [
  [3, 20],
  [6, 21],
  [9, 22],
  [12, 21],
];

function sunRows(c: City, locale: Locale) {
  return SUN_DATES.map(([m, d]) => {
    const off = offsetOn(c, m, d);
    const s = sunDay(BUILD_YEAR, m, d, c.lat, c.lon, off);
    const t = (ms: number | null) => (ms === null ? "—" : hm(Math.round(ms / 60000) + off));
    const len =
      s.polar === "day"
        ? locale === "ru"
          ? "полярный день"
          : "polar day"
        : s.polar === "night"
          ? locale === "ru"
            ? "полярная ночь"
            : "polar night"
          : durationWords(s.dayLength, locale);
    return { date: fmtDate(locale, { y: BUILD_YEAR, m, d }, false), rise: t(s.sunrise), set: t(s.sunset), len, polar: s.polar };
  });
}

function offsetOn(c: City, m: number, d: number): number {
  return zoned(c.tz, Date.UTC(BUILD_YEAR, m - 1, d, 12)).off;
}

/** Difference (minutes) of city b relative to city a in January and July. */
function diffJanJul(a: City, b: City): [number, number] {
  const ia = zoneInfo(a.tz);
  const ib = zoneInfo(b.tz);
  return [ib.jan - ia.jan, ib.jul - ia.jul];
}

function diffText(d: [number, number], locale: Locale): string {
  if (d[0] === d[1]) return diffShort(d[0], locale);
  return locale === "ru" ? `${diffShort(d[0], locale)} зимой, ${diffShort(d[1], locale)} летом` : `${diffShort(d[0], locale)} in winter, ${diffShort(d[1], locale)} in summer`;
}

export function cityPage(c: City, locale: Locale): PageModel {
  const ru = locale === "ru";
  const info = zoneInfo(c.tz);
  const country = countryByCc.get(c.cc)!;
  const name = cityName(c, locale);
  const label = cityLabel(c, locale);
  const inName = cityIn(c, locale);
  const abbrStd = zoneAbbr(c.tz, info.std, info);
  const abbrDst = zoneAbbr(c.tz, info.dst, info);
  const dst = dstText(c.tz, locale);
  const offsets = info.hasDst
    ? ru
      ? `${offWithAbbr(info.std, abbrStd)} зимой и ${offWithAbbr(info.dst, abbrDst)} летом`
      : `${offWithAbbr(info.std, abbrStd)} in winter and ${offWithAbbr(info.dst, abbrDst)} in summer`
    : offWithAbbr(info.std, abbrStd);
  const moscow = cityBySlug.get("moscow")!;
  const astana = cityBySlug.get("astana")!;
  const dMsk = diffJanJul(moscow, c);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ── text ── */
  const titleBase = ru ? `Время ${inName} сейчас` : `Time ${inName}, ${countryName(c.cc, locale)}`;
  const title = ru ? (titleBase.length <= 30 ? `${titleBase} — точное время и часовой пояс` : `${titleBase} — точное время`) : `${titleBase} — current local time`;
  const h1 = ru ? `Время ${inName}` : `Current time ${inName}`;
  const lead = ru
    ? `${label} — ${offsets}${info.hasDst ? "" : ", без перехода на летнее время"}.`
    : `${label} is on ${offsets}${info.hasDst ? "" : ", no daylight saving time"}.`;
  const mskPart = c.slug === "moscow" ? "" : ru ? `, разница с Москвой ${diffText(dMsk, locale)}` : `, ${diffText(dMsk, locale)} from Moscow`;
  const description = ru
    ? `Точное время ${inName} онлайн с секундами, дата и день недели. Часовой пояс ${fmtOffset(info.std)}${info.hasDst ? ` (летом ${fmtOffset(info.dst)})` : ", без перехода на летнее время"}${mskPart}; восход и закат.`
    : `Current local time ${inName} with seconds, date and weekday. Time zone ${fmtOffset(info.std)}${info.hasDst ? ` (${fmtOffset(info.dst)} in summer)` : ", no DST"}${mskPart}; sunrise and sunset.`;

  /* ── facts ── */
  const facts: [string, string][] = [
    [ru ? "Страна" : "Country", ru ? country.ru : country.en],
    [ru ? "Часовой пояс" : "Time zone", `${c.tz}${abbrStd ? ` (${abbrStd}${abbrDst && abbrDst !== abbrStd ? `/${abbrDst}` : ""})` : ""}`],
    [ru ? "Смещение от UTC" : "UTC offset", info.hasDst ? (ru ? `${fmtOffset(info.std)} зимой, ${fmtOffset(info.dst)} летом` : `${fmtOffset(info.std)} in winter, ${fmtOffset(info.dst)} in summer`) : ru ? `${fmtOffset(info.std)} круглый год` : `${fmtOffset(info.std)} all year`],
    [ru ? "Летнее время" : "Daylight saving time", dst.long],
  ];
  if (c.slug !== "moscow") facts.push([ru ? "Разница с Москвой" : "Difference from Moscow", diffText(dMsk, locale)]);
  if (c.slug !== "astana" && c.cc !== "KZ") facts.push([ru ? "Разница с Астаной" : "Difference from Astana", diffText(diffJanJul(astana, c), locale)]);
  facts.push([ru ? "Координаты" : "Coordinates", fmtCoords(c, locale)], [ru ? "Население" : "Population", fmtPopulation(c.pop, locale)]);

  /* ── sun table ── */
  const sun = sunRows(c, locale);
  const sunBlock: Block = {
    type: "table",
    title: ru ? `Восход и закат ${inName} в ${BUILD_YEAR} году` : `Sunrise and sunset ${inName} in ${BUILD_YEAR}`,
    head: ru ? ["Дата", "Восход", "Закат", "Долгота дня"] : ["Date", "Sunrise", "Sunset", "Day length"],
    rows: sun.map((r) => [r.date, r.rise, r.set, r.len]),
  };

  /* ── differences with world cities ── */
  const world = citiesBySlugs(WORLD_12).filter((x) => x.slug !== c.slug);
  const diffBlock: Block = {
    type: "table",
    title: ru ? `Когда ${inName} 12:00` : `When it is 12:00 ${inName}`,
    head: ru ? ["Город", "Январь", "Июль"] : ["City", "January", "July"],
    rows: world.map((w) => {
      const [dj, dl] = diffJanJul(c, w);
      const cell = (d: number) => `${hm(720 + d)} (${diffShort(d, locale)})`;
      return [cityLabel(w, locale), cell(dj), cell(dl)];
    }),
  };

  /* ── chips ── */
  const topBlocks: Block[] = [];
  const same = citiesOf(c.cc).filter((x) => x.slug !== c.slug);
  if (same.length) {
    topBlocks.push({
      type: "links",
      title: ru ? `Другие города: ${country.ru}` : `Other cities in ${enCountry(country)}`,
      style: "chips",
      items: same.slice(0, 30).map((x) => cityLink(x, locale, fmtOffset(zoneInfo(x.tz).std))),
      more: country.hasPage ? { path: countryPath(country), label: ru ? `Все часовые пояса: ${country.ru}` : `All time zones of ${enCountry(country)}` } : undefined,
    });
  }
  const sameZone = CITIES.filter((x) => x.cc !== c.cc && zoneInfo(x.tz).jan === info.jan && zoneInfo(x.tz).jul === info.jul).slice(0, 12);
  if (sameZone.length) topBlocks.push({ type: "links", title: ru ? `Живут по тому же времени` : `Same time as ${name}`, style: "chips", items: sameZone.map((x) => cityLink(x, locale)) });
  const pairs = pairsWith(c.slug, locale).slice(0, 10);
  if (pairs.length) topBlocks.push({ type: "links", title: ru ? "Перевод времени" : "Time conversion", style: "chips", items: pairs });

  /* ── FAQ ── */
  const june = sun[1];
  const dec = sun[3];
  const faq: QA[] = ru
    ? [
        { q: `Какой часовой пояс ${inName}?`, a: `${label} живёт по времени ${offsets}. Идентификатор часового пояса — ${c.tz}. ${dst.long}` },
        {
          q: `Переводят ли часы ${inName}?`,
          a: info.hasDst ? `Да. ${dst.long} Часы на этой странице учитывают перевод автоматически.` : `Нет, ${inName} не переходят на летнее время: ${fmtOffset(info.std)} действует круглый год.`,
        },
        ...(c.slug !== "moscow"
          ? [
              {
                q: `Сколько времени ${inName}, когда в Москве 12:00?`,
                a:
                  dMsk[0] === dMsk[1]
                    ? `${cap(inName)} в это время ${hm(720 + dMsk[0])}: разница с Москвой ${diffShort(dMsk[0], locale)}.`
                    : `Зимой — ${hm(720 + dMsk[0])} (${diffShort(dMsk[0], locale)}), летом — ${hm(720 + dMsk[1])} (${diffShort(dMsk[1], locale)}): разница меняется из-за перехода на летнее время.`,
              },
            ]
          : []),
        {
          q: `Во сколько восход и закат ${inName}?`,
          a:
            june.polar || dec.polar
              ? `${cap(inName)} бывают полярный день и полярная ночь. 21 июня: ${june.polar ? june.len : `восход ${june.rise}, закат ${june.set}`}; 21 декабря: ${dec.polar ? dec.len : `восход ${dec.rise}, закат ${dec.set}`}. Время на сегодня показано над таблицей.`
              : `21 июня солнце встаёт в ${june.rise} и садится в ${june.set} (день длится ${june.len}), 21 декабря — в ${dec.rise} и ${dec.set} (${dec.len}). Восход и закат на сегодня показаны рядом с часами.`,
        },
      ]
    : [
        { q: `What time zone is ${name} in?`, a: `${label} is on ${offsets}. The IANA time zone is ${c.tz}. ${dst.long}` },
        {
          q: `Does ${name} observe daylight saving time?`,
          a: info.hasDst ? `Yes. ${dst.long} The clock on this page applies the change automatically.` : `No. ${name} stays on ${fmtOffset(info.std)} all year.`,
        },
        ...(c.slug !== "moscow"
          ? [
              {
                q: `What time is it ${inName} when it is noon in Moscow?`,
                a:
                  dMsk[0] === dMsk[1]
                    ? `${hm(720 + dMsk[0])}: ${name} is ${diffShort(dMsk[0], locale)} from Moscow.`
                    : `${hm(720 + dMsk[0])} in winter (${diffShort(dMsk[0], locale)}) and ${hm(720 + dMsk[1])} in summer (${diffShort(dMsk[1], locale)}), because of daylight saving time.`,
              },
            ]
          : []),
        {
          q: `When is sunrise and sunset ${inName}?`,
          a:
            june.polar || dec.polar
              ? `${name} has polar day and polar night. June 21: ${june.polar ? june.len : `sunrise ${june.rise}, sunset ${june.set}`}; December 21: ${dec.polar ? dec.len : `sunrise ${dec.rise}, sunset ${dec.set}`}. Today's times are shown above the table.`
              : `On June 21 the sun rises at ${june.rise} and sets at ${june.set} (${june.len} of daylight); on December 21 at ${dec.rise} and ${dec.set} (${dec.len}). Today's sunrise and sunset are shown next to the clock.`,
        },
      ];

  /* ── client props ── */
  const props: Omit<CityTimeProps, "locale"> = {
    city: { ...clientCity(c, locale), inName },
    compare: citiesBySlugs(COMPARE)
      .filter((x) => x.slug !== c.slug)
      .map((x) => clientCity(x, locale)),
    world: world.map((x) => clientCity(x, locale)),
  };

  const related: LinkItem[] = [
    { path: ["time-zone-converter"], label: ru ? "Конвертер часовых поясов" : "Time zone converter", icon: "ArrowLeftRight" },
    { path: ["world-clock"], label: ru ? "Мировое время" : "World clock", icon: "Globe" },
  ];
  if (country.hasPage) related.unshift({ path: countryPath(country), label: ru ? `Время ${country.ruIn}` : `Time in ${enCountry(country)}`, icon: "Map" });

  return {
    path: [SECTION_ID, c.slug],
    sectionId: SECTION_ID,
    kind: "entity",
    title,
    h1,
    description,
    lead,
    breadcrumbs: [home(locale), timeCrumb(locale), ...(country.hasPage ? [{ name: ru ? country.ru : country.en, path: countryPath(country) }] : [])],
    tool: { id: "time/city", props },
    topBlocks,
    blocks: [{ type: "facts", title: ru ? "Часовой пояс и координаты" : "Time zone and location", rows: facts }, sunBlock, diffBlock],
    faq,
    related,
    schemaType: "WebPage",
    icon: "Clock",
    hue: HUE,
  };
}
