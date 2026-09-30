import { defineToolSection } from "@/registry/tool-section";
import { guardSection } from "./kit/section-guard";
import * as algebra from "./group-algebra";
import * as expr from "./group-expr";
import * as numbers from "./group-numbers";
import { percentTool } from "./percent/def";

/** Navigation group only (no landing page): "Математика" is not a search query by itself. */
const tools = [percentTool, ...expr.tools, ...algebra.tools, ...numbers.tools];

export const calcSection = guardSection(
  defineToolSection({
    id: "calc",
    name: { ru: "Математика", en: "Math" },
    description: {
      ru: "Проценты, научный калькулятор, дроби, уравнения, матрицы, статистика, НОД и НОК, простые числа и графики функций",
      en: "Percentages, scientific calculator, fractions, equations, matrices, statistics, GCD and LCM, primes and function graphs",
    },
    icon: "Calculator",
    hue: 240,
    category: "calc",
    order: 1,
    tools,
  }),
  tools,
);
