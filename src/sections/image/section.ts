import { defineToolSection } from "@/registry/tool-section";

export const imageSection = defineToolSection({
  id: "image",
  name: { ru: "Изображения", en: "Images" },
  description: {
    ru: "Сжатие, изменение размера, обрезка, конвертация и редактирование фото онлайн",
    en: "Compress, resize, crop, convert and edit photos online",
  },
  icon: "Image",
  hue: 210,
  category: "files",
  order: 2,
  tools: [],
});
