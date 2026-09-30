import { defineToolSection } from "@/registry/tool-section";

export const cronSection = defineToolSection({
  id: "cron",
  name: { ru: "Cron", en: "Cron" },
  description: {
    ru: "Генератор и расшифровка cron-выражений с ближайшими запусками",
    en: "Build and explain cron expressions with next run times",
  },
  icon: "Clock3",
  hue: 205,
  category: "dev",
  order: 4,
  tools: [],
});
