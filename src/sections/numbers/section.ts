import { defineToolSection } from "@/registry/tool-section";

export const numbersSection = defineToolSection({
  id: "numbers",
  name: { ru: "Числа", en: "Numbers" },
  description: {
    ru: "Римские цифры, число и сумма прописью, перевод между системами счисления",
    en: "Roman numerals, numbers and amounts in words, conversion between number bases",
  },
  icon: "Hash",
  hue: 20,
  category: "convert",
  order: 2,
  tools: [],
});
