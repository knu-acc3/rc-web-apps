import { defineToolSection } from "@/registry/tool-section";

export const portSection = defineToolSection({
  id: "port",
  name: { ru: "Сетевые порты", en: "Network ports" },
  description: {
    ru: "Какой сервис использует порт: справочник TCP и UDP портов",
    en: "Which service uses a port: TCP and UDP port reference",
  },
  icon: "Network",
  hue: 185,
  category: "dev",
  order: 11,
  tools: [],
});
