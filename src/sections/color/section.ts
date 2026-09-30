import { defineToolSection } from "@/registry/tool-section";

export const colorSection = defineToolSection({
  id: "color",
  name: { ru: "Цвета", en: "Colors" },
  description: {
    ru: "Подбор и конвертация цветов, палитры, контраст и каталоги цветов",
    en: "Color picker and converter, palettes, contrast and color catalogs",
  },
  icon: "Palette",
  hue: 330,
  category: "design",
  order: 1,
  tools: [],
});
