import { describe as suite, expect, it } from "vitest";
import { describe, fieldRows } from "@/sections/cron/describe";
import { CronError, matchingDays, nextRuns, parseCron, runsPerDay } from "@/sections/cron/engine";
import { toSystemd } from "@/sections/cron/systemd";
import { wallToInstant } from "@/sections/cron/tz";

const iso = (ms: number) => new Date(ms).toISOString().replace(".000Z", "Z");
const runs = (expr: string, from: string, n: number, tz = "UTC") => nextRuns(parseCron(expr), Date.parse(from), n, tz).map((r) => iso(r.ms));

suite("parser", () => {
  it("accepts the full syntax", () => {
    for (const e of [
      "* * * * *",
      "*/5 * * * *",
      "0 9-17 * * 1-5",
      "1-10/2 * * * *",
      "5/15 * * * *",
      "0 0 1,15 * *",
      "0 0 * JAN,JUL MON-FRI",
      "0 0 * * 7",
      "0 0 * * 0-7",
      "@yearly",
      "@annually",
      "@monthly",
      "@weekly",
      "@daily",
      "@midnight",
      "@hourly",
      "@reboot",
      "*/30 * * * * *",
      "0 0 12 ? * MON-FRI",
      "0 0 0 L * ?",
      "0 0 0 L-3 * ?",
      "0 0 0 LW * ?",
      "0 0 0 15W * ?",
      "0 0 18 ? * 6L",
      "0 0 9 ? * 2#1",
      "0 0 9 ? * MON#1",
      "0 0 12 1 1 ? 2030",
    ])
      expect(() => parseCron(e), e).not.toThrow();
  });
  it("rejects bad input with a field", () => {
    const bad: [string, string][] = [
      ["* * * *", "field-count"],
      ["60 * * * *", "out-of-range"],
      ["* 24 * * *", "out-of-range"],
      ["* * 0 * *", "out-of-range"],
      ["* * * 13 *", "out-of-range"],
      ["* * * * 8", "out-of-range"],
      ["*/0 * * * *", "step"],
      ["10-5 * * * *", "reversed"],
      ["* * L * *", "quartz-only"],
      ["0 0 12 1 * 1 2030", "quartz-question"],
      ["@often", "unknown-macro"],
      ["a * * * *", "bad-value"],
    ];
    for (const [e, code] of bad) {
      try {
        parseCron(e);
        throw new Error(`accepted ${e}`);
      } catch (err) {
        expect((err as CronError).code, e).toBe(code);
      }
    }
  });
  it("7 and 0 are both Sunday; names work", () => {
    expect(parseCron("0 0 * * 7").fields.dow.values).toEqual([0]);
    expect(parseCron("0 0 * * sun").fields.dow.values).toEqual([0]);
    expect(parseCron("0 0 * * 5-7").fields.dow.values).toEqual([0, 5, 6]);
    expect(parseCron("0 0 * * MON-FRI").fields.dow.values).toEqual([1, 2, 3, 4, 5]);
    expect(parseCron("1-10/2 * * * *").fields.minute.values).toEqual([1, 3, 5, 7, 9]);
    expect(parseCron("50/5 * * * *").fields.minute.values).toEqual([50, 55]);
    expect(parseCron("0 0 12 ? * 1").fields.dow.values).toEqual([0]); // Quartz 1 = Sunday
  });
});

