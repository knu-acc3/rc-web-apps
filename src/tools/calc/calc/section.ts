import { defineToolSection } from "@/registry/tool-section";
import * as algebra from "./content/group-algebra";
import * as expr from "./content/group-expr";
import * as numbers from "./content/group-numbers";
import { percentTool } from "./percent/def";
import { print3dTool } from "../3d-print/def";

/** Navigation group only (no landing page): "Математика" is not a search query by itself. */
const tools = [percentTool, print3dTool, ...expr.tools, ...algebra.tools, ...numbers.tools];

export const calcSection = defineToolSection({
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
});
