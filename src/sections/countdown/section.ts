import { defineToolSection } from "@/registry/tool-section";

export const countdownSection = defineToolSection({
  id: "countdown",
  name: { ru: "Обратный отсчёт", en: "Countdown" },
  description: {
    ru: "Сколько дней, часов и минут осталось до праздников и важных дат",
    en: "How many days, hours and minutes are left until holidays and important dates",
  },
  icon: "Hourglass",
  hue: 205,
  category: "time",
  order: 3,
  tools: [],
});
