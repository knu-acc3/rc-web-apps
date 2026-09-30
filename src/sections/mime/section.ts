import { defineToolSection } from "@/registry/tool-section";

export const mimeSection = defineToolSection({
  id: "mime",
  name: { ru: "MIME-типы", en: "MIME types" },
  description: {
    ru: "Справочник MIME-типов: какой Content-Type у файла по его расширению",
    en: "MIME type reference: which Content-Type a file has by its extension",
  },
  icon: "FileCode",
  hue: 220,
  category: "dev",
  order: 10,
  tools: [],
});
