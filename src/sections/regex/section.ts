import { defineToolSection } from "@/registry/tool-section";

export const regexSection = defineToolSection({
  id: "regex",
  name: { ru: "Регулярные выражения", en: "Regex" },
  description: {
    ru: "Онлайн-тестер регулярных выражений и библиотека готовых шаблонов с примерами",
    en: "Online regular expression tester and a library of ready-made patterns with examples",
  },
  icon: "Regex",
  hue: 245,
  category: "dev",
  order: 3,
  tools: [],
});
