import { describe, expect, it } from "vitest";
import { EVENTS } from "@/sections/countdown/data/events";
import { nextTarget, splitMs } from "@/sections/countdown/lib/next";

// These run in the test process's local time zone — exactly like the browser does.
const local = (y: number, m: number, d: number, h = 0, mi = 0) => new Date(y, m - 1, d, h, mi).getTime();

describe("countdown targets in local time", () => {
  const newYear = { name: "New Year", to: "until New Year", dates: ["2026-01-01", "2027-01-01", "2028-01-01"], allDay: true };

  it("rolls over to the next occurrence", () => {
    expect(nextTarget(newYear, local(2026, 9, 30, 12))).toMatchObject({ start: local(2027, 1, 1), state: "before" });
    expect(nextTarget(newYear, local(2027, 1, 1, 15))).toMatchObject({ start: local(2027, 1, 1), state: "during" });
    expect(nextTarget(newYear, local(2027, 1, 2, 0, 1))).toMatchObject({ start: local(2028, 1, 1), state: "before" });
  });

  it("one-off events report the time since", () => {
    const once = { name: "x", to: "x", dates: ["2027-01-01"], once: true };
    expect(nextTarget(once, local(2027, 3, 1))).toMatchObject({ state: "after", start: local(2027, 1, 1) });
    expect(nextTarget({ ...newYear, dates: ["2020-01-01"] }, local(2026, 1, 1))).toBeNull();
  });

  it("custom time of day", () => {
    const spec = { name: "x", to: "x", dates: ["2026-12-31"], time: "18:30", once: true };
    expect(nextTarget(spec, local(2026, 12, 31, 18, 0))!.start).toBe(local(2026, 12, 31, 18, 30));
  });

  it("weekend: Saturday 00:00, and 'during' on Saturday and Sunday", () => {
    const w = { name: "w", to: "w", weekend: true };
    expect(nextTarget(w, local(2026, 9, 30, 10))).toMatchObject({ start: local(2026, 10, 3), state: "before" }); // Wed → Sat Oct 3
    expect(nextTarget(w, local(2026, 10, 4, 10))).toMatchObject({ start: local(2026, 10, 3), state: "during" }); // Sunday
  });

  it("astronomical moments", () => {
    const m = { name: "eq", to: "eq", moments: [Date.UTC(2026, 2, 20, 14, 46), Date.UTC(2027, 2, 20, 20, 25)] };
    expect(nextTarget(m, Date.UTC(2026, 5, 1))).toMatchObject({ start: Date.UTC(2027, 2, 20, 20, 25), state: "before" });
  });

  it("splits durations", () => {
    expect(splitMs(((3 * 24 + 4) * 3600 + 5 * 60 + 6) * 1000 + 999)).toEqual({ d: 3, h: 4, m: 5, s: 6 });
  });
});

describe("event rules", () => {
  const ev = (slug: string) => EVENTS.find((e) => e.slug === slug)!;
  it("Black Friday is the day after the 4th Thursday of November", () => {
    expect(ev("black-friday").dates!(2026)).toEqual([{ y: 2026, m: 11, d: 27 }]);
    expect(ev("thanksgiving").dates!(2027)).toEqual([{ y: 2027, m: 11, d: 25 }]);
  });
  it("Maslenitsa starts 55 days before Orthodox Easter", () => {
    expect(ev("maslenitsa").dates!(2026)).toEqual([{ y: 2026, m: 2, d: 16 }]);
  });
  it("Kazakh holidays", () => {
    // Law No. 306-VIII of 11.06.2026: August 30 → March 15.
    expect(ev("kazakhstan-constitution-day").md).toEqual([3, 15]);
    expect(ev("nauryz").md).toEqual([3, 21]);
    expect(ev("kurban-ait").dates!(2026)).toEqual([{ y: 2026, m: 5, d: 27 }]);
  });
  it("slugs are unique", () => {
    expect(new Set(EVENTS.map((e) => e.slug)).size).toBe(EVENTS.length);
  });
});
