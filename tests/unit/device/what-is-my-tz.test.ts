import { describe, expect, it } from "vitest";
import { dstInfo, formatOffset, isValidTimeZone, nextTransition, tzOffsetMinutes, utcLabel } from "@/tools/device/what-is-my/lib/tz";

describe("formatOffset", () => {
  it("formats minutes east of UTC as ±HH:MM", () => {
    expect(formatOffset(300)).toBe("+05:00");
    expect(formatOffset(180)).toBe("+03:00");
    expect(formatOffset(0)).toBe("+00:00");
    expect(formatOffset(-210)).toBe("-03:30");
    expect(formatOffset(345)).toBe("+05:45");
    expect(utcLabel(-300)).toBe("UTC-05:00");
  });
});

describe("tzOffsetMinutes", () => {
  it("uses fixed dates, independent of the host zone", () => {
    const winter = new Date("2026-01-15T12:00:00Z");
    const summer = new Date("2026-07-15T12:00:00Z");
    // Kazakhstan switched to a single UTC+5 zone on 1 March 2024.
    expect(formatOffset(tzOffsetMinutes("Asia/Almaty", winter))).toBe("+05:00");
    expect(formatOffset(tzOffsetMinutes("Asia/Almaty", new Date("2023-06-01T00:00:00Z")))).toBe("+06:00");
    expect(formatOffset(tzOffsetMinutes("Europe/Moscow", winter))).toBe("+03:00");
    expect(formatOffset(tzOffsetMinutes("Europe/Moscow", summer))).toBe("+03:00");
    expect(tzOffsetMinutes("America/New_York", winter)).toBe(-300);
    expect(tzOffsetMinutes("America/New_York", summer)).toBe(-240);
    expect(tzOffsetMinutes("Asia/Kathmandu", winter)).toBe(345);
    expect(tzOffsetMinutes("UTC", winter)).toBe(0);
  });

  it("validates zone names", () => {
    expect(isValidTimeZone("Asia/Almaty")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});

describe("DST", () => {
  it("detects zones with and without DST", () => {
    expect(dstInfo("Europe/Moscow", 2026)).toEqual({ observes: false, standard: 180, daylight: null });
    expect(dstInfo("Europe/Berlin", 2026)).toEqual({ observes: true, standard: 60, daylight: 120 });
    // Southern hemisphere: summer time in January.
    expect(dstInfo("Australia/Sydney", 2026)).toEqual({ observes: true, standard: 600, daylight: 660 });
  });

  it("finds the next transition to the minute", () => {
    // EU: last Sunday of October 2026 = 25 Oct, 01:00 UTC.
    const t = nextTransition("Europe/Berlin", new Date("2026-09-30T00:00:00Z"));
    expect(t?.at.toISOString()).toBe("2026-10-25T01:00:00.000Z");
    expect(t?.from).toBe(120);
    expect(t?.to).toBe(60);
    const ny = nextTransition("America/New_York", new Date("2026-01-01T00:00:00Z"));
    expect(ny?.at.toISOString()).toBe("2026-03-08T07:00:00.000Z");
    expect(nextTransition("Asia/Almaty", new Date("2026-01-01T00:00:00Z"))).toBeNull();
  });
});