suite("next runs", () => {
  it("every 5 minutes from an odd second", () => {
    expect(runs("*/5 * * * *", "2025-03-10T10:03:27Z", 3)).toEqual(["2025-03-10T10:05:00Z", "2025-03-10T10:10:00Z", "2025-03-10T10:15:00Z"]);
  });
  it("seconds field", () => {
    expect(runs("*/30 * * * * *", "2025-03-10T10:00:10Z", 3)).toEqual(["2025-03-10T10:00:30Z", "2025-03-10T10:01:00Z", "2025-03-10T10:01:30Z"]);
  });
  it("Feb 29 only in leap years", () => {
    expect(runs("0 0 29 2 *", "2025-01-01T00:00:00Z", 3)).toEqual(["2028-02-29T00:00:00Z", "2032-02-29T00:00:00Z", "2036-02-29T00:00:00Z"]);
  });
  it("impossible dates terminate with no runs", () => {
    expect(runs("0 0 30 2 *", "2025-01-01T00:00:00Z", 3)).toEqual([]);
    expect(runs("0 0 31 4 *", "2025-01-01T00:00:00Z", 3)).toEqual([]);
    expect(runs("@reboot", "2025-01-01T00:00:00Z", 3)).toEqual([]);
  });
  it("DOM/DOW OR semantics (Vixie)", () => {
    // 13th OR any Friday — June 2025: Fri 6, 13 (both), 20, 27
    expect(runs("0 0 13 * 5", "2025-06-01T00:00:00Z", 4)).toEqual(["2025-06-06T00:00:00Z", "2025-06-13T00:00:00Z", "2025-06-20T00:00:00Z", "2025-06-27T00:00:00Z"]);
    // DOM starting with * → AND: odd days that are Mondays
    expect(runs("0 0 */2 * 1", "2025-06-01T00:00:00Z", 2)).toEqual(["2025-06-09T00:00:00Z", "2025-06-23T00:00:00Z"]);
    expect(runs("0 0 * * 7", "2025-06-01T00:00:01Z", 1)).toEqual(["2025-06-08T00:00:00Z"]);
  });
  it("Quartz L, LW, W, # and nL", () => {
    expect(runs("0 0 0 L * ?", "2025-01-15T00:00:00Z", 3)).toEqual(["2025-01-31T00:00:00Z", "2025-02-28T00:00:00Z", "2025-03-31T00:00:00Z"]);
    expect(runs("0 0 0 L-2 * ?", "2025-02-01T00:00:00Z", 1)).toEqual(["2025-02-26T00:00:00Z"]);
    expect(runs("0 0 0 LW * ?", "2025-05-01T00:00:00Z", 1)).toEqual(["2025-05-30T00:00:00Z"]); // May 31 2025 is Saturday
    expect(runs("0 0 0 15W * ?", "2025-06-01T00:00:00Z", 1)).toEqual(["2025-06-16T00:00:00Z"]); // June 15 2025 is Sunday
    expect(runs("0 0 0 1W * ?", "2025-02-01T00:00:00Z", 1)).toEqual(["2025-02-03T00:00:00Z"]); // Feb 1 2025 is Saturday → Monday 3rd
    expect(runs("0 0 9 ? * 2#1", "2025-06-01T00:00:00Z", 2)).toEqual(["2025-06-02T09:00:00Z", "2025-07-07T09:00:00Z"]);
    expect(runs("0 0 18 ? * 6L", "2025-06-01T00:00:00Z", 2)).toEqual(["2025-06-27T18:00:00Z", "2025-07-25T18:00:00Z"]);
    expect(runs("0 0 12 1 1 ? 2030", "2025-06-01T00:00:00Z", 2)).toEqual(["2030-01-01T12:00:00Z"]);
  });
  it("time zones and DST: New York spring gap and fall overlap", () => {
    // 2025-03-09: 02:00 → 03:00 in New York; 02:30 doesn't exist → moved to 03:00 EDT (07:00Z)
    expect(runs("30 2 * * *", "2025-03-08T12:00:00Z", 3, "America/New_York")).toEqual(["2025-03-09T07:00:00Z", "2025-03-10T06:30:00Z", "2025-03-11T06:30:00Z"]);
    // 2025-11-02: 01:30 happens twice; the job runs once, at the first occurrence (EDT, 05:30Z)
    expect(runs("30 1 * * *", "2025-11-01T12:00:00Z", 2, "America/New_York")).toEqual(["2025-11-02T05:30:00Z", "2025-11-03T06:30:00Z"]);
    // every 30 min through the spring gap: no duplicates, 02:00 and 02:30 collapse into 03:00
    expect(runs("*/30 * * * *", "2025-03-09T06:15:00Z", 3, "America/New_York")).toEqual(["2025-03-09T06:30:00Z", "2025-03-09T07:00:00Z", "2025-03-09T07:30:00Z"]);
  });
  it("time zones: London and Almaty", () => {
    expect(runs("0 9 * * *", "2025-06-01T00:00:00Z", 1, "Europe/London")).toEqual(["2025-06-01T08:00:00Z"]);
    expect(runs("0 9 * * *", "2025-12-01T00:00:00Z", 1, "Europe/London")).toEqual(["2025-12-01T09:00:00Z"]);
    expect(runs("30 1 * * *", "2025-10-25T12:00:00Z", 1, "Europe/London")).toEqual(["2025-10-26T00:30:00Z"]);
    // Almaty: UTC+5 without DST since 2024
    expect(runs("0 9 * * *", "2025-06-01T00:00:00Z", 1, "Asia/Almaty")).toEqual(["2025-06-01T04:00:00Z"]);
    expect(runs("0 9 * * *", "2025-12-01T00:00:00Z", 1, "Asia/Almaty")).toEqual(["2025-12-01T04:00:00Z"]);
  });
  it("wallToInstant flags gaps and overlaps", () => {
    expect(wallToInstant({ y: 2025, M: 3, d: 9, h: 2, m: 30, s: 0 }, "America/New_York")).toMatchObject({ gap: true });
    expect(wallToInstant({ y: 2025, M: 11, d: 2, h: 1, m: 30, s: 0 }, "America/New_York")).toMatchObject({ overlap: true });
  });
  it("counts", () => {
    expect(runsPerDay(parseCron("*/5 * * * *"))).toBe(288);
    expect(runsPerDay(parseCron("*/30 * * * * *"))).toBe(2880);
    expect(matchingDays(parseCron("0 9 * * 1-5"), 2027)).toBe(261);
    expect(matchingDays(parseCron("0 0 29 2 *"), 2028)).toBe(1);
  });
});

