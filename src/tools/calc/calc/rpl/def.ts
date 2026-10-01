import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { fmtBig } from "../bigint/format";
import { fmtN } from "../../shared/fmt";
import { logBase, nthRoot } from "./engine";

function rootsTable(locale: Locale): Block {
  const ru = locale === "ru";
  const xs = [2, 3, 5, 8, 10, 16, 20, 27, 50, 64, 100, 1000];
  return {
    type: "table",
    title: ru ? "Квадратные и кубические корни" : "Square and cube roots",
    head: ["x", "√x", "∛x"],
    rows: xs.map((x) => [String(x), fmtN(locale, nthRoot(x, 2), 6), fmtN(locale, nthRoot(x, 3), 6)]),
  };
}

function powersTable(locale: Locale): Block {
  const ru = locale === "ru";
  const bases = [2, 3, 5, 10];
  const exps = [2, 3, 5, 8, 10, 16, 20];
  return {
    type: "table",
    title: ru ? "Таблица степеней" : "Table of powers",
    head: [ru ? "Показатель" : "Exponent", ...bases.map((b) => `${b}ⁿ`)],
    rows: exps.map((e) => [String(e), ...bases.map((b) => fmtBig(locale, BigInt(b) ** BigInt(e)))]),
  };
}

function logsTable(locale: Locale): Block {
  const ru = locale === "ru";
  const xs = [2, 3, 5, 10, 50, 100, 1000, 1024];
  return {
    type: "table",
    title: ru ? "Логарифмы частых чисел" : "Logarithms of common numbers",
    head: ["x", "lg x", "ln x", "log₂ x"],
    rows: xs.map((x) => [String(x), fmtN(locale, logBase(x, 10), 6), fmtN(locale, logBase(x, Math.E), 6), fmtN(locale, logBase(x, 2), 6)]),
  };
}

export const rootTool: ToolDef = {
  slug: "root-calculator",
  component: "calc/rpl",
  icon: "Radical",
  name: { ru: "Калькулятор корней", en: "Root calculator" },
  title: { ru: "Калькулятор корней онлайн — квадратный, кубический, n-й", en: "Root calculator — square, cube and nth roots" },
  h1: { ru: "Калькулятор корней", en: "Root calculator" },
  description: {
    ru: "Извлеките квадратный, кубический или корень любой степени из числа и упростите корень: √72 = 6√2 ≈ 8,485. Кубический корень из отрицательного числа тоже.",
    en: "Take the square, cube or any nth root of a number and simplify the radical: √72 = 6√2 ≈ 8.485. Cube roots of negative numbers work too.",
  },
  lead: { ru: "√72 = 6√2 ≈ 8,485281; ³√−27 = −3.", en: "√72 = 6√2 ≈ 8.485281; ³√−27 = −3." },
  keywords: { ru: ["квадратный корень", "кубический корень", "корень n степени", "извлечь корень", "упростить корень"], en: ["square root calculator", "cube root", "nth root", "simplify radical"] },
  props: { mode: "root" },
  howTo: {
    ru: ["Введите число и степень корня: 2 — квадратный, 3 — кубический.", "Результат и упрощённый вид корня появятся сразу.", "Проверка показывает, что корень в степени n даёт исходное число."],
    en: ["Enter the number and the root degree: 2 for square, 3 for cube.", "The result and the simplified radical appear instantly.", "The check raises the root back to the power n."],
  },
  about: {
    ru: [
      "Корень n-й степени из x — число, которое в степени n даёт x. Квадратный корень из 72 не извлекается нацело, но его можно упростить: 72 = 36 · 2, поэтому √72 = 6√2.",
      "Корень чётной степени из отрицательного числа не существует среди действительных чисел, а нечётной — существует: ³√−8 = −2.",
    ],
    en: [
      "The nth root of x is the number that gives x when raised to the power n. √72 is not a whole number but simplifies: 72 = 36 · 2, so √72 = 6√2.",
      "Even roots of negative numbers are not real numbers, while odd roots are: ³√−8 = −2.",
    ],
  },
  faq: {
    ru: [
      { q: "Как извлечь квадратный корень без калькулятора?", a: "Найдите ближайшие полные квадраты: √50 между 7 (49) и 8 (64), ближе к 7 — ≈ 7,07. Или упростите: √50 = √(25·2) = 5√2." },
      { q: "Как вычислить корень n-й степени?", a: "Это число в степени 1/n: ⁵√32 = 32^(1/5) = 2." },
      { q: "Как упростить корень?", a: "Разложите подкоренное число на множители и вынесите полные квадраты: √48 = √(16 · 3) = 4√3. Калькулятор делает это автоматически для целых чисел." },
    ],
    en: [
      { q: "How do I estimate a square root by hand?", a: "Find the nearest perfect squares: √50 is between 7 (49) and 8 (64), close to 7 — ≈ 7.07. Or simplify: √50 = √(25·2) = 5√2." },
      { q: "How do I compute an nth root?", a: "Raise the number to the power 1/n: ⁵√32 = 32^(1/5) = 2." },
      { q: "How do I simplify a square root?", a: "Factor the number and take out perfect squares: √48 = √(16 · 3) = 4√3. The calculator does this automatically for whole numbers." },
    ],
  },
  related: ["exponent-calculator", "logarithm-calculator", "scientific-calculator", "equation-solver"],
  blocks: (locale) => [rootsTable(locale)],
};

