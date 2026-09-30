import { defineToolSection } from "@/registry/tool-section";

export const calcSection = defineToolSection({
  id: "calc",
  name: { ru: "Математика", en: "Math" },
  description: {
    ru: "Проценты, научный калькулятор, дроби, уравнения, матрицы и статистика",
    en: "Percentages, scientific calculator, fractions, equations, matrices and statistics",
  },
  icon: "Calculator",
  hue: 240,
  category: "calc",
  order: 1,
  tools: [],
});
