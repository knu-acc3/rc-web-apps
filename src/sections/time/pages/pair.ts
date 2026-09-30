import type { Locale } from "@/i18n/config";
import type { Block, LinkItem, PageModel, QA } from "@/registry/types";
import { fmtDate } from "@/sections/calendar/lib/dates";
import { pairList, zoneBySlug, type ZoneDef } from "../data/zones";
import { fmtOffset, transitions, tzOffset, zoned } from "../lib/tz";
import { BUILD_NOW, cityBySlug, cityIn, cityLabel, clientCity, clientZone, diffShort, durationWords, type City } from "../model";
import type { ConverterProps } from "../types";
import { home, HUE, hm } from "./common";

type End = { slug: string; city?: City; zone?: ZoneDef };

const ZONE_KEYS = new Set(["utc", "gmt", "msk", "cet", "eet", "est", "pst", "cst", "ist"]);

function endOf(slug: string): End | null {
  if (ZONE_KEYS.has(slug)) {
    const zone = zoneBySlug.get(slug);
    return zone ? { slug, zone } : null;
  }
  const city = cityBySlug.get(slug);
  return city ? { slug, city } : null;
}

export const pairKey = (a: string, b: string) => `${a}-to-${b}`;

const PAIRS = new Map<string, [End, End]>();
for (const [a, b] of pairList()) {
  const ea = endOf(a);
  const eb = endOf(b);
  if (ea && eb) PAIRS.set(pairKey(a, b), [ea, eb]);
}
export const pairKeys = (): string[] => [...PAIRS.keys()];
export const hasPair = (key: string): boolean => PAIRS.has(key);

/* ───────────── helpers ───────────── */

const name = (e: End, locale: Locale): string => (e.city ? cityLabel(e.city, locale) : e.zone!.slug === "utc" ? "UTC" : (e.zone!.abbr ?? fmtOffset(e.zone!.offset)));
const offAt = (e: End, t: number): number => (e.city ? tzOffset(e.city.tz, t) : e.zone!.offset);

/** «в Москве 12:00» / «по MSK 12:00» ; "12:00 in Moscow" / "12:00 MSK" */
function at(e: End, time: string, locale: Locale): string {
  if (locale === "ru") return e.city ? `${cityIn(e.city, locale)} ${time}` : `по ${name(e, locale)} ${time}`;
  return e.city ? `${time} ${cityIn(e.city, locale)}` : `${time} ${name(e, locale)}`;
}

function janJul(e: End): [number, number] {
  const y = new Date(BUILD_NOW).getUTCFullYear();
  return [offAt(e, Date.UTC(y, 0, 15, 12)), offAt(e, Date.UTC(y, 6, 15, 12))];
}

function pairLink(a: string, b: string, locale: Locale): LinkItem | null {
  const p = PAIRS.get(pairKey(a, b));
  if (!p) return null;
  return { path: ["time-zone-converter", pairKey(a, b)], label: `${name(p[0], locale)} → ${name(p[1], locale)}` };
}

/** Converter pairs that involve a city or zone (for chips on its page). */
export function pairsWith(slug: string, locale: Locale): LinkItem[] {
  const out: LinkItem[] = [];
  for (const [k, [a, b]] of PAIRS) {
    if (a.slug !== slug) continue;
    out.push({ path: ["time-zone-converter", k], label: `${name(a, locale)} → ${name(b, locale)}` });
  }
  if (!out.length) for (const [k, [a, b]] of PAIRS) if (b.slug === slug) out.push({ path: ["time-zone-converter", k], label: `${name(a, locale)} → ${name(b, locale)}` });
  return out.slice(0, 24);
}

function dayNote(min: number, locale: Locale): string {
  if (min < 0) return locale === "ru" ? " (накануне)" : " (previous day)";
  if (min >= 1440) return locale === "ru" ? " (след. день)" : " (next day)";
  return "";
}

/* ───────────── page ───────────── */

