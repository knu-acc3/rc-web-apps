import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { fmtBig } from "../bigint/format";
import { gcdMany, lcmMany } from "../bigint/nt";

function table(locale: Locale): Block {
  const ru = locale === "ru";
  const sets: number[][] = [
    [12, 18],
    [24, 36],
    [48, 180],
    [15, 25],
    [8, 12, 20],
    [14, 21, 35],
    [6, 10, 15],
    [17, 23],
    [84, 126, 210],
  ];
  return {
    type: "table",
    title: ru ? "Примеры НОД и НОК" : "GCD and LCM examples",
    head: ru ? ["Числа", "НОД", "НОК"] : ["Numbers", "GCD", "LCM"],
    rows: sets.map((s) => {
      const b = s.map(BigInt);
      return [s.join(", "), fmtBig(locale, gcdMany(b)), fmtBig(locale, lcmMany(b))];
    }),
  };
}

export const gcdLcmTool: ToolDef = {
  slug: "gcd-lcm-calculator",
  component: "calc/gcd-lcm",
  icon: "Combine",
  name: { ru: "НОД и НОК", en: "GCD and LCM calculator" },
  title: { ru: "НОД и НОК онлайн — калькулятор с алгоритмом Евклида", en: "GCD and LCM calculator with Euclid's algorithm" },
  h1: { ru: "Калькулятор НОД и НОК", en: "GCD and LCM calculator" },
  description: {
    ru: "Найдите наибольший общий делитель и наименьшее общее кратное для двух и более чисел любой длины: НОД(48, 180) = 12, НОК(4, 6, 10) = 60. Шаги алгоритма Евклида.",
    en: "Find the greatest common divisor and least common multiple of two or more integers of any length: gcd(48, 180) = 12, lcm(4, 6, 10) = 60, with Euclid's steps.",
  },
  lead: {
    ru: "НОД(48, 180) = 12, НОК(48, 180) = 720 — калькулятор показывает шаги алгоритма Евклида и разложение на множители.",
    en: "gcd(48, 180) = 12 and lcm(48, 180) = 720 — with Euclid's steps and prime factorizations.",
  },
  keywords: {
    ru: ["НОД", "НОК", "наибольший общий делитель", "наименьшее общее кратное", "алгоритм Евклида"],
    en: ["gcd calculator", "lcm calculator", "greatest common divisor", "least common multiple", "euclidean algorithm"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите два или больше целых чисел через пробел или запятую.",
      "НОД и НОК появятся сразу — даже для очень больших чисел.",
      "Ниже — шаги алгоритма Евклида и разложение чисел на простые множители.",
    ],
    en: [
      "Enter two or more integers separated by spaces or commas.",
      "The GCD and LCM appear instantly — even for very large numbers.",
      "Below are Euclid's steps and the prime factorization of each number.",
    ],
  },
  about: {
    ru: [
      "Наибольший общий делитель ищется алгоритмом Евклида: большее число делят на меньшее с остатком, затем делитель — на остаток, пока остаток не станет нулём. Для 180 и 48: 180 = 48·3 + 36, 48 = 36·1 + 12, 36 = 12·3 + 0 — НОД равен 12.",
      "Наименьшее общее кратное связано с НОД формулой НОК(a, b) = a·b / НОД(a, b). Для нескольких чисел НОД и НОК находят последовательно: НОД(a, b, c) = НОД(НОД(a, b), c). НОК пригодится при сложении дробей — это общий знаменатель.",
    ],
    en: [
      "The GCD is found with Euclid's algorithm: divide the larger number by the smaller, then the divisor by the remainder, until the remainder is zero. For 180 and 48: 180 = 48·3 + 36, 48 = 36·1 + 12, 36 = 12·3 + 0 — the GCD is 12.",
      "The LCM follows from lcm(a, b) = a·b / gcd(a, b). For several numbers both are computed step by step: gcd(a, b, c) = gcd(gcd(a, b), c). The LCM is the common denominator when adding fractions.",
    ],
  },
  faq: {
    ru: [
      { q: "Как найти НОД двух чисел?", a: "Алгоритмом Евклида или через разложение: 48 = 2⁴·3, 180 = 2²·3²·5, общие множители 2²·3 = 12." },
      { q: "Как найти НОК?", a: "НОК = произведение чисел / НОД. Для 48 и 180: 48 × 180 / 12 = 720." },
      { q: "Что значит «взаимно простые числа»?", a: "Их НОД равен 1, например 15 и 28. Тогда НОК равен их произведению." },
    ],
    en: [
      { q: "How do I find the GCD of two numbers?", a: "With Euclid's algorithm or factorization: 48 = 2⁴·3, 180 = 2²·3²·5, common factors 2²·3 = 12." },
      { q: "How do I find the LCM?", a: "LCM = product of the numbers / GCD. For 48 and 180: 48 × 180 / 12 = 720." },
      { q: "What does coprime mean?", a: "Their GCD is 1, as with 15 and 28. Then the LCM equals their product." },
    ],
  },
  related: ["prime-number-checker", "fraction-calculator", "ratio-calculator", "factorial-calculator"],
  blocks: (locale) => [table(locale)],
};
