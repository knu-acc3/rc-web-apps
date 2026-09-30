import type { L10n } from "@/i18n/config";
import type { CategoryId } from "./types";

export const CATEGORIES: { id: CategoryId; name: L10n; icon: string }[] = [
  { id: "files", name: { ru: "PDF, изображения и медиа", en: "PDF, images & media" }, icon: "FileStack" },
  { id: "text", name: { ru: "Текст", en: "Text" }, icon: "Type" },
  { id: "symbols", name: { ru: "Символы и эмодзи", en: "Symbols & emoji" }, icon: "Smile" },
  { id: "time", name: { ru: "Время и даты", en: "Time & dates" }, icon: "Clock" },
  { id: "calc", name: { ru: "Калькуляторы", en: "Calculators" }, icon: "Calculator" },
  { id: "convert", name: { ru: "Конвертеры и размеры", en: "Converters & sizes" }, icon: "ArrowLeftRight" },
  { id: "random", name: { ru: "Случайное и игры", en: "Random & games" }, icon: "Dices" },
  { id: "design", name: { ru: "Цвет и дизайн", en: "Color & design" }, icon: "Palette" },
  { id: "dev", name: { ru: "Разработчику", en: "Developers" }, icon: "Code" },
  { id: "web", name: { ru: "Веб, SEO и безопасность", en: "Web, SEO & security" }, icon: "Globe" },
  { id: "device", name: { ru: "Устройство и браузер", en: "Device & browser" }, icon: "Monitor" },
];
