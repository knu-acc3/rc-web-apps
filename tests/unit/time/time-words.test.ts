import { describe, expect, it } from "vitest";
import { dragMinute, enSpoken, handAngles, ruOfficial, ruSpoken } from "@/tools/time/time/lib/words";

describe("time in words (ru)", () => {
  it.each([
    [15, 40, "без двадцати четыре"],
    [3, 40, "без двадцати четыре"],
    [2, 15, "четверть третьего"],
    [4, 30, "половина пятого"],
    [3, 45, "без четверти четыре"],
    [3, 10, "десять минут четвёртого"],
    [3, 1, "одна минута четвёртого"],
    [3, 22, "двадцать две минуты четвёртого"],
    [3, 55, "без пяти четыре"],
    [3, 58, "без двух минут четыре"],
    [3, 59, "без одной минуты четыре"],
    [12, 40, "без двадцати час"],
    [0, 15, "четверть первого"],
    [11, 30, "половина двенадцатого"],
    [23, 45, "без четверти двенадцать"],
    [3, 0, "ровно три"],
    [13, 0, "ровно час"],
    [12, 0, "полдень"],
    [0, 0, "полночь"],
  ])("%i:%i → %s", (h, m, s) => expect(ruSpoken(h, m)).toBe(s));

  it("says the official time", () => {
    expect(ruOfficial(15, 40)).toBe("пятнадцать часов сорок минут");
    expect(ruOfficial(21, 1)).toBe("двадцать один час одна минута");
    expect(ruOfficial(22, 32)).toBe("двадцать два часа тридцать две минуты");
    expect(ruOfficial(0, 5)).toBe("ноль часов пять минут");
    expect(ruOfficial(14, 0)).toBe("четырнадцать часов ровно");
  });
});

describe("time in words (en)", () => {
  it.each([
    [3, 40, "twenty to four"],
    [3, 15, "quarter past three"],
    [3, 30, "half past three"],
    [3, 45, "quarter to four"],
    [3, 7, "seven minutes past three"],
    [3, 1, "one minute past three"],
    [3, 35, "twenty-five to four"],
    [12, 40, "twenty to one"],
    [15, 0, "three o'clock"],
  ])("%i:%i → %s", (h, m, s) => expect(enSpoken(h, m)).toBe(s));
});

describe("clock hands", () => {
  it("moves the hour hand between numbers", () => {
    expect(handAngles(2, 30)).toEqual({ hour: 75, minute: 180 });
  });
  it("carries the hour when the minute hand passes 12", () => {
    expect(dragMinute(3 * 60 + 50, 30)).toBe(4 * 60 + 5);
    expect(dragMinute(4 * 60 + 5, 330)).toBe(3 * 60 + 55);
    expect(dragMinute(3 * 60 + 20, 180)).toBe(3 * 60 + 30);
    expect(dragMinute(23 * 60 + 55, 6)).toBe(1);
  });
});
