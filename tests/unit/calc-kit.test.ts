import { describe, expect, it } from "vitest";
import { toCsv } from "@/sections/calc/kit/csv";
import { fmtCompact, fmtMoney, fmtN, fmtPct, fmtRound } from "@/sections/calc/kit/fmt";
import { roundTo, tidy, toMinor } from "@/sections/calc/kit/math";
import { field, parseLocaleNumber, readNum, toInput } from "@/sections/calc/kit/num";
import { niceTicks } from "@/sections/calc/kit/ticks";

const plain = (s: string) => s.replace(/[  ]/g, " ");

describe("calc kit: number input", () => {
  it("parses Russian and English input", () => {
    expect(parseLocaleNumber("ru", "1 000,5")).toBe(1000.5);
    expect(parseLocaleNumber("ru", "1,5")).toBe(1.5);
    expect(parseLocaleNumber("ru", "−12,25")).toBe(-12.25);
    expect(parseLocaleNumber("en", "250,000")).toBe(250000);
    expect(parseLocaleNumber("en", "1,234,567.89")).toBe(1234567.89);
    expect(parseLocaleNumber("en", "1.5")).toBe(1.5);
    expect(parseLocaleNumber("ru", "abc")).toBeNull();
  });

  it("validates ranges and integers", () => {
    expect(readNum("ru", "", { min: 0 })).toEqual({ value: null, error: null, empty: true });
    expect(readNum("ru", "-1", { min: 0 }).error).toBe("min");
    expect(readNum("ru", "101", { max: 100 }).error).toBe("max");
    expect(readNum("ru", "2,5", { int: true }).error).toBe("int");
    expect(readNum("ru", "0", { gt: 0 }).error).toBe("gt");
    expect(field("ru", "x").message).toBe("Введите число");
    expect(field("en", "5", { min: 10 }).message).toBe("Must be at least 10");
  });

  it("formats input defaults that round-trip", () => {
    expect(toInput("ru", 1000000)).toBe("1 000 000");
    expect(toInput("ru", 1234.5)).toBe("1 234,5");
    expect(toInput("en", 1234.5)).toBe("1,234.5");
    for (const locale of ["ru", "en"] as const) for (const n of [0, 5, 100, 1000, 250000, 1234567.891, -42.5]) expect(parseLocaleNumber(locale, toInput(locale, n))).toBe(n);
  });
});

describe("calc kit: formatting", () => {
  it("never strips integer zeros", () => {
    expect(plain(fmtN("ru", 100))).toBe("100");
    expect(plain(fmtN("ru", 240))).toBe("240");
    expect(plain(fmtRound("ru", 1000, 0))).toBe("1 000");
    expect(plain(fmtRound("en", 1000.5, 2))).toBe("1,000.5");
  });

  it("formats money and percent", () => {
    expect(plain(fmtMoney("ru", 1234.5, "KZT"))).toBe("1 234,50 ₸");
    expect(plain(fmtMoney("en", 1234.5, "USD"))).toBe("$1,234.50");
    expect(plain(fmtMoney("ru", -10, "RUB", 0))).toBe("−10 ₽");
    expect(plain(fmtPct("ru", 12.5))).toBe("12,5 %");
    expect(fmtPct("en", 12.5)).toBe("12.5%");
    expect(plain(fmtCompact("ru", 1_200_000))).toBe("1,2 млн");
    expect(fmtCompact("en", 45_000)).toBe("45K");
  });

  it("rounds robustly", () => {
    expect(tidy(0.1 + 0.2)).toBe(0.3);
    expect(tidy((1.1 * 7) / 100)).toBe(0.077);
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(-2.675, 2)).toBe(-2.68);
    expect(toMinor(12.345)).toBe(1235);
    expect(toMinor(0.1 + 0.2)).toBe(30);
  });
});

describe("calc kit: ticks and csv", () => {
  it("builds nice ticks", () => {
    expect(niceTicks(0, 97).values).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(0, 1_000_000, 4).values).toEqual([0, 250000, 500000, 750000, 1000000]);
    const t = niceTicks(-3, 7);
    expect(t.min).toBeLessThanOrEqual(-3);
    expect(t.max).toBeGreaterThanOrEqual(7);
  });

  it("writes locale-aware CSV", () => {
    expect(toCsv("ru", [["a", 1.5], ["b;c", 2]])).toBe('﻿a;1,50\r\n"b;c";2\r\n');
    expect(toCsv("en", [["a", 1.5]])).toBe("﻿a,1.50\r\n");
  });
});
