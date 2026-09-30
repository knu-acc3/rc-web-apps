import { defineToolSection } from "@/registry/tool-section";

export const uuidSection = defineToolSection({
  id: "uuid",
  name: { ru: "UUID и ID", en: "UUID & IDs" },
  description: {
    ru: "Генерация и разбор уникальных идентификаторов: UUID v4 и v7, ULID, NanoID",
    en: "Generate and decode unique identifiers: UUID v4 and v7, ULID and NanoID",
  },
  icon: "KeyRound",
  hue: 170,
  category: "dev",
  order: 7,
  tools: [],
});