suite("descriptions (ru)", () => {
  const d = (e: string) => describe(parseCron(e), "ru");
  it("time phrases and plurals", () => {
    expect(d("* * * * *")).toBe("Каждую минуту");
    expect(d("*/2 * * * *")).toBe("Каждые 2 минуты");
    expect(d("*/5 * * * *")).toBe("Каждые 5 минут");
    expect(d("*/21 * * * *")).toBe("Каждые 21 минуту");
    expect(d("0 * * * *")).toBe("Каждый час");
    expect(d("0 */2 * * *")).toBe("Каждые 2 часа");
    expect(d("0 */6 * * *")).toBe("Каждые 6 часов");
    expect(d("30 * * * *")).toBe("В 30 минут каждого часа");
    expect(d("0 9 * * *")).toBe("Каждый день в 09:00");
    expect(d("0 0,12 * * *")).toBe("Каждый день в 00:00 и 12:00");
    expect(d("*/15 9-17 * * 1-5")).toBe("Каждые 15 минут с 09:00 до 17:59, по будням (пн–пт)");
    expect(d("*/30 * * * * *")).toBe("Каждые 30 секунд");
    expect(d("0 9-17 * * *")).toBe("Каждый час с 09:00 до 17:00");
  });
  it("days, weekdays and months with correct cases", () => {
    expect(d("0 9 * * 1-5")).toBe("В 09:00 по будням (пн–пт)");
    expect(d("0 10 * * 6,0")).toBe("В 10:00 по выходным (сб и вс)");
    expect(d("0 0 * * 1")).toBe("В 00:00 по понедельникам");
    expect(d("0 17 * * 5")).toBe("В 17:00 по пятницам");
    expect(d("0 0 * * 1,3,5")).toBe("В 00:00 по понедельникам, средам и пятницам");
    expect(d("0 0 * * 2-4")).toBe("В 00:00 со вторника по четверг");
    expect(d("0 0 * * 3-6")).toBe("В 00:00 со среды по субботу");
    expect(d("0 0 1 * *")).toBe("В 00:00 1-го числа каждого месяца");
    expect(d("0 0 1,15 * *")).toBe("В 00:00 1-го и 15-го числа каждого месяца");
    expect(d("0 0 1 1 *")).toBe("В 00:00 1 января");
    expect(d("0 0 1 1,4,7,10 *")).toBe("В 00:00 1-го числа, в январе, апреле, июле и октябре");
    expect(d("0 0 1 */3 *")).toBe("В 00:00 1-го числа, каждые 3 месяца (янв, апр, июл, окт)");
    expect(d("0 0 * 6-8 *")).toBe("Каждый день в 00:00 с июня по август");
    expect(d("0 0 13 * 5")).toBe("В 00:00 13-го числа каждого месяца или по пятницам");
    expect(d("0 0 */2 * *")).toBe("В 00:00 по нечётным числам");
    expect(d("@reboot")).toBe("Один раз при запуске системы (@reboot)");
  });
  it("Quartz specials", () => {
    expect(d("0 0 0 L * ?")).toBe("В 00:00 в последний день месяца");
    expect(d("0 0 0 LW * ?")).toBe("В 00:00 в последний будний день месяца");
    expect(d("0 0 0 15W * ?")).toBe("В 00:00 в ближайший к 15-му числу будний день");
    expect(d("0 0 18 ? * 6L")).toBe("В 18:00 в последнюю пятницу месяца");
    expect(d("0 0 9 ? * 2#1")).toBe("В 09:00 в первый понедельник месяца");
    expect(d("0 0 9 ? * 1#2")).toBe("В 09:00 во второе воскресенье месяца");
    expect(d("0 0 9 ? * 4#2")).toBe("В 09:00 во вторую среду месяца");
  });
});

