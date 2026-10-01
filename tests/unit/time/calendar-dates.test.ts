import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  dayOfYear,
  daysInMonth,
  diffDays,
  fromDayNum,
  isLeap,
  isoWeek,
  isoWeekday,
  isoWeekMonday,
  isoWeeksInYear,
  nthWeekday,
  orthodoxEaster,
  parseYmd,
  westernEaster,
  ymdStr,
} from "@/tools/time/calendar/lib/dates";

const d = (s: string) => parseYmd(s)!;

describe("civil dates", () => {
  it("leap years", () => {
    expect([1900, 2000, 2024, 2025, 2100].map(isLeap)).toEqual([false, true, true, false, false]);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
  });

  it("weekday", () => {
    expect(isoWeekday(1970, 1, 1)).toBe(4);
    expect(isoWeekday(2026, 9, 30)).toBe(3); // Wednesday
    expect(isoWeekday(2000, 2, 29)).toBe(2);
  });

  it("day numbers round-trip, including years < 100", () => {
    for (const s of ["0001-01-01", "0099-12-31", "1582-10-15", "2026-03-08", "9999-12-31"]) expect(ymdStr(fromDayNum(diffDays({ y: 1970, m: 1, d: 1 }, d(s))))).toBe(s);
  });

  it("add months clamps to the end of month", () => {
    expect(ymdStr(addMonths(d("2026-01-31"), 1))).toBe("2026-02-28");
    expect(ymdStr(addMonths(d("2024-01-31"), 1))).toBe("2024-02-29");
    expect(ymdStr(addMonths(d("2024-02-29"), 12))).toBe("2025-02-28");
    expect(ymdStr(addMonths(d("2026-03-15"), -3))).toBe("2025-12-15");
  });

  it("parse rejects invalid dates", () => {
    expect(parseYmd("2025-02-29")).toBeNull();
    expect(parseYmd("2026-13-01")).toBeNull();
    expect(parseYmd("2024-02-29")).not.toBeNull();
  });

  it("day of year", () => {
    expect(dayOfYear(d("2026-12-31"))).toBe(365);
    expect(dayOfYear(d("2024-12-31"))).toBe(366);
  });
});

describe("ISO 8601 weeks", () => {
  it.each([
    ["2026-12-31", 2026, 53],
    ["2027-01-01", 2026, 53],
    ["2027-01-03", 2026, 53],
    ["2027-01-04", 2027, 1],
    ["2024-12-30", 2025, 1],
    ["2021-01-03", 2020, 53],
    ["2026-01-01", 2026, 1],
    ["2026-09-30", 2026, 40],
    ["2008-12-29", 2009, 1],
    ["2010-01-03", 2009, 53],
  ])("%s → %i-W%i", (s, year, week) => {
    expect(isoWeek(d(s))).toEqual({ year, week });
  });

  it("weeks per year", () => {
    expect(isoWeeksInYear(2026)).toBe(53);
    expect(isoWeeksInYear(2020)).toBe(53);
    expect(isoWeeksInYear(2025)).toBe(52);
    expect(isoWeeksInYear(2032)).toBe(53); // leap year starting on Thursday
  });

  it("monday of a week", () => {
    expect(ymdStr(isoWeekMonday(2026, 1))).toBe("2025-12-29");
    expect(ymdStr(isoWeekMonday(2026, 53))).toBe("2026-12-28");
    expect(ymdStr(addDays(isoWeekMonday(2020, 53), 6))).toBe("2021-01-03");
  });
});

describe("movable feasts", () => {
  it.each([
    [2024, "2024-03-31", "2024-05-05"],
    [2025, "2025-04-20", "2025-04-20"],
    [2026, "2026-04-05", "2026-04-12"],
    [2027, "2027-03-28", "2027-05-02"],
    [2028, "2028-04-16", "2028-04-16"],
    [2029, "2029-04-01", "2029-04-08"],
    [2030, "2030-04-21", "2030-04-28"],
    [2035, "2035-03-25", "2035-04-29"],
  ])("Easter %i: western %s, orthodox %s", (y, w, o) => {
    expect(ymdStr(westernEaster(y))).toBe(w);
    expect(ymdStr(orthodoxEaster(y))).toBe(o);
  });

  it("nth weekday", () => {
    expect(ymdStr(nthWeekday(2026, 11, 4, 4))).toBe("2026-11-26"); // US Thanksgiving 2026
    expect(ymdStr(nthWeekday(2025, 11, 4, 4))).toBe("2025-11-27");
    expect(ymdStr(nthWeekday(2026, 3, 7, -1))).toBe("2026-03-29"); // last Sunday of March
  });
});
