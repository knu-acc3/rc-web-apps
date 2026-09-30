import { defineToolSection } from "@/registry/tool-section";

export const emojiSection = defineToolSection({
  id: "emoji",
  name: { ru: "Эмодзи", en: "Emoji" },
  description: {
    ru: "Все эмодзи с названиями, значениями и кодами — копирование в один клик",
    en: "Every emoji with names, meanings and codes — copy in one click",
  },
  icon: "Smile",
  hue: 45,
  category: "symbols",
  order: 1,
  tools: [],
});
