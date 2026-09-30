import { describe, expect, it } from "vitest";
import { parseYmd, ymdStr } from "@/sections/calendar/lib/dates";
import { addWorkingDays, countWorkingDays, holidaysByLaw, isWorkingDay, monthNorm, productionYear, yearNorm } from "@/sections/calendar/lib/holidays";
import { islamicDates } from "@/sections/calendar/lib/islamic";

const d = (s: string) => parseYmd(s)!;

describe("Russia production calendar (official totals)", () => {
  it.each([
    // year, working days, hours at 40 h/week
    [2024, 248, 1979],
    [2025, 247, 1972],
    [2026, 247, 1972],
  ])("%i: %i days, %i hours", (y, days, hours) => {
    const n = yearNorm("ru", y);
    expect(n.workDays).toBe(days);
    expect(n.hours40).toBe(hours);
    expect(productionYear("ru", y).decree).toBe("known");
  });

  it("2025 transfers and automatic moves", () => {
    const py = productionYear("ru", 2025);
    expect(py.type(d("2025-02-24"))).toBe("off"); // Feb 23 was a Sunday
    expect(py.type(d("2025-03-10"))).toBe("off"); // Mar 8 was a Saturday
    expect(py.type(d("2025-05-02"))).toBe("off");
    expect(py.type(d("2025-12-31"))).toBe("off");
    expect(py.type(d("2025-11-01"))).toBe("workSat");
    expect(py.type(d("2025-11-03"))).toBe("off");
    expect(py.type(d("2025-04-30"))).toBe("short");
  });

  it("2024 working Saturdays and month norms", () => {
    const py = productionYear("ru", 2024);
    for (const s of ["2024-04-27", "2024-11-02", "2024-12-28"]) expect(isWorkingDay("ru", d(s))).toBe(true);
    for (const s of ["2024-04-29", "2024-04-30", "2024-05-10", "2024-12-30", "2024-12-31"]) expect(py.type(d(s))).toBe("off");
    expect(monthNorm("ru", 2024, 1).workDays).toBe(17);
    expect(monthNorm("ru", 2024, 11)).toMatchObject({ workDays: 21, hours40: 167 });
  });

  it("2026: 12-day New Year break (Dec 31, 2025 – Jan 11, 2026)", () => {
    for (let day = 1; day <= 11; day++) expect(isWorkingDay("ru", { y: 2026, m: 1, d: day })).toBe(false);
    expect(isWorkingDay("ru", d("2026-01-12"))).toBe(true);
    expect(isWorkingDay("ru", d("2025-12-31"))).toBe(false);
    expect(productionYear("ru", 2026).type(d("2026-03-09"))).toBe("off");
    expect(productionYear("ru", 2026).type(d("2026-05-11"))).toBe("off");
  });

  it("years without a known decree are flagged", () => {
    expect(productionYear("ru", 2028).decree).toBe("unknown");
  });
});

describe("Kazakhstan holidays by law", () => {
  it("fixed holidays", () => {
    const keys = holidaysByLaw("kz", 2026).map((h) => `${ymdStr(h.ymd)} ${h.key}`);
    expect(keys).toContain("2026-08-30 constitution");
    expect(keys).toContain("2026-10-25 republic");
    expect(keys).toContain("2026-12-16 independence");
    expect(keys).toContain("2026-07-06 capital");
    expect(keys).toContain("2026-05-07 kz-defender");
    expect(keys).toContain("2026-05-27 kurban-ait");
    expect(keys.some((k) => k.includes("12-17"))).toBe(false);
  });

  it("weekend holidays move to the next working day, religious ones do not", () => {
    const py = productionYear("kz", 2026);
    // Nauryz 2026: Sat 21, Sun 22, Mon 23 → Tue 24 and Wed 25 are days off
    expect(py.type(d("2026-03-24"))).toBe("off");
    expect(py.type(d("2026-03-25"))).toBe("off");
    expect(py.type(d("2026-03-26"))).toBe("work");
    // Constitution Day Sun Aug 30 → Mon Aug 31
    expect(py.type(d("2026-08-31"))).toBe("off");
    // Orthodox Christmas 2023 (Sat Jan 7) was not moved
    expect(productionYear("kz", 2023).type(d("2023-01-09"))).toBe("work");
    expect(py.decree).toBe("unknown");
  });
});

describe("working-day arithmetic", () => {
  it("counts inclusive and exclusive ranges", () => {
    expect(countWorkingDays(null, d("2026-09-28"), d("2026-10-04"))).toBe(5);
    expect(countWorkingDays(null, d("2026-09-28"), d("2026-10-04"), false)).toBe(5);
    expect(countWorkingDays(null, d("2026-09-28"), d("2026-10-02"), false)).toBe(4);
    expect(countWorkingDays("ru", d("2026-01-01"), d("2026-01-31"))).toBe(15);
    expect(countWorkingDays("ru", d("2026-01-31"), d("2026-01-01"))).toBe(15);
  });

  it("adds working days skipping holidays", () => {
    expect(ymdStr(addWorkingDays("ru", d("2025-12-30"), 1))).toBe("2026-01-12");
    expect(ymdStr(addWorkingDays(null, d("2026-10-02"), 1))).toBe("2026-10-05");
    expect(ymdStr(addWorkingDays("kz", d("2026-03-20"), 1))).toBe("2026-03-26");
    expect(ymdStr(addWorkingDays("ru", d("2026-01-12"), -1))).toBe("2025-12-30");
  });
});

describe("Islamic dates (Umm al-Qura)", () => {
  it("known recent dates", () => {
    expect(islamicDates("fitr", 2024).map(ymdStr)).toEqual(["2024-04-10"]);
    expect(islamicDates("adha", 2025).map(ymdStr)).toEqual(["2025-06-06"]);
    expect(islamicDates("ramadan", 2026).map(ymdStr)).toEqual(["2026-02-18"]);
    expect(islamicDates("fitr", 2033).map(ymdStr)).toEqual(["2033-01-03", "2033-12-23"]);
    expect(islamicDates("fitr", 2050)).toEqual([]);
  });
});
