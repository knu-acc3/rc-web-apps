import { describe, expect, it } from "vitest";
import { enCardinal, enDecimal, enOrdinal, enOrdinalSuffix } from "@/sections/numbers/words-en";
import { ruCardinal, ruDecimal, ruOrdinal, ruPlural } from "@/sections/numbers/words-ru";
import { parseDecimalInput } from "@/sections/numbers/parse";

describe("Russian cardinal", () => {
  it.each([
    [0, "ноль"],
    [1, "один"],
    [2, "два"],
    [5, "пять"],
    [11, "одиннадцать"],
    [12, "двенадцать"],
    [21, "двадцать один"],
    [40, "сорок"],
    [101, "сто один"],
    [111, "сто одиннадцать"],
    [999, "девятьсот девяносто девять"],
    [1000, "одна тысяча"],
    [1001, "одна тысяча один"],
    [2000, "две тысячи"],
    [2024, "две тысячи двадцать четыре"],
    [5000, "пять тысяч"],
    [11_000, "одиннадцать тысяч"],
    [21_000, "двадцать одна тысяча"],
    [22_000, "двадцать две тысячи"],
    [1_000_000, "один миллион"],
    [2_000_000, "два миллиона"],
    [5_000_000, "пять миллионов"],
    [1_234_567, "один миллион двести тридцать четыре тысячи пятьсот шестьдесят семь"],
    [-15, "минус пятнадцать"],
  ])("%i → %s", (n, words) => {
    expect(ruCardinal(n)).toBe(words);
  });

  it("agrees in gender", () => {
    expect(ruCardinal(1, "f")).toBe("одна");
    expect(ruCardinal(2, "f")).toBe("две");
    expect(ruCardinal(21, "f")).toBe("двадцать одна");
    expect(ruCardinal(1, "n")).toBe("одно");
    expect(ruCardinal(2, "n")).toBe("два");
    expect(ruCardinal(12, "f")).toBe("двенадцать");
  });

  it("handles quadrillions exactly", () => {
    expect(ruCardinal(10n ** 15n)).toBe("один квадриллион");
    expect(ruCardinal(999_999_999_999_999_999n)).toMatch(/^девятьсот девяносто девять квадриллионов .* девятьсот девяносто девять$/);
    expect(() => ruCardinal(10n ** 18n)).toThrow();
  });

  it("plural forms", () => {
    const f = ["рубль", "рубля", "рублей"] as const;
    expect([1, 2, 5, 11, 12, 14, 21, 22, 25, 101, 111, 0].map((n) => ruPlural(n, f))).toEqual([
      "рубль", "рубля", "рублей", "рублей", "рублей", "рублей", "рубль", "рубля", "рублей", "рубль", "рублей", "рублей",
    ]);
  });
});

describe("Russian ordinal", () => {
  it.each([
    [0, "нулевой"],
    [1, "первый"],
    [2, "второй"],
    [3, "третий"],
    [4, "четвёртый"],
    [7, "седьмой"],
    [11, "одиннадцатый"],
    [20, "двадцатый"],
    [21, "двадцать первый"],
    [40, "сороковой"],
    [90, "девяностый"],
    [100, "сотый"],
    [101, "сто первый"],
    [200, "двухсотый"],
    [1000, "тысячный"],
    [2000, "двухтысячный"],
    [2024, "две тысячи двадцать четвёртый"],
    [21_000, "двадцатиоднотысячный"],
    [40_000, "сорокатысячный"],
    [100_000, "стотысячный"],
    [1_000_000, "миллионный"],
    [3_000_000, "трёхмиллионный"],
    [1_002_000, "один миллион двухтысячный"],
  ])("%i → %s", (n, words) => {
    expect(ruOrdinal(n)).toBe(words);
  });

  it("agrees in gender", () => {
    expect(ruOrdinal(3, "f")).toBe("третья");
    expect(ruOrdinal(3, "n")).toBe("третье");
    expect(ruOrdinal(2, "f")).toBe("вторая");
    expect(ruOrdinal(1000, "f")).toBe("тысячная");
    expect(ruOrdinal(22, "n")).toBe("двадцать второе");
  });
});

describe("Russian decimals", () => {
  it.each([
    ["0.5", "ноль целых пять десятых"],
    ["1.5", "одна целая пять десятых"],
    ["2.25", "две целых двадцать пять сотых"],
    ["21.21", "двадцать одна целая двадцать одна сотая"],
    ["3.001", "три целых одна тысячная"],
    ["0.0002", "ноль целых две десятитысячных"],
    ["-1.1", "минус одна целая одна десятая"],
  ])("%s → %s", (text, words) => {
    const d = parseDecimalInput(text)!;
    expect(ruDecimal(d.int, d.frac, d.neg)).toBe(words);
  });
});

describe("English", () => {
  it.each([
    [0, "zero"],
    [13, "thirteen"],
    [21, "twenty-one"],
    [105, "one hundred five"],
    [1000, "one thousand"],
    [2024, "two thousand twenty-four"],
    [1_000_001, "one million one"],
    [1_234_567, "one million two hundred thirty-four thousand five hundred sixty-seven"],
  ])("%i → %s", (n, w) => {
    expect(enCardinal(n)).toBe(w);
  });

  it("British and", () => {
    expect(enCardinal(123, { british: true })).toBe("one hundred and twenty-three");
    expect(enCardinal(1005, { british: true })).toBe("one thousand and five");
    expect(enCardinal(2100, { british: true })).toBe("two thousand one hundred");
  });

  it.each([
    [1, "first"],
    [2, "second"],
    [3, "third"],
    [5, "fifth"],
    [8, "eighth"],
    [9, "ninth"],
    [12, "twelfth"],
    [20, "twentieth"],
    [21, "twenty-first"],
    [100, "one hundredth"],
    [2024, "two thousand twenty-fourth"],
    [1_000_000, "one millionth"],
  ])("ordinal %i → %s", (n, w) => {
    expect(enOrdinal(n)).toBe(w);
  });

  it("suffixes and decimals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111].map(enOrdinalSuffix)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "101st", "111th"]);
    expect(enDecimal(3n, "14")).toBe("three point one four");
  });
});

describe("parseDecimalInput", () => {
  it("parses locale formats exactly", () => {
    expect(parseDecimalInput("1 234 567,89")).toEqual({ neg: false, int: 1234567n, frac: "89" });
    expect(parseDecimalInput("1,234,567.89")).toEqual({ neg: false, int: 1234567n, frac: "89" });
    expect(parseDecimalInput("−12.50")).toEqual({ neg: true, int: 12n, frac: "50" });
    expect(parseDecimalInput("999999999999999999")).toEqual({ neg: false, int: 999999999999999999n, frac: "" });
    expect(parseDecimalInput("abc")).toBeNull();
    expect(parseDecimalInput("1.2.3")).toBeNull();
  });
});
