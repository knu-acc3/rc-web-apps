import type { L10n, Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { defineToolSection } from "@/registry/tool-section";
import type { Block, LinkItem, ToolDef, VariantDef } from "@/registry/types";
import { COMPRESS_VARIANTS } from "./data/compress-variants";
import { CROP_RATIOS } from "./data/crop-ratios";
import { FILTER_TEXTS } from "./data/filters-text";
import { CONVERT_PAIRS, FORMATS } from "./data/formats";
import { RESIZE_PRESETS } from "./data/resize-presets";
import { TOOL_TEXTS_A } from "./data/tools-text-a";
import { TOOL_TEXTS_B } from "./data/tools-text-b";
import type { FormatInfo, ToolText, VariantText } from "./data/types";
import { FILTERS } from "./engine/filters";
import { gcd } from "./engine/geometry";

const TEXTS: Record<string, ToolText> = { ...TOOL_TEXTS_A, ...TOOL_TEXTS_B };

const L = (ru: string, en: string): L10n => ({ ru, en });
const pick = <T>(x: Record<Locale, T>, locale: Locale) => x[locale];

/* ───────────── slugs (top-level, English form of the main query) ───────────── */

const SLUG = {
  compress: "compress-image",
  resize: "resize-image",
  crop: "crop-image",
  "crop-circle": "crop-image-circle",
  rotate: "rotate-image",
  flip: "flip-image",
  convert: "image-converter",
  filters: "photo-filters",
  censor: "blur-part-of-image",
  watermark: "add-watermark",
  "add-text": "add-text-to-image",
  "to-base64": "image-to-base64",
  "base64-to-image": "base64-to-image",
  exif: "exif-viewer",
  collage: "photo-collage",
  split: "split-image",
  "round-corners": "round-image-corners",
  border: "add-border-to-image",
  square: "make-image-square",
  favicon: "favicon-generator",
  colors: "image-color-picker",
  "gif-maker": "gif-maker",
  "gif-frames": "split-gif",
  dpi: "change-dpi",
  svg: "svg-viewer",
  "pixel-art": "pixel-art-maker",
  compare: "compare-images",
} as const;

type Key = keyof typeof SLUG;

function tool(key: Key, component: string, icon: string, extra: Partial<ToolDef> = {}): ToolDef {
  const t = TEXTS[key];
  if (!t) throw new Error(`Missing texts for image tool "${key}"`);
  return {
    slug: SLUG[key],
    component,
    icon,
    name: t.name,
    title: t.title,
    h1: t.h1,
    description: t.description,
    lead: t.lead,
    keywords: t.keywords,
    howTo: t.howTo,
    about: t.about,
    faq: t.faq,
    wide: true,
    ...extra,
  };
}

function variant(v: VariantText, slug: string, props: Record<string, unknown>, blocks: (locale: Locale) => Block[], glyph?: string): VariantDef {
  return {
    slug,
    name: v.name,
    title: v.title,
    h1: v.h1,
    description: v.description,
    lead: v.lead,
    keywords: v.keywords,
    props,
    faq: v.faq,
    glyph,
    blocks: (locale) => [...blocks(locale), { type: "text", title: locale === "ru" ? "Подробнее" : "Details", paragraphs: v.paragraphs[locale] }],
  };
}

/* ───────────── shared helpers for data blocks ───────────── */

const num = (locale: Locale, n: number, d = 2) => formatNumber(locale, n, { maximumFractionDigits: d });

function ratioLabel(w: number, h: number, locale: Locale): string {
  const g = gcd(w, h);
  const a = w / g;
  const b = h / g;
  if (a <= 32 && b <= 32) return `${a}:${b}`;
  return w >= h ? `${num(locale, w / h)}:1` : `1:${num(locale, h / w)}`;
}

function orientation(w: number, h: number, locale: Locale): string {
  if (w === h) return locale === "ru" ? "квадрат" : "square";
  if (w > h) return locale === "ru" ? "горизонтальная" : "landscape";
  return locale === "ru" ? "вертикальная" : "portrait";
}

const mp = (locale: Locale, w: number, h: number) => `${num(locale, (w * h) / 1e6)} ${locale === "ru" ? "Мп" : "MP"}`;
const yesNo = (locale: Locale, v: boolean | "limited") =>
  v === "limited" ? (locale === "ru" ? "ограниченно" : "limited") : v ? (locale === "ru" ? "да" : "yes") : locale === "ru" ? "нет" : "no";

/* ───────────── format pairs ───────────── */

function formatTable(a: FormatInfo, b: FormatInfo, locale: Locale): Block {
  const ru = locale === "ru";
  const row = (label: string, f: (x: FormatInfo) => string) => [label, f(a), f(b)];
  return {
    type: "table",
    title: ru ? `${a.label} и ${b.label}: сравнение форматов` : `${a.label} vs ${b.label}: format comparison`,
    head: [ru ? "Характеристика" : "Property", a.label, b.label],
    rows: [
      row(ru ? "Полное название" : "Full name", (x) => x.full),
      row(ru ? "Расширения" : "Extensions", (x) => x.exts.map((e) => `.${e}`).join(", ")),
      row("MIME", (x) => x.mime),
      row(ru ? "Появился" : "Introduced", (x) => String(x.year)),
      row(ru ? "Разработчик" : "Developed by", (x) => pick(x.by, locale)),
      row(ru ? "Сжатие" : "Compression", (x) => pick(x.compression, locale)),
      row(ru ? "Прозрачность" : "Transparency", (x) => yesNo(locale, x.alpha)),
      row(ru ? "Анимация" : "Animation", (x) => yesNo(locale, x.animation)),
      row(ru ? "Цвета" : "Colours", (x) => pick(x.colors, locale)),
      row(ru ? "Поддержка" : "Support", (x) => pick(x.support, locale)),
      row(ru ? "Лучше всего для" : "Best for", (x) => pick(x.bestFor, locale)),
    ],
  };
}

const convertVariants = (): VariantDef[] =>
  CONVERT_PAIRS.map((p) => {
    const a = FORMATS[p.from];
    const b = FORMATS[p.to];
    return variant(p, p.slug, { from: p.from, to: p.to }, (locale) => [
      formatTable(a, b, locale),
      { type: "text", title: locale === "ru" ? `О формате ${a.label}` : `About ${a.label}`, paragraphs: [pick(a.about, locale)] },
      { type: "text", title: locale === "ru" ? `О формате ${b.label}` : `About ${b.label}`, paragraphs: [pick(b.about, locale)] },
    ]);
  });

/* ───────────── resize presets & crop ratios ───────────── */

const cropBySlug = new Map(CROP_RATIOS.map((r) => [r.slug, r]));
const ratioSlug = (w: number, h: number) => {
  const g = gcd(w, h);
  return `${w / g}-${h / g}`;
};

const resizeVariants = (): VariantDef[] =>
  RESIZE_PRESETS.map((p) =>
    variant(p, p.slug, { preset: { w: p.w, h: p.h, fit: p.fit, dpi: p.dpi } }, (locale) => {
      const ru = locale === "ru";
      const rows: [string, string][] = [
        [ru ? "Размер в пикселях" : "Size in pixels", `${p.w} × ${p.h} px`],
        [ru ? "Соотношение сторон" : "Aspect ratio", ratioLabel(p.w, p.h, locale)],
        [ru ? "Ориентация" : "Orientation", orientation(p.w, p.h, locale)],
        [ru ? "Мегапиксели" : "Megapixels", mp(locale, p.w, p.h)],
      ];
      if (p.mm) rows.push([ru ? "Физический размер" : "Physical size", `${num(locale, p.mm[0], 1)} × ${num(locale, p.mm[1], 1)} ${ru ? "мм" : "mm"}`]);
      if (p.dpi) rows.push([ru ? "Разрешение печати" : "Print resolution", `${p.dpi} dpi ${ru ? "(записывается в JPG/PNG)" : "(written into JPG/PNG)"}`]);
      rows.push([
        ru ? "Заполнение по умолчанию" : "Default fit",
        p.fit === "cover" ? (ru ? "заполнить и обрезать по центру" : "fill and crop centre") : ru ? "вписать с полями" : "fit with padding",
      ]);
      const blocks: Block[] = [
        { type: "facts", title: ru ? "Параметры размера" : "Size details", rows },
        { type: "facts", title: ru ? "Требования и советы" : "Requirements and tips", rows: pick(p.facts, locale) },
      ];
      const crop = cropBySlug.get(ratioSlug(p.w, p.h));
      const same = RESIZE_PRESETS.filter((x) => x !== p && x.group === p.group);
      const links: LinkItem[] = [
        ...(crop ? [{ path: [SLUG.crop, crop.slug], label: ru ? `Обрезать ${crop.ratio.join(":")}` : `Crop ${crop.ratio.join(":")}` }] : []),
        ...same.map((x) => ({ path: [SLUG.resize, x.slug], label: pick(x.name, locale), hint: `${x.w}×${x.h}` })),
      ];
      if (links.length) blocks.push({ type: "links", title: ru ? "Похожие размеры" : "Similar sizes", style: "chips", items: links });
      return blocks;
    }),
  );

const cropVariants = (): VariantDef[] =>
  CROP_RATIOS.map((r) =>
    variant(
      r,
      r.slug,
      { ratio: r.ratio },
      (locale) => {
        const ru = locale === "ru";
        const blocks: Block[] = [
          { type: "facts", title: ru ? `Где используется ${r.ratio.join(":")}` : `Where ${r.ratio.join(":")} is used`, rows: pick(r.facts, locale) },
          {
            type: "table",
            title: ru ? `Типичные размеры ${r.ratio.join(":")}` : `Typical ${r.ratio.join(":")} sizes`,
            head: [ru ? "Назначение" : "Use", ru ? "Пиксели" : "Pixels", ru ? "Мегапиксели" : "Megapixels"],
            rows: r.sizes.map(([w, h, label]) => [pick(label, locale), `${w} × ${h}`, mp(locale, w, h)]),
          },
        ];
        const presets = RESIZE_PRESETS.filter((p) => ratioSlug(p.w, p.h) === r.slug);
        if (presets.length)
          blocks.push({
            type: "links",
            title: ru ? "Готовые размеры с этими пропорциями" : "Ready-made sizes with this ratio",
            style: "chips",
            items: presets.map((p) => ({ path: [SLUG.resize, p.slug], label: pick(p.name, locale), hint: `${p.w}×${p.h}` })),
          });
        return blocks;
      },
      r.ratio.join(":"),
    ),
  );

/* ───────────── compression & filters ───────────── */

const compressVariants = (): VariantDef[] =>
  COMPRESS_VARIANTS.map((v) =>
    variant(v, v.slug, { format: v.format, targetKb: v.targetKb }, (locale) => [
      { type: "facts", title: locale === "ru" ? "Коротко" : "Quick facts", rows: pick(v.facts, locale) },
    ]),
  );

const UNIT: Record<string, L10n> = { "%": L("%", "%"), px: L("px", "px"), "°": L("°", "°"), lv: L("уровней", "levels"), "": L("", "") };

const filterVariants = (): VariantDef[] =>
  FILTER_TEXTS.map((f) => {
    const def = FILTERS[f.id];
    return variant(f, f.id, { filter: f.id }, (locale) => {
      const ru = locale === "ru";
      const u = pick(UNIT[def.unit], locale);
      const range = `${def.min}–${def.max}${u ? (u.length > 1 && u !== "px" ? ` ${u}` : u === "px" ? " px" : u) : ""}`;
      return [
        {
          type: "facts",
          title: ru ? "Как работает фильтр" : "How the filter works",
          rows: [
            [ru ? "Формула" : "Formula", pick(f.math, locale)],
            [ru ? "Диапазон настройки" : "Setting range", `${range}; ${ru ? "по умолчанию" : "default"} ${def.def}`],
            [ru ? "Предпросмотр" : "Preview", ru ? "на уменьшенной копии, мгновенно" : "instant, on a reduced copy"],
            [ru ? "Экспорт" : "Export", ru ? "в полном разрешении, в Web Worker" : "full resolution, in a Web Worker"],
          ],
        },
      ];
    });
  });

/* ───────────── main-page data blocks ───────────── */

const READABLE = ["jpg", "jfif", "png", "webp", "avif", "heic", "gif", "bmp", "tiff", "svg", "ico"] as const;
const WRITABLE = new Set(["jpg", "png", "webp", "avif", "gif", "ico"]);

const converterBlocks = (locale: Locale): Block[] => {
  const ru = locale === "ru";
  return [
    {
      type: "table",
      title: ru ? "Поддерживаемые форматы" : "Supported formats",
      head: [
        ru ? "Формат" : "Format",
        ru ? "Открыть" : "Read",
        ru ? "Сохранить в" : "Save as",
        ru ? "Прозрачность" : "Transparency",
        ru ? "Анимация" : "Animation",
      ],
      rows: READABLE.map((id) => {
        const f = FORMATS[id];
        return [
          `${f.label} (.${f.exts[0]})`,
          ru ? "да" : "yes",
          WRITABLE.has(id) ? (ru ? "да" : "yes") : "—",
          yesNo(locale, f.alpha),
          yesNo(locale, f.animation),
        ];
      }),
    },
  ];
};

const resizeBlocks = (locale: Locale): Block[] => {
  const ru = locale === "ru";
  return [
    {
      type: "table",
      title: ru ? "Популярные размеры изображений" : "Popular image sizes",
      head: [ru ? "Для чего" : "For", ru ? "Пиксели" : "Pixels", ru ? "Пропорции" : "Ratio"],
      rows: RESIZE_PRESETS.map((p) => [
        pick(p.name, locale),
        `${p.w} × ${p.h}${p.mm ? ` (${p.mm[0]}×${p.mm[1]} ${ru ? "мм" : "mm"})` : ""}`,
        ratioLabel(p.w, p.h, locale),
      ]),
    },
  ];
};

/* ───────────── section ───────────── */

export const imageSection = defineToolSection({
  id: "image",
  name: L("Изображения", "Images"),
  description: L("Сжатие, изменение размера, обрезка, конвертация и редактирование фото онлайн", "Compress, resize, crop, convert and edit photos online"),
  icon: "Image",
  hue: 210,
  category: "files",
  order: 2,
  tools: [
    tool("compress", "image/compress", "Minimize2", {
      popular: true,
      related: ["resize-image", "image-converter", "exif-viewer", "compress-image/to-100kb"],
      variants: { title: L("Сжатие по формату и до нужного размера", "Compress by format or to a target size"), list: compressVariants },
    }),
    tool("resize", "image/resize", "Scaling", {
      popular: true,
      related: ["crop-image", "compress-image", "make-image-square", "change-dpi"],
      variants: { title: L("Размеры для соцсетей, документов и печати", "Sizes for social media, documents and print"), list: resizeVariants },
      blocks: resizeBlocks,
    }),
    tool("convert", "image/convert", "ArrowLeftRight", {
      popular: true,
      related: ["compress-image", "resize-image", "favicon-generator", "svg-viewer"],
      variants: { title: L("Популярные конвертации", "Popular conversions"), list: convertVariants },
      blocks: converterBlocks,
    }),
    tool("crop", "image/crop", "Crop", {
      popular: true,
      related: ["crop-image-circle", "resize-image", "rotate-image", "make-image-square"],
      variants: { title: L("Обрезка по пропорциям", "Crop to an aspect ratio"), list: cropVariants },
    }),
    tool("crop-circle", "image/crop", "Circle", { props: { shape: "circle" }, related: ["crop-image", "round-image-corners", "favicon-generator"] }),
    tool("rotate", "image/orient", "RotateCw", { props: { mode: "rotate" }, related: ["flip-image", "crop-image", "exif-viewer"] }),
    tool("flip", "image/orient", "FlipHorizontal2", { props: { mode: "flip" }, related: ["rotate-image", "crop-image"] }),
    tool("filters", "image/filters", "Sparkles", {
      popular: true,
      related: ["blur-part-of-image", "add-text-to-image", "compare-images"],
      variants: { title: L("Все фильтры", "All filters"), list: filterVariants },
    }),
    tool("censor", "image/censor", "EyeOff", { related: ["photo-filters/pixelate", "photo-filters/blur", "exif-viewer", "crop-image"] }),
    tool("watermark", "image/watermark", "Stamp", { popular: true, related: ["add-text-to-image", "compress-image", "resize-image"] }),
    tool("add-text", "image/add-text", "Type", { related: ["add-watermark", "photo-collage", "add-border-to-image"] }),
    tool("collage", "image/collage", "LayoutGrid", { related: ["split-image", "make-image-square", "gif-maker"] }),
    tool("split", "image/split", "Scissors", { related: ["photo-collage", "crop-image", "make-image-square"] }),
    tool("square", "image/decorate", "Square", {
      props: { mode: "square" },
      related: ["resize-image/instagram-post", "crop-image/1-1", "add-border-to-image"],
    }),
    tool("round-corners", "image/decorate", "SquareRoundCorner", {
      props: { mode: "round" },
      related: ["add-border-to-image", "crop-image-circle", "make-image-square"],
    }),
    tool("border", "image/decorate", "Frame", { props: { mode: "border" }, related: ["round-image-corners", "make-image-square", "add-watermark"] }),
    tool("exif", "image/exif", "FileSearch", { related: ["change-dpi", "compress-image", "rotate-image"] }),
    tool("dpi", "image/dpi", "Printer", { related: ["resize-image/print-10x15", "resize-image/passport-35x45", "exif-viewer"] }),
    tool("to-base64", "image/to-base64", "Binary", { related: ["base64-to-image", "image-converter", "svg-viewer"] }),
    tool("base64-to-image", "image/base64-to-image", "FileImage", { related: ["image-to-base64", "image-converter"] }),
    tool("favicon", "image/favicon", "AppWindow", { related: ["image-converter/png-to-ico", "svg-viewer", "crop-image-circle"] }),
    tool("colors", "image/colors", "Pipette", { related: ["photo-filters", "compare-images"] }),
    tool("gif-maker", "image/gif-maker", "Film", { related: ["split-gif", "image-converter/jpg-to-gif", "photo-collage"] }),
    tool("gif-frames", "image/gif-frames", "Clapperboard", { related: ["gif-maker", "image-converter/gif-to-png"] }),
    tool("svg", "image/svg", "PenTool", { related: ["image-converter/svg-to-png", "favicon-generator", "image-to-base64"] }),
    tool("pixel-art", "image/pixel-art", "Grid3x3", { related: ["gif-maker", "favicon-generator"] }),
    tool("compare", "image/compare", "Columns2", { related: ["compress-image", "photo-filters", "image-color-picker"] }),
  ],
});
