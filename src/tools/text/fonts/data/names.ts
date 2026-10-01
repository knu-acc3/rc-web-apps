import type { L10n } from "@/i18n/config";
import type { StyleId } from "../lib/styles";

/** URL of the generator: /font-generator and /font-generator/{variant}. */
export const TOOL_SLUG = "font-generator";

/** Short style names (chips, result rows). Shared by the client component and section.ts. */
export const STYLE_NAMES: Record<StyleId, L10n> = {
  bold: { ru: "Жирный", en: "Bold" },
  italic: { ru: "Курсив", en: "Italic" },
  "bold-italic": { ru: "Жирный курсив", en: "Bold italic" },
  script: { ru: "Рукописный", en: "Script" },
  "bold-script": { ru: "Жирный рукописный", en: "Bold script" },
  fraktur: { ru: "Готический", en: "Fraktur (gothic)" },
  "bold-fraktur": { ru: "Жирный готический", en: "Bold fraktur" },
  "double-struck": { ru: "Двойной контур", en: "Double-struck" },
  monospace: { ru: "Моноширинный", en: "Monospace" },
  sans: { ru: "Без засечек", en: "Sans-serif" },
  "sans-bold": { ru: "Жирный без засечек", en: "Sans-serif bold" },
  "sans-italic": { ru: "Курсив без засечек", en: "Sans-serif italic" },
  "sans-bold-italic": { ru: "Жирный курсив без засечек", en: "Sans-serif bold italic" },
  "small-caps": { ru: "Капитель", en: "Small caps" },
  superscript: { ru: "Надстрочный", en: "Superscript" },
  subscript: { ru: "Подстрочный", en: "Subscript" },
  circled: { ru: "В кружках", en: "Circled" },
  "circled-negative": { ru: "В чёрных кружках", en: "Black circled" },
  bubble: { ru: "Кружки для любых букв", en: "Bubble (any letters)" },
  squared: { ru: "В квадратах", en: "Squared" },
  "squared-negative": { ru: "В чёрных квадратах", en: "Black squared" },
  parenthesized: { ru: "В скобках", en: "Parenthesized" },
  fullwidth: { ru: "Широкий (вейпорвейв)", en: "Wide (vaporwave)" },
  "upside-down": { ru: "Перевёрнутый", en: "Upside down" },
  mirror: { ru: "Зеркальный", en: "Mirrored" },
  strikethrough: { ru: "Зачёркнутый", en: "Strikethrough" },
  "slash-through": { ru: "Зачёркнутый косой чертой", en: "Slash-through" },
  underline: { ru: "Подчёркнутый", en: "Underlined" },
  "double-underline": { ru: "Двойное подчёркивание", en: "Double underline" },
  overline: { ru: "Черта сверху", en: "Overline" },
  zalgo: { ru: "Залго", en: "Zalgo" },
  glitch: { ru: "Глитч", en: "Glitch" },
};

export const PLATFORM_IDS = ["instagram", "telegram", "vk", "tiktok", "discord", "x-twitter", "steam", "whatsapp", "youtube", "pubg-free-fire"] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];

interface PlatformDef {
  /** "Инстаграм" / "Instagram" */
  name: L10n;
  /** Genitive after «для»: «для Инстаграма» */
  forName: L10n;
  /** Styles listed first on the platform page; the first one is selected. */
  styles: StyleId[];
  /** Show the twitter-text weighted counter. */
  xCounter?: boolean;
}

export const PLATFORMS: Record<PlatformId, PlatformDef> = {
  instagram: {
    name: { ru: "Инстаграм", en: "Instagram" },
    forName: { ru: "Инстаграма", en: "Instagram" },
    styles: ["bold", "italic", "bold-italic", "script", "bold-script", "sans-bold", "small-caps", "double-struck", "fraktur", "monospace", "strikethrough", "underline"],
  },
  telegram: {
    name: { ru: "Телеграм", en: "Telegram" },
    forName: { ru: "Телеграма", en: "Telegram" },
    styles: ["script", "bold-script", "fraktur", "double-struck", "small-caps", "circled", "squared-negative", "fullwidth", "upside-down", "zalgo"],
  },
  vk: {
    name: { ru: "ВКонтакте", en: "VK" },
    forName: { ru: "ВК", en: "VK" },
    styles: ["bold", "italic", "bold-italic", "sans-bold", "strikethrough", "underline", "script", "small-caps", "circled", "double-struck"],
  },
  tiktok: {
    name: { ru: "ТикТок", en: "TikTok" },
    forName: { ru: "ТикТока", en: "TikTok" },
    styles: ["bold", "bold-script", "script", "small-caps", "sans-bold", "double-struck", "fraktur", "circled", "fullwidth", "underline"],
  },
  discord: {
    name: { ru: "Discord", en: "Discord" },
    forName: { ru: "Discord", en: "Discord" },
    styles: ["small-caps", "bold-fraktur", "bold-script", "double-struck", "monospace", "circled-negative", "squared-negative", "fullwidth", "superscript", "zalgo"],
  },
  "x-twitter": {
    name: { ru: "X (Твиттер)", en: "X (Twitter)" },
    forName: { ru: "X (Твиттера)", en: "X (Twitter)" },
    styles: ["bold", "italic", "bold-italic", "sans-bold", "sans-italic", "strikethrough", "underline", "monospace", "script", "small-caps"],
    xCounter: true,
  },
  steam: {
    name: { ru: "Steam", en: "Steam" },
    forName: { ru: "Steam", en: "Steam" },
    styles: ["fraktur", "bold-fraktur", "bold-script", "small-caps", "double-struck", "circled-negative", "squared-negative", "fullwidth", "upside-down", "zalgo"],
  },
  whatsapp: {
    name: { ru: "WhatsApp", en: "WhatsApp" },
    forName: { ru: "WhatsApp", en: "WhatsApp" },
    styles: ["underline", "double-underline", "script", "bold-script", "double-struck", "small-caps", "circled", "fraktur", "fullwidth", "upside-down"],
  },
  youtube: {
    name: { ru: "YouTube", en: "YouTube" },
    forName: { ru: "YouTube", en: "YouTube" },
    styles: ["underline", "script", "bold-script", "small-caps", "double-struck", "fraktur", "circled", "fullwidth", "bold-italic", "superscript"],
  },
  "pubg-free-fire": {
    name: { ru: "PUBG и Free Fire", en: "PUBG & Free Fire" },
    forName: { ru: "PUBG и Free Fire", en: "PUBG & Free Fire" },
    styles: ["small-caps", "superscript", "fullwidth", "circled", "circled-negative", "squared-negative", "bold-fraktur", "script", "upside-down", "zalgo"],
  },
};

/** Sample text for the first (server) render. */
export const SAMPLE: L10n = { ru: "Привет, мир! Hello 123", en: "Hello world 123" };
