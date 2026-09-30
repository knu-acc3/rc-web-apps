import { defineToolSection } from "@/registry/tool-section";

export const notesSection = defineToolSection({
  id: "notes",
  name: { ru: "Заметки и задачи", en: "Notes & to-do" },
  description: {
    ru: "Заметки и список дел онлайн, которые хранятся только в вашем браузере",
    en: "Online notes and to-do lists that are stored only in your own browser",
  },
  icon: "NotebookPen",
  hue: 50,
  category: "text",
  order: 3,
  tools: [],
});
