import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { fmtBig } from "../bigint/format";
import { factorial, factorialDigits, factorialZeros } from "../bigint/nt";

function table(locale: Locale): Block {
  const ru = locale === "ru";
  const ns = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20];
  return {
    type: "table",
    title: ru ? "Таблица факториалов" : "Factorial table",
    head: ["n", "n!"],
    rows: ns.map((n) => [String(n), fmtBig(locale, factorial(n))]),
  };
}

function bigTable(locale: Locale): Block {
  const ru = locale === "ru";
  const ns = [50, 100, 500, 1000, 10000, 100000, 1000000];
  return {
    type: "table",
    title: ru ? "Сколько цифр в больших факториалах" : "Digits in large factorials",
    head: ru ? ["n", "Цифр в n!", "Нулей в конце"] : ["n", "Digits in n!", "Trailing zeros"],
    rows: ns.map((n) => [fmtBig(locale, BigInt(n)), fmtBig(locale, BigInt(factorialDigits(n))), fmtBig(locale, BigInt(factorialZeros(n)))]),
  };
}

export const factorialTool: ToolDef = {
  slug: "factorial-calculator",
  component: "calc/factorial",
  icon: "CircleAlert",
  name: { ru: "Калькулятор факториала", en: "Factorial calculator" },
  title: { ru: "Калькулятор факториала онлайн — точное значение n!", en: "Factorial calculator — exact value of n!" },
  h1: { ru: "Факториал числа онлайн", en: "Factorial calculator" },
  description: {
    ru: "Точное значение факториала до 20 000!, число цифр и нулей в конце для n до миллиарда, двойной факториал n!!. 20! = 2 432 902 008 176 640 000, у 100! — 158 цифр.",
    en: "Exact factorials up to 20,000!, digit count and trailing zeros for n up to a billion, and double factorials n!!. 20! = 2,432,902,008,176,640,000; 100! has 158 digits.",
  },
  lead: {
    ru: "10! = 3 628 800; 100! — число из 158 цифр, которое заканчивается 24 нулями.",
    en: "10! = 3,628,800; 100! is a 158-digit number ending in 24 zeros.",
  },
  keywords: {
    ru: ["факториал", "n!", "калькулятор факториала", "факториал 100", "двойной факториал"],
    en: ["factorial calculator", "n factorial", "100 factorial", "double factorial"],
  },
  props: { n: 20 },
  howTo: {
    ru: ["Введите целое число n от 0.", "Сразу появятся значение n!, количество цифр и нулей в конце.", "Точное значение можно скопировать; для двойного факториала переключите вид на n!!."],
    en: ["Enter a whole number n from 0.", "The value of n!, its digit count and trailing zeros appear instantly.", "Copy the exact value; switch to n!! for the double factorial."],
  },
  about: {
    ru: [
      "Факториал n! — произведение всех натуральных чисел от 1 до n; по определению 0! = 1. Он растёт очень быстро: 10! — уже 3,6 миллиона, 20! — больше 2 квинтиллионов, а 70! превышает гугол (10¹⁰⁰).",
      "Калькулятор считает точно, целыми числами любой длины. Количество нулей в конце n! равно числу пятёрок в разложении: ⌊n/5⌋ + ⌊n/25⌋ + … — у 1000! их 249.",
    ],
    en: [
      "The factorial n! is the product of all whole numbers from 1 to n, with 0! = 1 by definition. It grows extremely fast: 10! is 3.6 million, 20! exceeds 2 quintillion and 70! is larger than a googol (10¹⁰⁰).",
      "The calculator is exact, using integers of any length. The number of trailing zeros equals the number of factors 5: ⌊n/5⌋ + ⌊n/25⌋ + … — 1000! has 249.",
    ],
  },
  faq: {
    ru: [
      { q: "Чему равен 0!?", a: "Единице. Так договорились, чтобы формулы комбинаторики работали и для пустого набора: способов упорядочить 0 предметов — один." },
      { q: "Сколько нулей в конце 100!?", a: "24: ⌊100/5⌋ + ⌊100/25⌋ = 20 + 4. Каждый ноль даёт пара множителей 2 и 5, а пятёрок меньше, чем двоек." },
      { q: "Что такое двойной факториал?", a: "Произведение чисел той же чётности, что и n: 7!! = 7 · 5 · 3 · 1 = 105, 8!! = 8 · 6 · 4 · 2 = 384." },
    ],
    en: [
      { q: "What is 0!?", a: "One. By convention, so that combinatorics formulas work for the empty set: there is exactly one way to arrange zero items." },
      { q: "How many trailing zeros does 100! have?", a: "24: ⌊100/5⌋ + ⌊100/25⌋ = 20 + 4. Each zero comes from a pair of factors 2 and 5, and fives are scarcer." },
      { q: "What is a double factorial?", a: "The product of numbers with the same parity as n: 7!! = 7 · 5 · 3 · 1 = 105, 8!! = 8 · 6 · 4 · 2 = 384." },
    ],
  },
  related: ["combination-calculator", "prime-number-checker", "scientific-calculator", "gcd-lcm-calculator"],
  blocks: (locale) => [table(locale), bigTable(locale)],
};