export function pairPage(key: string, locale: Locale): PageModel | null {
  const p = PAIRS.get(key);
  if (!p) return null;
  const [a, b] = p;
  const ru = locale === "ru";
  const A = name(a, locale);
  const B = name(b, locale);
  const diff = offAt(b, BUILD_NOW) - offAt(a, BUILD_NOW);
  const [aj, al] = janJul(a);
  const [bj, bl] = janJul(b);
  const dj = bj - aj;
  const dl = bl - al;
  const seasonal = dj !== dl;

  const rel = (d: number) => {
    if (d === 0) return ru ? "время совпадает" : "the same time";
    if (ru) return `разница ${durationWords(d, locale)}`;
    return `${B} is ${durationWords(d, locale)} ${d > 0 ? "ahead" : "behind"}`;
  };
  const noon = hm(720 + diff);
  const leadMain = ru ? `Когда ${at(a, "12:00", locale)}, ${at(b, noon, locale)} — ${rel(diff)}` : `When it is ${at(a, "12:00", locale)}, it is ${at(b, noon, locale)} (${rel(diff)})`;
  const seasonNote = seasonal
    ? ru
      ? ` Разница меняется в течение года: ${diffShort(dj, locale)} в январе и ${diffShort(dl, locale)} в июле.`
      : ` The difference changes during the year: ${diffShort(dj, locale)} in January and ${diffShort(dl, locale)} in July.`
    : "";
  const lead = `${leadMain}.${seasonNote}`;

  /* validity window of the table (next clock change of either side) */
  const trs = [a, b]
    .filter((e) => e.city)
    .flatMap((e) => transitions(e.city!.tz, BUILD_NOW, BUILD_NOW + 400 * 86400000).map((t) => ({ t, e })))
    .sort((x, y) => x.t.at - y.t.at);
  const next = trs[0];
  let validity: string;
  if (!next) {
    validity = ru ? "Ни в одном из двух мест часы не переводят, поэтому разница постоянна круглый год." : "Neither place changes its clocks, so the difference is the same all year round.";
  } else {
    const p2 = zoned(next.t.to, next.t.at);
    const date = fmtDate(locale, { y: p2.y, m: p2.m, d: p2.d });
    const newDiff = offAt(b, next.t.at + 60000) - offAt(a, next.t.at + 60000);
    const who = next.e.city ? cityIn(next.e.city, locale) : name(next.e, locale);
    validity = ru
      ? `Таблица составлена по смещениям, которые действуют сейчас. ${date} ${who} переводят часы, и разница станет ${diffShort(newDiff, locale)} — живой конвертер выше учитывает это автоматически.`
      : `The table uses the offsets in effect now. On ${date} clocks change ${who} and the difference becomes ${diffShort(newDiff, locale)} — the live converter above handles this automatically.`;
  }

  const rows: string[][] = [];
  for (let h = 0; h < 24; h++) {
    const m = h * 60 + diff;
    rows.push([hm(h * 60), `${hm(m)}${dayNote(m, locale)}`]);
  }

  const description = ru
    ? `${A} и ${B}: ${diff === 0 ? "время совпадает" : `разница ${durationWords(diff, locale)}`}${seasonal ? ` (${diffShort(dj, locale)} зимой, ${diffShort(dl, locale)} летом)` : ""}. Таблица перевода на 24 часа и живой конвертер: когда ${at(a, "9:00", locale)}, ${at(b, hm(540 + diff), locale)}.`
    : `${A} to ${B}: ${diff === 0 ? "same time" : `${durationWords(Math.abs(diff), locale)} ${diff > 0 ? "ahead" : "behind"}`}${seasonal ? ` (${diffShort(dj, locale)} in winter, ${diffShort(dl, locale)} in summer)` : ""}. 24-hour conversion table and live converter: 9:00 in ${A} is ${hm(540 + diff)} in ${B}.`;

  const faq: QA[] = ru
    ? [
        { q: `${A} и ${B}: какая разница во времени?`, a: `${leadMain}.${seasonNote}` },
        { q: `Сколько времени ${b.city ? cityIn(b.city, locale) : `по ${B}`}, когда ${at(a, "9:00", locale)}?`, a: `${hm(540 + diff)}${dayNote(540 + diff, locale)}. Полная таблица на все 24 часа — ниже.` },
        { q: "Меняется ли разница в течение года?", a: seasonal ? `Да: ${diffShort(dj, locale)} в январе и ${diffShort(dl, locale)} в июле, потому что в одном из мест переводят часы на летнее время.` : "Нет, разница постоянна: смещения обоих мест от UTC в течение года одинаковы." },
      ]
    : [
        { q: `What is the time difference between ${A} and ${B}?`, a: `${leadMain}.${seasonNote}` },
        { q: `What time is it in ${B} when it is 9:00 in ${A}?`, a: `${hm(540 + diff)}${dayNote(540 + diff, locale)}. See the full 24-hour table below.` },
        { q: "Does the difference change during the year?", a: seasonal ? `Yes: ${diffShort(dj, locale)} in January and ${diffShort(dl, locale)} in July, because one of the places observes daylight saving time.` : "No, it stays the same: both UTC offsets are constant all year." },
      ];

  /* chips: reverse, same origin, same destination */
  const reverse = pairLink(b.slug, a.slug, locale);
  const fromA: LinkItem[] = [];
  const toB: LinkItem[] = [];
  for (const [k, [x, y]] of PAIRS) {
    if (k === key) continue;
    if (x.slug === a.slug && y.slug !== a.slug) fromA.push({ path: ["time-zone-converter", k], label: `${name(x, locale)} → ${name(y, locale)}` });
    else if (y.slug === b.slug) toB.push({ path: ["time-zone-converter", k], label: `${name(x, locale)} → ${name(y, locale)}` });
  }
  const topBlocks: Block[] = [];
  const chips = [...(reverse ? [reverse] : []), ...fromA, ...toB.filter((l) => l.path[1] !== reverse?.path[1])].slice(0, 48);
  if (chips.length) topBlocks.push({ type: "links", title: ru ? "Другие пары городов" : "More city pairs", style: "chips", items: chips });

  const props: Omit<ConverterProps, "locale"> = {
    rows: [a, b].map((e) => (e.city ? clientCity(e.city, locale) : clientZone(e.zone!, locale))),
    withLocal: false,
  };

  const related: LinkItem[] = [
    { path: ["time-zone-converter"], label: ru ? "Конвертер часовых поясов" : "Time zone converter", icon: "ArrowLeftRight" },
    ...[a, b].map((e) =>
      e.city
        ? { path: ["time", e.city.slug], label: ru ? `Время ${cityIn(e.city, locale)}` : `Time ${cityIn(e.city, locale)}`, icon: "Clock" }
        : e.zone!.slug === "utc"
          ? { path: ["utc-time"], label: ru ? "Время UTC сейчас" : "Current UTC time", icon: "Globe" }
          : { path: ["time-zones", e.zone!.slug], label: ru ? `Часовой пояс ${name(e, locale)}` : `${name(e, locale)} time zone`, icon: "Globe" },
    ),
  ];

  return {
    path: ["time-zone-converter", key],
    sectionId: "time",
    kind: "variant",
    title: ru ? `${A} — ${B}: разница во времени и перевод` : `${A} to ${B} time — difference & converter`,
    h1: ru ? `Разница во времени: ${A} → ${B}` : `${A} to ${B} time`,
    description,
    lead,
    breadcrumbs: [home(locale), { name: ru ? "Конвертер часовых поясов" : "Time zone converter", path: ["time-zone-converter"] }],
    tool: { id: "time/convert", props },
    topBlocks,
    blocks: [
      {
        type: "facts",
        title: ru ? "Коротко" : "Quick facts",
        rows: [
          [ru ? "Разница сейчас" : "Difference now", diffShort(diff, locale)],
          [ru ? "В январе / в июле" : "January / July", `${diffShort(dj, locale)} / ${diffShort(dl, locale)}`],
          [A, a.city ? `${a.city.tz}, ${fmtOffset(offAt(a, BUILD_NOW))}` : fmtOffset(a.zone!.offset)],
          [B, b.city ? `${b.city.tz}, ${fmtOffset(offAt(b, BUILD_NOW))}` : fmtOffset(b.zone!.offset)],
        ],
      },
      { type: "table", title: ru ? `Таблица перевода времени: ${A} → ${B}` : `Conversion table: ${A} → ${B}`, head: [A, B], rows },
      { type: "text", paragraphs: [validity] },
    ],
    faq,
    related,
    schemaType: "WebApplication",
    icon: "ArrowLeftRight",
    hue: HUE,
  };
}
