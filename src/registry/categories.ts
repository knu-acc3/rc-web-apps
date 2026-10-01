import type { L10n } from "@/i18n/config";
import type { CategoryId } from "./types";

export const CATEGORIES: { id: CategoryId; name: L10n; icon: string; hue: number; blurb: L10n }[] = [
  {
    id: "files",
    name: { ru: "PDF, фото, видео и аудио", en: "PDF, photos, video & audio" },
    icon: "FileStack",
    hue: 5,
    blurb: { ru: "Склеить PDF, сжать фото, перевести видео в MP3", en: "Merge PDFs, compress photos, turn video into MP3" },
  },
  {
    id: "text",
    name: { ru: "Текст", en: "Text" },
    icon: "Type",
    hue: 160,
    blurb: { ru: "Счётчик символов, регистр, транслит, шрифты", en: "Character counter, case, transliteration, fonts" },
  },
  {
    id: "symbols",
    name: { ru: "Символы и эмодзи", en: "Symbols & emoji" },
    icon: "Smile",
    hue: 45,
    blurb: { ru: "Скопировать эмодзи, сердечки, стрелки и знаки", en: "Copy emoji, hearts, arrows and signs" },
  },
  {
    id: "time",
    name: { ru: "Время и даты", en: "Time & dates" },
    icon: "Clock",
    hue: 190,
    blurb: { ru: "Таймер, секундомер, время в городах, календарь", en: "Timer, stopwatch, world time, calendar" },
  },
  {
    id: "calc",
    name: { ru: "Калькуляторы", en: "Calculators" },
    icon: "Calculator",
    hue: 240,
    blurb: { ru: "Проценты, кредит, ИМТ, зарплата на руки", en: "Percentages, loans, BMI, take-home pay" },
  },
  {
    id: "convert",
    name: { ru: "Конвертеры и размеры", en: "Converters & sizes" },
    icon: "ArrowLeftRight",
    hue: 28,
    blurb: { ru: "Км в мили, кг в фунты, размеры обуви и бумаги", en: "Km to miles, kg to lb, shoe and paper sizes" },
  },
  {
    id: "random",
    name: { ru: "Случайное и игры", en: "Random & games" },
    icon: "Dices",
    hue: 300,
    blurb: { ru: "Колесо фортуны, кубик, случайное число", en: "Spin the wheel, dice, random number" },
  },
  {
    id: "design",
    name: { ru: "Цвет и дизайн", en: "Color & design" },
    icon: "Palette",
    hue: 330,
    blurb: { ru: "Палитры, пипетка, коды цветов, CSS-генераторы", en: "Palettes, color picker, color codes, CSS generators" },
  },
  {
    id: "dev",
    name: { ru: "Разработчику", en: "Developers" },
    icon: "Code",
    hue: 215,
    blurb: { ru: "JSON, Base64, хэши, regex, cron, UUID", en: "JSON, Base64, hashes, regex, cron, UUID" },
  },
  {
    id: "web",
    name: { ru: "Веб, SEO и безопасность", en: "Web, SEO & security" },
    icon: "Globe",
    hue: 140,
    blurb: { ru: "Пароли, QR-коды, проверка карт и IBAN", en: "Passwords, QR codes, card and IBAN checks" },
  },
  {
    id: "device",
    name: { ru: "Устройство и браузер", en: "Device & browser" },
    icon: "Monitor",
    hue: 95,
    blurb: { ru: "Проверка микрофона, камеры, клавиатуры, экрана", en: "Test your microphone, camera, keyboard, screen" },
  },
];

export const CATEGORY_LOOK = Object.fromEntries(CATEGORIES.map((c) => [c.id, { icon: c.icon, hue: c.hue }])) as Record<CategoryId, { icon: string; hue: number }>;
