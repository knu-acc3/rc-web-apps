import { defineToolSection } from "@/registry/tool-section";

export const timeSection = defineToolSection({
  id: "time",
  name: { ru: "Мировое время", en: "World time" },
  description: {
    ru: "Точное время в городах и странах мира, часовые пояса и конвертер времени",
    en: "Current time in cities and countries, time zones and time converter",
  },
  icon: "Globe",
  hue: 195,
  category: "time",
  order: 1,
  tools: [],
});
