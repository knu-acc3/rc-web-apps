import { defineToolSection } from "@/registry/tool-section";

export const fontsSection = defineToolSection({
  id: "fonts",
  name: { ru: "Красивые шрифты", en: "Fancy fonts" },
  description: {
    ru: "Жирный, курсивный, зачёркнутый и другие стили текста для соцсетей",
    en: "Bold, italic, strikethrough and other text styles for social media",
  },
  icon: "ALargeSmall",
  hue: 175,
  category: "text",
  order: 2,
  tools: [],
});
