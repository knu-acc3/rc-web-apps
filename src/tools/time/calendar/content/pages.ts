import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { ui } from "@/i18n/ui";
import type { Block, Crumb, LinkItem, PageModel, QA } from "@/registry/types";
import {
  addDays,
  cap,
  dayNumOf,
  daysInMonth,
  daysInYear,
  fmtDate,
  isLeap,
  isoWeekday,
  isoWeekMonday,
  isoWeeksInYear,
  MONTH_SLUGS,
  MONTHS,
  monthName,
  orthodoxEaster,
  westernEaster,
  WEEKDAYS,
  type Ymd,
} from "../lib/dates";
import { monthNorm, productionYear, yearNorm, type Holiday, type HolidayCountry } from "../lib/holidays";
import type { MonthCalendarProps } from "../MonthCalendar";
import type { ProductionCalendarProps } from "../ProductionCalendar";
import type { YearCalendarProps } from "../YearCalendar";

export const HUE = 215;
export const YEARS = range(2020, 2035);
export const MONTH_YEARS = range(2024, 2030);
export const WEEK_YEARS = range(2020, 2035);
export const PROD_YEARS: Record<HolidayCountry, number[]> = { ru: range(2024, 2030), kz: range(2026, 2030) };
export const COUNTRY_SLUG: Record<HolidayCountry, string> = { ru: "russia", kz: "kazakhstan" };

