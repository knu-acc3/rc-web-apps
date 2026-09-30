import { describe, expect, it } from "vitest";
import { parseYmd, ymdStr } from "@/sections/calendar/lib/dates";
import {
  addPeriod,
  age,
  detectUnit,
  difference,
  formatDuration,
  iso8601,
  parseClock,
  parseDuration,
  parseTimestamp,
  rfc2822,
  shiftMinutes,
  sumDurations,
  ymdBetween,
} from "@/sections/date/lib/engine";

const d = (s: string) => parseYmd(s)!;

describe("age", () => {
  it("years, months, days", () => {
    expect(age(d("1990-05-15"), d("2026-09-30"))).toMatchObject({ years: 36, months: 4, days: 15, nextAge: 37 });
    expect(ymdStr(age(d("1990-05-15"), d("2026-09-30"))!.next)).toBe("2027-05-15");
  });

  it("born on February 29", () => {
    const a = age(d("2000-02-29"), d("2025-02-28"))!;
    expect(a.years).toBe(25); // birthday counted on Feb 28 in common years
    expect(a.isBirthday).toBe(true);
    expect(age(d("2000-02-29"), d("2025-02-27"))!.years).toBe(24);
    expect(ymdStr(age(d("2000-02-29"), d("2025-03-01"))!.next)).toBe("2026-02-28");
    expect(ymdStr(age(d("2000-02-29"), d("2027-03-01"))!.next)).toBe("2028-02-29");
    expect(age(d("2000-02-29"), d("2024-02-29"))).toMatchObject({ years: 24, months: 0, days: 0, isBirthday: true });
  });

  it("month-end borrowing", () => {
    expect(ymdBetween(d("2026-01-31"), d("2026-03-01"))).toEqual({ years: 0, months: 1, days: 1 });
    // a month from Jan 31 ends on Feb 28 (the last day of a shorter month)
    expect(ymdBetween(d("2026-01-31"), d("2026-02-28"))).toEqual({ years: 0, months: 1, days: 0 });
    expect(ymdBetween(d("2025-03-31"), d("2026-03-30"))).toEqual({ years: 0, months: 11, days: 30 });
  });

  it("total days and future birth date", () => {
    expect(age(d("2026-01-01"), d("2026-12-31"))!.totalDays).toBe(364);
    expect(age(d("2027-01-01"), d("2026-12-31"))).toBeNull();
  });
});

describe("difference between dates", () => {
  it("counts days with and without the end date", () => {
    expect(difference(d("2026-01-01"), d("2026-12-31"), false, null)).toMatchObject({ days: 364, weeks: 52, weekDays: 0 });
    expect(difference(d("2026-01-01"), d("2026-12-31"), true, null)).toMatchObject({ inclusive: 365, weeks: 52, weekDays: 1, years: 1, months: 0, restDays: 0 });
    expect(difference(d("2026-03-10"), d("2026-03-01"), false, null).days).toBe(-9);
  });

  it("business days with holidays", () => {
    // January 2026 in Russia: 15 working days (holidays Jan 1–11)
    expect(difference(d("2026-01-01"), d("2026-01-31"), true, "ru").workdays).toBe(15);
    expect(difference(d("2026-01-01"), d("2026-01-31"), true, null).workdays).toBe(22);
    // Kazakhstan, March 2026 (Nauryz 21–25 incl. moved days, Mar 9 moved day off)
    expect(difference(d("2026-03-01"), d("2026-03-31"), true, "kz").workdays).toBe(18);
  });
});

describe("adding periods", () => {
  it.each([
    ["2026-01-31", 1, "months", "2026-02-28"],
    ["2024-02-29", 1, "years", "2025-02-28"],
    ["2026-09-30", 30, "days", "2026-10-30"],
    ["2026-09-30", -30, "days", "2026-08-31"],
    ["2026-09-30", 2, "weeks", "2026-10-14"],
    ["2026-10-02", 1, "workdays", "2026-10-05"],
  ] as const)("%s + %i %s = %s", (from, n, unit, expected) => {
    expect(ymdStr(addPeriod(d(from), n, unit, null))).toBe(expected);
  });
  it("business days skip Russian holidays", () => {
    expect(ymdStr(addPeriod(d("2025-12-29"), 3, "workdays", "ru"))).toBe("2026-01-13");
  });
});

