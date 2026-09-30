import { defineToolSection } from "@/registry/tool-section";
import * as algebra from "./group-algebra";
import * as expr from "./group-expr";
import * as numbers from "./group-numbers";
import { percentTool } from "./percent/def";

export const calcSection = defineToolSection({
  id: "calc",
  name: { ru: "Математика", en: "Math" },
  title: {
    ru: "Математические калькуляторы онлайн — проценты, дроби, уравнения",
    en: "Math calculators online — percent, fractions, equations",
  },
  h1: { ru: "Математические калькуляторы", en: "Math calculators" },
  description: {
    ru: "Бесплатные математические калькуляторы: проценты, научный калькулятор, дроби, уравнения, матрицы, статистика, НОД и НОК, простые числа и графики функций.",
    en: "Free math calculators: percentages, a scientific calculator, fractions, equations, matrices, statistics, GCD and LCM, prime numbers and function graphs.",
  },
  icon: "Calculator",
  hue: 240,
  category: "calc",
  order: 1,
  tools: [percentTool, ...expr.tools, ...algebra.tools, ...numbers.tools],
  hubBlocks: (locale) => [
    {
      type: "text",
      title: locale === "ru" ? "О калькуляторах" : "About these calculators",
      paragraphs:
        locale === "ru"
          ? [
              "Каждый калькулятор считает сразу при вводе — без кнопки «Рассчитать». Числа можно вводить в привычном виде: с пробелами между разрядами и запятой, например «1 000,5».",
              "Рядом с ответом показаны формула и ход решения: для уравнений — дискриминант и корни, включая комплексные, для матриц — приведение к ступенчатому виду, для НОД — шаги алгоритма Евклида. Параметры расчёта сохраняются в ссылке, ею можно поделиться.",
            ]
          : [
              "Every calculator updates as you type — there is no Calculate button. Numbers can be typed with separators, e.g. 1,000.5.",
              "Next to the answer you get the formula and the working: the discriminant and roots (including complex ones) for equations, row reduction for matrices, Euclid's steps for the GCD. The inputs are kept in the link, so you can share a calculation.",
            ],
    },
  ],
});