function range(a: number, b: number): number[] {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

/** Build year: only for the default view of /calendar and labels; pages are year-specific. */
const BUILD_YEAR = new Date().getFullYear();

const home = (locale: Locale): Crumb => ({ name: ui(locale).home, path: [] });
const calCrumb = (locale: Locale): Crumb => ({ name: locale === "ru" ? "Календарь" : "Calendar", path: ["calendar"] });
const wd = (locale: Locale, x: Ymd) => (locale === "ru" ? WEEKDAYS.ruShort : WEEKDAYS.enShort)[isoWeekday(x.y, x.m, x.d) - 1];
const wdLong = (locale: Locale, x: Ymd) => (locale === "ru" ? WEEKDAYS.ru : WEEKDAYS.en)[isoWeekday(x.y, x.m, x.d) - 1];
const n = (locale: Locale, v: number) => formatNumber(locale, v);
const countryName = (c: HolidayCountry, locale: Locale) => (locale === "ru" ? (c === "ru" ? "Россия" : "Казахстан") : c === "ru" ? "Russia" : "Kazakhstan");
const countryGen = (c: HolidayCountry) => (c === "ru" ? "России" : "Казахстана");
const days = (locale: Locale, v: number) => (locale === "ru" ? `${n(locale, v)} ${plural("ru", v, ["день", "дня", "дней"])}` : `${n(locale, v)} ${v === 1 ? "day" : "days"}`);
/** «247 рабочих дней», «21 будний день» */
const workDays = (locale: Locale, v: number) => (locale === "ru" ? `${n(locale, v)} ${plural("ru", v, ["рабочий день", "рабочих дня", "рабочих дней"])}` : `${n(locale, v)} working ${v === 1 ? "day" : "days"}`);
const offDays = (locale: Locale, v: number) => (locale === "ru" ? `${n(locale, v)} ${plural("ru", v, ["выходной и праздничный день", "выходных и праздничных дня", "выходных и праздничных дней"])}` : `${n(locale, v)} days off`);
const weekdaysRu = (v: number) => `${v} ${plural("ru", v, ["будний день", "будних дня", "будних дней"])}`;
const weeks = (locale: Locale, v: number) => (locale === "ru" ? `${v} ${plural("ru", v, ["неделя", "недели", "недель"])}` : `${v} weeks`);

/* ───────────── holiday tables ───────────── */

interface HolidayRun {
  from: Ymd;
  to: Ymd;
  name: string;
  expected: boolean;
}

function holidayRuns(list: Holiday[], locale: Locale): HolidayRun[] {
  const runs: HolidayRun[] = [];
  for (const h of list) {
    const name = h.name[locale];
    const last = runs[runs.length - 1];
    if (last && last.name === name && dayNumOf(h.ymd) === dayNumOf(last.to) + 1) last.to = h.ymd;
    else runs.push({ from: h.ymd, to: h.ymd, name, expected: !!h.expected });
  }
  return runs;
}

function runDate(locale: Locale, r: HolidayRun): string {
  if (r.from.d === r.to.d) return fmtDate(locale, r.from, false);
  return locale === "ru" ? `${r.from.d}–${r.to.d} ${MONTHS.ruGen[r.from.m - 1]}` : `${MONTHS.en[r.from.m - 1]} ${r.from.d}–${r.to.d}`;
}

function holidayTable(country: HolidayCountry, year: number, locale: Locale, month?: number): Block {
  const ru = locale === "ru";
  const list = productionYear(country, year).holidays.filter((h) => !month || h.ymd.m === month);
  const runs = holidayRuns(list, locale);
  return {
    type: "table",
    title: ru ? `Праздники ${countryGen(country)} в ${year} году` : `Public holidays in ${countryName(country, locale)}, ${year}`,
    head: ru ? ["Дата", "День недели", "Праздник"] : ["Date", "Weekday", "Holiday"],
    rows: runs.map((r) => [
      runDate(locale, r),
      r.from.d === r.to.d ? wd(locale, r.from) : `${wd(locale, r.from)}–${wd(locale, r.to)}`,
      `${r.name}${r.expected ? (ru ? " (ожидаемая дата)" : " (expected date)") : ""}`,
    ]),
  };
}

/* ───────────── /calendar ───────────── */

export function calendarToolPage(locale: Locale): PageModel {
  const ru = locale === "ru";
  const props: Omit<YearCalendarProps, "locale"> = { year: BUILD_YEAR, follow: true };
  return {
    path: ["calendar"],
    sectionId: "calendar",
    kind: "tool",
    title: ru ? "Календарь онлайн — год с праздниками и номерами недель" : "Calendar online — full year with holidays and week numbers",
    h1: ru ? "Календарь" : "Calendar",
    description: ru
      ? "Календарь на текущий год: 12 месяцев на одном экране, праздники России или Казахстана, номера недель ISO, сегодняшний день и печать. Годы с 2020 по 2035."
      : "Calendar for the current year: 12 months on one screen, Russian or Kazakh public holidays, ISO week numbers, today's date and printing. Years 2020 to 2035.",
    lead: ru ? "Все месяцы текущего года с праздниками и номерами недель." : "Every month of the current year with holidays and week numbers.",
    breadcrumbs: [home(locale)],
    tool: { id: "calendar/year", props },
    topBlocks: [yearChips(locale), productionChips(locale)],
    blocks: [
      {
        type: "text",
        title: ui(locale).about,
        paragraphs: ru
          ? [
              "Календарь показывает текущий год по дате вашего устройства и выделяет сегодняшний день. Стрелками можно перелистывать годы. Праздники отмечаются по производственному календарю России или Казахстана — страна выбирается автоматически по вашему часовому поясу, её можно сменить.",
              "Номера недель считаются по ISO 8601: неделя начинается в понедельник, первой считается неделя с первым четвергом года. Календарь можно распечатать — на листе останутся только месяцы.",
            ]
          : [
              "The calendar shows the current year from your device date and highlights today. Use the arrows to switch years. Public holidays follow the official calendar of Russia or Kazakhstan — picked from your time zone, and you can change it.",
              "Week numbers follow ISO 8601: weeks start on Monday and week 1 contains the first Thursday of the year. Print the calendar and only the months end up on paper.",
            ],
      },
    ],
    howTo: ru
      ? ["Откройте страницу — сразу виден текущий год, сегодняшний день выделен рамкой.", "Выберите, праздники какой страны отмечать: России, Казахстана или никакой.", "Включите номера недель, если они нужны, и нажмите «Печать», чтобы распечатать год."]
      : ["Open the page — the current year is shown and today is outlined.", "Choose whose holidays to mark: Russia, Kazakhstan or none.", "Turn on week numbers if you need them and press Print to print the year."],
    faq: ru
      ? [
          { q: "С какого дня начинается неделя в календаре?", a: "С понедельника, как принято в России, Казахстане и по стандарту ISO 8601." },
          { q: "Откуда берутся праздники?", a: "Из законов о праздниках России и Казахстана и официальных переносов выходных. Для лет, где переносы ещё не утверждены или нам не известны, это указано на странице производственного календаря." },
          { q: "Можно ли посмотреть другой год?", a: "Да: перелистывайте стрелками или откройте страницу нужного года — есть календари с 2020 по 2035 год." },
        ]
      : [
          { q: "Which day does the week start on?", a: "Monday, following ISO 8601 and the convention in Russia and Kazakhstan." },
          { q: "Where do the holidays come from?", a: "From the public-holiday laws of Russia and Kazakhstan and official day-off transfers. Where transfers are not approved or not known to us, the production-calendar page says so." },
          { q: "Can I see another year?", a: "Yes: use the arrows or open a year page — calendars from 2020 to 2035 are available." },
        ],
    related: relatedLinks(locale, ["week-number", "production-calendar"]),
    schemaType: "WebApplication",
    icon: "CalendarDays",
    hue: HUE,
    wide: true,
  };
}

function yearChips(locale: Locale, exclude?: number): Block {
  return { type: "links", title: locale === "ru" ? "Календарь по годам" : "Calendar by year", style: "chips", items: YEARS.filter((y) => y !== exclude).map((y) => ({ path: ["calendar", String(y)], label: String(y) })) };
}

function productionChips(locale: Locale): Block {
  const items: LinkItem[] = [];
  for (const c of ["ru", "kz"] as HolidayCountry[]) for (const y of PROD_YEARS[c]) items.push({ path: ["production-calendar", `${COUNTRY_SLUG[c]}-${y}`], label: `${countryName(c, locale)} ${y}` });
  return { type: "links", title: locale === "ru" ? "Производственный календарь" : "Working-day calendar", style: "chips", items };
}

function relatedLinks(locale: Locale, keys: string[]): LinkItem[] {
  const ru = locale === "ru";
  const all: Record<string, LinkItem> = {
    calendar: { path: ["calendar"], label: ru ? "Календарь" : "Calendar", hint: ru ? "Год с праздниками и номерами недель" : "Year with holidays and week numbers", icon: "CalendarDays", hue: HUE },
    "week-number": { path: ["week-number"], label: ru ? "Номер недели" : "Week number", hint: ru ? "Какая сейчас неделя по ISO 8601" : "What ISO week it is now", icon: "CalendarRange", hue: HUE },
    "production-calendar": { path: ["production-calendar"], label: ru ? "Производственный календарь" : "Working-day calendar", hint: ru ? "Рабочие дни и нормы часов России и Казахстана" : "Working days and hours in Russia and Kazakhstan", icon: "Briefcase", hue: HUE },
  };
  return keys.map((k) => all[k]).filter(Boolean);
}

/* ───────────── /calendar/{year} ───────────── */

export function yearPage(year: number, locale: Locale): PageModel {
  const ru = locale === "ru";
  const jan1 = { y: year, m: 1, d: 1 };
  const dec31 = { y: year, m: 12, d: 31 };
  const leap = isLeap(year);
  const w = isoWeeksInYear(year);
  const oe = orthodoxEaster(year);
  const we = westernEaster(year);
  const nextLeap = range(year + 1, year + 8).find(isLeap)!;

  const facts: [string, string][] = [
    [ru ? "Дней в году" : "Days in the year", `${days(locale, daysInYear(year))}${ru ? (leap ? " (високосный)" : " (невисокосный)") : leap ? " (leap year)" : ""}`],
    [ru ? "Начинается" : "Starts on", ru ? `в ${WEEKDAYS.ruAcc[isoWeekday(year, 1, 1) - 1]}, 1 января` : `${wdLong(locale, jan1)}, January 1`],
    [ru ? "Заканчивается" : "Ends on", ru ? `в ${WEEKDAYS.ruAcc[isoWeekday(year, 12, 31) - 1]}, 31 декабря` : `${wdLong(locale, dec31)}, December 31`],
    [ru ? "Недель по ISO 8601" : "ISO 8601 weeks", String(w)],
    [ru ? "Пасха (православная)" : "Orthodox Easter", fmtDate(locale, oe, false)],
    [ru ? "Пасха (католическая)" : "Western Easter", fmtDate(locale, we, false)],
  ];
  for (const c of ["ru", "kz"] as HolidayCountry[]) {
    if (!PROD_YEARS[c].includes(year)) continue;
    const yn = yearNorm(c, year);
    facts.push([ru ? `Рабочих дней (${countryName(c, locale)})` : `Working days (${countryName(c, locale)})`, `${n(locale, yn.workDays)}${productionYear(c, year).decree === "known" ? "" : ru ? " — без переносов по постановлению" : " — without decree transfers"}`]);
  }

  const monthChips: LinkItem[] = MONTH_YEARS.includes(year) ? MONTH_SLUGS.map((s, i) => ({ path: ["calendar", String(year), s], label: monthName(locale, i + 1) })) : [];
  const topBlocks: Block[] = [];
  if (monthChips.length) topBlocks.push({ type: "links", title: ru ? `Месяцы ${year} года` : `Months of ${year}`, style: "chips", items: monthChips });
  topBlocks.push(yearChips(locale, year));
  const prodLinks = (["ru", "kz"] as HolidayCountry[]).filter((c) => PROD_YEARS[c].includes(year)).map((c) => ({ path: ["production-calendar", `${COUNTRY_SLUG[c]}-${year}`], label: ru ? `Производственный календарь ${year}: ${countryName(c, locale)}` : `${countryName(c, locale)} working-day calendar ${year}` }));
  if (prodLinks.length) topBlocks.push({ type: "links", title: ru ? "Рабочие дни и нормы часов" : "Working days and hours", style: "chips", items: prodLinks });

  const faq: QA[] = ru
    ? [
        { q: `Сколько дней в ${year} году?`, a: `${cap(days(locale, daysInYear(year)))}: ${year} год ${leap ? "високосный, в феврале 29 дней" : `невисокосный, в феврале 28 дней. Ближайший високосный — ${nextLeap}`}.` },
        { q: `С какого дня недели начинается ${year} год?`, a: `1 января ${year} года — ${WEEKDAYS.ru[isoWeekday(year, 1, 1) - 1]}, а 31 декабря — ${WEEKDAYS.ru[isoWeekday(year, 12, 31) - 1]}.` },
        { q: `Сколько недель в ${year} году?`, a: `По ISO 8601 в ${year} году ${weeks(locale, w)}: первая начинается ${fmtDate(locale, isoWeekMonday(year, 1))}, последняя заканчивается ${fmtDate(locale, addDays(isoWeekMonday(year, w), 6))}.` },
        { q: `Когда Пасха в ${year} году?`, a: `Православная Пасха — ${fmtDate(locale, oe, false)}, католическая — ${fmtDate(locale, we, false)}${oe.m === we.m && oe.d === we.d ? " (в этом году они совпадают)" : ""}.` },
      ]
    : [
        { q: `How many days are in ${year}?`, a: `${daysInYear(year)}: ${year} is ${leap ? "a leap year with 29 days in February" : `a common year with 28 days in February. The next leap year is ${nextLeap}`}.` },
        { q: `What day of the week does ${year} start on?`, a: `January 1, ${year} is a ${wdLong(locale, jan1)}, and December 31 is a ${wdLong(locale, dec31)}.` },
        { q: `How many weeks are in ${year}?`, a: `${year} has ${w} ISO weeks: week 1 starts on ${fmtDate(locale, isoWeekMonday(year, 1))} and the last week ends on ${fmtDate(locale, addDays(isoWeekMonday(year, w), 6))}.` },
        { q: `When is Easter in ${year}?`, a: `Orthodox Easter is on ${fmtDate(locale, oe, false)}, Western Easter on ${fmtDate(locale, we, false)}${oe.m === we.m && oe.d === we.d ? " (the same day this year)" : ""}.` },
      ];

  const props: Omit<YearCalendarProps, "locale"> = {
    year,
    prev: YEARS.includes(year - 1) ? ["calendar", String(year - 1)] : null,
    next: YEARS.includes(year + 1) ? ["calendar", String(year + 1)] : null,
  };
  return {
    path: ["calendar", String(year)],
    sectionId: "calendar",
    kind: "variant",
    title: ru ? `Календарь на ${year} год — с праздниками и номерами недель` : `${year} calendar — with holidays and week numbers`,
    h1: ru ? `Календарь на ${year} год` : `${year} calendar`,
    description: ru
      ? `Календарь на ${year} год: ${days(locale, daysInYear(year))}, начинается в ${WEEKDAYS.ruAcc[isoWeekday(year, 1, 1) - 1]}, ${weeks(locale, w)}. Праздники России и Казахстана, номера недель, Пасха ${fmtDate(locale, oe, false)}; печать.`
      : `${year} calendar: ${daysInYear(year)} days, starts on a ${wdLong(locale, jan1)}, ${w} ISO weeks. Public holidays of Russia and Kazakhstan, week numbers, Easter dates; printable.`,
    lead: ru ? `${cap(String(year))} год — ${leap ? "високосный" : "невисокосный"}, ${days(locale, daysInYear(year))}, ${weeks(locale, w)}.` : `${year} is ${leap ? "a leap year" : "a common year"}: ${daysInYear(year)} days, ${w} ISO weeks.`,
    breadcrumbs: [home(locale), calCrumb(locale)],
    tool: { id: "calendar/year", props },
    topBlocks,
    blocks: [{ type: "facts", title: ru ? "Коротко" : "Quick facts", rows: facts }, holidayTable("ru", year, locale), holidayTable("kz", year, locale)],
    faq,
    related: relatedLinks(locale, ["calendar", "week-number", "production-calendar"]),
    schemaType: "WebPage",
    icon: "CalendarDays",
    hue: HUE,
    wide: true,
  };
}

/* ───────────── /calendar/{year}/{month} ───────────── */

export function monthPage(year: number, month: number, locale: Locale): PageModel {
  const ru = locale === "ru";
  const dim = daysInMonth(year, month);
  let weekdays = 0;
  for (let d = 1; d <= dim; d++) if (isoWeekday(year, month, d) <= 5) weekdays++;
  const mName = monthName(locale, month);
  const mLow = MONTHS.ru[month - 1];
  const first = { y: year, m: month, d: 1 };
  const facts: [string, string][] = [
    [ru ? "Дней в месяце" : "Days in the month", String(dim)],
    [ru ? "Будних дней (пн–пт)" : "Weekdays (Mon–Fri)", String(weekdays)],
    [ru ? "Суббот и воскресений" : "Saturdays and Sundays", String(dim - weekdays)],
    [ru ? "Первый день" : "First day", wdLong(locale, first)],
  ];
  const normFacts: string[] = [];
  for (const c of ["ru", "kz"] as HolidayCountry[]) {
    const mn = monthNorm(c, year, month);
    const known = productionYear(c, year).decree === "known";
    facts.push([
      ru ? `Рабочих дней (${countryName(c, locale)})` : `Working days (${countryName(c, locale)})`,
      `${mn.workDays}${c === "ru" ? (ru ? `, ${formatNumber(locale, mn.hours40)} ч` : `, ${formatNumber(locale, mn.hours40)} h`) : ""}${known ? "" : ru ? " (без переносов по постановлению)" : " (without decree transfers)"}`,
    ]);
    normFacts.push(ru ? `${countryName(c, locale)} — ${mn.workDays}` : `${countryName(c, locale)} ${mn.workDays}`);
  }
  const ruHol = holidayRuns(productionYear("ru", year).holidays.filter((h) => h.ymd.m === month), locale);
  const kzHol = holidayRuns(productionYear("kz", year).holidays.filter((h) => h.ymd.m === month), locale);
  const holText = (runs: HolidayRun[]) => (runs.length ? runs.map((r) => `${runDate(locale, r)} — ${r.name}`).join("; ") : ru ? "нет" : "none");

  const siblings: LinkItem[] = MONTH_SLUGS.map((s, i) => ({ path: ["calendar", String(year), s], label: monthName(locale, i + 1) })).filter((_, i) => i + 1 !== month);
  const sameMonth: LinkItem[] = MONTH_YEARS.filter((y) => y !== year).map((y) => ({ path: ["calendar", String(y), MONTH_SLUGS[month - 1]], label: `${mName} ${y}` }));
  const prevM = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const nextM = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const props: Omit<MonthCalendarProps, "locale"> = {
    year,
    month,
    prev: MONTH_YEARS.includes(prevM.y) ? ["calendar", String(prevM.y), MONTH_SLUGS[prevM.m - 1]] : null,
    next: MONTH_YEARS.includes(nextM.y) ? ["calendar", String(nextM.y), MONTH_SLUGS[nextM.m - 1]] : null,
  };
  const ruN = monthNorm("ru", year, month);
  const kzN = monthNorm("kz", year, month);

  return {
    path: ["calendar", String(year), MONTH_SLUGS[month - 1]],
    sectionId: "calendar",
    kind: "variant",
    title: ru ? `Календарь на ${mLow} ${year} года — праздники и рабочие дни` : `${mName} ${year} calendar — holidays and working days`,
    h1: ru ? `Календарь на ${mLow} ${year}` : `${mName} ${year} calendar`,
    description: ru
      ? `Календарь на ${mLow} ${year} года: ${days(locale, dim)}, начинается в ${WEEKDAYS.ruAcc[isoWeekday(year, month, 1) - 1]}, ${weekdaysRu(weekdays)}. Рабочих дней: Россия — ${ruN.workDays}, Казахстан — ${kzN.workDays}. Праздники, номера недель, печать.`
      : `${mName} ${year} calendar: ${dim} days, starts on a ${wdLong(locale, first)}, ${weekdays} weekdays. Working days: Russia ${ruN.workDays}, Kazakhstan ${kzN.workDays}. Holidays, week numbers, printable.`,
    lead: ru ? `В ${MONTHS.ruPrep[month - 1]} ${year} года ${days(locale, dim)}; рабочих дней: ${normFacts.join(", ")}.` : `${mName} ${year} has ${dim} days; working days: ${normFacts.join(", ")}.`,
    breadcrumbs: [home(locale), calCrumb(locale), { name: ru ? `Календарь на ${year} год` : `${year} calendar`, path: ["calendar", String(year)] }],
    tool: { id: "calendar/month", props },
    topBlocks: [
      { type: "links", title: ru ? `Другие месяцы ${year} года` : `Other months of ${year}`, style: "chips", items: siblings },
      { type: "links", title: ru ? `${mName} в другие годы` : `${mName} in other years`, style: "chips", items: sameMonth },
    ],
    blocks: [{ type: "facts", title: ru ? "Коротко" : "Quick facts", rows: facts }],
    faq: ru
      ? [
          { q: `Сколько рабочих дней в ${MONTHS.ruPrep[month - 1]} ${year} года?`, a: `В России — ${workDays(locale, ruN.workDays)} (${formatNumber(locale, ruN.hours40)} ч при 40-часовой неделе), в Казахстане — ${workDays(locale, kzN.workDays)}.${productionYear("ru", year).decree === "known" ? "" : " Для России переносы выходных по постановлению Правительства в расчёт не включены."}${productionYear("kz", year).decree === "known" ? "" : " Для Казахстана переносы по постановлению Правительства не учитываются."}` },
          { q: `Какие праздники в ${MONTHS.ruPrep[month - 1]} ${year} года?`, a: `Россия: ${holText(ruHol)}. Казахстан: ${holText(kzHol)}.` },
          { q: `С какого дня недели начинается ${mLow} ${year} года?`, a: `1 ${MONTHS.ruGen[month - 1]} ${year} года — ${WEEKDAYS.ru[isoWeekday(year, month, 1) - 1]}, последний день месяца — ${WEEKDAYS.ru[isoWeekday(year, month, dim) - 1]}.` },
        ]
      : [
          { q: `How many working days are in ${mName} ${year}?`, a: `Russia: ${ruN.workDays} (${formatNumber(locale, ruN.hours40)} hours on a 40-hour week); Kazakhstan: ${kzN.workDays}.${productionYear("ru", year).decree === "known" ? "" : " Russian decree transfers are not included."}${productionYear("kz", year).decree === "known" ? "" : " Kazakh decree transfers are not included."}` },
          { q: `What holidays are in ${mName} ${year}?`, a: `Russia: ${holText(ruHol)}. Kazakhstan: ${holText(kzHol)}.` },
          { q: `What day does ${mName} ${year} start on?`, a: `${mName} 1, ${year} is a ${wdLong(locale, first)}; the last day of the month is a ${wdLong(locale, { y: year, m: month, d: dim })}.` },
        ],
    related: relatedLinks(locale, ["calendar", "week-number", "production-calendar"]),
    schemaType: "WebPage",
    icon: "CalendarDays",
    hue: HUE,
  };
}

/* ───────────── /week-number ───────────── */

export function weekToolPage(locale: Locale): PageModel {
  const ru = locale === "ru";
  return {
    path: ["week-number"],
    sectionId: "calendar",
    kind: "tool",
    title: ru ? "Номер недели сейчас — какая сегодня неделя" : "Week number today — what week is it now",
    h1: ru ? "Номер недели сейчас" : "What week is it",
    description: ru
      ? "Какая сейчас неделя по ISO 8601: номер текущей недели, её даты с понедельника по воскресенье и число недель в году. Номер недели для любой даты и таблицы недель на 2020–2035 годы."
      : "What week it is by ISO 8601: the current week number, its dates from Monday to Sunday and the number of weeks in the year. Week number of any date and week tables for 2020–2035.",
    lead: ru ? "Номер текущей недели по ISO 8601 и её даты." : "The current ISO 8601 week number and its dates.",
    breadcrumbs: [home(locale)],
    tool: { id: "calendar/week" },
    topBlocks: [{ type: "links", title: ru ? "Номера недель по годам" : "Week numbers by year", style: "chips", items: WEEK_YEARS.map((y) => ({ path: ["week-number", String(y)], label: String(y) })) }],
    blocks: [
      {
        type: "text",
        title: ui(locale).about,
        paragraphs: ru
          ? [
              "Номер недели считается по международному стандарту ISO 8601, который используют в России, Казахстане и Европе: неделя начинается в понедельник, а первой неделей года считается та, в которую попадает первый четверг января (или, что то же самое, 4 января).",
              "Поэтому 1–3 января иногда относятся к последней неделе прошлого года, а 29–31 декабря — к первой неделе следующего. В году 52 или 53 недели.",
            ]
          : [
              "Week numbers follow the international standard ISO 8601, used in Europe, Russia and Kazakhstan: weeks start on Monday and week 1 is the week with the first Thursday of January (equivalently, January 4).",
              "That is why January 1–3 sometimes belong to the last week of the previous year and December 29–31 to week 1 of the next. A year has 52 or 53 weeks.",
            ],
      },
    ],
    howTo: ru
      ? ["Номер текущей недели виден сразу, крупно, вместе с датами понедельника и воскресенья.", "Чтобы узнать неделю другой даты, выберите её в поле ниже — ответ появится мгновенно.", "Полные таблицы недель по годам — в ссылках под инструментом."]
      : ["The current week number is shown right away with its Monday and Sunday dates.", "To find the week of another date, pick it below — the answer appears instantly.", "Full week tables by year are linked below the tool."],
    faq: ru
      ? [
          { q: "Как считается номер недели?", a: "По ISO 8601: неделя начинается в понедельник, неделя № 1 содержит первый четверг года. Так же нумеруют недели в Excel (функция НОМНЕДЕЛИ.ISO) и в большинстве календарей." },
          { q: "Почему 1 января может быть 53-й неделей?", a: "Если 1 января приходится на пятницу, субботу или воскресенье, эти дни относятся к последней неделе предыдущего года. Например, 3 января 2027 года — это 53-я неделя 2026 года." },
          { q: "Сколько недель в году?", a: "52 или 53. Год содержит 53 недели, если начинается в четверг или если он високосный и начинается в среду." },
        ]
      : [
          { q: "How is the week number calculated?", a: "By ISO 8601: weeks start on Monday and week 1 contains the first Thursday of the year. Excel's ISOWEEKNUM and most calendars use the same rule." },
          { q: "Why can January 1 be in week 53?", a: "If January 1 falls on a Friday, Saturday or Sunday, those days belong to the last week of the previous year. For example, January 3, 2027 is in week 53 of 2026." },
          { q: "How many weeks are in a year?", a: "52 or 53. A year has 53 weeks if it starts on a Thursday, or if it is a leap year starting on a Wednesday." },
        ],
    related: relatedLinks(locale, ["calendar", "production-calendar"]),
    schemaType: "WebApplication",
    icon: "CalendarRange",
    hue: HUE,
  };
}

export function weekYearPage(year: number, locale: Locale): PageModel {
  const ru = locale === "ru";
  const w = isoWeeksInYear(year);
  const rows: string[][] = [];
  for (let k = 1; k <= w; k++) {
    const mon = isoWeekMonday(year, k);
    const sun = addDays(mon, 6);
    rows.push([String(k), fmtDate(locale, mon, mon.y !== year), fmtDate(locale, sun, sun.y !== year)]);
  }
  const first = isoWeekMonday(year, 1);
  const lastSun = addDays(isoWeekMonday(year, w), 6);
  return {
    path: ["week-number", String(year)],
    sectionId: "calendar",
    kind: "variant",
    title: ru ? `Номера недель ${year} года — все ${w} ${plural("ru", w, ["неделя", "недели", "недель"])} по датам` : `Week numbers ${year} — all ${w} ISO weeks with dates`,
    h1: ru ? `Номера недель в ${year} году` : `Week numbers ${year}`,
    description: ru
      ? `Номера недель ${year} года по ISO 8601: ${weeks(locale, w)}, первая начинается ${fmtDate(locale, first)}, последняя заканчивается ${fmtDate(locale, lastSun)}. Таблица с датами понедельника и воскресенья.`
      : `ISO 8601 week numbers for ${year}: ${w} weeks, week 1 starts on ${fmtDate(locale, first)} and the last week ends on ${fmtDate(locale, lastSun)}. Table with Monday and Sunday dates.`,
    lead: ru ? `В ${year} году ${weeks(locale, w)} по ISO 8601.` : `${year} has ${w} ISO 8601 weeks.`,
    breadcrumbs: [home(locale), { name: ru ? "Номер недели" : "Week number", path: ["week-number"] }],
    tool: { id: "calendar/week" },
    topBlocks: [{ type: "links", title: ru ? "Другие годы" : "Other years", style: "chips", items: WEEK_YEARS.filter((y) => y !== year).map((y) => ({ path: ["week-number", String(y)], label: String(y) })) }],
    blocks: [
      {
        type: "facts",
        title: ru ? "Коротко" : "Quick facts",
        rows: [
          [ru ? "Недель в году" : "Weeks in the year", String(w)],
          [ru ? "Неделя № 1" : "Week 1", `${fmtDate(locale, first)} — ${fmtDate(locale, addDays(first, 6))}`],
          [ru ? `Неделя № ${w}` : `Week ${w}`, `${fmtDate(locale, isoWeekMonday(year, w))} — ${fmtDate(locale, lastSun)}`],
          [ru ? "1 января" : "January 1", ru ? `${WEEKDAYS.ru[isoWeekday(year, 1, 1) - 1]}, неделя ${isoWeekOf(year, 1, 1)}` : `${wdLong(locale, { y: year, m: 1, d: 1 })}, week ${isoWeekOf(year, 1, 1)}`],
        ],
      },
      { type: "table", title: ru ? `Недели ${year} года` : `Weeks of ${year}`, head: ru ? ["Неделя", "Понедельник", "Воскресенье"] : ["Week", "Monday", "Sunday"], rows },
    ],
    faq: ru
      ? [
          { q: `Сколько недель в ${year} году?`, a: `${cap(weeks(locale, w))}. ${w === 53 ? `53 недели бывают, когда год начинается в четверг или високосный год начинается в среду.` : "Большинство лет содержат 52 недели."}` },
          { q: `Когда начинается первая неделя ${year} года?`, a: `${cap(fmtDate(locale, first))} (понедельник). ${first.y < year ? `Дни с 1 января до этой даты не входят в неделю № 1 — они относятся к последней неделе ${year - 1} года.` : ""}`.trim() },
        ]
      : [
          { q: `How many weeks are in ${year}?`, a: `${w}. ${w === 53 ? "A year has 53 weeks when it starts on a Thursday, or is a leap year starting on a Wednesday." : "Most years have 52 weeks."}` },
          { q: `When does week 1 of ${year} start?`, a: `On ${fmtDate(locale, first)} (Monday).` },
        ],
    related: relatedLinks(locale, ["week-number", "calendar"]),
    schemaType: "WebPage",
    icon: "CalendarRange",
    hue: HUE,
  };
}

function isoWeekOf(y: number, m: number, d: number): string {
  const mon = isoWeekMonday(y, 1);
  if (dayNumOf({ y, m, d }) < dayNumOf(mon)) return `${isoWeeksInYear(y - 1)} (${y - 1})`;
  return String(Math.floor((dayNumOf({ y, m, d }) - dayNumOf(mon)) / 7) + 1);
}

/* ───────────── /production-calendar ───────────── */

function allProd(): { country: HolidayCountry; year: number; path: string[] }[] {
  const out: { country: HolidayCountry; year: number; path: string[] }[] = [];
  for (const c of ["ru", "kz"] as HolidayCountry[]) for (const y of PROD_YEARS[c]) out.push({ country: c, year: y, path: ["production-calendar", `${COUNTRY_SLUG[c]}-${y}`] });
  return out;
}

export function productionHub(locale: Locale): PageModel {
  const ru = locale === "ru";
  const year = PROD_YEARS.ru.includes(BUILD_YEAR) ? BUILD_YEAR : PROD_YEARS.ru[PROD_YEARS.ru.length - 1];
  const props: Omit<ProductionCalendarProps, "locale"> = { country: "ru", year, others: allProd() };
  return {
    path: ["production-calendar"],
    sectionId: "calendar",
    kind: "tool",
    title: ru ? "Производственный календарь России и Казахстана | рабочие дни и праздники" : "Working-day calendar of Russia and Kazakhstan | holidays and workdays",
    h1: ru ? "Производственный календарь" : "Working-day calendar",
    description: ru
      ? `Производственные календари России на ${PROD_YEARS.ru[0]}–${PROD_YEARS.ru[PROD_YEARS.ru.length - 1]} годы и Казахстана на ${PROD_YEARS.kz[0]}–${PROD_YEARS.kz[PROD_YEARS.kz.length - 1]}: праздники, переносы выходных, сокращённые дни, рабочие дни и нормы часов по месяцам.`
      : `Working-day calendars of Russia for ${PROD_YEARS.ru[0]}–${PROD_YEARS.ru[PROD_YEARS.ru.length - 1]} and Kazakhstan for ${PROD_YEARS.kz[0]}–${PROD_YEARS.kz[PROD_YEARS.kz.length - 1]}: public holidays, moved days off, shortened days, working days and hours per month.`,
    lead: ru ? "Праздники, переносы и нормы рабочего времени по месяцам." : "Holidays, moved days off and working-time norms by month.",
    breadcrumbs: [home(locale)],
    tool: { id: "calendar/production", props },
    blocks: [
      {
        type: "text",
        title: ui(locale).about,
        paragraphs: ru
          ? [
              "Производственный календарь показывает, какие дни в году рабочие, а какие — выходные и праздничные, с учётом переносов. По нему считают норму рабочего времени, зарплату, отпускные и больничные.",
              "Для России учтены праздники по статье 112 Трудового кодекса, перенос выходного, совпавшего с праздником, и постановления Правительства о переносе выходных за годы, для которых они известны. Предпраздничные дни сокращены на час.",
              "Для Казахстана учтены праздники по закону «О праздниках в Республике Казахстан» и перенос выходного, совпавшего с праздником, на следующий рабочий день. Дополнительные переносы, которые Правительство РК утверждает отдельным постановлением, в календарь не включены — сверяйтесь с постановлением на нужный год.",
            ]
          : [
              "A working-day (production) calendar shows which days of the year are working days and which are weekends or public holidays, including moved days off. It is used to calculate working-time norms, salaries and leave pay.",
              "For Russia it includes holidays under Article 112 of the Labour Code, the rule that moves a day off falling on a holiday, and government decrees moving days off for the years where they are known. Pre-holiday days are one hour shorter.",
              "For Kazakhstan it includes holidays under the law on public holidays and the rule that moves a day off to the next working day. Additional transfers approved by separate government decrees are not included — check the decree for the year.",
            ],
      },
    ],
    faq: ru
      ? [
          { q: "Что такое норма рабочего времени?", a: "Количество часов, которое работник должен отработать за месяц или год при 40-, 36- или 24-часовой неделе. В России её считают по производственному календарю: рабочие дни × 8 ч минус по часу за каждый предпраздничный день." },
          { q: "Почему переносят выходные?", a: "Когда праздник совпадает с выходным, выходной переносится на следующий рабочий день. Кроме того, правительство переносит выходные, чтобы сделать длинные праздники без «разрывов»." },
          { q: "Есть ли в Казахстане сокращённые предпраздничные дни?", a: "В этом календаре для Казахстана норма часов считается как рабочие дни × 8 часов (40-часовая неделя), без сокращения предпраздничных дней." },
        ]
      : [
          { q: "What is the working-time norm?", a: "The number of hours an employee must work in a month or year on a 40-, 36- or 24-hour week. In Russia it equals working days × 8 h minus one hour for each pre-holiday day." },
          { q: "Why are days off moved?", a: "When a public holiday falls on a weekend, the day off moves to the next working day. Governments also move days off to create longer holiday breaks." },
          { q: "Are pre-holiday days shorter in Kazakhstan?", a: "In this calendar the Kazakh norm is working days × 8 hours (40-hour week), without shortened pre-holiday days." },
        ],
    related: relatedLinks(locale, ["calendar", "week-number"]),
    schemaType: "WebApplication",
    icon: "Briefcase",
    hue: HUE,
    wide: true,
  };
}

export function productionPage(country: HolidayCountry, year: number, locale: Locale): PageModel {
  const ru = locale === "ru";
  const py = productionYear(country, year);
  const yn = yearNorm(country, year);
  const cn = countryName(country, locale);
  const isRu = country === "ru";
  const months = Array.from({ length: 12 }, (_, i) => monthNorm(country, year, i + 1));
  const known = py.decree === "known";

  const head = ru
    ? ["Месяц", "Календарных", "Рабочих", "Выходных", ...(isRu ? ["40 ч", "36 ч", "24 ч"] : ["Часов (40 ч/нед.)"])]
    : ["Month", "Calendar days", "Working", "Days off", ...(isRu ? ["40 h", "36 h", "24 h"] : ["Hours (40 h/week)"])];
  const num = (v: number) => formatNumber(locale, v);
  const normRows = months.map((m) => [monthName(locale, m.month), num(m.calendarDays), num(m.workDays), num(m.offDays), ...(isRu ? [num(m.hours40), num(m.hours36), num(m.hours24)] : [num(m.hours40)])]);
  normRows.push([ru ? "Год" : "Year", num(yn.calendarDays), num(yn.workDays), num(yn.offDays), ...(isRu ? [num(yn.hours40), num(yn.hours36), num(yn.hours24)] : [num(yn.hours40)])]);

  const transfers = py.transfers.map((t) => {
    const h = py.holidayOn(t.from);
    const from = fmtDate(locale, t.from, false);
    const to = fmtDate(locale, t.to, false);
    const reason = t.auto
      ? ru
        ? `праздник «${h?.name.ru}» выпал на ${WEEKDAYS.ruAcc[isoWeekday(t.from.y, t.from.m, t.from.d) - 1]}`
        : `the holiday "${h?.name.en}" fell on a ${wdLong(locale, t.from)}`
      : h
        ? ru
          ? "постановление Правительства (январский выходной)"
          : "government decree (January day off)"
        : ru
          ? `постановление Правительства: ${from} — рабочий день`
          : `government decree: ${from} is a working day`;
    return [ru ? `${from} → ${to}` : `${from} → ${to}`, reason];
  });
  const shorts: string[] = [];
  if (isRu) {
    for (let m = 1; m <= 12; m++)
      for (let d = 1; d <= daysInMonth(year, m); d++) if (py.type({ y: year, m, d }) === "short") shorts.push(fmtDate(locale, { y: year, m, d }, false));
  }

  const note = isRu
    ? known
      ? ru
        ? `Переносы выходных в ${year} году — по постановлению Правительства РФ; учтены праздники по ст. 112 Трудового кодекса и сокращённые предпраздничные дни.`
        : `Moved days off in ${year} follow the Russian government decree; holidays under Article 112 of the Labour Code and shortened pre-holiday days are included.`
      : ru
        ? `Постановление Правительства о переносе выходных на ${year} год в этот календарь не включено: учтены только праздники по ст. 112 Трудового кодекса и автоматический перенос выходного, совпавшего с праздником (кроме январских). Январские выходные, совпавшие с праздниками, правительство переносит отдельным постановлением — после его учёта число рабочих дней может измениться.`
        : `The government decree moving days off in ${year} is not included: only holidays under Article 112 of the Labour Code and the automatic move of a day off that coincides with a holiday (except in January) are applied. January days off are moved by a separate decree, which can change the number of working days.`
    : ru
      ? `Учтены праздники по закону «О праздниках в Республике Казахстан» и перенос выходного, совпавшего с праздником, на следующий рабочий день (для религиозных праздников перенос не делается). ${known ? `Других переносов по постановлению Правительства РК в ${year} году нет.` : `Дополнительные переносы рабочих дней по постановлению Правительства РК на ${year} год не включены — проверьте постановление перед расчётом зарплаты.`}${year === 2026 ? " В 2026 году День Конституции не отмечается: с 1 июля 2026 года он перенесён с 30 августа на 15 марта (Закон РК от 11.06.2026 № 306-VIII), поэтому 31 августа — рабочий день." : year > 2026 ? " День Конституции — 15 марта. Дата Курбан айта — ожидаемая: её объявляет Духовное управление мусульман Казахстана." : ""}`
      : `Includes holidays under the Law on Public Holidays of Kazakhstan and the move of a day off that coincides with a holiday to the next working day (not for religious holidays). ${known ? `There are no other government transfers in ${year}.` : `Additional transfers by government decree for ${year} are not included — check the decree before payroll calculations.`}${year === 2026 ? " Constitution Day is not observed in 2026: from 1 July 2026 it moved from August 30 to March 15 (Law No. 306-VIII of 11.06.2026), so August 31 is a working day." : year > 2026 ? " Constitution Day is on March 15. The Kurban Ait date is expected; it is announced by the Spiritual Administration of Muslims of Kazakhstan." : ""}`;

  const blocks: Block[] = [
    { type: "table", title: ru ? `Нормы рабочего времени на ${year} год` : `Working-time norms for ${year}`, head, rows: normRows },
    holidayTable(country, year, locale),
  ];
  if (transfers.length) blocks.push({ type: "table", title: ru ? "Переносы выходных" : "Moved days off", head: ru ? ["Перенос", "Причина"] : ["Move", "Reason"], rows: transfers });
  if (shorts.length) blocks.push({ type: "text", title: ru ? "Сокращённые предпраздничные дни" : "Shortened pre-holiday days", paragraphs: [ru ? `${shorts.join(", ")} — рабочий день короче на 1 час.` : `${shorts.join(", ")} — the working day is one hour shorter.`] });
  blocks.push({ type: "text", title: ru ? "Что учтено" : "What is included", paragraphs: [note] });

  const others = allProd().filter((o) => !(o.country === country && o.year === year));
  const faq: QA[] = ru
    ? [
        { q: `Сколько рабочих дней в ${year} году${isRu ? "" : " в Казахстане"}?`, a: `${cap(workDays(locale, yn.workDays))} и ${offDays(locale, yn.offDays)}${isRu ? `; норма при 40-часовой неделе — ${num(yn.hours40)} ч, при 36-часовой — ${num(yn.hours36)} ч` : `; норма при 40-часовой неделе — ${num(yn.hours40)} ч`}.${known ? "" : " Переносы по постановлению Правительства не учтены."}` },
        { q: `Какие праздники в ${year} году?`, a: holidayRuns(py.holidays, locale).map((r) => `${runDate(locale, r)} — ${r.name}`).join("; ") + "." },
        ...(transfers.length ? [{ q: `Какие переносы выходных в ${year} году?`, a: transfers.map((t) => `${t[0]}: ${t[1]}`).join("; ") + "." }] : []),
      ]
    : [
        { q: `How many working days are in ${year}${isRu ? " in Russia" : " in Kazakhstan"}?`, a: `${yn.workDays} working days and ${yn.offDays} weekends and holidays; the norm on a 40-hour week is ${num(yn.hours40)} hours.${known ? "" : " Decree transfers are not included."}` },
        { q: `What are the public holidays in ${year}?`, a: holidayRuns(py.holidays, locale).map((r) => `${runDate(locale, r)} — ${r.name}`).join("; ") + "." },
        ...(transfers.length ? [{ q: `Which days off are moved in ${year}?`, a: transfers.map((t) => `${t[0]}: ${t[1]}`).join("; ") + "." }] : []),
      ];

  const props: Omit<ProductionCalendarProps, "locale"> = { country, year };
  return {
    path: ["production-calendar", `${COUNTRY_SLUG[country]}-${year}`],
    sectionId: "calendar",
    kind: "variant",
    title: ru ? (isRu ? `Производственный календарь на ${year} год — Россия` : `Производственный календарь Казахстана на ${year} год`) : `${cn} working-day calendar ${year} — holidays and hours`,
    h1: ru ? (isRu ? `Производственный календарь на ${year} год` : `Производственный календарь Казахстана на ${year} год`) : `${cn} working-day calendar ${year}`,
    description: ru
      ? `Производственный календарь ${countryGen(country)} на ${year} год: ${workDays(locale, yn.workDays)}, ${offDays(locale, yn.offDays)}, норма ${num(yn.hours40)} ч (40 ч/нед.). Праздники, переносы, нормы по месяцам.`
      : `${cn} working-day calendar for ${year}: ${yn.workDays} working days, ${yn.offDays} days off and holidays, ${num(yn.hours40)} hours on a 40-hour week. Holidays, moved days off and monthly norms.`,
    lead: ru
      ? `${year} год${isRu ? "" : " в Казахстане"}: ${workDays(locale, yn.workDays)} и ${offDays(locale, yn.offDays)}${known || !isRu ? "" : " (без учёта постановления о переносах)"}.`
      : `${year} in ${cn}: ${yn.workDays} working days and ${yn.offDays} days off${known || !isRu ? "" : " (decree transfers not included)"}.`,
    breadcrumbs: [home(locale), { name: ru ? "Производственный календарь" : "Working-day calendar", path: ["production-calendar"] }],
    tool: { id: "calendar/production", props },
    topBlocks: [{ type: "links", title: ru ? "Другие годы и страны" : "Other years and countries", style: "chips", items: others.map((o) => ({ path: o.path, label: `${countryName(o.country, locale)} ${o.year}` })) }],
    blocks,
    faq,
    related: [...relatedLinks(locale, ["production-calendar", "calendar"]), { path: ["calendar", String(year)], label: ru ? `Календарь на ${year} год` : `${year} calendar`, icon: "CalendarDays", hue: HUE }],
    schemaType: "WebPage",
    icon: "Briefcase",
    hue: HUE,
    wide: true,
  };
}
