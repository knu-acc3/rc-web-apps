import { defineToolSection } from "@/registry/tool-section";

export const symbolsSection = defineToolSection({
  id: "symbols",
  name: { ru: "Символы", en: "Symbols" },
  description: {
    ru: "Специальные символы Unicode: стрелки, звёзды, сердечки, математика, валюты",
    en: "Unicode special characters: arrows, stars, hearts, math, currency",
  },
  icon: "Asterisk",
  hue: 265,
  category: "symbols",
  order: 2,
  tools: [],
});