suite("descriptions (en)", () => {
  const d = (e: string) => describe(parseCron(e), "en");
  it("phrases", () => {
    expect(d("* * * * *")).toBe("Every minute");
    expect(d("*/5 * * * *")).toBe("Every 5 minutes");
    expect(d("0 9 * * 1-5")).toBe("At 09:00 on weekdays (Mon–Fri)");
    expect(d("0 0 1 * *")).toBe("At 00:00 on the 1st of every month");
    expect(d("0 0 1 1 *")).toBe("At 00:00 on January 1");
    expect(d("0 0 13 * 5")).toBe("At 00:00 on the 13th of every month or on Fridays");
    expect(d("0 0 18 ? * 6L")).toBe("At 18:00 on the last Friday of the month");
    expect(d("*/15 9-17 * * 1-5")).toBe("Every 15 minutes between 09:00 and 17:59, on weekdays (Mon–Fri)");
    expect(d("0 0 * * 2-4")).toBe("At 00:00 Tuesday through Thursday");
  });
  it("field rows", () => {
    const rows = fieldRows(parseCron("*/5 9-17 * * 1-5"), "en");
    expect(rows[0]).toEqual(["Minutes", "*/5", "0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55"]);
    expect(rows[4][2]).toContain("weekdays");
  });
});

suite("systemd OnCalendar", () => {
  it("converts simple expressions", () => {
    expect(toSystemd(parseCron("0 9 * * 1-5"))).toBe("Mon..Fri *-*-* 09:00:00");
    expect(toSystemd(parseCron("*/5 * * * *"))).toBe("*-*-* *:00/5:00");
    expect(toSystemd(parseCron("0 0 1 * *"))).toBe("*-*-01 00:00:00");
    expect(toSystemd(parseCron("0 0 1 1,4,7,10 *"))).toBe("*-01,04,07,10-01 00:00:00");
    expect(toSystemd(parseCron("0 0 13 * 5"))).toBeNull();
    expect(toSystemd(parseCron("0 0 0 L * ?"))).toBe("*-*~01 00:00:00");
  });
});
