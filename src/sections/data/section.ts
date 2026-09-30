import { defineToolSection } from "@/registry/tool-section";

export const dataSection = defineToolSection({
  id: "data",
  name: { ru: "Конвертеры данных", en: "Data converters" },
  description: {
    ru: "JSON, CSV, YAML, XML, TOML — перевод между форматами",
    en: "JSON, CSV, YAML, XML, TOML — convert between formats",
  },
  icon: "FileJson",
  hue: 235,
  category: "dev",
  order: 2,
  tools: [],
});
