import type { FilterId } from "./types";

/** Short UI names of filters (also used for chips). */
export const FILTER_NAMES: Record<FilterId, { ru: string; en: string }> = {
  grayscale: { ru: "Оттенки серого", en: "Grayscale" },
  sepia: { ru: "Сепия", en: "Sepia" },
  invert: { ru: "Негатив", en: "Invert" },
  blur: { ru: "Размытие", en: "Blur" },
  sharpen: { ru: "Резкость", en: "Sharpen" },
  brightness: { ru: "Яркость", en: "Brightness" },
  contrast: { ru: "Контраст", en: "Contrast" },
  saturation: { ru: "Насыщенность", en: "Saturation" },
  "hue-rotate": { ru: "Сдвиг оттенка", en: "Hue rotate" },
  vintage: { ru: "Винтаж", en: "Vintage" },
  pixelate: { ru: "Пикселизация", en: "Pixelate" },
  posterize: { ru: "Постеризация", en: "Posterize" },
  "black-and-white": { ru: "Чёрно-белое (порог)", en: "Black & white (threshold)" },
  duotone: { ru: "Дуотон", en: "Duotone" },
  vignette: { ru: "Виньетка", en: "Vignette" },
  emboss: { ru: "Тиснение", en: "Emboss" },
  sketch: { ru: "Карандашный рисунок", en: "Pencil sketch" },
  noise: { ru: "Зерно плёнки", en: "Film grain" },
  warm: { ru: "Тёплый тон", en: "Warm" },
  cool: { ru: "Холодный тон", en: "Cool" },
};
