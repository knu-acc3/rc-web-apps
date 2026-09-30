import { defineToolSection } from "@/registry/tool-section";

export const kaomojiSection = defineToolSection({
  id: "kaomoji",
  name: { ru: "Каомодзи", en: "Kaomoji" },
  description: {
    ru: "Японские текстовые смайлики из символов по эмоциям: радость, грусть, любовь и другие",
    en: "Japanese text emoticons grouped by emotion: happy, sad, love, angry and more",
  },
  icon: "Laugh",
  hue: 10,
  category: "symbols",
  order: 3,
  tools: [],
});
