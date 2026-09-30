/**
 * Public holidays and working-day calendars of Russia and Kazakhstan.
 *
 * - Holidays by law are generated for any year (RU: Labour Code art. 112;
 *   KZ: Law "On holidays in the Republic of Kazakhstan").
 * - Automatic rule of both countries: a (non-religious, for RU non-January) holiday
 *   that falls on a Saturday/Sunday gives a day off on the next working day.
 * - Government decrees that move weekends are included ONLY for years listed in
 *   RU_DECREES; for all other years `decree` is "unknown" and the UI must say that
 *   decree transfers are not included.
 */
import type { L10n } from "@/i18n/config";
import { addDays, dayNum, dayNumOf, fromDayNum, isoWeekday, parseYmd, ymdStr, type Ymd } from "./dates";
import { islamicDates, ISLAMIC_YEARS } from "./islamic";

export type HolidayCountry = "ru" | "kz";
export const HOLIDAY_COUNTRIES: HolidayCountry[] = ["ru", "kz"];

export interface Holiday {
  ymd: Ymd;
  key: string;
  name: L10n;
  kind: "public" | "religious";
  /** The date is announced yearly by a religious authority; this is the expected date. */
  expected?: boolean;
}

/** work: normal working day; short: working day shortened by 1 h (RU pre-holiday); workSat: weekend day made working by decree;
 *  weekend: Sat/Sun; holiday: public holiday by law; off: extra day off (automatic or decree transfer). */
export type DayType = "work" | "short" | "workSat" | "weekend" | "holiday" | "off";

export interface Transfer {
  from: Ymd;
  to: Ymd;
  /** true = automatic rule (holiday on a weekend), false = government decree */
  auto: boolean;
}

export interface ProdYear {
  country: HolidayCountry;
  year: number;
  holidays: Holiday[];
  transfers: Transfer[];
  /** "known": this year's decree transfers are included; "unknown": not included. */
  decree: "known" | "unknown";
  type(x: Ymd): DayType;
  holidayOn(x: Ymd): Holiday | undefined;
}

/* ───────────── names ───────────── */

const N = {
  newYear: { ru: "Новый год", en: "New Year" },
  newYearHol: { ru: "Новогодние каникулы", en: "New Year holidays" },
  christmas: { ru: "Рождество Христово", en: "Orthodox Christmas" },
  defender: { ru: "День защитника Отечества", en: "Defender of the Fatherland Day" },
  women: { ru: "Международный женский день", en: "International Women's Day" },
  spring: { ru: "Праздник Весны и Труда", en: "Spring and Labour Day" },
  victory: { ru: "День Победы", en: "Victory Day" },
  russia: { ru: "День России", en: "Russia Day" },
  unity: { ru: "День народного единства", en: "Unity Day" },
  nauryz: { ru: "Наурыз мейрамы", en: "Nauryz" },
  kzUnity: { ru: "Праздник единства народа Казахстана", en: "Unity Day of the People of Kazakhstan" },
  kzDefender: { ru: "День защитника Отечества", en: "Defender of the Fatherland Day" },
  capital: { ru: "День Столицы", en: "Capital Day" },
  constitution: { ru: "День Конституции Республики Казахстан", en: "Constitution Day" },
  republic: { ru: "День Республики", en: "Republic Day" },
  independence: { ru: "День Независимости", en: "Independence Day" },
  kurban: { ru: "Курбан айт (первый день)", en: "Kurban Ait (Eid al-Adha), day 1" },
} satisfies Record<string, L10n>;

/* ───────────── official decree data (only what is certain) ───────────── */

interface Decree {
  /** [from, to]: `from` (a weekend day or a January holiday on a weekend) → day off moves to `to`. */
  transfers: [string, string][];
  /** Official list of shortened pre-holiday days when it differs from the plain rule. */
  short?: string[];
}

const RU_DECREES: Record<number, Decree> = {
  2024: {
    transfers: [
      ["2024-01-06", "2024-05-10"],
      ["2024-01-07", "2024-12-31"],
      ["2024-04-27", "2024-04-29"],
      ["2024-11-02", "2024-04-30"],
      ["2024-12-28", "2024-12-30"],
    ],
    short: ["2024-02-22", "2024-03-07", "2024-05-08", "2024-06-11", "2024-11-02"],
  },
  2025: {
    transfers: [
      ["2025-01-04", "2025-05-02"],
      ["2025-01-05", "2025-12-31"],
      ["2025-11-01", "2025-11-03"],
    ],
  },
  // Постановление Правительства РФ от 24.09.2025 № 1466.
  2026: {
    transfers: [
      ["2026-01-03", "2026-01-09"],
      ["2026-01-04", "2026-12-31"],
    ],
  },
  // Постановление Правительства РФ от 17.09.2026 № 1187.
  2027: {
    transfers: [
      ["2027-01-02", "2027-11-05"],
      ["2027-01-03", "2027-12-31"],
      ["2027-02-20", "2027-02-22"],
    ],
    short: ["2027-02-20", "2027-04-30", "2027-06-11", "2027-11-03"],
  },
};

