import { defineToolSection } from "@/registry/tool-section";

export const pdfSection = defineToolSection({
  id: "pdf",
  name: { ru: "PDF-инструменты", en: "PDF tools" },
  description: {
    ru: "Объединение, разделение, сжатие, поворот и конвертация PDF прямо в браузере",
    en: "Merge, split, compress, rotate and convert PDF files right in your browser",
  },
  icon: "FileText",
  hue: 0,
  category: "files",
  order: 1,
  tools: [],
});
