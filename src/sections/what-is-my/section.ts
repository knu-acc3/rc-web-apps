import { defineToolSection } from "@/registry/tool-section";

export const whatIsMySection = defineToolSection({
  id: "what-is-my",
  name: { ru: "Что у меня", en: "What is my…" },
  description: {
    ru: "Браузер, операционная система, разрешение экрана и другие параметры устройства",
    en: "Your browser, OS, screen resolution and other device details",
  },
  icon: "Info",
  hue: 210,
  category: "device",
  order: 2,
  tools: [],
});
