import { defineToolSection } from "@/registry/tool-section";

export const fileSection = defineToolSection({
  id: "file",
  name: { ru: "Файлы и архивы", en: "Files & archives" },
  description: {
    ru: "Создание и распаковка ZIP-архивов, контрольные суммы и пакетная работа с файлами",
    en: "Create and extract ZIP archives, file checksums and batch file utilities",
  },
  icon: "FileArchive",
  hue: 30,
  category: "files",
  order: 5,
  tools: [],
});
