import { defineToolSection } from "@/registry/tool-section";

export const devSection = defineToolSection({
  id: "dev",
  name: { ru: "Утилиты разработчика", en: "Developer utilities" },
  description: {
    ru: "Декодер JWT, калькулятор chmod, сравнение текста, разбор URL и User-Agent",
    en: "JWT decoder, chmod calculator, text diff, URL and User-Agent parsers for developers",
  },
  icon: "Terminal",
  hue: 215,
  category: "dev",
  order: 8,
  tools: [],
});
