import type { L10n } from "@/i18n/config";

/** Photo tools the result can be handed to ("Дальше" on the result card). Slugs are top-level page paths. */
interface HandoffTarget {
  id: "compress" | "resize" | "crop" | "convert" | "rotate" | "filters" | "add-text" | "watermark";
  slug: string;
  label: L10n;
}

export const HANDOFF_TARGETS: readonly HandoffTarget[] = [
  { id: "compress", slug: "compress-image", label: { ru: "Сжать", en: "Compress" } },
  { id: "resize", slug: "resize-image", label: { ru: "Изменить размер", en: "Resize" } },
  { id: "crop", slug: "crop-image", label: { ru: "Обрезать", en: "Crop" } },
  { id: "convert", slug: "image-converter", label: { ru: "Конвертировать", en: "Convert" } },
  { id: "rotate", slug: "rotate-image", label: { ru: "Повернуть", en: "Rotate" } },
  { id: "filters", slug: "photo-filters", label: { ru: "Фильтры", en: "Filters" } },
  { id: "add-text", slug: "add-text-to-image", label: { ru: "Добавить текст", en: "Add text" } },
  { id: "watermark", slug: "add-watermark", label: { ru: "Водяной знак", en: "Watermark" } },
];

export type HandoffId = HandoffTarget["id"];
