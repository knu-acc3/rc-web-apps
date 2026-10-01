import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { fmtBig } from "../bigint/format";
import { nCr } from "../bigint/nt";

function pascal(locale: Locale): Block {
  const ru = locale === "ru";
  return {
    type: "table",
    title: ru ? "Число сочетаний C(n, k) — треугольник Паскаля" : "Combinations C(n, k) — Pascal's triangle",
    head: ["n \\ k", "0", "1", "2", "3", "4", "5", "6"],
    rows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => [String(n), ...[0, 1, 2, 3, 4, 5, 6].map((k) => (k <= n ? fmtBig(locale, nCr(n, k)) : ""))]),
  };
}

export const combinatoricsTool: ToolDef = {
  slug: "combination-calculator",
  component: "calc/combinatorics",
  icon: "Shuffle",
  name: { ru: "Калькулятор сочетаний и размещений", en: "Combination and permutation calculator" },
  title: { ru: "Сочетания и размещения онлайн — калькулятор комбинаторики", en: "Combination and permutation calculator (nCr, nPr)" },
  h1: { ru: "Калькулятор сочетаний, размещений и перестановок", en: "Combinations and permutations calculator" },
  description: {
    ru: "Посчитайте сочетания C(n, k), размещения A(n, k), варианты с повторениями и перестановки мультимножества точно: C(52, 5) = 2 598 960, A(10, 3) = 720.",
    en: "Count combinations C(n, k), permutations P(n, k), arrangements with repetition and multiset permutations exactly: C(52, 5) = 2,598,960, P(10, 3) = 720.",
  },
  lead: {
    ru: "Выбрать 5 карт из колоды в 52 можно 2 598 960 способами — это C(52, 5).",
    en: "There are 2,598,960 ways to choose 5 cards from a 52-card deck — that is C(52, 5).",
  },
  keywords: {
    ru: ["сочетания", "размещения", "перестановки", "комбинаторика", "число сочетаний", "C из n по k"],
    en: ["combination calculator", "permutation calculator", "nCr", "nPr", "combinatorics"],
  },
  props: { kind: "ncr" },
  howTo: {
    ru: ["Выберите тип задачи: сочетания, размещения или варианты с повторениями.", "Введите n и k — ответ и формула появятся сразу.", "Для перестановок с повторениями укажите, сколько раз повторяется каждый элемент."],
    en: ["Choose the problem type: combinations, permutations or with repetition.", "Enter n and k — the answer and the formula appear instantly.", "For multiset permutations enter how many times each item repeats."],
  },
  about: {
    ru: [
      "Главный вопрос комбинаторики — важен ли порядок. Если нет (выбор команды, набор карт), считают сочетания C(n, k). Если да (пьедестал, код), — размещения A(n, k), которых в k! раз больше.",
      "Когда элементы могут повторяться, число вариантов растёт: 4-значных PIN-кодов из цифр 0–9 — 10⁴ = 10 000. Калькулятор считает точно даже огромные значения.",
    ],
    en: [
      "The key question is whether order matters. If not (choosing a team, a hand of cards), count combinations C(n, k). If it does (a podium, a code), count permutations P(n, k), which are k! times as many.",
      "When items can repeat the count grows: there are 10⁴ = 10,000 four-digit PINs using digits 0–9. The calculator is exact even for huge values.",
    ],
  },
  faq: {
    ru: [
      { q: "Чем сочетания отличаются от размещений?", a: "В размещениях порядок важен, в сочетаниях — нет. Выбрать 3 человек из 10 можно C(10, 3) = 120 способами, а распределить между ними 3 разных места — A(10, 3) = 720." },
      { q: "Сколько комбинаций в лотерее 6 из 49?", a: "C(49, 6) = 13 983 816 — шанс угадать все шесть чисел одним билетом примерно 1 из 14 миллионов." },
      { q: "Как посчитать перестановки с повторениями?", a: "n! делят на факториалы количеств повторов: из букв слова «МАМА» можно составить 4! / (2! · 2!) = 6 разных слов." },
    ],
    en: [
      { q: "What is the difference between combinations and permutations?", a: "Permutations care about order, combinations do not. Choosing 3 people out of 10 gives C(10, 3) = 120; awarding them 3 different places gives P(10, 3) = 720." },
      { q: "How many combinations are in a 6/49 lottery?", a: "C(49, 6) = 13,983,816 — about a 1 in 14 million chance to match all six numbers with one ticket." },
      { q: "How do I count permutations with repeated items?", a: "Divide n! by the factorials of the repeat counts: the letters of 'MAMA' form 4! / (2! · 2!) = 6 distinct words." },
    ],
  },
  related: ["factorial-calculator", "percentage-calculator", "prime-number-checker", "statistics-calculator"],
  blocks: (locale) => [pascal(locale)],
};
