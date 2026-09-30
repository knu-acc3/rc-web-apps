import { defineToolSection } from "@/registry/tool-section";

export const cssSection = defineToolSection({
  id: "css",
  name: { ru: "CSS-генераторы", en: "CSS generators" },
  description: {
    ru: "Тени, градиенты, анимации, flexbox и grid с готовым кодом",
    en: "Shadows, gradients, animations, flexbox and grid with ready code",
  },
  icon: "Paintbrush",
  hue: 270,
  category: "design",
  order: 2,
  tools: [],
});
