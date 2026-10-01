import type { Locale } from "@/i18n/config";

/** Memorisation tips per number (2–20), shared by the tool and the variant pages. */
export function tableTip(locale: Locale, n: number): string {
  const ru = locale === "ru";
  const tips: Record<number, [string, string]> = {
    2: ["Умножить на 2 — значит сложить число с самим собой: 2 × 7 = 7 + 7 = 14. Все ответы чётные.", "Multiplying by 2 means adding a number to itself: 2 × 7 = 7 + 7 = 14. Every answer is even."],
    3: ["Сумма цифр каждого ответа делится на 3: 3 × 8 = 24, 2 + 4 = 6.", "The digit sum of every answer is divisible by 3: 3 × 8 = 24, 2 + 4 = 6."],
    4: ["Удвойте дважды: 4 × 7 = 7 × 2 × 2 = 28.", "Double it twice: 4 × 7 = 7 × 2 × 2 = 28."],
    5: ["Ответы оканчиваются на 0 или 5; 5 × n — это половина от 10 × n: 5 × 8 = 80 / 2 = 40.", "Answers end in 0 or 5; 5 × n is half of 10 × n: 5 × 8 = 80 / 2 = 40."],
    6: ["6 × n = 5 × n + n: 6 × 7 = 35 + 7 = 42. Для чётных n ответ оканчивается той же цифрой: 6 × 4 = 24, 6 × 8 = 48.", "6 × n = 5 × n + n: 6 × 7 = 35 + 7 = 42. For even n the answer ends in the same digit: 6 × 4 = 24, 6 × 8 = 48."],
    7: ["Простого правила нет, но почти все ответы уже знакомы по другим столбцам. Новых остаётся три: 7 × 7 = 49, 7 × 8 = 56, 7 × 9 = 63.", "There is no simple trick, but most answers appear in other columns. Only three are new: 7 × 7 = 49, 7 × 8 = 56, 7 × 9 = 63."],
    8: ["Удвойте три раза: 8 × 6 = 6 → 12 → 24 → 48.", "Double three times: 8 × 6 = 6 → 12 → 24 → 48."],
    9: ["Сумма цифр ответа равна 9, а первая цифра на единицу меньше множителя: 9 × 7 = 63 (6 = 7 − 1, 6 + 3 = 9).", "The digits of the answer add up to 9 and the first digit is one less than the multiplier: 9 × 7 = 63 (6 = 7 − 1, 6 + 3 = 9)."],
    10: ["Припишите ноль: 10 × 7 = 70.", "Add a zero: 10 × 7 = 70."],
    11: ["Для 1–9 цифра повторяется: 11 × 7 = 77. Для двузначных сложите цифры и поставьте сумму в середину: 11 × 23 = 2(2+3)3 = 253.", "For 1–9 the digit repeats: 11 × 7 = 77. For two-digit numbers put the sum of the digits in the middle: 11 × 23 = 2(2+3)3 = 253."],
    12: ["12 × n = 10 × n + 2 × n: 12 × 7 = 70 + 14 = 84.", "12 × n = 10 × n + 2 × n: 12 × 7 = 70 + 14 = 84."],
    13: ["13 × n = 10 × n + 3 × n: 13 × 6 = 60 + 18 = 78.", "13 × n = 10 × n + 3 × n: 13 × 6 = 60 + 18 = 78."],
    14: ["14 × n = 10 × n + 4 × n: 14 × 7 = 70 + 28 = 98. Или удвойте ответ на 7: 7 × 7 = 49 → 98.", "14 × n = 10 × n + 4 × n: 14 × 7 = 70 + 28 = 98. Or double the 7 times table: 7 × 7 = 49 → 98."],
    15: ["15 × n = 10 × n + половина от 10 × n: 15 × 6 = 60 + 30 = 90.", "15 × n = 10 × n + half of 10 × n: 15 × 6 = 60 + 30 = 90."],
    16: ["16 × n = 10 × n + 6 × n, или удвойте 8 × n: 16 × 7 = 56 × 2 = 112.", "16 × n = 10 × n + 6 × n, or double 8 × n: 16 × 7 = 56 × 2 = 112."],
    17: ["17 × n = 10 × n + 7 × n: 17 × 6 = 60 + 42 = 102.", "17 × n = 10 × n + 7 × n: 17 × 6 = 60 + 42 = 102."],
    18: ["18 × n = 20 × n − 2 × n: 18 × 7 = 140 − 14 = 126.", "18 × n = 20 × n − 2 × n: 18 × 7 = 140 − 14 = 126."],
    19: ["19 × n = 20 × n − n: 19 × 7 = 140 − 7 = 133.", "19 × n = 20 × n − n: 19 × 7 = 140 − 7 = 133."],
    20: ["Умножьте на 2 и припишите ноль: 20 × 7 = 14 → 140.", "Multiply by 2 and add a zero: 20 × 7 = 14 → 140."],
  };
  return tips[n]?.[ru ? 0 : 1] ?? "";
}
