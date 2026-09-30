import { defineToolSection } from "@/registry/tool-section";

export const financeSection = defineToolSection({
  id: "finance",
  name: { ru: "Финансы", en: "Finance" },
  description: {
    ru: "Кредиты, ипотека, вклады, НДС, зарплата и другие финансовые калькуляторы",
    en: "Loans, mortgages, deposits, VAT, salary and other finance calculators",
  },
  icon: "Wallet",
  hue: 150,
  category: "calc",
  order: 2,
  tools: [],
});