describe("unix timestamps", () => {
  it("auto-detects the unit from the digit count", () => {
    expect(detectUnit(10)).toBe("s");
    expect(detectUnit(13)).toBe("ms");
    expect(detectUnit(16)).toBe("us");
    expect(detectUnit(19)).toBe("ns");
  });

  it("13-digit values are milliseconds, not seconds", () => {
    const p = parseTimestamp("1700000000000")!;
    expect(p.unit).toBe("ms");
    expect(new Date(p.ms).toISOString()).toBe("2023-11-14T22:13:20.000Z");
    expect(p.suspicious).toBe(false);
  });

  it("parses seconds, µs, ns and negatives", () => {
    expect(new Date(parseTimestamp("1234567890")!.ms).toISOString()).toBe("2009-02-13T23:31:30.000Z");
    expect(new Date(parseTimestamp("1700000000123456")!.ms).toISOString()).toBe("2023-11-14T22:13:20.123Z");
    expect(new Date(parseTimestamp("1700000000123456789")!.ms).toISOString()).toBe("2023-11-14T22:13:20.123Z");
    expect(new Date(parseTimestamp("-86400")!.ms).toISOString()).toBe("1969-12-31T00:00:00.000Z");
    expect(new Date(parseTimestamp("2147483647")!.ms).toISOString()).toBe("2038-01-19T03:14:07.000Z");
    expect(parseTimestamp("12ab")).toBeNull();
  });

  it("forced units and suspicious values", () => {
    const p = parseTimestamp("1700000000000", "s");
    expect(p?.suspicious).toBe(true);
    expect(parseTimestamp("1700000000", "ms")?.suspicious).toBe(true);
  });

  it("formats", () => {
    expect(iso8601(1700000000000)).toBe("2023-11-14T22:13:20Z");
    expect(iso8601(1700000000000, 300)).toBe("2023-11-15T03:13:20+05:00");
    expect(rfc2822(1700000000000)).toBe("Tue, 14 Nov 2023 22:13:20 +0000");
    expect(rfc2822(1700000000000, 180)).toBe("Wed, 15 Nov 2023 01:13:20 +0300");
  });
});

describe("durations", () => {
  it.each([
    ["1:30:15", 5415],
    ["90:00", 5400],
    ["1h 30m", 5400],
    ["1ч 30мин 15с", 5415],
    ["2 часа 5 минут", 7500],
    ["45", 2700],
    ["1,5ч", 5400],
    ["-0:15", -15],
    ["1д 2ч", 93600],
  ])("%s → %i s", (s, v) => {
    expect(parseDuration(s)).toBe(v);
  });

  it("rejects garbage and invalid minutes", () => {
    expect(parseDuration("1:75")).toBeNull();
    expect(parseDuration("abc")).toBeNull();
    expect(parseDuration("1h foo")).toBeNull();
  });

  it("hh:mm mode and sums", () => {
    expect(parseDuration("01:30", "min", "hm")).toBe(5400);
    expect(sumDurations(["1:30:00", "0:45:30", "", "-0:15:30", "x"])).toEqual({ total: 7200, bad: [4] });
    expect(formatDuration(93784)).toBe("26:03:04");
    expect(formatDuration(-1800)).toBe("−0:30:00");
  });
});

describe("work hours", () => {
  it("shifts, breaks and overnight", () => {
    expect(shiftMinutes(parseClock("09:00")!, parseClock("18:00")!, 60)).toBe(480);
    expect(shiftMinutes(parseClock("22:00")!, parseClock("06:00")!, 30)).toBe(450);
    expect(parseClock("24:00")).toBe(1440);
    expect(parseClock("25:00")).toBeNull();
    expect(parseClock("9.30")).toBe(570);
  });
});
