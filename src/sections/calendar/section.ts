import { defineToolSection } from "@/registry/tool-section";

export const calendarSection = defineToolSection({
  id: "calendar",
  name: { ru: "Календарь", en: "Calendar" },
  description: {
    ru: "Календари по годам, производственный календарь и номера недель",
    en: "Yearly calendars, working-day calendars and week numbers",
  },
  icon: "CalendarDays",
  hue: 215,
  category: "time",
  order: 4,
  tools: [],
});
