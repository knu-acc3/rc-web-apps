import type { L10n, Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import type { Block, LinkItem, PageModel, QA } from "@/registry/types";
import { ABBR_ZONES, OFFSET_ZONES, zoneBySlug, type ZoneDef } from "../data/zones";
import { fmtOffset, isoOffset } from "../lib/tz";
import {
  COUNTRIES,
  citiesWithOffset,
  cityLabel,
  clientCity,
  countriesOfCities,
  countryPath,
  durationWords,
  joinList,
  zoneCityName,
  zoneInfo,
  zonePath,
  type City,
  type Country,
} from "../lib/model";
import type { ZonesTableProps, ZoneTimeProps } from "../lib/types";
import { cityLink, home, HUE, hm } from "./common";
import { pairsWith } from "./pair";

/** Offsets used only by places outside the catalogue. */
const EXTRA_USAGE: Record<number, L10n> = {
  [-720]: { ru: "только необитаемые острова Бейкер и Хауленд (США)", en: "only the uninhabited Baker and Howland Islands (US)" },
  [-660]: { ru: "Ниуэ, Американское Самоа и атолл Мидуэй", en: "Niue, American Samoa and Midway Atoll" },
};

const zonesCrumb = (locale: Locale) => ({ name: locale === "ru" ? "Часовые пояса" : "Time zones", path: ["time-zones"] });

/** Zones (from the full per-country lists) that use `off` in January or July. */
function zonesWithOffset(off: number): { tz: string; cc: string }[] {
  const out: { tz: string; cc: string }[] = [];
  for (const c of COUNTRIES) for (const tz of c.zones) {
    const i = zoneInfo(tz);
    if (i.jan === off || i.jul === off) out.push({ tz, cc: c.cc });
  }
  return out;
}

function countryLabel(c: Country, off: number, locale: Locale): string {
  const n = locale === "ru" ? c.ru : c.en;
  const partial = c.zones.some((tz) => {
    const i = zoneInfo(tz);
    return i.jan !== off && i.jul !== off;
  });
  return partial ? (locale === "ru" ? `${n} (частично)` : `${n} (partly)`) : n;
}

function countryLinks(list: Country[], locale: Locale): LinkItem[] {
  return list.map((c) => ({ path: countryPath(c), label: locale === "ru" ? c.ru : c.en }));
}

const absWords = (off: number, locale: Locale, acc = false) => durationWords(Math.abs(off), locale, acc);

/** «на 5 часов впереди UTC» / «на 3 часа 30 минут позади UTC» */
function relUtc(off: number, locale: Locale): string {
  if (off === 0) return locale === "ru" ? "совпадает со всемирным координированным временем" : "equals Coordinated Universal Time";
  if (locale === "ru") return `на ${absWords(off, locale, true)} ${off > 0 ? "впереди" : "позади"} всемирного координированного времени (UTC)`;
  return `${absWords(off, locale)} ${off > 0 ? "ahead of" : "behind"} Coordinated Universal Time (UTC)`;
}

const mskRel = (off: number) => (off === 180 ? "МСК" : `МСК${off > 180 ? "+" : "−"}${hmShort(Math.abs(off - 180))}`);
const mskRelEn = (off: number) => (off === 180 ? "Moscow time" : `Moscow time ${off > 180 ? "+" : "−"}${hmShort(Math.abs(off - 180))} h`);
const hmShort = (min: number) => `${Math.floor(min / 60)}${min % 60 ? `:${String(min % 60).padStart(2, "0")}` : ""}`;

function candidates(off: number, locale: Locale) {
  const w = citiesWithOffset(off);
  return [...w.all, ...w.winter, ...w.summer].slice(0, 40).map((c) => clientCity(c, locale));
}

/* ───────────── offset pages ───────────── */

function offsetPage(z: ZoneDef, locale: Locale): PageModel {
  const ru = locale === "ru";
  const off = z.offset;
  const label = fmtOffset(off);
  const w = citiesWithOffset(off);
  const allC = countriesOfCities(w.all);
  const winterC = countriesOfCities(w.winter).filter((c) => !allC.includes(c));
  const summerC = countriesOfCities(w.summer).filter((c) => !allC.includes(c));
  const extraZones = !w.all.length && !w.winter.length && !w.summer.length ? zonesWithOffset(off) : [];

  let usage: string;
  if (allC.length || winterC.length || summerC.length) {
    const parts: string[] = [];
    if (allC.length) parts.push(ru ? `круглый год — ${joinList(allC.map((c) => countryLabel(c, off, locale)), locale, 10)}` : `all year in ${joinList(allC.map((c) => countryLabel(c, off, locale)), locale, 10)}`);
    if (winterC.length) parts.push(ru ? `только в январе (зимой северного полушария) — ${joinList(winterC.map((c) => countryLabel(c, off, locale)), locale, 8)}` : `only in January in ${joinList(winterC.map((c) => countryLabel(c, off, locale)), locale, 8)}`);
    if (summerC.length) parts.push(ru ? `только в июле — ${joinList(summerC.map((c) => countryLabel(c, off, locale)), locale, 8)}` : `only in July in ${joinList(summerC.map((c) => countryLabel(c, off, locale)), locale, 8)}`);
    usage = parts.join(ru ? "; " : "; ");
  } else if (extraZones.length) {
    usage = joinList(extraZones.map((x) => zoneCityName(x.tz, locale)), locale, 6);
  } else {
    usage = EXTRA_USAGE[off]?.[locale] ?? (ru ? "постоянно населённых территорий с этим смещением нет" : "no permanently inhabited places use this offset");
  }

  const title = ru ? `${label} — время сейчас, страны и города` : `${label} time now — countries and cities`;
  const h1 = ru ? `Часовой пояс ${label}` : `${label} time zone`;
  const structured = allC.length > 0 || winterC.length > 0 || summerC.length > 0 || extraZones.length > 0;
  const lead = ru ? `${label} ${relUtc(off, locale)}. Где действует: ${usage}.` : `${label} is ${relUtc(off, locale)}. ${structured ? `It is used ${extraZones.length ? "in " : ""}${usage}` : cap(usage)}.`;
  const description = ru
    ? `Точное время ${label} онлайн. ${label} — это ${off === 0 ? "нулевое смещение" : `${off > 0 ? "+" : "−"}${absWords(off, locale)} к UTC`}, ${mskRel(off)}. Какие страны и города живут по ${label}: ${joinList((allC.length ? allC : [...winterC, ...summerC]).map((c) => c.ru), locale, 4) || usage}.`
    : `Current time in ${label}. ${label} is ${off === 0 ? "zero offset" : `${absWords(off, locale)} ${off > 0 ? "ahead of" : "behind"} UTC`} (${mskRelEn(off)}). Countries and cities on ${label}: ${joinList((allC.length ? allC : [...winterC, ...summerC]).map((c) => c.en), locale, 4) || usage}.`;

  const whole = off % 60 === 0;
  const facts: [string, string][] = [
    [ru ? "Смещение от UTC" : "Offset from UTC", off === 0 ? "0" : `${off > 0 ? "+" : "−"}${absWords(off, locale)}`],
    [ru ? "Запись ISO 8601" : "ISO 8601 notation", isoOffset(off)],
    [ru ? "Относительно Москвы" : "Relative to Moscow", ru ? mskRel(off) : mskRelEn(off)],
    [ru ? "Когда по UTC полдень" : "When it is noon UTC", hm(720 + off)],
  ];
  if (whole && off !== 0) facts.push([ru ? "Фиксированная зона IANA" : "Fixed IANA zone", `Etc/GMT${off > 0 ? "-" : "+"}${Math.abs(off) / 60}`]);

  const blocks: Block[] = [{ type: "facts", title: ru ? "Коротко" : "Quick facts", rows: facts }];
  if (whole && off !== 0) {
    blocks.push({
      type: "text",
      paragraphs: [
        ru
          ? `Обратите внимание: в идентификаторах IANA знак перевёрнут — Etc/GMT${off > 0 ? "-" : "+"}${Math.abs(off) / 60} означает ${label}. Это историческая особенность базы tz; в быту пишут ${label} или GMT${off > 0 ? "+" : "−"}${Math.abs(off) / 60}.`
          : `Note that the sign is inverted in IANA ids: Etc/GMT${off > 0 ? "-" : "+"}${Math.abs(off) / 60} means ${label}. This is a historical quirk of the tz database; in everyday use people write ${label} or GMT${off > 0 ? "+" : "−"}${Math.abs(off) / 60}.`,
      ],
    });
  }

  const topBlocks: Block[] = [];
  const cityList = [...w.all, ...w.winter, ...w.summer];
  if (cityList.length) topBlocks.push({ type: "links", title: ru ? `Города на ${label}` : `Cities on ${label}`, style: "chips", items: cityList.slice(0, 48).map((c) => cityLink(c, locale)) });
  const cl = [...allC, ...winterC, ...summerC].filter((c) => c.hasPage);
  if (cl.length) topBlocks.push({ type: "links", title: ru ? "Страны" : "Countries", style: "chips", items: countryLinks(cl, locale).slice(0, 40) });
  const idx = OFFSET_ZONES.findIndex((x) => x.slug === z.slug);
  const neigh = OFFSET_ZONES.slice(Math.max(1, idx - 6), idx + 7).filter((x) => x !== z && x.slug !== "gmt");
  topBlocks.push({ type: "links", title: ru ? "Соседние часовые пояса" : "Neighbouring offsets", style: "chips", items: neigh.map((x) => ({ path: zonePath(x), label: fmtOffset(x.offset) })) });

  const example = w.all[0] ?? w.winter[0] ?? w.summer[0];
  const faq: QA[] = ru
    ? [
        { q: `Какие страны живут по ${label}?`, a: `${cap(usage)}.` },
        { q: `Сколько времени по ${label}, когда в Москве 12:00?`, a: `${hm(720 + off - 180)}. ${label} — это ${mskRel(off)}.` },
        { q: `${label} и GMT${off >= 0 ? "+" : "−"}${hmShort(Math.abs(off))} — одно и то же?`, a: `Да. Для часов в быту UTC и GMT совпадают, поэтому ${label} и GMT${off >= 0 ? "+" : "−"}${hmShort(Math.abs(off))} обозначают одно и то же смещение.` },
      ]
    : [
        { q: `Which countries use ${label}?`, a: structured ? `${label} is used ${extraZones.length ? "in " : ""}${usage}.` : `${cap(usage)}.` },
        { q: `What time is it in ${label} when it is noon in Moscow?`, a: `${hm(720 + off - 180)}. ${label} is ${mskRelEn(off)}.` },
        { q: `Is ${label} the same as GMT${off >= 0 ? "+" : "−"}${hmShort(Math.abs(off))}?`, a: `Yes. For civil time UTC and GMT are the same, so ${label} and GMT${off >= 0 ? "+" : "−"}${hmShort(Math.abs(off))} mean the same offset.` },
      ];

  const props: Omit<ZoneTimeProps, "locale"> = { label, offset: off, tz: null, candidates: candidates(off, locale) };
  return {
    path: zonePath(z),
    sectionId: "time",
    kind: "variant",
    title,
    h1,
    description,
    lead,
    breadcrumbs: [home(locale), zonesCrumb(locale)],
    tool: { id: "time/zone", props },
    topBlocks,
    blocks,
    faq,
    related: zoneRelated(locale, example),
    schemaType: "WebPage",
    icon: "Globe",
    hue: HUE,
  };
}

/* ───────────── abbreviation pages ───────────── */

function abbrPage(z: ZoneDef, locale: Locale): PageModel {
  const ru = locale === "ru";
  const abbr = z.abbr!;
  const off = z.offset;
  const label = fmtOffset(off);
  const nameRu = z.ru ?? z.full ?? abbr;
  const nameEn = z.full ?? abbr;
  const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  const generic = !!z.tz;
  const offText = generic ? (ru ? `${label} зимой, ${fmtOffset(off + 60)} летом` : `${label} in winter, ${fmtOffset(off + 60)} in summer`) : label;

  const title = ru ? `${abbr}: время сейчас — ${generic ? label : label}, ${lower(nameRu)}` : `${abbr} time now — ${label}, ${nameEn}`;
  const h1 = ru ? `${abbr} — ${lower(nameRu)}` : `${abbr} — ${nameEn}`;
  const lead = ru ? `${abbr} (${nameEn}) — ${offText}. Где действует: ${z.used?.ru ?? ""}.` : `${abbr} (${nameEn}) is ${offText}. Used in ${z.used?.en ?? ""}.`;
  const description = ru
    ? `Точное время ${abbr} онлайн: ${lower(nameRu)}, ${offText}${z.msk !== undefined ? ` (${mskRel(off)})` : ""}. Где используется ${abbr}, разница с Москвой и UTC, перевод времени.`
    : `Current ${abbr} time: ${nameEn}, ${offText}. Where ${abbr} is used, difference from UTC and Moscow, and time conversion.`;

  const facts: [string, string][] = [
    [ru ? "Полное название" : "Full name", ru ? `${nameRu} (${nameEn})` : nameEn],
    [ru ? "Смещение от UTC" : "UTC offset", offText],
    [ru ? "Относительно Москвы" : "Relative to Moscow", generic ? `${ru ? mskRel(off) : mskRelEn(off)} / ${ru ? mskRel(off + 60) : mskRelEn(off + 60)}` : ru ? mskRel(off) : mskRelEn(off)],
    [ru ? "Когда в Москве 12:00" : "When it is noon in Moscow", generic ? `${hm(720 + off - 180)} / ${hm(780 + off - 180)}` : hm(720 + off - 180)],
  ];
  if (z.pair) {
    const p = zoneBySlug.get(z.pair);
    if (p) facts.push([ru ? "Парное время" : "Counterpart", `${p.abbr ?? fmtOffset(p.offset)} (${fmtOffset(p.offset)})`]);
  }
  const blocks: Block[] = [{ type: "facts", title: ru ? "Коротко" : "Quick facts", rows: facts }];
  if (z.note) blocks.push({ type: "text", title: ru ? "Важно" : "Note", paragraphs: [z.note[locale]] });

  const topBlocks: Block[] = [];
  const chips: LinkItem[] = [];
  if (z.pair) {
    const p = zoneBySlug.get(z.pair);
    if (p) chips.push({ path: zonePath(p), label: p.abbr ?? fmtOffset(p.offset) });
  }
  const offPage = OFFSET_ZONES.find((x) => x.kind === "offset" && x.offset === off);
  if (offPage) chips.push({ path: zonePath(offPage), label: fmtOffset(off) });
  chips.push(...pairsWith(z.slug, locale));
  for (const o of ABBR_ZONES) if (o !== z && o.slug !== z.pair && chips.length < 40) chips.push({ path: zonePath(o), label: o.abbr! });
  topBlocks.push({ type: "links", title: ru ? "Связанные часовые пояса" : "Related time zones", style: "chips", items: chips });

  const faq: QA[] = ru
    ? [
        { q: `Сколько сейчас времени по ${abbr}?`, a: `${abbr} — это ${offText}. Часы вверху страницы показывают время ${abbr} в реальном времени, по часам вашего устройства.` },
        { q: `Где используется ${abbr}?`, a: `${cap(z.used?.ru ?? "")}.` },
        off === 180
          ? { q: "Как перевести MSK в UTC?", a: "Отнимите 3 часа: 12:00 MSK = 09:00 UTC. Россия не переводит часы, поэтому разница постоянна круглый год." }
          : {
              q: `Как перевести ${abbr} в московское время?`,
              a: `${off < 180 ? "Прибавьте" : "Отнимите"} ${durationWords(Math.abs(180 - off), locale, true)}${generic ? " (летом — на час меньше)" : ""}: 12:00 ${abbr} = ${hm(720 + 180 - off)} MSK.`,
            },
      ]
    : [
        { q: `What time is it in ${abbr} now?`, a: `${abbr} is ${offText}. The clock at the top of the page shows ${abbr} time live, based on your device clock.` },
        { q: `Where is ${abbr} used?`, a: `In ${z.used?.en ?? ""}.` },
        off === 180
          ? { q: "How do I convert MSK to UTC?", a: "Subtract 3 hours: 12:00 MSK = 09:00 UTC. Russia does not change clocks, so the difference is the same all year." }
          : {
              q: `How do I convert ${abbr} to Moscow time?`,
              a: `${off < 180 ? "Add" : "Subtract"} ${durationWords(Math.abs(180 - off), locale)}${generic ? " (one hour less in summer)" : ""}: 12:00 ${abbr} = ${hm(720 + 180 - off)} MSK.`,
            },
      ];

  const props: Omit<ZoneTimeProps, "locale"> = { label: abbr, offset: generic ? null : off, tz: z.tz ?? null, candidates: generic ? [] : candidates(off, locale) };
  return {
    path: zonePath(z),
    sectionId: "time",
    kind: "variant",
    title,
    h1,
    description,
    lead,
    breadcrumbs: [home(locale), zonesCrumb(locale)],
    tool: { id: "time/zone", props },
    topBlocks,
    blocks,
    faq,
    related: zoneRelated(locale),
    schemaType: "WebPage",
    icon: "Globe",
    hue: HUE,
  };
}

function zoneRelated(locale: Locale, city?: City): LinkItem[] {
  const ru = locale === "ru";
  const out: LinkItem[] = [
    { path: ["time-zones"], label: ru ? "Часовые пояса мира" : "World time zones", icon: "Globe" },
    { path: ["time-zone-converter"], label: ru ? "Конвертер часовых поясов" : "Time zone converter", icon: "ArrowLeftRight" },
    { path: ["utc-time"], label: ru ? "Время UTC сейчас" : "Current UTC time", icon: "Clock" },
  ];
  if (city) out.push({ path: ["time", city.slug], label: ru ? `Время: ${cityLabel(city, locale)}` : `Time in ${cityLabel(city, locale)}`, icon: "Clock" });
  return out;
}

export function zonePage(slug: string, locale: Locale): PageModel | null {
  const z = zoneBySlug.get(slug);
  if (!z || z.slug === "utc") return null;
  return z.kind === "offset" ? offsetPage(z, locale) : abbrPage(z, locale);
}

/* ───────────── /time-zones landing ───────────── */

export function zonesHub(locale: Locale): PageModel {
  const ru = locale === "ru";
  const offsets = OFFSET_ZONES.filter((z) => z.kind === "offset").sort((a, b) => a.offset - b.offset);
  const rows: ZonesTableProps["rows"] = offsets.map((z) => {
    const w = citiesWithOffset(z.offset);
    const list = [...w.all, ...w.winter, ...w.summer];
    const names = list.length ? list.slice(0, 4).map((c) => cityLabel(c, locale)) : zonesWithOffset(z.offset).slice(0, 3).map((x) => zoneCityName(x.tz, locale));
    return { offset: z.offset, label: fmtOffset(z.offset), path: `/${locale}/${zonePath(z).join("/")}`, cities: names.join(", ") || (EXTRA_USAGE[z.offset]?.[locale] ?? "") };
  });
  const zonesCount = offsets.length;
  const abbrLinks: LinkItem[] = ABBR_ZONES.map((z) => ({ path: zonePath(z), label: z.abbr!, hint: ru ? (z.ru ?? "") : (z.full ?? "") }));
  const offsetLinks: LinkItem[] = offsets.map((z) => ({ path: zonePath(z), label: fmtOffset(z.offset) }));
  const faq: QA[] = ru
    ? [
        { q: "Сколько часовых поясов в мире?", a: `«Астрономических» поясов 24, но реальных смещений от UTC больше — в таблице их ${zonesCount}: от UTC−12 (необитаемые острова Бейкер и Хауленд) до UTC+14 (остров Киритимати), включая получасовые (Индия, Иран, Афганистан, Мьянма) и смещения с 45 минутами (Непал, острова Чатем).` },
        { q: "Чем UTC отличается от GMT?", a: "UTC — атомная шкала времени, по которой синхронизируются часы во всём мире. GMT — среднее солнечное время Гринвича и название часового пояса. В быту UTC и GMT совпадают." },
        { q: "Почему в одном часовом поясе разное время летом и зимой?", a: "Многие страны переводят часы на летнее время: например, Лондон зимой живёт по UTC+0, а летом — по UTC+1. Россия, Казахстан, Китай и Япония часы не переводят." },
        { q: "Как узнать свой часовой пояс?", a: "Он показан вверху страницы: браузер сообщает идентификатор зоны (например, Asia/Almaty) и текущее смещение от UTC." },
      ]
    : [
        { q: "How many time zones are there?", a: `There are 24 'astronomical' zones, but more real UTC offsets — the table lists ${zonesCount}: from UTC−12 (the uninhabited Baker and Howland Islands) to UTC+14 (Kiritimati), including half-hour offsets (India, Iran, Afghanistan, Myanmar) and 45-minute ones (Nepal, the Chatham Islands).` },
        { q: "What is the difference between UTC and GMT?", a: "UTC is the atomic time standard clocks worldwide are synchronised to. GMT is mean solar time at Greenwich and the name of a time zone. For everyday purposes they are the same." },
        { q: "Why does a place have different offsets in summer and winter?", a: "Many countries observe daylight saving time: London is on UTC+0 in winter and UTC+1 in summer. Russia, Kazakhstan, China and Japan do not change clocks." },
        { q: "How do I find my time zone?", a: "It is shown at the top of this page: your browser reports the zone id (e.g. Europe/London) and the current UTC offset." },
      ];
  const props: Omit<ZonesTableProps, "locale"> = { rows };
  return {
    path: ["time-zones"],
    sectionId: "time",
    kind: "tool",
    title: ru ? "Часовые пояса мира — список UTC и текущее время" : "World time zones — UTC offsets and current time",
    h1: ru ? "Часовые пояса мира" : "World time zones",
    description: ru
      ? `Все ${zonesCount} ${plural("ru", zonesCount, ["часовой пояс", "часовых пояса", "часовых поясов"])} мира от UTC−12 до UTC+14: текущее время в каждом, страны и города, аббревиатуры MSK, CET, EST, PST и ваш часовой пояс.`
      : `All ${zonesCount} time zones of the world from UTC−12 to UTC+14: current time in each, countries and cities, abbreviations like MSK, CET, EST, PST, and your own zone.`,
    lead: ru ? "Текущее время во всех часовых поясах от UTC−12 до UTC+14 и ваш собственный пояс." : "The current time in every zone from UTC−12 to UTC+14, plus your own zone.",
    breadcrumbs: [home(locale)],
    tool: { id: "time/zones", props },
    topBlocks: [
      { type: "links", title: ru ? "Аббревиатуры часовых поясов" : "Time zone abbreviations", style: "chips", items: abbrLinks },
      { type: "links", title: ru ? "Смещения от UTC" : "UTC offsets", style: "chips", items: offsetLinks },
    ],
    blocks: [
      {
        type: "text",
        title: ru ? "Как устроены часовые пояса" : "How time zones work",
        paragraphs: ru
          ? [
              "Время каждого пояса задаётся смещением от UTC — всемирного координированного времени. Москва живёт по UTC+3, Астана и Алматы — по UTC+5, Нью-Йорк зимой — по UTC−5.",
              "Границы поясов проводят государства, поэтому пояса повторяют границы стран, а не меридианы: Китай целиком живёт по UTC+8, хотя простирается на пять «астрономических» поясов, а Россия разделена на 11 поясов.",
              "Текущее время на этой странице считается в вашем браузере по актуальной базе часовых поясов IANA — с учётом перехода на летнее время.",
            ]
          : [
              "Each zone is defined by its offset from UTC, Coordinated Universal Time. Moscow is on UTC+3, Astana and Almaty on UTC+5, New York on UTC−5 in winter.",
              "Zone boundaries are set by governments, so they follow borders rather than meridians: all of China uses UTC+8 although it spans five 'astronomical' zones, while Russia is split into 11 zones.",
              "The current times on this page are calculated in your browser from the IANA time zone database, including daylight saving time.",
            ],
      },
    ],
    faq,
    related: [
      { path: ["time-zone-converter"], label: ru ? "Конвертер часовых поясов" : "Time zone converter", icon: "ArrowLeftRight" },
      { path: ["world-clock"], label: ru ? "Мировое время" : "World clock", icon: "Globe" },
      { path: ["utc-time"], label: ru ? "Время UTC сейчас" : "Current UTC time", icon: "Clock" },
    ],
    schemaType: "WebApplication",
    icon: "Globe",
    hue: HUE,
  };
}

export const zoneSlugs = (): string[] => [...OFFSET_ZONES, ...ABBR_ZONES].filter((z) => z.slug !== "utc").map((z) => z.slug);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
