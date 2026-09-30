import { describe, expect, it } from "vitest";
import { isoOf, parseIso } from "@/sections/calc/kit/dates";
import { cycles, eddFromConception, eddFromIvf, eddFromLmp, eddFromUltrasound, gestationalAge, keyDates, pregnancyMonth, splitWeeks, trimester } from "@/sections/health/engines/cycle";
import { bedtimesFor, hm, hm12, parseHm, wakeTimesFor } from "@/sections/health/engines/sleep";

const d = (s: string) => parseIso(s)!;

describe("pregnancy dating", () => {
  it("Naegele's rule, 28-day cycle: LMP 2026-01-01 → 2026-10-08", () => {
    expect(isoOf(eddFromLmp(d("2026-01-01")))).toBe("2026-10-08");
  });

  it("35-day cycle shifts BOTH the due date and the gestational age by 7 days", () => {
    const edd = eddFromLmp(d("2026-01-01"), 35);
    expect(isoOf(edd)).toBe("2026-10-15");
    // on 2026-03-01: 59 days since LMP − 7 = 52 days = 7 weeks 3 days
    const ga = gestationalAge(edd, d("2026-03-01"));
    expect(ga).toBe(52);
    expect(splitWeeks(ga)).toEqual({ weeks: 7, days: 3 });
  });

  it("conception, IVF and ultrasound dating", () => {
    expect(isoOf(eddFromConception(d("2026-01-15")))).toBe("2026-10-08");
    expect(isoOf(eddFromIvf(d("2026-01-20"), 5))).toBe("2026-10-08");
    expect(isoOf(eddFromIvf(d("2026-01-18"), 3))).toBe("2026-10-08");
    // 8w0d on 2026-03-01 → EDD = scan + 280 − 56 = scan + 224 days
    expect(isoOf(eddFromUltrasound(d("2026-03-01"), 8, 0))).toBe("2026-10-11");
  });

  it("works across leap years", () => {
    expect(isoOf(eddFromLmp(d("2027-06-01")))).toBe("2028-03-07");
  });

  it("trimester boundaries 13+6 / 14+0 / 27+6 / 28+0", () => {
    expect(trimester(13 * 7 + 6)).toBe(1);
    expect(trimester(14 * 7)).toBe(2);
    expect(trimester(27 * 7 + 6)).toBe(2);
    expect(trimester(28 * 7)).toBe(3);
  });

  it("key dates and months", () => {
    const k = keyDates(d("2026-10-08"));
    expect(isoOf(k.conception)).toBe("2026-01-15");
    expect(isoOf(k.postTerm)).toBe("2026-10-22");
    expect(pregnancyMonth(4)).toBe(1);
    expect(pregnancyMonth(12)).toBe(3);
    expect(pregnancyMonth(40)).toBe(9);
  });
});

describe("ovulation", () => {
  it("28-day cycle, LMP 2026-01-01 → ovulation on cycle day 14 (Jan 14), fertile Jan 9–15", () => {
    const c = cycles(d("2026-01-01"), 28, 14, 3);
    expect(isoOf(c[0].ovulation)).toBe("2026-01-14");
    expect(isoOf(c[0].fertileStart)).toBe("2026-01-09");
    expect(isoOf(c[0].fertileEnd)).toBe("2026-01-15");
    expect(isoOf(c[0].nextStart)).toBe("2026-01-29");
    expect(isoOf(c[1].ovulation)).toBe("2026-02-11");
  });

  it("32-day cycle → ovulation on cycle day 18 (32 − 14)", () => {
    const c = cycles(d("2026-01-01"), 32, 14, 1);
    expect(c[0].ovulation - c[0].start + 1).toBe(18);
    // luteal days after ovulation up to the next period = 14
    expect(c[0].nextStart - c[0].ovulation - 1).toBe(14);
  });
});

describe("sleep cycles", () => {
  it("wake at 07:00 → 21:45, 23:15, 00:45, 02:15", () => {
    expect(bedtimesFor(parseHm("07:00")!).map((o) => hm(o.time))).toEqual(["21:45", "23:15", "00:45", "02:15"]);
  });
  it("bed at 23:00 → 03:45, 05:15, 06:45, 08:15 (23:15 + 3…6 × 90 min)", () => {
    expect(wakeTimesFor(parseHm("23:00")!).map((o) => hm(o.time))).toEqual(["03:45", "05:15", "06:45", "08:15"]);
  });
  it("custom cycle and wrap-around", () => {
    expect(bedtimesFor(parseHm("05:00")!, 100, 10, [5]).map((o) => hm(o.time))).toEqual(["20:30"]);
    expect(hm12(parseHm("00:30")!)).toBe("12:30 AM");
    expect(parseHm("25:00")).toBeNull();
  });
});
