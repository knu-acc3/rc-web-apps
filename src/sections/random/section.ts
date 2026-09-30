import { defineToolSection } from "@/registry/tool-section";

export const randomSection = defineToolSection({
  id: "random",
  name: { ru: "Случайный выбор", en: "Random" },
  description: {
    ru: "Колесо фортуны, монетка, кубики, случайные числа и жеребьёвка",
    en: "Spin the wheel, coin flip, dice, random numbers and team picker",
  },
  icon: "Dices",
  hue: 300,
  category: "random",
  order: 1,
  tools: [],
});