export const exponentTool: ToolDef = {
  slug: "exponent-calculator",
  component: "calc/rpl",
  icon: "Superscript",
  name: { ru: "Калькулятор степеней", en: "Exponent calculator" },
  title: { ru: "Возведение в степень онлайн — точный калькулятор степеней", en: "Exponent calculator — exact powers online" },
  h1: { ru: "Возведение числа в степень", en: "Exponent calculator" },
  description: {
    ru: "Возведите число в любую степень — целую, дробную или отрицательную. Целые степени целых чисел считаются точно: 2¹⁰⁰ = 1 267 650 600 228 229 401 496 703 205 376.",
    en: "Raise a number to any power — whole, fractional or negative. Whole powers of integers are exact: 2¹⁰⁰ = 1,267,650,600,228,229,401,496,703,205,376.",
  },
  lead: { ru: "2¹⁰ = 1024, 10⁻² = 0,01, 8^(1/3) = 2.", en: "2¹⁰ = 1024, 10⁻² = 0.01, 8^(1/3) = 2." },
  keywords: { ru: ["возведение в степень", "калькулятор степеней", "степень числа", "2 в степени"], en: ["exponent calculator", "power calculator", "raise to a power"] },
  props: { mode: "power" },
  howTo: {
    ru: ["Введите основание и показатель степени.", "Для целых чисел ответ точный, даже если в нём тысячи цифр.", "Дробный показатель — это корень, отрицательный — обратная величина."],
    en: ["Enter the base and the exponent.", "For integers the answer is exact, even with thousands of digits.", "A fractional exponent is a root, a negative one a reciprocal."],
  },
  about: {
    ru: [
      "Степень aᵇ — это a, умноженное само на себя b раз. Отрицательный показатель даёт обратную величину (2⁻³ = 1/8), дробный — корень (8^(1/3) = 2), а любое число в нулевой степени равно 1.",
      "Калькулятор считает целые степени целых чисел без округления, поэтому 3⁵⁰ или 2²⁰⁰ получаются точно до последней цифры.",
    ],
    en: [
      "The power aᵇ is a multiplied by itself b times. A negative exponent gives a reciprocal (2⁻³ = 1/8), a fractional one a root (8^(1/3) = 2), and any number to the power 0 is 1.",
      "Whole powers of integers are computed without rounding, so 3⁵⁰ or 2²⁰⁰ are exact to the last digit.",
    ],
  },
  faq: {
    ru: [
      { q: "Чему равно число в нулевой степени?", a: "Единице для любого ненулевого числа: 5⁰ = 1. Выражение 0⁰ в большинстве контекстов тоже считают равным 1." },
      { q: "Что значит отрицательная степень?", a: "Это единица, делённая на положительную степень: 10⁻³ = 1 / 1000 = 0,001." },
      { q: "Сколько будет 2 в 10 степени?", a: "2¹⁰ = 1024. Степени двойки удваиваются: 2⁸ = 256, 2⁹ = 512, 2¹⁰ = 1024." },
    ],
    en: [
      { q: "What is a number to the power zero?", a: "One for any non-zero number: 5⁰ = 1. 0⁰ is also taken as 1 in most contexts." },
      { q: "What does a negative exponent mean?", a: "One divided by the positive power: 10⁻³ = 1 / 1000 = 0.001." },
      { q: "What is 2 to the power of 10?", a: "2¹⁰ = 1024. Powers of two double each time: 2⁸ = 256, 2⁹ = 512, 2¹⁰ = 1024." },
    ],
  },
  related: ["root-calculator", "logarithm-calculator", "scientific-calculator", "factorial-calculator"],
  blocks: (locale) => [powersTable(locale)],
};

