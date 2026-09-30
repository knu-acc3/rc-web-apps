import type { Txt } from "../shared";

export interface RatioDef {
  slug: string;
  w: number;
  h: number;
  /** Typical resolutions with this (or the marketed) ratio. */
  res: [number, number][];
  short: Txt;
  uses: Txt;
}

export const RATIOS: RatioDef[] = [
  {
    slug: "16-9", w: 16, h: 9,
    res: [[640, 360], [1280, 720], [1600, 900], [1920, 1080], [2560, 1440], [3200, 1800], [3840, 2160], [5120, 2880], [7680, 4320]],
    short: { ru: "стандарт HD-видео, телевизоров и мониторов", en: "the standard for HD video, TVs and monitors" },
    uses: {
      ru: "Стандарт HD-телевидения и видео (720p, 1080p, 4K, 8K), YouTube, игровых консолей, большинства мониторов и ноутбуков.",
      en: "The standard for HD television and video (720p, 1080p, 4K, 8K), YouTube, game consoles and most monitors and laptops.",
    },
  },
  {
    slug: "16-10", w: 16, h: 10,
    res: [[1280, 800], [1440, 900], [1680, 1050], [1920, 1200], [2560, 1600], [2880, 1800], [3840, 2400]],
    short: { ru: "мониторы и ноутбуки с более высоким экраном", en: "taller monitors and laptops" },
    uses: {
      ru: "Мониторы и ноутбуки с экраном выше, чем 16:9: MacBook, мониторы WUXGA 24″. Лишние 10% высоты удобны для документов и кода.",
      en: "Monitors and laptops taller than 16:9: MacBooks and 24″ WUXGA monitors. The extra 10% of height helps with documents and code.",
    },
  },
  {
    slug: "4-3", w: 4, h: 3,
    res: [[640, 480], [800, 600], [1024, 768], [1280, 960], [1400, 1050], [1600, 1200], [2048, 1536]],
    short: { ru: "старые мониторы, iPad и фото со смартфонов", en: "classic monitors, iPads and phone photos" },
    uses: {
      ru: "Старые мониторы и телевизоры, iPad, проекторы XGA; этот же формат у большинства фотографий со смартфонов (например, 4000 × 3000).",
      en: "Classic monitors and TVs, iPads and XGA projectors; also the default for most smartphone photos (e.g. 4000 × 3000).",
    },
  },
  {
    slug: "3-2", w: 3, h: 2,
    res: [[1080, 720], [1440, 960], [1920, 1280], [2160, 1440], [2736, 1824], [3000, 2000], [6000, 4000]],
    short: { ru: "кадр фотокамер и фотопечать 10 × 15", en: "the camera frame and 4 × 6 prints" },
    uses: {
      ru: "Кадр 35-мм плёнки (36 × 24 мм) и большинства зеркальных и беззеркальных камер, фотопечать 10 × 15 см, ноутбуки и планшеты Microsoft Surface.",
      en: "The 35 mm film frame (36 × 24 mm) and most DSLR and mirrorless cameras, 4 × 6 inch prints, and Microsoft Surface laptops and tablets.",
    },
  },
  {
    slug: "21-9", w: 21, h: 9,
    res: [[2560, 1080], [3440, 1440], [3840, 1600], [5120, 2160]],
    short: { ru: "ультраширокие мониторы", en: "ultrawide monitors" },
    uses: {
      ru: "Маркетинговое название ультрашироких мониторов. Реальные пропорции: 2560 × 1080 — 64:27 (2,37:1), 3440 × 1440 — 43:18 (2,39:1), 3840 × 1600 — 12:5 (2,4:1). Близко к кинокадру 2,39:1.",
      en: "A marketing name for ultrawide monitors. The real ratios are 64:27 for 2560 × 1080 (2.37:1), 43:18 for 3440 × 1440 (2.39:1) and 12:5 for 3840 × 1600 (2.4:1) — close to the 2.39:1 cinema frame.",
    },
  },
  {
    slug: "32-9", w: 32, h: 9,
    res: [[3840, 1080], [5120, 1440], [7680, 2160]],
    short: { ru: "сверхширокие мониторы — два 16:9 рядом", en: "super-ultrawide monitors — two 16:9 side by side" },
    uses: {
      ru: "Сверхширокие мониторы 49″ и 57″: по ширине это два экрана 16:9 рядом (5120 × 1440 = два QHD).",
      en: "49″ and 57″ super-ultrawide monitors: two 16:9 screens side by side (5120 × 1440 = two QHD panels).",
    },
  },
  {
    slug: "1-1", w: 1, h: 1,
    res: [[512, 512], [1024, 1024], [1080, 1080], [2048, 2048]],
    short: { ru: "квадрат: аватары и посты", en: "square: avatars and posts" },
    uses: {
      ru: "Квадратные изображения: аватары, обложки альбомов, посты Instagram (1080 × 1080), иконки приложений.",
      en: "Square images: avatars, album covers, Instagram posts (1080 × 1080) and app icons.",
    },
  },
  {
    slug: "9-16", w: 9, h: 16,
    res: [[720, 1280], [1080, 1920], [1440, 2560], [2160, 3840]],
    short: { ru: "вертикальное видео: Stories, Reels, TikTok", en: "vertical video: Stories, Reels, TikTok" },
    uses: {
      ru: "Вертикальное видео: Stories, Reels, TikTok, YouTube Shorts (1080 × 1920), экраны смартфонов в вертикальной ориентации.",
      en: "Vertical video: Stories, Reels, TikTok and YouTube Shorts (1080 × 1920), and phone screens held upright.",
    },
  },
  {
    slug: "5-4", w: 5, h: 4,
    res: [[1280, 1024], [1600, 1280], [2560, 2048]],
    short: { ru: "мониторы 1280 × 1024", en: "1280 × 1024 monitors" },
    uses: {
      ru: "Мониторы 17–19″ с разрешением 1280 × 1024 и медицинские мониторы; фотопечать 10 × 8 дюймов в альбомной ориентации.",
      en: "17–19″ monitors at 1280 × 1024 and medical displays; 10 × 8 inch prints in landscape.",
    },
  },
  {
    slug: "4-5", w: 4, h: 5,
    res: [[864, 1080], [1080, 1350], [1600, 2000]],
    short: { ru: "вертикальные посты Instagram", en: "portrait Instagram posts" },
    uses: {
      ru: "Вертикальные посты Instagram (1080 × 1350) — в ленте они занимают больше места, чем квадрат; фотопечать 8 × 10 дюймов.",
      en: "Portrait Instagram posts (1080 × 1350), which take more feed space than squares; 8 × 10 inch prints.",
    },
  },
  {
    slug: "2-1", w: 2, h: 1,
    res: [[1440, 720], [2160, 1080], [2880, 1440], [3840, 1920]],
    short: { ru: "смартфоны 18:9 и панорамы 360°", en: "18:9 phones and 360° panoramas" },
    uses: {
      ru: "Смартфоны с экраном 18:9 (например, 2160 × 1080) и сферические панорамы и видео 360° в равнопромежуточной проекции (3840 × 1920).",
      en: "Phones with 18:9 screens (e.g. 2160 × 1080) and 360° panoramas and video in equirectangular projection (3840 × 1920).",
    },
  },
];

export const RATIO_BY_SLUG = new Map(RATIOS.map((r) => [r.slug, r]));
