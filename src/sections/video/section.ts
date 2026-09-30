import { defineToolSection } from "@/registry/tool-section";

export const videoSection = defineToolSection({
  id: "video",
  name: { ru: "Видео", en: "Video" },
  description: {
    ru: "Обрезка, сжатие, конвертация видео и запись экрана в браузере",
    en: "Trim, compress and convert video, record your screen in the browser",
  },
  icon: "Film",
  hue: 280,
  category: "files",
  order: 3,
  tools: [],
});
