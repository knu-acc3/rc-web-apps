import { defineToolSection } from "@/registry/tool-section";

export const validateSection = defineToolSection({
  id: "validate",
  name: { ru: "Проверка данных", en: "Validators" },
  description: {
    ru: "Проверка IBAN, номеров карт, телефонов, email, ИИН и БИН",
    en: "Validate IBAN, card numbers, phones, email, IIN and BIN",
  },
  icon: "BadgeCheck",
  hue: 140,
  category: "web",
  order: 3,
  tools: [],
});
