import { defineToolSection } from "@/registry/tool-section";

export const textSection = defineToolSection({
  id: "text",
  name: { ru: "Текст", en: "Text tools" },
  description: {
    ru: "Счётчик слов, регистр, очистка, сортировка, сравнение и транслитерация текста",
    en: "Word counter, case converter, cleaner, sorter, diff and transliteration",
  },
  icon: "Type",
  hue: 160,
  category: "text",
  order: 1,
  tools: [],
});
