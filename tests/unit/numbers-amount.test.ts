import { describe, expect, it } from "vitest";
import { amountEn, amountRu, currencyByCode, parseMoney, type Money } from "@/sections/numbers/amount";

const RUB = currencyByCode.get("RUB")!;
const KZT = currencyByCode.get("KZT")!;
const USD = currencyByCode.get("USD")!;
const UAH = currencyByCode.get("UAH")!;
const money = (s: string): Money => {
  const p = parseMoney(s);
  if (!p.ok) throw new Error(s);
  return p.money;
};

describe("amount in words (ru)", () => {
  it("1 234 567,89 ₽", () => {
    expect(amountRu(money("1 234 567,89"), RUB, { minor: "words", wrap: "none", capitalize: true })).toBe(
      "Один миллион двести тридцать четыре тысячи пятьсот шестьдесят семь рублей восемьдесят девять копеек",
    );
    expect(amountRu(money("1234567.89"), RUB, { minor: "digits", wrap: "none", capitalize: true })).toBe(
      "Один миллион двести тридцать четыре тысячи пятьсот шестьдесят семь рублей 89 копеек",
    );
  });

  it("1 234 567,89 ₸", () => {
    expect(amountRu(money("1 234 567,89"), KZT, { minor: "words", wrap: "none", capitalize: true })).toBe(
      "Один миллион двести тридцать четыре тысячи пятьсот шестьдесят семь тенге восемьдесят девять тиынов",
    );
    expect(amountRu(money("21,21"), KZT, { minor: "words", wrap: "none", capitalize: false })).toBe("двадцать один тенге двадцать один тиын");
  });

  it("agreement of rubles and kopecks", () => {
    const o = { minor: "words", wrap: "none", capitalize: false } as const;
    expect(amountRu(money("1.01"), RUB, o)).toBe("один рубль одна копейка");
    expect(amountRu(money("2.02"), RUB, o)).toBe("два рубля две копейки");
    expect(amountRu(money("5.05"), RUB, o)).toBe("пять рублей пять копеек");
    expect(amountRu(money("11.11"), RUB, o)).toBe("одиннадцать рублей одиннадцать копеек");
    expect(amountRu(money("21.21"), RUB, o)).toBe("двадцать один рубль двадцать одна копейка");
    expect(amountRu(money("101"), RUB, o)).toBe("сто один рубль ноль копеек");
    expect(amountRu(money("2000"), RUB, { ...o, minor: "none" })).toBe("две тысячи рублей");
    expect(amountRu(money("2 000 000"), RUB, { ...o, minor: "none" })).toBe("два миллиона рублей");
    expect(amountRu(money("22"), UAH, { ...o, minor: "none" })).toBe("двадцать две гривны");
  });

  it("formats", () => {
    expect(amountRu(money("100"), RUB, { minor: "digits", wrap: "paren", capitalize: true })).toBe("(Сто рублей 00 копеек)");
    expect(amountRu(money("1500.5"), RUB, { minor: "digits", wrap: "contract", capitalize: false })).toBe("1 500 (одна тысяча пятьсот) рублей 50 копеек");
    expect(amountRu(money("1000"), USD, { minor: "digits", wrap: "none", capitalize: true })).toBe("Одна тысяча долларов США 00 центов");
  });

  it("rounds to kopecks half-up with exact decimals", () => {
    expect(money("0.125")).toEqual({ major: 0n, minor: 13, rounded: true });
    expect(money("9.999")).toEqual({ major: 10n, minor: 0, rounded: true });
    expect(money("1,1")).toEqual({ major: 1n, minor: 10, rounded: false });
    expect(parseMoney("-5")).toEqual({ ok: false, error: "negative" });
    expect(parseMoney("abc")).toEqual({ ok: false, error: "invalid" });
  });
});

describe("amount in words (en)", () => {
  it("dollars and cents", () => {
    expect(amountEn(money("1234.56"), USD, { minor: "words", wrap: "none", capitalize: true })).toBe(
      "One thousand two hundred thirty-four dollars and fifty-six cents",
    );
    expect(amountEn(money("1"), USD, { minor: "digits", wrap: "none", capitalize: true })).toBe("One dollar and 00/100");
    expect(amountEn(money("1 234 567,89"), KZT, { minor: "words", wrap: "none", capitalize: true })).toBe(
      "One million two hundred thirty-four thousand five hundred sixty-seven tenge and eighty-nine tiyn",
    );
  });
});