/** Kazakhstan: years whose government transfers are verified (2026: none — only the automatic rule applies). */
const KZ_DECREES: Record<number, Decree> = { 2026: { transfers: [] } };

/* ───────────── holidays by law ───────────── */

const h = (y: number, m: number, d: number, key: string, name: L10n, kind: Holiday["kind"] = "public"): Holiday => ({ ymd: { y, m, d }, key, name, kind });

export function holidaysByLaw(country: HolidayCountry, y: number): Holiday[] {
  if (country === "ru") {
    const out: Holiday[] = [];
    for (let d = 1; d <= 8; d++) {
      if (d === 7) out.push(h(y, 1, 7, "christmas", N.christmas));
      else out.push(h(y, 1, d, d === 1 ? "new-year" : `new-year-${d}`, d === 1 ? N.newYear : N.newYearHol));
    }
    out.push(
      h(y, 2, 23, "defender", N.defender),
      h(y, 3, 8, "women", N.women),
      h(y, 5, 1, "spring", N.spring),
      h(y, 5, 9, "victory", N.victory),
      h(y, 6, 12, "russia", N.russia),
      h(y, 11, 4, "unity", N.unity),
    );
    return out;
  }
  const out: Holiday[] = [
    h(y, 1, 1, "new-year", N.newYear),
    h(y, 1, 2, "new-year-2", N.newYear),
    h(y, 1, 7, "christmas", N.christmas, "religious"),
    h(y, 3, 8, "women", N.women),
    h(y, 3, 21, "nauryz", N.nauryz),
    h(y, 3, 22, "nauryz-2", N.nauryz),
    h(y, 3, 23, "nauryz-3", N.nauryz),
    h(y, 5, 1, "kz-unity", N.kzUnity),
    h(y, 5, 7, "kz-defender", N.kzDefender),
    h(y, 5, 9, "victory", N.victory),
    h(y, 7, 6, "capital", N.capital),
  ];
  // Constitution Day: August 30 until 2025. Law No. 306-VIII of 11.06.2026 (in force from 1 July 2026) moved it to
  // March 15, the day the new Constitution was adopted — so 2026 has no Constitution Day at all.
  if (y <= 2025) out.push(h(y, 8, 30, "constitution", N.constitution));
  if (y >= 2027) out.push(h(y, 3, 15, "constitution", N.constitution));
  // Republic Day became a public holiday again in 2022; Dec 17 stopped being a holiday the same year.
  if (y >= 2022) out.push(h(y, 10, 25, "republic", N.republic));
  out.push(h(y, 12, 16, "independence", N.independence));
  if (y < 2022) out.push(h(y, 12, 17, "independence-2", N.independence));
  if (y >= ISLAMIC_YEARS.min && y <= ISLAMIC_YEARS.max) {
    for (const ymd of islamicDates("adha", y)) out.push({ ymd, key: "kurban-ait", name: N.kurban, kind: "religious", expected: y > 2026 });
  }
  return out.sort((a, b) => dayNumOf(a.ymd) - dayNumOf(b.ymd));
}

/* ───────────── production year ───────────── */

const cache = new Map<string, ProdYear>();

