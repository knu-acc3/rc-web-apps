import { defineToolSection } from "@/registry/tool-section";

export const sizesSection = defineToolSection({
  id: "sizes",
  name: { ru: "Размеры", en: "Sizes" },
  description: {
    ru: "Форматы бумаги, размеры обуви, одежды и колец, разрешения экранов",
    en: "Paper formats, shoe, clothing and ring sizes, screen resolutions",
  },
  icon: "Shirt",
  hue: 40,
  category: "convert",
  order: 3,
  tools: [],
});
