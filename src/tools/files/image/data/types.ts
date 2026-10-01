import type { L10n, L10nList, Locale } from "@/i18n/config";
import type { QA } from "@/registry/types";

/** Localised list of [label, value] rows for a "facts" block. */
export type FactRows = Record<Locale, [string, string][]>;

/** SEO + content texts of a tool page. */
export interface ToolText {
  /** Short name used in cards, chips and breadcrumbs ("Сжать фото"). */
  name: L10n;
  /** <title> without brand, key phrase first, ≤ 60 chars. */
  title: L10n;
  /** H1 = the main search phrase. */
  h1: L10n;
  /** Meta description, 120–160 chars, concrete facts. */
  description: L10n;
  /** One-line direct answer under the H1. */
  lead: L10n;
  keywords: L10nList;
  /** 3–5 steps. */
  howTo: L10nList;
  /** 2–3 short paragraphs. */
  about: L10nList;
  /** 3–5 real questions and answers. */
  faq: Record<Locale, QA[]>;
}

/** Common SEO texts of a variant page. */
export interface VariantText {
  /** Short chip label ("HEIC → JPG", "Сепия", "1:1"). */
  name: L10n;
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  keywords: L10nList;
  /** 1–3 paragraphs specific to this variant. */
  paragraphs: L10nList;
  /** 2–4 real questions and answers specific to this variant. */
  faq: Record<Locale, QA[]>;
}

/* ───────────── Formats & conversion pairs ───────────── */

export type FormatId = "jpg" | "png" | "webp" | "avif" | "heic" | "gif" | "bmp" | "tiff" | "svg" | "ico" | "jfif";
/** Formats the engine can write. */
export type OutFormatId = "jpg" | "png" | "webp" | "avif" | "gif" | "ico";

export interface FormatInfo {
  id: FormatId;
  /** Display label: "JPG", "HEIC", "WebP". */
  label: string;
  /** Expanded name: "Joint Photographic Experts Group". */
  full: string;
  /** File extensions without dot, most common first. */
  exts: string[];
  mime: string;
  /** Year the format appeared. */
  year: number;
  /** Who created / maintains it. */
  by: L10n;
  /** Compression type in a few words: "с потерями (DCT)" / "lossy (DCT)". */
  compression: L10n;
  /** Supports an alpha channel (transparency). */
  alpha: boolean;
  /** Supports animation: true / false / "limited" (e.g. only via extensions). */
  animation: boolean | "limited";
  /** Colour depth summary: "24 бита, 16,7 млн цветов". */
  colors: L10n;
  /** Where it opens: browsers / OS support, one sentence. */
  support: L10n;
  /** 2–3 sentences about the format. */
  about: L10n;
  /** What it is best for, one sentence. */
  bestFor: L10n;
}

export interface ConvertPair extends VariantText {
  /** "heic-to-jpg" */
  slug: string;
  from: FormatId;
  to: OutFormatId;
}

/* ───────────── Resize presets ───────────── */

export type PresetGroup = "social" | "document" | "print" | "screen" | "marketplace";

export interface ResizePreset extends VariantText {
  slug: string;
  group: PresetGroup;
  /** Target size in pixels. */
  w: number;
  h: number;
  /** Physical size for documents/prints, in millimetres [w, h]. */
  mm?: [number, number];
  /** DPI written into the file for print/document presets (usually 300). */
  dpi?: number;
  /** Default fitting: "cover" = fill and crop centre, "contain" = fit inside with padding. */
  fit: "cover" | "contain";
  /** Extra platform-specific facts (display size, safe zone, file limits…). */
  facts: FactRows;
}

/* ───────────── Crop ratios ───────────── */

export interface CropRatio extends VariantText {
  /** "16-9" */
  slug: string;
  /** [w, h] e.g. [16, 9] */
  ratio: [number, number];
  /** Where this ratio is used, as rows for a facts block. */
  facts: FactRows;
  /** Typical pixel sizes with this ratio: [w, h, label]. */
  sizes: [number, number, L10n][];
}

/* ───────────── Compression variants ───────────── */

export interface CompressVariant extends VariantText {
  /** "jpg" | "png" | "webp" | "avif" | "to-100kb" … */
  slug: string;
  /** Output format preset (undefined = keep original format). */
  format?: "jpg" | "png" | "webp" | "avif";
  /** Target size in kilobytes (1 KB = 1024 bytes). */
  targetKb?: number;
  facts: FactRows;
}

/* ───────────── Filters ───────────── */

/** Filter ids implemented by the pixel engine (engine/filters.ts). */
export type FilterId =
  | "grayscale"
  | "sepia"
  | "invert"
  | "blur"
  | "sharpen"
  | "brightness"
  | "contrast"
  | "saturation"
  | "hue-rotate"
  | "vintage"
  | "pixelate"
  | "posterize"
  | "black-and-white"
  | "duotone"
  | "vignette"
  | "emboss"
  | "sketch"
  | "noise"
  | "warm"
  | "cool";

export interface FilterText extends VariantText {
  id: FilterId;
  /** How the filter is computed, one or two sentences (shown as a fact). */
  math: L10n;
}