export const logarithmTool: ToolDef = {
  slug: "logarithm-calculator",
  component: "calc/rpl",
  icon: "FunctionSquare",
  name: { ru: "Калькулятор логарифмов", en: "Logarithm calculator" },
  title: { ru: "Калькулятор логарифмов онлайн — ln, lg, log₂ и любое основание", en: "Logarithm calculator — ln, log10, log2 and any base" },
  h1: { ru: "Калькулятор логарифмов", en: "Logarithm calculator" },
  description: {
    ru: "Найдите логарифм числа по основанию 10, e, 2 или любому другому: log₂ 1024 = 10, lg 1000 = 3, ln e = 1. Сразу показаны натуральный, десятичный и двоичный логарифмы.",
    en: "Find the logarithm of a number to base 10, e, 2 or any other: log₂ 1024 = 10, log₁₀ 1000 = 3, ln e = 1, with the natural, common and binary logs shown together.",
  },
  lead: { ru: "lg 1000 = 3, потому что 10³ = 1000; ln 1000 ≈ 6,9078.", en: "log₁₀ 1000 = 3 because 10³ = 1000; ln 1000 ≈ 6.9078." },
  keywords: { ru: ["логарифм", "калькулятор логарифмов", "натуральный логарифм", "десятичный логарифм", "log2"], en: ["logarithm calculator", "natural log", "log base 2", "log base 10"] },
  props: { mode: "log" },
  howTo: {
    ru: ["Введите число x больше нуля.", "Выберите основание: 10, e, 2 или своё.", "Логарифм и три стандартных логарифма появятся сразу."],
    en: ["Enter a number x greater than zero.", "Choose the base: 10, e, 2 or your own.", "The logarithm and the three standard logs appear instantly."],
  },
  about: {
    ru: [
      "Логарифм logₐ x показывает, в какую степень нужно возвести основание a, чтобы получить x: log₂ 8 = 3, потому что 2³ = 8. Десятичный логарифм обозначают lg, натуральный (по основанию e ≈ 2,71828) — ln.",
      "Логарифм по любому основанию выражается через натуральный: logₐ x = ln x / ln a. Логарифм определён только для положительных x и оснований, отличных от 1.",
    ],
    en: [
      "The logarithm logₐ x is the power to which the base a must be raised to give x: log₂ 8 = 3 because 2³ = 8. The common log uses base 10 and the natural log (ln) base e ≈ 2.71828.",
      "Any base can be written through the natural log: logₐ x = ln x / ln a. Logarithms are defined only for positive x and bases other than 1.",
    ],
  },
  faq: {
    ru: [
      { q: "Чем ln отличается от lg?", a: "ln — логарифм по основанию e ≈ 2,718, lg — по основанию 10. Например, ln 100 ≈ 4,605, а lg 100 = 2." },
      { q: "Как посчитать логарифм по основанию 2?", a: "Разделите натуральный логарифм числа на ln 2: log₂ 1000 = ln 1000 / ln 2 ≈ 9,966." },
      { q: "Почему нельзя взять логарифм от нуля или отрицательного числа?", a: "Положительное основание в любой степени даёт положительное число, поэтому нет такой степени, которая дала бы 0 или −5." },
    ],
    en: [
      { q: "What is the difference between ln and log?", a: "ln uses base e ≈ 2.718, log (common) uses base 10. For example, ln 100 ≈ 4.605 while log 100 = 2." },
      { q: "How do I compute a base-2 logarithm?", a: "Divide the natural log by ln 2: log₂ 1000 = ln 1000 / ln 2 ≈ 9.966." },
      { q: "Why is there no logarithm of zero or a negative number?", a: "A positive base raised to any power is positive, so no power gives 0 or −5." },
    ],
  },
  related: ["exponent-calculator", "root-calculator", "scientific-calculator", "graphing-calculator"],
  blocks: (locale) => [logsTable(locale)],
};