export function productionYear(country: HolidayCountry, year: number): ProdYear {
  const key = `${country}${year}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const holidays = holidaysByLaw(country, year);
  const decree = (country === "ru" ? RU_DECREES : KZ_DECREES)[year];
  const types = new Map<number, DayType>();
  const hol = new Map<number, Holiday>();
  for (const x of holidays) {
    const n = dayNumOf(x.ymd);
    hol.set(n, x);
    types.set(n, "holiday");
  }
  const start = dayNum(year, 1, 1);
  const end = dayNum(year, 12, 31);
  const wd = (n: number) => {
    const x = fromDayNum(n);
    return isoWeekday(x.y, x.m, x.d);
  };
  const base = (n: number): DayType => types.get(n) ?? (wd(n) >= 6 ? "weekend" : "work");
  const transfers: Transfer[] = [];

  // Decree transfers first: they define working Saturdays and extra days off.
  if (decree) {
    for (const [f, t] of decree.transfers) {
      const from = parseYmd(f)!;
      const to = parseYmd(t)!;
      const fn = dayNumOf(from);
      if (!hol.has(fn)) types.set(fn, "workSat");
      types.set(dayNumOf(to), "off");
      transfers.push({ from, to, auto: false });
    }
  }

  // Automatic rule: a holiday on a weekend → the next working day is off.
  // RU: not for January 1–8 (those are moved by decree only); KZ: not for religious holidays.
  for (const x of holidays) {
    const n = dayNumOf(x.ymd);
    if (wd(n) < 6) continue;
    if (country === "ru" && x.ymd.m === 1 && x.ymd.d <= 8) continue;
    if (country === "kz" && x.kind === "religious") continue;
    let t = n + 1;
    while (base(t) !== "work") t++;
    types.set(t, "off");
    transfers.push({ from: x.ymd, to: fromDayNum(t), auto: true });
  }

  // RU: working day right before a public holiday is shortened by one hour.
  if (country === "ru") {
    if (decree?.short) {
      for (const s of decree.short) types.set(dayNumOf(parseYmd(s)!), "short");
    } else {
      for (let n = start; n <= end; n++) {
        const t = base(n);
        if (t !== "work" && t !== "workSat") continue;
        const next = fromDayNum(n + 1);
        const nextIsHoliday = hol.has(n + 1) || (next.m === 1 && next.d === 1);
        if (nextIsHoliday) types.set(n, "short");
      }
    }
  }

  transfers.sort((a, b) => dayNumOf(a.to) - dayNumOf(b.to));
  const py: ProdYear = {
    country,
    year,
    holidays,
    transfers,
    decree: decree ? "known" : "unknown",
    type: (x) => {
      const n = dayNumOf(x);
      if (x.y !== year) return productionYear(country, x.y).type(x);
      return base(n);
    },
    holidayOn: (x) => hol.get(dayNumOf(x)),
  };
  cache.set(key, py);
  return py;
}

export const isWorkType = (t: DayType): boolean => t === "work" || t === "short" || t === "workSat";

/** Working day in the given country's calendar; `null` country = plain Mon–Fri. */
export function isWorkingDay(country: HolidayCountry | null, x: Ymd): boolean {
  if (!country) return isoWeekday(x.y, x.m, x.d) <= 5;
  return isWorkType(productionYear(country, x.y).type(x));
}

/**
 * Number of working days in [from, to] (both inclusive when `inclusive`, otherwise [from, to)).
 * Order-independent: returns a non-negative count.
 */
export function countWorkingDays(country: HolidayCountry | null, from: Ymd, to: Ymd, inclusive = true): number {
  let a = dayNumOf(from);
  let b = dayNumOf(to);
  if (a > b) [a, b] = [b, a];
  if (!inclusive) b -= 1;
  let n = 0;
  for (let d = a; d <= b; d++) if (isWorkingDay(country, fromDayNum(d))) n++;
  return n;
}

/** Move `n` working days forward (n > 0) or backward (n < 0); the start day itself is not counted. */
export function addWorkingDays(country: HolidayCountry | null, from: Ymd, n: number): Ymd {
  let x = from;
  const step = n < 0 ? -1 : 1;
  let left = Math.abs(n);
  while (left > 0) {
    x = addDays(x, step);
    if (isWorkingDay(country, x)) left--;
  }
  return x;
}

export interface MonthNorm {
  month: number;
  calendarDays: number;
  workDays: number;
  offDays: number;
  shortDays: number;
  hours40: number;
  hours36: number;
  hours24: number;
}

/** Working-time norms. RU: pre-holiday days are 1 h shorter (art. 95 of the Labour Code). KZ: days × hours. */
export function monthNorm(country: HolidayCountry, year: number, month: number): MonthNorm {
  const py = productionYear(country, year);
  let work = 0;
  let short = 0;
  let days = 0;
  for (let n = dayNum(year, month, 1); ; n++) {
    const x = fromDayNum(n);
    if (x.m !== month) break;
    days++;
    const t = py.type(x);
    if (isWorkType(t)) work++;
    if (t === "short") short++;
  }
  const r = (v: number) => Math.round(v * 10) / 10;
  return {
    month,
    calendarDays: days,
    workDays: work,
    offDays: days - work,
    shortDays: short,
    hours40: r(work * 8 - short),
    hours36: r(work * 7.2 - short),
    hours24: r(work * 4.8 - short),
  };
}

export function yearNorm(country: HolidayCountry, year: number): MonthNorm {
  const months = Array.from({ length: 12 }, (_, i) => monthNorm(country, year, i + 1));
  const sum = (k: keyof MonthNorm) => months.reduce((s, m) => s + m[k], 0);
  const r = (v: number) => Math.round(v * 10) / 10;
  return {
    month: 0,
    calendarDays: sum("calendarDays"),
    workDays: sum("workDays"),
    offDays: sum("offDays"),
    shortDays: sum("shortDays"),
    hours40: r(sum("hours40")),
    hours36: r(sum("hours36")),
    hours24: r(sum("hours24")),
  };
}

/** Holidays of both countries for quick client-side lookup, as "YYYY-MM-DD" → name. */
export function holidayMap(country: HolidayCountry, year: number): Record<string, L10n> {
  const out: Record<string, L10n> = {};
  for (const x of productionYear(country, year).holidays) out[ymdStr(x.ymd)] = x.name;
  return out;
}
