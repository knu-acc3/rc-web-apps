import { defineToolSection } from "@/registry/tool-section";

export const httpStatusSection = defineToolSection({
  id: "http-status",
  name: { ru: "HTTP-коды", en: "HTTP status codes" },
  description: {
    ru: "Справочник HTTP-кодов ответа с описанием и примерами",
    en: "HTTP response status codes explained with examples",
  },
  icon: "Server",
  hue: 200,
  category: "dev",
  order: 9,
  tools: [],
});
