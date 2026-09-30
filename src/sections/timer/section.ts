import { defineToolSection } from "@/registry/tool-section";

export const timerSection = defineToolSection({
  id: "timer",
  name: { ru: "Таймер и секундомер", en: "Timer & stopwatch" },
  description: {
    ru: "Онлайн-таймер на любое время, секундомер, помодоро и будильник",
    en: "Online timer for any duration, stopwatch, pomodoro and alarm clock",
  },
  icon: "Timer",
  hue: 185,
  category: "time",
  order: 2,
  tools: [],
});
