import type { L10n } from "@/i18n/config";

/** How characters are counted against a limit. */
export type CountMethod = "chars" | "x" | "sms" | "hashtags" | "codeUnits";

export interface PlatformLimit {
  key: string;
  label: L10n;
  max: number;
  method: CountMethod;
  /** Recommended minimum (for SEO snippets). */
  min?: number;
  /** A display guideline rather than a hard limit. */
  soft?: boolean;
}

export interface Platform {
  id: string;
  name: L10n;
  limits: PlatformLimit[];
}

/** Limits that are published by the platforms themselves or widely documented. */
export const PLATFORMS: Platform[] = [
  {
    id: "x-twitter",
    name: { ru: "X (Twitter)", en: "X (Twitter)" },
    limits: [{ key: "post", label: { ru: "Пост (взвешенный подсчёт X)", en: "Post (X weighted count)" }, max: 280, method: "x" }],
  },
  {
    id: "sms",
    name: { ru: "СМС", en: "SMS" },
    limits: [{ key: "sms", label: { ru: "Одно СМС", en: "Single SMS" }, max: 160, method: "sms" }],
  },
  {
    id: "meta-title",
    name: { ru: "Title (заголовок страницы)", en: "Meta title" },
    limits: [{ key: "title", label: { ru: "Рекомендуемая длина title", en: "Recommended title length" }, max: 60, min: 30, method: "chars", soft: true }],
  },
  {
    id: "meta-description",
    name: { ru: "Meta description", en: "Meta description" },
    limits: [{ key: "desc", label: { ru: "Рекомендуемая длина description", en: "Recommended description length" }, max: 160, min: 120, method: "chars", soft: true }],
  },
  {
    id: "instagram-caption",
    name: { ru: "Инстаграм", en: "Instagram" },
    limits: [
      { key: "caption", label: { ru: "Подпись к посту", en: "Post caption" }, max: 2200, method: "chars" },
      { key: "fold", label: { ru: "Примерно видно до «ещё»", en: "Roughly visible before “more”" }, max: 125, method: "chars", soft: true },
      { key: "tags", label: { ru: "Хештеги", en: "Hashtags" }, max: 30, method: "hashtags" },
      { key: "bio", label: { ru: "Описание профиля", en: "Profile bio" }, max: 150, method: "chars" },
    ],
  },
  {
    id: "telegram-message",
    name: { ru: "Телеграм", en: "Telegram" },
    limits: [
      { key: "message", label: { ru: "Сообщение", en: "Message" }, max: 4096, method: "chars" },
      { key: "caption", label: { ru: "Подпись к фото/видео", en: "Media caption" }, max: 1024, method: "chars" },
    ],
  },
  {
    id: "youtube-title",
    name: { ru: "Название видео YouTube", en: "YouTube title" },
    limits: [{ key: "title", label: { ru: "Название видео", en: "Video title" }, max: 100, method: "chars" }],
  },
  {
    id: "youtube-description",
    name: { ru: "Описание видео YouTube", en: "YouTube description" },
    limits: [{ key: "desc", label: { ru: "Описание видео", en: "Video description" }, max: 5000, method: "chars" }],
  },
  {
    id: "tiktok",
    name: { ru: "ТикТок", en: "TikTok" },
    limits: [
      { key: "caption", label: { ru: "Подпись к видео", en: "Video caption" }, max: 4000, method: "chars" },
      { key: "bio", label: { ru: "Описание профиля", en: "Profile bio" }, max: 80, method: "chars" },
    ],
  },
  {
    id: "vk-post",
    name: { ru: "ВКонтакте", en: "VK" },
    limits: [{ key: "post", label: { ru: "Пост на стене", en: "Wall post" }, max: 16384, method: "chars" }],
  },
];

export const PLATFORM_BY_ID = new Map(PLATFORMS.map((p) => [p.id, p]));
