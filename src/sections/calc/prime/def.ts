import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { sieve } from "../bigint/nt";

function table(locale: Locale): Block {
  const ru = locale === "ru";
  const limits = [10, 100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000];
  const nf = new Intl.NumberFormat(ru ? "ru-RU" : "en-US");
  return {
    type: "table",
    title: ru ? "Сколько простых чисел до N" : "How many primes are there up to N",
    head: ru ? ["N", "Простых чисел", "Наибольшее"] : ["N", "Primes", "Largest"],
    rows: limits.map((n) => {
      const ps = n <= 1_000_000 ? sieve(n) : null;
      return [nf.format(n), nf.format(ps ? ps.length : 664579), nf.format(ps ? ps[ps.length - 1] : 9999991)];
    }),
  };
}

export const primeTool: ToolDef = {
  slug: "prime-number-checker",
  component: "calc/prime",
  icon: "Hash",
  name: { ru: "Проверка числа на простоту", en: "Prime number checker" },
  title: { ru: "Проверка числа на простоту онлайн и разложение", en: "Prime number checker and prime factorization" },
  h1: { ru: "Простое ли число? Проверка и разложение на множители", en: "Is it prime? Prime checker and factorization" },
  description: {
    ru: "Проверьте, простое ли число — до 300 цифр, тестом Миллера — Рабина (точным для всех 64-битных чисел), разложите составное на множители и найдите все простые до N.",
    en: "Check whether a number is prime — up to 300 digits, with Miller–Rabin (exact for all 64-bit numbers) — factor composites and list every prime up to N.",
  },
  lead: {
    ru: "97 — простое число; 600 851 475 143 = 71 · 839 · 1471 · 6857.",
    en: "97 is prime; 600,851,475,143 = 71 · 839 · 1471 · 6857.",
  },
  keywords: {
    ru: ["простое число", "проверка на простоту", "разложение на простые множители", "таблица простых чисел", "тест Миллера Рабина"],
    en: ["prime number checker", "is it prime", "prime factorization", "list of primes", "miller rabin"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите число — калькулятор сразу скажет, простое оно или составное.",
      "Для составного числа появится разложение на простые множители.",
      "Посмотрите соседние простые числа — предыдущее и следующее.",
      "В режиме «Список» найдите все простые числа до N (до 10 миллионов) и скачайте их.",
    ],
    en: [
      "Enter a number — the calculator tells you instantly whether it is prime.",
      "For a composite number you get its prime factorization.",
      "See the neighbouring primes — the previous and the next one.",
      "In list mode find all primes up to N (up to 10 million) and download them.",
    ],
  },
  about: {
    ru: [
      "Простое число делится только на 1 и на само себя: 2, 3, 5, 7, 11… Для проверки используется тест Миллера — Рабина с 12 основаниями — для чисел меньше 3,3·10²⁴ (в том числе всех 64-битных) он даёт гарантированно верный ответ, в отличие от простых «вероятностных» реализаций.",
      "Разложение на множители выполняется делением на малые простые и методом ро-Полларда, поэтому даже 18-значные числа раскладываются мгновенно. Список простых строится решетом Эратосфена: до миллиона их 78 498.",
    ],
    en: [
      "A prime number is divisible only by 1 and itself: 2, 3, 5, 7, 11… The check uses Miller–Rabin with 12 bases, which is guaranteed correct below 3.3·10²⁴ (including every 64-bit number), unlike simple probabilistic versions.",
      "Factorization uses trial division and Pollard's rho, so even 18-digit numbers are factored instantly. The prime list uses the sieve of Eratosthenes: there are 78,498 primes below one million.",
    ],
  },
  faq: {
    ru: [
      { q: "Является ли 1 простым числом?", a: "Нет. Простое число должно иметь ровно два делителя, а у 1 он один. Наименьшее простое — 2, и это единственное чётное простое число." },
      { q: "Как проверить, простое ли число?", a: "Для небольших чисел достаточно проверить делимость на простые до √n: для 97 это 2, 3, 5 и 7. Для больших чисел используют тест Миллера — Рабина, как в этом калькуляторе." },
      { q: "Сколько простых чисел до 100?", a: "25: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97." },
    ],
    en: [
      { q: "Is 1 a prime number?", a: "No. A prime has exactly two divisors and 1 has only one. The smallest prime is 2, the only even prime." },
      { q: "How do I check if a number is prime?", a: "For small numbers test divisibility by primes up to √n: for 97 that is 2, 3, 5 and 7. For large numbers use the Miller–Rabin test, as this calculator does." },
      { q: "How many primes are there below 100?", a: "25: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97." },
    ],
  },
  related: ["gcd-lcm-calculator", "factorial-calculator", "combination-calculator", "scientific-calculator"],
  blocks: (locale) => [table(locale)],
};
