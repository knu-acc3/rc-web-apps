import { defineToolSection } from "@/registry/tool-section";

export const codeSection = defineToolSection({
  id: "code",
  name: { ru: "Форматирование кода", en: "Code formatters" },
  description: {
    ru: "Форматирование, проверка и минификация JSON, SQL, HTML, CSS, JS, XML",
    en: "Format, validate and minify JSON, SQL, HTML, CSS, JS, XML",
  },
  icon: "Braces",
  hue: 255,
  category: "dev",
  order: 1,
  tools: [],
});
