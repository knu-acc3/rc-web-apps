import type { Txt } from "../shared";

export type ScreenKind = "monitor" | "laptop" | "tv" | "phone" | "tablet" | "legacy";

export interface ScreenRes {
  w: number;
  h: number;
  kind: ScreenKind;
  /** Diagonals (inches) typical for this resolution, used for the PPI table. */
  diags: number[];
  /** Where the resolution is used (only well-known facts). */
  devices: Txt;
  /** Official pixel density of named devices, if any. */
  note?: Txt;
  /** Short usage phrase for meta descriptions when `devices` is too long. */
  brief?: Txt;
}

export const screenSlug = (r: { w: number; h: number }) => `${r.w}x${r.h}`;

export const SCREENS: ScreenRes[] = [
  {
    w: 1920, h: 1080, kind: "monitor", diags: [13.3, 15.6, 21.5, 24, 27, 32, 43],
    devices: {
      ru: "Самое распространённое разрешение мониторов и ноутбуков; Full HD-телевизоры, игровые консоли, видео 1080p на YouTube.",
      en: "The most common monitor and laptop resolution; Full HD TVs, game consoles and 1080p video on YouTube.",
    },
  },
  {
    w: 1280, h: 720, kind: "tv", diags: [5, 13.3, 24, 32],
    devices: {
      ru: "HD Ready-телевизоры, недорогие смартфоны и планшеты, видео 720p, стримы в низком качестве.",
      en: "HD Ready TVs, budget phones and tablets, 720p video and low-bitrate streams.",
    },
  },
  {
    w: 2560, h: 1440, kind: "monitor", diags: [24, 27, 32],
    devices: {
      ru: "Мониторы 27″ QHD, игровые мониторы 1440p; в смартфонах — экраны QHD (2560 × 1440 в вертикальной ориентации).",
      en: "27″ QHD monitors and 1440p gaming monitors; QHD phone screens (2560 × 1440 in portrait).",
    },
  },
  {
    w: 3840, h: 2160, kind: "tv", diags: [27, 32, 43, 55, 65, 75],
    devices: {
      ru: "4K-телевизоры, мониторы 27–32″ 4K, видео 2160p, PlayStation 5 и Xbox Series X.",
      en: "4K TVs, 27–32″ 4K monitors, 2160p video, PlayStation 5 and Xbox Series X.",
    },
  },
  {
    w: 1366, h: 768, kind: "laptop", diags: [11.6, 14, 15.6, 32],
    devices: {
      ru: "Бюджетные ноутбуки 11,6–15,6″ 2010-х годов, часть телевизоров HD Ready с диагональю 32″.",
      en: "Budget 11.6–15.6″ laptops of the 2010s and some 32″ HD Ready TVs.",
    },
  },
  {
    w: 1440, h: 900, kind: "laptop", diags: [13.3, 19],
    devices: {
      ru: "MacBook Air 13″ (2010–2017), мониторы 19″ формата 16:10.",
      en: "MacBook Air 13″ (2010–2017) and 19″ 16:10 monitors.",
    },
  },
  {
    w: 1536, h: 864, kind: "laptop", diags: [14, 15.6],
    devices: {
      ru: "Обычно это не физическая матрица, а размер в CSS-пикселях: экран 1920 × 1080 при масштабе Windows 125% сайты видят как 1536 × 864.",
      en: "Usually not a physical panel but a CSS-pixel size: a 1920 × 1080 screen at 125% Windows scaling reports 1536 × 864 to websites.",
    },
  },
  {
    w: 1600, h: 900, kind: "laptop", diags: [15.6, 17.3, 20],
    devices: {
      ru: "Ноутбуки 15,6–17,3″ и мониторы 20″ среднего класса.",
      en: "Mid-range 15.6–17.3″ laptops and 20″ monitors.",
    },
  },
  {
    w: 1280, h: 1024, kind: "legacy", diags: [17, 19],
    devices: {
      ru: "Мониторы 17″ и 19″ с соотношением сторон 5:4 (2000-е годы), офисные и промышленные мониторы.",
      en: "17″ and 19″ 5:4 monitors from the 2000s, office and industrial displays.",
    },
  },
  {
    w: 1680, h: 1050, kind: "monitor", diags: [20, 22],
    devices: { ru: "Мониторы 20–22″ формата 16:10.", en: "20–22″ 16:10 monitors." },
  },
  {
    w: 1920, h: 1200, kind: "monitor", diags: [16, 24],
    devices: {
      ru: "Мониторы 24″ формата 16:10 и ноутбуки 16″ с экраном 16:10.",
      en: "24″ 16:10 monitors and 16″ laptops with 16:10 screens.",
    },
  },
  {
    w: 2560, h: 1600, kind: "laptop", diags: [13.3, 16, 30],
    devices: {
      ru: "MacBook Pro 13″ (2012–2022) и MacBook Air 13″ (2018–2020), мониторы 30″ формата 16:10.",
      en: "13″ MacBook Pro (2012–2022) and 13″ MacBook Air (2018–2020), 30″ 16:10 monitors.",
    },
    note: { ru: "MacBook Pro 13″ — 227 ppi.", en: "13″ MacBook Pro — 227 ppi." },
  },
  {
    w: 2560, h: 1080, kind: "monitor", diags: [25, 29, 34],
    devices: {
      ru: "Ультраширокие мониторы 25–29″ (часто продаются как 21:9, точное соотношение 64:27).",
      en: "25–29″ ultrawide monitors (marketed as 21:9, the exact ratio is 64:27).",
    },
  },
  {
    w: 3440, h: 1440, kind: "monitor", diags: [34, 35],
    devices: {
      ru: "Ультраширокие мониторы 34″ (маркетинговое 21:9, точное 43:18).",
      en: "34″ ultrawide monitors (marketed as 21:9, exactly 43:18).",
    },
  },
  {
    w: 5120, h: 1440, kind: "monitor", diags: [49],
    devices: {
      ru: "Сверхширокие мониторы 49″ формата 32:9 — два экрана QHD рядом (например, Samsung Odyssey G9).",
      en: "49″ 32:9 super-ultrawide monitors — two QHD screens side by side (e.g. Samsung Odyssey G9).",
    },
    brief: { ru: "Сверхширокие мониторы 49″ — два QHD рядом.", en: "49″ super-ultrawide monitors — two QHD side by side." },
  },
  {
    w: 5120, h: 2880, kind: "monitor", diags: [27],
    devices: {
      ru: "iMac 27″ Retina 5K, Apple Studio Display, мониторы 27″ 5K.",
      en: "27″ iMac with Retina 5K display, Apple Studio Display and other 27″ 5K monitors.",
    },
    note: { ru: "iMac 27″ Retina 5K и Studio Display — 218 ppi.", en: "27″ iMac Retina 5K and Studio Display — 218 ppi." },
  },
  {
    w: 7680, h: 4320, kind: "tv", diags: [55, 65, 75, 85],
    devices: {
      ru: "8K-телевизоры 65–85″; контента в 8K пока мало, обычно изображение масштабируется.",
      en: "65–85″ 8K TVs; native 8K content is rare, so the picture is usually upscaled.",
    },
  },
  {
    w: 1024, h: 768, kind: "legacy", diags: [9.7, 15],
    devices: {
      ru: "iPad 1 и 2, первый iPad mini, проекторы XGA, мониторы 15″ формата 4:3.",
      en: "iPad 1 and 2, the first iPad mini, XGA projectors and 15″ 4:3 monitors.",
    },
  },
  {
    w: 800, h: 600, kind: "legacy", diags: [12, 14, 15],
    devices: {
      ru: "Старые мониторы 14–15″, проекторы SVGA, минимальное разрешение для старых программ.",
      en: "Old 14–15″ monitors, SVGA projectors and the minimum resolution of legacy software.",
    },
  },
  {
    w: 1080, h: 1920, kind: "phone", diags: [5, 5.5, 6],
    devices: {
      ru: "Смартфоны с экраном Full HD 16:9 и вертикальное видео: Stories, Reels, TikTok, YouTube Shorts (1080 × 1920).",
      en: "Full HD 16:9 phones and vertical video: Stories, Reels, TikTok and YouTube Shorts (1080 × 1920).",
    },
  },
  {
    w: 720, h: 1280, kind: "phone", diags: [4.7, 5, 5.5],
    devices: {
      ru: "Недорогие смартфоны с HD-экраном 16:9, вертикальное видео 720p.",
      en: "Budget phones with 16:9 HD screens and vertical 720p video.",
    },
  },
  {
    w: 1080, h: 2400, kind: "phone", diags: [6.4, 6.5, 6.67],
    devices: {
      ru: "Многие Android-смартфоны с экраном 20:9 (FHD+), например серии Samsung Galaxy A и Xiaomi Redmi Note.",
      en: "Many Android phones with 20:9 FHD+ screens, e.g. Samsung Galaxy A and Xiaomi Redmi Note series.",
    },
  },
  {
    w: 1170, h: 2532, kind: "phone", diags: [6.1],
    devices: { ru: "iPhone 12, 12 Pro, 13, 13 Pro и 14 (6,1″).", en: "iPhone 12, 12 Pro, 13, 13 Pro and 14 (6.1″)." },
    note: { ru: "Apple указывает 460 ppi.", en: "Apple specifies 460 ppi." },
  },
  {
    w: 1179, h: 2556, kind: "phone", diags: [6.1],
    devices: { ru: "iPhone 14 Pro, 15, 15 Pro и 16 (6,1″).", en: "iPhone 14 Pro, 15, 15 Pro and 16 (6.1″)." },
    note: { ru: "Apple указывает 460 ppi.", en: "Apple specifies 460 ppi." },
  },
  {
    w: 1290, h: 2796, kind: "phone", diags: [6.7],
    devices: {
      ru: "iPhone 14 Pro Max, 15 Plus, 15 Pro Max и 16 Plus (6,7″).",
      en: "iPhone 14 Pro Max, 15 Plus, 15 Pro Max and 16 Plus (6.7″).",
    },
    note: { ru: "Apple указывает 460 ppi.", en: "Apple specifies 460 ppi." },
  },
  {
    w: 1284, h: 2778, kind: "phone", diags: [6.7],
    devices: { ru: "iPhone 12 Pro Max, 13 Pro Max и 14 Plus (6,7″).", en: "iPhone 12 Pro Max, 13 Pro Max and 14 Plus (6.7″)." },
    note: { ru: "Apple указывает 458 ppi.", en: "Apple specifies 458 ppi." },
  },
  {
    w: 1125, h: 2436, kind: "phone", diags: [5.8],
    devices: { ru: "iPhone X, XS и 11 Pro (5,8″).", en: "iPhone X, XS and 11 Pro (5.8″)." },
    note: { ru: "Apple указывает 458 ppi.", en: "Apple specifies 458 ppi." },
  },
  {
    w: 828, h: 1792, kind: "phone", diags: [6.1],
    devices: { ru: "iPhone XR и iPhone 11 (6,1″).", en: "iPhone XR and iPhone 11 (6.1″)." },
    note: { ru: "Apple указывает 326 ppi.", en: "Apple specifies 326 ppi." },
  },
  {
    w: 750, h: 1334, kind: "phone", diags: [4.7],
    devices: {
      ru: "iPhone 6, 6s, 7, 8 и iPhone SE 2-го и 3-го поколения (4,7″).",
      en: "iPhone 6, 6s, 7, 8 and iPhone SE (2nd and 3rd generation, 4.7″).",
    },
    note: { ru: "Apple указывает 326 ppi.", en: "Apple specifies 326 ppi." },
  },
  {
    w: 1440, h: 3200, kind: "phone", diags: [6.2, 6.7, 6.8],
    devices: {
      ru: "Флагманские Android-смартфоны с экраном WQHD+ 20:9, например Samsung Galaxy S20 и S21 Ultra.",
      en: "Flagship Android phones with 20:9 WQHD+ screens, e.g. Samsung Galaxy S20 and S21 Ultra.",
    },
  },
  {
    w: 2048, h: 1536, kind: "tablet", diags: [7.9, 9.7],
    devices: {
      ru: "iPad 3 и 4, iPad Air 1 и 2, iPad 9,7″ (5-е и 6-е поколение), iPad mini 2–5.",
      en: "iPad 3 and 4, iPad Air 1 and 2, 9.7″ iPad (5th and 6th gen) and iPad mini 2–5.",
    },
    note: { ru: "iPad 9,7″ — 264 ppi, iPad mini — 326 ppi.", en: "9.7″ iPad — 264 ppi, iPad mini — 326 ppi." },
  },
  {
    w: 2388, h: 1668, kind: "tablet", diags: [11],
    devices: { ru: "iPad Pro 11″ (2018–2022).", en: "11″ iPad Pro (2018–2022)." },
    note: { ru: "Apple указывает 264 ppi.", en: "Apple specifies 264 ppi." },
  },
  {
    w: 2732, h: 2048, kind: "tablet", diags: [12.9],
    devices: { ru: "iPad Pro 12,9″ (все поколения).", en: "12.9″ iPad Pro (all generations)." },
    note: { ru: "Apple указывает 264 ppi.", en: "Apple specifies 264 ppi." },
  },
  {
    w: 2880, h: 1800, kind: "laptop", diags: [15.4],
    devices: { ru: "MacBook Pro 15″ Retina (2012–2019).", en: "15″ MacBook Pro with Retina display (2012–2019)." },
    note: { ru: "Apple указывает 220 ppi.", en: "Apple specifies 220 ppi." },
  },
  {
    w: 3024, h: 1964, kind: "laptop", diags: [14.2],
    devices: { ru: "MacBook Pro 14″ (с 2021 года).", en: "14″ MacBook Pro (2021 and later)." },
    note: { ru: "Apple указывает 254 ppi.", en: "Apple specifies 254 ppi." },
  },
  {
    w: 3456, h: 2234, kind: "laptop", diags: [16.2],
    devices: { ru: "MacBook Pro 16″ (с 2021 года).", en: "16″ MacBook Pro (2021 and later)." },
    note: { ru: "Apple указывает 254 ppi.", en: "Apple specifies 254 ppi." },
  },
  {
    w: 2560, h: 1664, kind: "laptop", diags: [13.6],
    devices: { ru: "MacBook Air 13″ на M2 и M3.", en: "13″ MacBook Air with M2 and M3." },
    note: { ru: "Apple указывает 224 ppi.", en: "Apple specifies 224 ppi." },
  },
  {
    w: 1280, h: 800, kind: "laptop", diags: [7, 10.1, 13.3],
    devices: {
      ru: "MacBook и MacBook Pro 13″ (2008–2012), Steam Deck, недорогие планшеты 8–10″.",
      en: "13″ MacBook and MacBook Pro (2008–2012), Steam Deck and budget 8–10″ tablets.",
    },
  },
  {
    w: 4096, h: 2160, kind: "tv", diags: [],
    devices: {
      ru: "Стандарт цифрового кинематографа DCI 4K: кинопроекторы и профессиональные камеры; бытовой 4K — это 3840 × 2160.",
      en: "The DCI 4K digital cinema standard: cinema projectors and pro cameras; consumer 4K is 3840 × 2160.",
    },
  },
];

export const SCREEN_BY_SLUG = new Map(SCREENS.map((s) => [screenSlug(s), s]));
