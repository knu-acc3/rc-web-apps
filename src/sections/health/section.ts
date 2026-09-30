import { defineToolSection } from "@/registry/tool-section";

export const healthSection = defineToolSection({
  id: "health",
  name: { ru: "Здоровье", en: "Health" },
  description: {
    ru: "ИМТ, калории, беременность, сон, вода и пульсовые зоны",
    en: "BMI, calories, pregnancy, sleep, water and heart-rate zones",
  },
  icon: "HeartPulse",
  hue: 350,
  category: "calc",
  order: 3,
  tools: [],
});
