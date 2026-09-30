import { describe, expect, it } from "vitest";
import { timerSpecs } from "@/sections/timer/data/durations";
import { nextOccurrence, timeline } from "@/sections/timer/lib/alarm";
import { clampInt, clock, durationShort, durationText } from "@/sections/timer/lib/format";

describe("timer formatting", () => {
  it("countdowns round up, stopwatches round down", () => {
    expect(clock(299_001)).toBe("05:00");
    expect(clock(300_000)).toBe("05:00");
    expect(clock(1)).toBe("00:01");
    expect(clock(0)).toBe("00:00");
    expect(clock(59_999, { up: true })).toBe("00:59");
    expect(clock(3_723_450, { up: true, hundredths: true })).toBe("1:02:03.45");
    expect(clock(300_000, { forceHours: true, padHours: true })).toBe("00:05:00");
  });

  it("Russian duration words with the right cases", () => {
    expect(durationText(60, "ru", true)).toBe("1 минуту");
    expect(durationText(21 * 60, "ru", true)).toBe("21 минуту");
    expect(durationText(22 * 60, "ru", true)).toBe("22 минуты");
    expect(durationText(5 * 60, "ru")).toBe("5 минут");
    expect(durationText(5400, "ru")).toBe("1 час 30 минут");
    expect(durationText(1, "ru")).toBe("1 секунда");
    expect(durationText(3 * 3600, "en")).toBe("3 hours");
    expect(durationShort(5400, "ru")).toBe("1 ч 30 мин");
    expect(clampInt("75", 59)).toBe(59);
    expect(clampInt("", 59)).toBe(0);
  });
});

describe("timer variants", () => {
  const specs = timerSpecs();
  it("slugs are unique and cover the requested durations", () => {
    const slugs = specs.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of ["10-seconds", "30-seconds", "90-seconds", "1-minute", "5-minutes", "60-minutes", "1-hour", "90-minutes", "1-hour-30-minutes", "2-hours-30-minutes", "12-hours", "75-minutes", "100-minutes", "120-minutes"]) {
      expect(slugs).toContain(s);
    }
    for (let m = 1; m <= 60; m++) expect(slugs).toContain(m === 1 ? "1-minute" : `${m}-minutes`);
    expect(specs.length).toBeGreaterThanOrEqual(85);
  });
});

describe("alarm and interval timeline", () => {
  it("next occurrence of a wall-clock time", () => {
    const base = new Date(2026, 8, 30, 22, 0).getTime();
    expect(new Date(nextOccurrence("07:00", base)).getDate()).toBe(1);
    expect(new Date(nextOccurrence("23:30", base)).getDate()).toBe(30);
    expect(nextOccurrence("22:00", base)).toBeGreaterThan(base);
  });

  it("tabata: 10 s prep + 8 × (20 + 10) − last rest = 240 s", () => {
    const t = timeline(10, 20, 10, 8);
    expect(t[t.length - 1].end).toBe(10_000 + 8 * 20_000 + 7 * 10_000);
    expect(t.filter((s) => s.kind === "work")).toHaveLength(8);
    expect(t.filter((s) => s.kind === "rest")).toHaveLength(7);
    expect(timeline(0, 60, 0, 10)).toHaveLength(10);
  });
});
