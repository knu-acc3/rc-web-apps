import { defineToolSection } from "@/registry/tool-section";

export const dateSection = defineToolSection({
  id: "date",
  name: { ru: "Даты", en: "Date calculators" },
  description: {
    ru: "Возраст, разница между датами, прибавление дней и Unix-время",
    en: "Age, difference between dates, adding days and Unix time",
  },
  icon: "CalendarClock",
  hue: 225,
  category: "time",
  order: 5,
  tools: [],
});
