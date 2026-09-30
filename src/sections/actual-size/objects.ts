import type { L10n } from "@/i18n/config";
import type { ClientObj, Shape } from "./types";

/*
 * Objects shown at actual size. Every dimension comes from an official specification
 * (standard, central bank, manufacturer spec sheet). Objects whose data could not be
 * verified were left out on purpose — see the section report.
 * w = horizontal size, h = vertical size, d = thickness/depth, all in millimetres.
 */

export type CatId = "cards" | "photos" | "paper" | "coins" | "banknotes" | "batteries" | "connectors" | "iphone" | "android" | "gadgets" | "things";

export interface ObjDef extends Omit<ClientObj, "name"> {
  cat: CatId;
  /** Objects compared in the "similar objects" table. */
  group: string;
  /** Full name, used as H1 (nominative case in Russian). */
  name: L10n;
  /** Shorter name for the <title> (defaults to name). */
  short?: L10n;
  /** Chip label (defaults to short / name). */
  chip?: L10n;
  /** Name already contains the size ("Business card 90 × 50 mm"): no size in the title. */
  named?: boolean;
  std?: string;
  /** Who publishes the dimensions. */
  src?: L10n;
  note?: L10n;
  material?: L10n;
  /** Mass, grams. */
  mass?: number;
  /** Screen diagonal, inches. */
  diag?: number;
  year?: number;
  popular?: boolean;
}

const same = (s: string): L10n => ({ ru: s, en: s });

/* ───────────── cards & documents ───────────── */

const CARDS: ObjDef[] = [
  {
    slug: "bank-card",
    cat: "cards",
    group: "id",
    name: { ru: "Банковская карта", en: "Bank card" },
    chip: { ru: "Банковская карта", en: "Bank card" },
    w: 85.6,
    h: 53.98,
    d: 0.76,
    r: 3.18,
    shape: "card",
    std: "ISO/IEC 7810 ID-1",
    note: {
      ru: "Тот же формат ID-1 у водительских прав, ID-карт (в том числе удостоверения личности РК), транспортных и скидочных карт. Радиус скругления углов — 3,18 мм.",
      en: "The same ID-1 format is used by driving licences, national ID cards, transit and loyalty cards. Corner radius is 3.18 mm.",
    },
    popular: true,
  },
  {
    slug: "passport",
    cat: "cards",
    group: "id",
    name: { ru: "Паспорт (формат ID-3)", en: "Passport (ID-3 size)" },
    chip: { ru: "Паспорт", en: "Passport" },
    w: 88,
    h: 125,
    r: 3,
    shape: "rect",
    std: "ISO/IEC 7810 ID-3, ICAO 9303",
    note: {
      ru: "Размер закрытого заграничного паспорта по стандарту ICAO; бланк внутреннего паспорта РФ тоже 88 × 125 мм.",
      en: "The closed size of an ICAO-standard passport booklet; the data page is 125 × 88 mm (TD3).",
    },
  },
  {
    slug: "mini-sim",
    cat: "cards",
    group: "sim",
    name: same("Mini-SIM (2FF)"),
    w: 25,
    h: 15,
    d: 0.76,
    shape: "sim",
    std: "ETSI TS 102 221 (2FF)",
    note: {
      ru: "«Обычная» SIM-карта старых телефонов. Из современной пластиковой рамки обычно выламываются все три размера.",
      en: "The “standard” SIM of older phones. Modern SIM holders usually let you snap out all three sizes.",
    },
  },
  {
    slug: "micro-sim",
    cat: "cards",
    group: "sim",
    name: same("Micro-SIM (3FF)"),
    w: 15,
    h: 12,
    d: 0.76,
    shape: "sim",
    std: "ETSI TS 102 221 (3FF)",
    note: {
      ru: "Использовалась в iPhone 4/4S и многих смартфонах 2010–2014 годов.",
      en: "Used in the iPhone 4/4S and many smartphones of 2010–2014.",
    },
  },
  {
    slug: "nano-sim",
    cat: "cards",
    group: "sim",
    name: same("Nano-SIM (4FF)"),
    w: 12.3,
    h: 8.8,
    d: 0.67,
    shape: "sim",
    std: "ETSI TS 102 221 (4FF)",
    note: {
      ru: "Самая маленькая съёмная SIM-карта и стандарт почти всех современных смартфонов; тоньше остальных — 0,67 мм.",
      en: "The smallest removable SIM and the standard in almost every current smartphone; thinner than the others at 0.67 mm.",
    },
    popular: true,
  },
  {
    slug: "sd-card",
    cat: "cards",
    group: "memory",
    name: { ru: "Карта памяти SD", en: "SD card" },
    w: 24,
    h: 32,
    d: 2.1,
    shape: "sd",
    label: "SD",
    std: "SD Association",
    note: {
      ru: "Одинаковый размер у SD, SDHC и SDXC: фотоаппараты, ноутбуки, кардридеры. Смартфоны и Nintendo Switch используют microSD.",
      en: "SD, SDHC and SDXC share this size: cameras, laptops, card readers. Phones and the Nintendo Switch take microSD.",
    },
  },
  {
    slug: "microsd-card",
    cat: "cards",
    group: "memory",
    name: { ru: "Карта памяти microSD", en: "microSD card" },
    w: 11,
    h: 15,
    d: 1,
    shape: "microsd",
    std: "SD Association",
    note: {
      ru: "Смартфоны, экшн-камеры, регистраторы, Nintendo Switch; через переходник вставляется в слот SD.",
      en: "Phones, action cameras, dashcams and the Nintendo Switch; an adapter fits it into an SD slot.",
    },
  },
  {
    slug: "business-card-90x50",
    cat: "cards",
    group: "business",
    name: { ru: "Визитка 90 × 50 мм", en: "Business card 90 × 50 mm" },
    chip: { ru: "Визитка 90×50", en: "Business card 90×50" },
    named: true,
    w: 90,
    h: 50,
    shape: "rect",
    note: {
      ru: "Самый распространённый формат визиток в России, Казахстане и других странах СНГ.",
      en: "The most common business card size in Russia, Kazakhstan and other CIS countries.",
    },
  },
  {
    slug: "business-card-85x55",
    cat: "cards",
    group: "business",
    name: { ru: "Визитка 85 × 55 мм (Европа)", en: "Business card 85 × 55 mm (Europe)" },
    chip: { ru: "Визитка 85×55", en: "Business card 85×55" },
    named: true,
    w: 85,
    h: 55,
    shape: "rect",
    note: {
      ru: "Европейский стандарт визиток: Германия, Франция, Италия, Испания и другие страны.",
      en: "The European business card standard used in Germany, France, Italy, Spain and elsewhere.",
    },
  },
  {
    slug: "business-card-us",
    cat: "cards",
    group: "business",
    name: { ru: "Американская визитка 3,5 × 2 дюйма", en: "US business card 3.5 × 2 in" },
    chip: { ru: "Визитка США", en: "US business card" },
    w: 88.9,
    h: 50.8,
    shape: "rect",
    note: {
      ru: "Стандарт США и Канады: 3,5 × 2 дюйма.",
      en: "The standard size in the United States and Canada.",
    },
  },
  {
    slug: "business-card-japan",
    cat: "cards",
    group: "business",
    name: { ru: "Японская визитка 91 × 55 мм", en: "Japanese business card 91 × 55 mm" },
    chip: { ru: "Визитка Японии", en: "Japanese business card" },
    named: true,
    w: 91,
    h: 55,
    shape: "rect",
    note: {
      ru: "Мэйси — японская визитка; немного больше европейской.",
      en: "The Japanese meishi, slightly larger than the European card.",
    },
  },
  {
    slug: "playing-card-poker",
    cat: "cards",
    group: "playing",
    name: { ru: "Игральная карта (покерный размер)", en: "Poker size playing card" },
    chip: { ru: "Игральная карта (покер)", en: "Poker card" },
    w: 63.5,
    h: 88.9,
    r: 3,
    shape: "playing-card",
    note: {
      ru: "2,5 × 3,5 дюйма; почти такой же размер (63 × 88 мм) у коллекционных карт Magic и Pokémon.",
      en: "2.5 × 3.5 in; collectible card games such as Magic and Pokémon use almost the same 63 × 88 mm size.",
    },
  },
  {
    slug: "playing-card-bridge",
    cat: "cards",
    group: "playing",
    name: { ru: "Игральная карта (бриджевый размер)", en: "Bridge size playing card" },
    chip: { ru: "Игральная карта (бридж)", en: "Bridge card" },
    w: 57.2,
    h: 88.9,
    r: 3,
    shape: "playing-card",
    note: {
      ru: "2,25 × 3,5 дюйма — на 6 мм уже покерной, удобнее держать веером.",
      en: "2.25 × 3.5 in — 6 mm narrower than poker size, easier to hold in a large hand.",
    },
  },
];

/* ───────────── photos ───────────── */

const docPhoto = (slug: string, ru: string, en: string, w: number, h: number, note: L10n, extra: Partial<ObjDef> = {}): ObjDef => ({
  slug,
  cat: "photos",
  group: "doc",
  name: { ru, en },
  w,
  h,
  shape: "photo",
  note,
  ...extra,
});

const printPhoto = (slug: string, ru: string, en: string, w: number, h: number, note: L10n, extra: Partial<ObjDef> = {}): ObjDef => ({
  slug,
  cat: "photos",
  group: "print",
  name: { ru, en },
  w,
  h,
  shape: "print",
  note,
  ...extra,
});

const PHOTOS: ObjDef[] = [
  docPhoto("photo-3x4", "Фото 3×4", "3×4 cm photo", 30, 40, {
    ru: "Для пропусков, личных дел, студенческих и зачётных книжек, медицинских карт и других внутренних документов.",
    en: "Used for passes, personnel files, student IDs and other internal documents in Russia and CIS countries.",
  }, { popular: true }),
  docPhoto("photo-35x45", "Фото 3,5×4,5", "3.5×4.5 cm photo", 35, 45, {
    ru: "Паспорт РФ, заграничный паспорт, шенгенская виза, паспорт Великобритании и большинства стран ЕС.",
    en: "Russian passports, the Schengen visa, UK passports and most EU passports.",
  }, { popular: true, short: { ru: "Фото 3,5×4,5", en: "3.5×4.5 cm photo" } }),
  docPhoto("photo-4x6", "Фото 4×6", "4×6 cm photo", 40, 60, {
    ru: "Встречается в требованиях к личным делам, пропускам и некоторым удостоверениям.",
    en: "Asked for by some personnel files, passes and certificates in Russia and CIS countries.",
  }),
  docPhoto("photo-2x2-inch", "Фото 2×2 дюйма", "2×2 inch photo", 50.8, 50.8, {
    ru: "Паспорт и виза США, а также виза в Индию: 51 × 51 мм.",
    en: "US passports and visas, and the Indian visa: 51 × 51 mm.",
  }, { popular: true }),
  docPhoto("photo-5x7-cm", "Фото 5×7 см (Канада)", "5×7 cm photo (Canada)", 50, 70, {
    ru: "Формат фото на паспорт Канады.",
    en: "The Canadian passport photo size.",
  }),
  docPhoto("photo-33x48", "Фото 33×48 мм (виза в Китай)", "33×48 mm photo (China visa)", 33, 48, {
    ru: "Требуемый размер фото для визы в Китай.",
    en: "The required photo size for a Chinese visa.",
  }, { named: true }),
  docPhoto("photo-9x12", "Фото 9×12", "9×12 cm photo", 90, 120, {
    ru: "Крупный формат для личных дел и документов, где нужен портрет большего размера.",
    en: "A large format for personnel files and documents that need a bigger portrait.",
  }),
  printPhoto("photo-9x13", "Фотография 9×13", "9×13 photo print (3.5×5″)", 89, 127, {
    ru: "Небольшой формат печати, 3,5 × 5 дюйма.",
    en: "A small print format, 3.5 × 5 inches.",
  }),
  printPhoto("photo-10x15", "Фотография 10×15", "10×15 photo print (4×6″)", 102, 152, {
    ru: "Самый популярный формат печати фото (4 × 6 дюймов); соотношение сторон 3:2, как у кадра большинства фотоаппаратов.",
    en: "The most popular photo print size (4 × 6 in); 3:2 aspect ratio like most camera frames.",
  }, { popular: true }),
  printPhoto("photo-13x18", "Фотография 13×18", "13×18 photo print (5×7″)", 127, 178, {
    ru: "Формат 5 × 7 дюймов — для рамок и фотоальбомов.",
    en: "The 5 × 7 inch format for frames and albums.",
  }),
  printPhoto("photo-15x21", "Фотография 15×21", "15×21 photo print", 152, 216, {
    ru: "Близок к листу A5 — популярный формат для рамок.",
    en: "Close to an A5 sheet — a popular frame size.",
  }),
  printPhoto("photo-20x30", "Фотография 20×30", "20×30 photo print (8×12″)", 203, 305, {
    ru: "Крупная печать 8 × 12 дюймов, пропорции 2:3.",
    en: "A large 8 × 12 inch print with 2:3 proportions.",
  }),
  {
    slug: "instax-mini",
    cat: "photos",
    group: "instant",
    name: { ru: "Снимок Instax Mini", en: "Instax Mini photo" },
    w: 54,
    h: 86,
    shape: "instant",
    hole: 17,
    note: { ru: "Размер кадра — 46 × 62 мм, остальное — рамка.", en: "The image area is 46 × 62 mm; the rest is the frame." },
  },
  {
    slug: "instax-square",
    cat: "photos",
    group: "instant",
    name: { ru: "Снимок Instax Square", en: "Instax Square photo" },
    w: 72,
    h: 86,
    shape: "instant",
    hole: 17,
    note: { ru: "Квадратный кадр 62 × 62 мм.", en: "A square 62 × 62 mm image." },
  },
  {
    slug: "instax-wide",
    cat: "photos",
    group: "instant",
    name: { ru: "Снимок Instax Wide", en: "Instax Wide photo" },
    w: 108,
    h: 86,
    shape: "instant",
    hole: 17,
    note: { ru: "Широкий кадр 99 × 62 мм.", en: "A wide 99 × 62 mm image." },
  },
  {
    slug: "polaroid-photo",
    cat: "photos",
    group: "instant",
    name: { ru: "Снимок Polaroid (600, i-Type)", en: "Polaroid photo (600, i-Type)" },
    chip: same("Polaroid"),
    w: 88,
    h: 107,
    shape: "instant",
    hole: 22,
    note: { ru: "Классическая квадратная рамка; кадр 79 × 79 мм.", en: "The classic square frame; the image is 79 × 79 mm." },
  },
];

/* ───────────── paper & envelopes ───────────── */

const sheet = (slug: string, label: string, ru: string, en: string, w: number, h: number, group: string, std: string | undefined, note: L10n, extra: Partial<ObjDef> = {}): ObjDef => ({
  slug,
  cat: "paper",
  group,
  name: { ru, en },
  chip: same(label),
  w,
  h,
  shape: "paper",
  label,
  std,
  note,
  ...extra,
});

const envelope = (slug: string, label: string, ru: string, en: string, w: number, h: number, std: string | undefined, note: L10n): ObjDef => ({
  slug,
  cat: "paper",
  group: "env",
  name: { ru, en },
  chip: { ru: `Конверт ${label}`, en: `${label} envelope` },
  w,
  h,
  shape: "envelope",
  label,
  std,
  note,
});

const PAPER: ObjDef[] = [
  sheet("a3", "A3", "Лист A3", "A3 sheet", 297, 420, "a", "ISO 216", {
    ru: "Два листа A4 рядом; формат чертежей, плакатов и схем.",
    en: "Two A4 sheets side by side; used for drawings, posters and charts.",
  }),
  sheet("a4", "A4", "Лист A4", "A4 sheet", 210, 297, "a", "ISO 216", {
    ru: "Стандартный офисный лист. Площадь A0 — 1 м², каждый следующий формат вдвое меньше; соотношение сторон 1 : √2.",
    en: "The standard office sheet. A0 is 1 m² and each next size is half of it; the aspect ratio is 1 : √2.",
  }, { popular: true }),
  sheet("a5", "A5", "Лист A5", "A5 sheet", 148, 210, "a", "ISO 216", {
    ru: "Половина A4: блокноты, ежедневники, брошюры.",
    en: "Half of A4: notebooks, planners and booklets.",
  }),
  sheet("a6", "A6", "Лист A6", "A6 sheet", 105, 148, "a", "ISO 216", {
    ru: "Размер почтовой открытки и карманного блокнота.",
    en: "The postcard and pocket notebook size.",
  }),
  sheet("a7", "A7", "Лист A7", "A7 sheet", 74, 105, "a", "ISO 216", {
    ru: "Маленький блокнот, флаеры, карманный календарь.",
    en: "Small notepads, flyers and pocket calendars.",
  }),
  sheet("a8", "A8", "Лист A8", "A8 sheet", 52, 74, "a", "ISO 216", {
    ru: "Самый маленький из популярных A-форматов — чуть меньше игральной карты.",
    en: "The smallest common A size — a little smaller than a playing card.",
  }),
  sheet("b4", "B4", "Лист B4", "B4 sheet", 250, 353, "b", "ISO 216", {
    ru: "Формат B лежит между соседними A: B4 больше A4, но меньше A3.",
    en: "B sizes sit between neighbouring A sizes: B4 is larger than A4 and smaller than A3.",
  }),
  sheet("b5", "B5", "Лист B5", "B5 sheet", 176, 250, "b", "ISO 216", {
    ru: "Книги, журналы и тетради; японский JIS B5 немного больше — 182 × 257 мм.",
    en: "Books, magazines and notebooks; the Japanese JIS B5 is slightly larger at 182 × 257 mm.",
  }),
  sheet("b6", "B6", "Лист B6", "B6 sheet", 125, 176, "b", "ISO 216", {
    ru: "Популярный формат книг в мягкой обложке.",
    en: "A popular paperback book size.",
  }),
  sheet("letter", "Letter", "Лист Letter (США)", "US Letter sheet", 215.9, 279.4, "us", "ANSI A", {
    ru: "Стандартный офисный лист США и Канады (8,5 × 11 дюймов): на 6 мм шире и на 18 мм короче A4.",
    en: "The standard office sheet in the US and Canada (8.5 × 11 in): 6 mm wider and 18 mm shorter than A4.",
  }, { popular: true }),
  sheet("legal", "Legal", "Лист Legal (США)", "US Legal sheet", 215.9, 355.6, "us", undefined, {
    ru: "Юридический формат США (8,5 × 14 дюймов): ширина как у Letter, но длиннее на 3 дюйма.",
    en: "The US legal format (8.5 × 14 in): as wide as Letter but 3 inches longer.",
  }),
  sheet("tabloid", "Tabloid", "Лист Tabloid (Ledger)", "Tabloid (Ledger) sheet", 279.4, 431.8, "us", "ANSI B", {
    ru: "11 × 17 дюймов — два листа Letter рядом; американский аналог A3.",
    en: "11 × 17 in — two Letter sheets side by side; the US counterpart of A3.",
  }),
  sheet("half-letter", "Half Letter", "Лист Half Letter", "Half Letter sheet", 139.7, 215.9, "us", undefined, {
    ru: "Половина Letter (5,5 × 8,5 дюйма), также называется Statement.",
    en: "Half of Letter (5.5 × 8.5 in), also called Statement.",
  }),
  sheet("index-card-3x5", "3×5″", "Каталожная карточка 3×5 дюймов", "3×5 index card", 127, 76.2, "us", undefined, {
    ru: "Карточки для заметок, рецептов и выступлений — 76 × 127 мм.",
    en: "Cards for notes, recipes and speeches — 76 × 127 mm.",
  }, { chip: { ru: "Карточка 3×5", en: "Index card 3×5" } }),
  envelope("envelope-dl", "DL", "Конверт DL (E65)", "DL envelope", 220, 110, "ISO 269", {
    ru: "Евроконверт для листа A4, сложенного втрое.",
    en: "The euro envelope for an A4 sheet folded in three.",
  }),
  envelope("envelope-c6", "C6", "Конверт C6", "C6 envelope", 162, 114, "ISO 269", {
    ru: "Для листа A4, сложенного вчетверо (A6), и открыток.",
    en: "For an A4 sheet folded twice (A6) and postcards.",
  }),
  envelope("envelope-c5", "C5", "Конверт C5", "C5 envelope", 229, 162, "ISO 269", {
    ru: "Для листа A4, сложенного пополам (A5).",
    en: "For an A4 sheet folded in half (A5).",
  }),
  envelope("envelope-c4", "C4", "Конверт C4", "C4 envelope", 324, 229, "ISO 269", {
    ru: "Для листов A4 без сгибов — документы, каталоги.",
    en: "For unfolded A4 sheets — documents and catalogues.",
  }),
  envelope("envelope-10", "#10", "Конверт №10 (США)", "#10 envelope", 241.3, 104.8, undefined, {
    ru: "Стандартный деловой конверт США (4⅛ × 9½ дюйма) для листа Letter, сложенного втрое.",
    en: "The standard US business envelope (4⅛ × 9½ in) for a Letter sheet folded in three.",
  }),
];

/* ───────────── coins ───────────── */

interface CoinSpec {
  slug: string;
  ru: string;
  en: string;
  chip: L10n;
  label: string;
  dia: number;
  d?: number;
  mass?: number;
  bimetal?: boolean;
  material?: L10n;
  note?: L10n;
  popular?: boolean;
  short?: L10n;
}

const coin = (group: string, src: L10n, c: CoinSpec): ObjDef => ({
  slug: c.slug,
  cat: "coins",
  group,
  name: { ru: c.ru, en: c.en },
  short: c.short,
  chip: c.chip,
  w: c.dia,
  h: c.dia,
  d: c.d,
  mass: c.mass,
  shape: c.bimetal ? "bimetal" : "coin",
  label: c.label,
  src,
  material: c.material,
  note: c.note,
  popular: c.popular,
});

const NBK: L10n = { ru: "Национальный банк Казахстана", en: "National Bank of Kazakhstan" };
const CBR: L10n = { ru: "Банк России", en: "Bank of Russia" };
const ECB: L10n = { ru: "Европейский центральный банк", en: "European Central Bank" };
const MINT: L10n = { ru: "Монетный двор США", en: "United States Mint" };

const BRASS_STEEL: L10n = { ru: "сталь с латунным покрытием", en: "brass-plated steel" };
const KZT_BIMETAL: L10n = { ru: "биметалл: нибрасс и нейзильбер", en: "bimetallic: nickel brass and nickel silver" };
const NORDIC: L10n = { ru: "северное золото", en: "Nordic gold" };
const COPPER_STEEL: L10n = { ru: "сталь, покрытая медью", en: "copper-covered steel" };
const CLAD: L10n = { ru: "медь, плакированная медно-никелевым сплавом", en: "cupronickel-clad copper" };

const COINS: ObjDef[] = [
  coin("kzt", NBK, { slug: "1-tenge", ru: "Монета 1 тенге", en: "1 tenge coin", chip: { ru: "1 тенге", en: "1 tenge" }, label: "1", dia: 15, d: 1.3, mass: 1.63, material: BRASS_STEEL }),
  coin("kzt", NBK, { slug: "2-tenge", ru: "Монета 2 тенге", en: "2 tenge coin", chip: { ru: "2 тенге", en: "2 tenge" }, label: "2", dia: 16, d: 1.3, mass: 1.84, material: BRASS_STEEL }),
  coin("kzt", NBK, { slug: "5-tenge", ru: "Монета 5 тенге", en: "5 tenge coin", chip: { ru: "5 тенге", en: "5 tenge" }, label: "5", dia: 17.27, d: 1.3, mass: 2.18, material: BRASS_STEEL }),
  coin("kzt", NBK, { slug: "10-tenge", ru: "Монета 10 тенге", en: "10 tenge coin", chip: { ru: "10 тенге", en: "10 tenge" }, label: "10", dia: 19.56, d: 1.3, mass: 2.81, material: BRASS_STEEL, popular: true }),
  coin("kzt", NBK, {
    slug: "20-tenge",
    ru: "Монета 20 тенге",
    en: "20 tenge coin",
    chip: { ru: "20 тенге", en: "20 tenge" },
    label: "20",
    dia: 18.27,
    d: 1.6,
    mass: 2.9,
    material: { ru: "сталь с никелевым покрытием", en: "nickel-plated steel" },
    note: { ru: "Меньше монеты 10 тенге по диаметру, но толще — 1,6 мм.", en: "Smaller in diameter than the 10 tenge coin but thicker at 1.6 mm." },
  }),
  coin("kzt", NBK, { slug: "50-tenge", ru: "Монета 50 тенге", en: "50 tenge coin", chip: { ru: "50 тенге", en: "50 tenge" }, label: "50", dia: 23, d: 1.6, mass: 4.71, material: { ru: "нейзильбер", en: "nickel silver" } }),
  coin("kzt", NBK, {
    slug: "100-tenge",
    ru: "Монета 100 тенге",
    en: "100 tenge coin",
    chip: { ru: "100 тенге", en: "100 tenge" },
    label: "100",
    dia: 24.5,
    d: 1.9,
    mass: 6.45,
    bimetal: true,
    material: KZT_BIMETAL,
    note: { ru: "Размер одинаков у монеты образца 2019 года и памятных монет серии этого номинала.", en: "The 2019 design and the commemorative coins of this denomination share the same size." },
    popular: true,
  }),
  coin("kzt", NBK, {
    slug: "200-tenge",
    ru: "Монета 200 тенге",
    en: "200 tenge coin",
    chip: { ru: "200 тенге", en: "200 tenge" },
    label: "200",
    dia: 26,
    d: 1.9,
    mass: 7.5,
    bimetal: true,
    material: KZT_BIMETAL,
    note: { ru: "Выпущена в обращение в январе 2020 года — самая крупная разменная монета Казахстана.", en: "Issued in January 2020 — the largest circulating coin of Kazakhstan." },
  }),
  coin("rub", CBR, { slug: "1-kopeck", ru: "Монета 1 копейка", en: "1 kopeck coin", chip: { ru: "1 копейка", en: "1 kopeck" }, label: "1", dia: 15.5, d: 1.25 }),
  coin("rub", CBR, { slug: "5-kopecks", ru: "Монета 5 копеек", en: "5 kopeck coin", chip: { ru: "5 копеек", en: "5 kopecks" }, label: "5", dia: 18.5, d: 1.45 }),
  coin("rub", CBR, { slug: "10-kopecks", ru: "Монета 10 копеек", en: "10 kopeck coin", chip: { ru: "10 копеек", en: "10 kopecks" }, label: "10", dia: 17.5, d: 1.25 }),
  coin("rub", CBR, { slug: "50-kopecks", ru: "Монета 50 копеек", en: "50 kopeck coin", chip: { ru: "50 копеек", en: "50 kopecks" }, label: "50", dia: 19.5, d: 1.5 }),
  coin("rub", CBR, { slug: "1-ruble", ru: "Монета 1 рубль", en: "1 ruble coin", chip: { ru: "1 рубль", en: "1 ruble" }, label: "1", dia: 20.5, d: 1.5, popular: true }),
  coin("rub", CBR, { slug: "2-rubles", ru: "Монета 2 рубля", en: "2 ruble coin", chip: { ru: "2 рубля", en: "2 rubles" }, label: "2", dia: 23, d: 1.8 }),
  coin("rub", CBR, { slug: "5-rubles", ru: "Монета 5 рублей", en: "5 ruble coin", chip: { ru: "5 рублей", en: "5 rubles" }, label: "5", dia: 25, d: 1.8, popular: true }),
  coin("rub", CBR, {
    slug: "10-rubles",
    ru: "Монета 10 рублей",
    en: "10 ruble coin",
    chip: { ru: "10 рублей", en: "10 rubles" },
    label: "10",
    dia: 22,
    d: 2.2,
    mass: 5.63,
    material: BRASS_STEEL,
    note: { ru: "Жёлтая монета образца 2009 года; меньше пятирублёвой по диаметру, но толще.", en: "The yellow 2009-design coin; smaller than the 5 ruble coin but thicker." },
  }),
  coin("eur", ECB, { slug: "1-euro-cent", ru: "Монета 1 евроцент", en: "1 euro cent coin", chip: { ru: "1 евроцент", en: "1 cent (€)" }, label: "1", dia: 16.25, d: 1.67, mass: 2.3, material: COPPER_STEEL }),
  coin("eur", ECB, { slug: "2-euro-cents", ru: "Монета 2 евроцента", en: "2 euro cent coin", chip: { ru: "2 евроцента", en: "2 cents (€)" }, label: "2", dia: 18.75, d: 1.67, mass: 3.06, material: COPPER_STEEL }),
  coin("eur", ECB, { slug: "5-euro-cents", ru: "Монета 5 евроцентов", en: "5 euro cent coin", chip: { ru: "5 евроцентов", en: "5 cents (€)" }, label: "5", dia: 21.25, d: 1.67, mass: 3.92, material: COPPER_STEEL }),
  coin("eur", ECB, { slug: "10-euro-cents", ru: "Монета 10 евроцентов", en: "10 euro cent coin", chip: { ru: "10 евроцентов", en: "10 cents (€)" }, label: "10", dia: 19.75, d: 1.93, mass: 4.1, material: NORDIC }),
  coin("eur", ECB, { slug: "20-euro-cents", ru: "Монета 20 евроцентов", en: "20 euro cent coin", chip: { ru: "20 евроцентов", en: "20 cents (€)" }, label: "20", dia: 22.25, d: 2.14, mass: 5.74, material: NORDIC }),
  coin("eur", ECB, { slug: "50-euro-cents", ru: "Монета 50 евроцентов", en: "50 euro cent coin", chip: { ru: "50 евроцентов", en: "50 cents (€)" }, label: "50", dia: 24.25, d: 2.38, mass: 7.8, material: NORDIC }),
  coin("eur", ECB, {
    slug: "1-euro",
    ru: "Монета 1 евро",
    en: "1 euro coin",
    chip: { ru: "1 евро", en: "€1" },
    label: "1",
    dia: 23.25,
    d: 2.33,
    mass: 7.5,
    bimetal: true,
    material: { ru: "биметалл: медно-никелевый центр, кольцо из никелевой латуни", en: "bimetallic: cupronickel centre, nickel brass ring" },
    popular: true,
  }),
  coin("eur", ECB, {
    slug: "2-euro",
    ru: "Монета 2 евро",
    en: "2 euro coin",
    chip: { ru: "2 евро", en: "€2" },
    label: "2",
    dia: 25.75,
    d: 2.2,
    mass: 8.5,
    bimetal: true,
    material: { ru: "биметалл: центр из никелевой латуни, медно-никелевое кольцо", en: "bimetallic: nickel brass centre, cupronickel ring" },
    note: { ru: "Самая крупная и тяжёлая монета евро.", en: "The largest and heaviest euro coin." },
  }),
  coin("usd", MINT, {
    slug: "us-penny",
    ru: "Монета 1 цент США (пенни)",
    en: "US penny (1 cent)",
    short: { ru: "Монета 1 цент США", en: "US penny (1 cent)" },
    chip: { ru: "1 цент США", en: "Penny" },
    label: "1¢",
    dia: 19.05,
    d: 1.52,
    mass: 2.5,
    material: { ru: "цинк с медным покрытием", en: "copper-plated zinc" },
    note: { ru: "В 2025 году Минфин США прекратил чеканку пенни для обращения, но монета остаётся законным платёжным средством.", en: "The US Treasury ended penny production for circulation in 2025, but the coin remains legal tender." },
  }),
  coin("usd", MINT, {
    slug: "us-nickel",
    ru: "Монета 5 центов США (никель)",
    en: "US nickel (5 cents)",
    short: { ru: "Монета 5 центов США", en: "US nickel (5 cents)" },
    chip: { ru: "5 центов США", en: "Nickel" },
    label: "5¢",
    dia: 21.21,
    d: 1.95,
    mass: 5,
    material: { ru: "медно-никелевый сплав", en: "cupronickel" },
  }),
  coin("usd", MINT, {
    slug: "us-dime",
    ru: "Монета 10 центов США (дайм)",
    en: "US dime (10 cents)",
    short: { ru: "Монета 10 центов США", en: "US dime (10 cents)" },
    chip: { ru: "10 центов США", en: "Dime" },
    label: "10¢",
    dia: 17.91,
    d: 1.35,
    mass: 2.268,
    material: CLAD,
    note: { ru: "Самая маленькая и тонкая монета США — меньше, чем 1 и 5 центов.", en: "The smallest and thinnest US coin — smaller than the penny and the nickel." },
  }),
  coin("usd", MINT, {
    slug: "us-quarter",
    ru: "Монета 25 центов США (квартер)",
    en: "US quarter (25 cents)",
    short: { ru: "Монета 25 центов США", en: "US quarter (25 cents)" },
    chip: { ru: "25 центов США", en: "Quarter" },
    label: "25¢",
    dia: 24.26,
    d: 1.75,
    mass: 5.67,
    material: CLAD,
    popular: true,
  }),
  coin("usd", MINT, {
    slug: "us-half-dollar",
    ru: "Монета 50 центов США",
    en: "US half dollar (50 cents)",
    chip: { ru: "50 центов США", en: "Half dollar" },
    label: "50¢",
    dia: 30.61,
    d: 2.15,
    mass: 11.34,
    material: CLAD,
  }),
  coin("usd", MINT, {
    slug: "us-dollar-coin",
    ru: "Монета 1 доллар США",
    en: "US dollar coin",
    chip: { ru: "1 доллар США", en: "Dollar coin" },
    label: "$1",
    dia: 26.49,
    d: 2,
    mass: 8.1,
    material: { ru: "марганцевая латунь (золотистая)", en: "golden manganese brass" },
  }),
];

/* ───────────── banknotes ───────────── */

const note = (slug: string, group: string, src: L10n, ru: string, en: string, chip: L10n, label: string, w: number, h: number, n?: L10n, popular?: boolean): ObjDef => ({
  slug,
  cat: "banknotes",
  group,
  name: { ru, en },
  chip,
  w,
  h,
  shape: "banknote",
  label,
  src,
  note: n,
  popular,
});

const EUROPA: L10n = { ru: "Серия «Европа» (второй выпуск).", en: "Europa series (second series)." };
const BANKNOTES: ObjDef[] = [
  note("us-dollar-bill", "usd", { ru: "Бюро гравировки и печати США", en: "US Bureau of Engraving and Printing" }, "Купюра доллара США", "US dollar bill", { ru: "Доллар США", en: "US dollar" }, "$", 156.1, 66.3, {
    ru: "Все номиналы — от 1 до 100 долларов — одного размера: 6,14 × 2,61 дюйма.",
    en: "Every denomination from $1 to $100 has the same size: 6.14 × 2.61 inches.",
  }, true),
  note("5-euro-note", "eur", ECB, "Банкнота 5 евро", "5 euro banknote", { ru: "5 евро", en: "€5" }, "5 €", 120, 62, EUROPA),
  note("10-euro-note", "eur", ECB, "Банкнота 10 евро", "10 euro banknote", { ru: "10 евро", en: "€10" }, "10 €", 127, 67, EUROPA),
  note("20-euro-note", "eur", ECB, "Банкнота 20 евро", "20 euro banknote", { ru: "20 евро", en: "€20" }, "20 €", 133, 72, EUROPA),
  note("50-euro-note", "eur", ECB, "Банкнота 50 евро", "50 euro banknote", { ru: "50 евро", en: "€50" }, "50 €", 140, 77, EUROPA, true),
  note("100-euro-note", "eur", ECB, "Банкнота 100 евро", "100 euro banknote", { ru: "100 евро", en: "€100" }, "100 €", 147, 77, {
    ru: "В серии «Европа» банкноты 100 и 200 евро стали ниже — такой же высоты, как 50 евро (77 мм).",
    en: "In the Europa series the €100 and €200 notes are as tall as the €50 note (77 mm).",
  }),
  note("200-euro-note", "eur", ECB, "Банкнота 200 евро", "200 euro banknote", { ru: "200 евро", en: "€200" }, "200 €", 153, 77, EUROPA),
  note("500-euro-note", "eur", ECB, "Банкнота 500 евро", "500 euro banknote", { ru: "500 евро", en: "€500" }, "500 €", 160, 82, {
    ru: "Первая серия: выпуск прекращён в 2019 году, но банкнота остаётся законным платёжным средством.",
    en: "First series: no longer issued since 2019, but it remains legal tender.",
  }),
  note("100-rubles-note", "rub", CBR, "Купюра 100 рублей", "100 ruble banknote", { ru: "100 рублей", en: "100 rubles" }, "100 ₽", 150, 65, {
    ru: "Размер одинаков у банкнот 10, 50, 100, 200, 500 и 2000 рублей. На сторублёвке образца 1997 года — Большой театр, на модификации 2022 года — Ржевский мемориал Советскому солдату.",
    en: "The 10, 50, 100, 200, 500 and 2000 ruble notes all share this size. The 1997 design shows the Bolshoi Theatre, the 2022 update the Rzhev Memorial to the Soviet Soldier.",
  }),
  note("200-rubles-note", "rub", CBR, "Купюра 200 рублей", "200 ruble banknote", { ru: "200 рублей", en: "200 rubles" }, "200 ₽", 150, 65, {
    ru: "Банкнота образца 2017 года: памятник затопленным кораблям в Севастополе, на обороте — Херсонес Таврический.",
    en: "The 2017 design: the Monument to the Scuttled Ships in Sevastopol on the front and ancient Chersonesus on the back.",
  }),
  note("500-rubles-note", "rub", CBR, "Купюра 500 рублей", "500 ruble banknote", { ru: "500 рублей", en: "500 rubles" }, "500 ₽", 150, 65, {
    ru: "Сиреневая банкнота образца 1997 года: памятник Петру I в Архангельске, на обороте — Соловецкий монастырь.",
    en: "The lilac 1997 design: the Peter the Great monument in Arkhangelsk, with the Solovetsky Monastery on the back.",
  }),
  note("1000-rubles-note", "rub", CBR, "Купюра 1000 рублей", "1000 ruble banknote", { ru: "1000 рублей", en: "1000 rubles" }, "1000 ₽", 157, 69, {
    ru: "Банкноты 1000 и 5000 рублей крупнее остальных: 157 × 69 мм.",
    en: "The 1000 and 5000 ruble notes are larger than the rest: 157 × 69 mm.",
  }, true),
  note("2000-rubles-note", "rub", CBR, "Купюра 2000 рублей", "2000 ruble banknote", { ru: "2000 рублей", en: "2000 rubles" }, "2000 ₽", 150, 65, {
    ru: "Образец 2017 года: несмотря на номинал, того же размера, что 100 рублей.",
    en: "The 2017 design: despite its value, the same size as the 100 ruble note.",
  }),
  note("5000-rubles-note", "rub", CBR, "Купюра 5000 рублей", "5000 ruble banknote", { ru: "5000 рублей", en: "5000 rubles" }, "5000 ₽", 157, 69, {
    ru: "Самая крупная банкнота России; размер как у 1000 рублей.",
    en: "Russia's highest denomination; the same size as the 1000 ruble note.",
  }, true),
];

/* ───────────── batteries ───────────── */

const cyl = (slug: string, label: string, ru: string, en: string, dia: number, len: number, group: string, std: string | undefined, n: L10n, popular?: boolean): ObjDef => ({
  slug,
  cat: "batteries",
  group,
  name: { ru, en },
  short: { ru: ru.replace(/ \(.*\)$/, ""), en },
  chip: same(label),
  w: dia,
  h: len,
  shape: "battery",
  label,
  std,
  note: n,
  popular,
});

const cell = (slug: string, label: string, ru: string, en: string, dia: number, thick: number, group: string, n: L10n, popular?: boolean): ObjDef => ({
  slug,
  cat: "batteries",
  group,
  name: { ru, en },
  short: { ru: ru.replace(/ \(.*\)$/, ""), en: en.replace(/ \(.*\)/, "") },
  chip: same(label),
  w: dia,
  h: dia,
  d: thick,
  shape: "cell",
  label,
  note: n,
  popular,
});

const BATTERIES: ObjDef[] = [
  cyl("aa", "AA", "Батарейка AA (пальчиковая)", "AA battery", 14.5, 50.5, "cyl", "IEC LR6 / R6", {
    ru: "Самый распространённый типоразмер: пульты, игрушки, мыши, вспышки. Щелочная — 1,5 В, NiMH-аккумулятор — 1,2 В.",
    en: "The most common size: remotes, toys, mice, flashes. Alkaline cells give 1.5 V, NiMH rechargeables 1.2 V.",
  }, true),
  cyl("aaa", "AAA", "Батарейка AAA (мизинчиковая)", "AAA battery", 10.5, 44.5, "cyl", "IEC LR03 / R03", {
    ru: "Тоньше и короче AA: пульты, беспроводные мыши и клавиатуры, фонарики. 1,5 В.",
    en: "Thinner and shorter than AA: remotes, wireless mice and keyboards, flashlights. 1.5 V.",
  }, true),
  cyl("aaaa", "AAAA", "Батарейка AAAA", "AAAA battery", 8.3, 42.5, "cyl", "IEC LR61", {
    ru: "Редкий тонкий типоразмер: активные стилусы (например, Surface Pen), лазерные указки.",
    en: "A rare slim size: active styluses (such as the Surface Pen) and laser pointers.",
  }),
  cyl("c-battery", "C", "Батарейка C (R14)", "C battery", 26.2, 50, "cyl", "IEC LR14 / R14", {
    ru: "«Средняя» батарейка: фонари, радиоприёмники, игрушки. 1,5 В.",
    en: "The “medium” battery: flashlights, radios and toys. 1.5 V.",
  }),
  cyl("d-battery", "D", "Батарейка D (R20)", "D battery", 34.2, 61.5, "cyl", "IEC LR20 / R20", {
    ru: "Самая крупная из бытовых цилиндрических батареек: фонари, газовые колонки, крупные игрушки. 1,5 В.",
    en: "The largest common cylindrical battery: flashlights, gas water heaters, large toys. 1.5 V.",
  }),
  cyl("n-battery", "N", "Батарейка N (LR1)", "N battery", 12, 30.2, "cyl", "IEC LR1", {
    ru: "Короткая батарейка 1,5 В для некоторых пультов, звонков и лазерных указок.",
    en: "A short 1.5 V cell for some remotes, doorbells and laser pointers.",
  }),
  {
    slug: "9v",
    cat: "batteries",
    group: "cyl",
    name: { ru: "Батарейка 9V (крона)", en: "9V battery" },
    short: { ru: "Батарейка 9V (крона)", en: "9V battery (PP3)" },
    chip: same("9V"),
    w: 26.5,
    h: 48.5,
    d: 17.5,
    shape: "9v",
    label: "9V",
    std: "IEC 6LR61 / 6F22",
    note: {
      ru: "Прямоугольная батарейка на 9 В с контактами-кнопками сверху: мультиметры, датчики дыма, гитарные педали.",
      en: "A rectangular 9 V battery with snap terminals on top: multimeters, smoke alarms, guitar pedals.",
    },
  },
  cyl("cr123a", "CR123A", "Батарейка CR123A", "CR123A battery", 17, 34.5, "cyl", undefined, {
    ru: "Литиевая 3 В: тактические фонари, фотоаппараты, датчики охранных систем.",
    en: "A 3 V lithium cell: tactical flashlights, cameras and alarm sensors.",
  }),
  cyl("cr2", "CR2", "Батарейка CR2", "CR2 battery", 15.6, 27, "cyl", undefined, {
    ru: "Литиевая 3 В: фотоаппараты, дальномеры, датчики умного дома.",
    en: "A 3 V lithium cell: cameras, rangefinders and smart-home sensors.",
  }),
  cyl("18650", "18650", "Аккумулятор 18650", "18650 battery", 18, 65, "li-ion", undefined, {
    ru: "Литий-ионный 3,6–3,7 В: название — диаметр 18 мм и длина 65 мм. Модели с платой защиты длиннее, около 67–69 мм.",
    en: "A 3.6–3.7 V lithium-ion cell named after its 18 mm diameter and 65 mm length. Protected cells are longer, about 67–69 mm.",
  }, true),
  cyl("21700", "21700", "Аккумулятор 21700", "21700 battery", 21, 70, "li-ion", undefined, {
    ru: "Литий-ионный 3,6–3,7 В: электромобили, электроинструмент, мощные фонари.",
    en: "A 3.6–3.7 V lithium-ion cell: electric cars, power tools and high-output flashlights.",
  }),
  cyl("26650", "26650", "Аккумулятор 26650", "26650 battery", 26, 65, "li-ion", undefined, {
    ru: "Толстый литиевый аккумулятор для мощных фонарей и электроники.",
    en: "A thick lithium cell for powerful flashlights and electronics.",
  }),
  cell("cr2032", "CR2032", "Батарейка CR2032", "CR2032 battery", 20, 3.2, "coin-cell", {
    ru: "Литиевая «таблетка» на 3 В: материнские платы, брелоки, весы, Apple AirTag. 20 — диаметр, 32 — толщина 3,2 мм.",
    en: "A 3 V lithium coin cell: motherboards, key fobs, scales, the Apple AirTag. 20 is the diameter, 32 the 3.2 mm thickness.",
  }, true),
  cell("cr2025", "CR2025", "Батарейка CR2025", "CR2025 battery", 20, 2.5, "coin-cell", {
    ru: "Тот же диаметр, что у CR2032, но толщина 2,5 мм вместо 3,2 мм.",
    en: "The same diameter as the CR2032 but 2.5 mm thick instead of 3.2 mm.",
  }),
  cell("cr2016", "CR2016", "Батарейка CR2016", "CR2016 battery", 20, 1.6, "coin-cell", {
    ru: "Самая тонкая из «двадцаток» — 1,6 мм: часы, пульты, брелоки.",
    en: "The thinnest of the 20 mm cells at 1.6 mm: watches, remotes, key fobs.",
  }),
  cell("cr2450", "CR2450", "Батарейка CR2450", "CR2450 battery", 24.5, 5, "coin-cell", {
    ru: "Крупная и ёмкая литиевая таблетка: умные замки, датчики, велокомпьютеры.",
    en: "A large high-capacity coin cell: smart locks, sensors, bike computers.",
  }),
  cell("cr2430", "CR2430", "Батарейка CR2430", "CR2430 battery", 24.5, 3, "coin-cell", {
    ru: "Диаметр как у CR2450, толщина 3 мм.",
    en: "The same diameter as the CR2450 with a 3 mm thickness.",
  }),
  cell("cr1632", "CR1632", "Батарейка CR1632", "CR1632 battery", 16, 3.2, "coin-cell", {
    ru: "Литиевая 3 В диаметром 16 мм: ключи от машин, брелоки, датчики.",
    en: "A 16 mm 3 V lithium cell: car keys, fobs and sensors.",
  }),
  cell("cr1620", "CR1620", "Батарейка CR1620", "CR1620 battery", 16, 2, "coin-cell", {
    ru: "16 мм, толщина 2 мм: автомобильные ключи и небольшие пульты.",
    en: "16 mm across, 2 mm thick: car keys and small remotes.",
  }),
  cell("cr1616", "CR1616", "Батарейка CR1616", "CR1616 battery", 16, 1.6, "coin-cell", {
    ru: "16 мм, толщина 1,6 мм: брелоки и тонкие пульты.",
    en: "16 mm across, 1.6 mm thick: key fobs and slim remotes.",
  }),
  cell("cr1220", "CR1220", "Батарейка CR1220", "CR1220 battery", 12.5, 2, "coin-cell", {
    ru: "Маленькая литиевая батарейка 3 В: часы, лазерные прицелы, небольшие брелоки.",
    en: "A small 3 V lithium cell: watches, laser sights and small fobs.",
  }),
  cell("lr44", "LR44", "Батарейка LR44 (AG13)", "LR44 (AG13) battery", 11.6, 5.4, "button", {
    ru: "Щелочная 1,5 В; аналоги AG13, A76, 357 (серебряная SR44). Игрушки, калькуляторы, штангенциркули.",
    en: "A 1.5 V alkaline button cell; equivalents AG13, A76, 357 (silver oxide SR44). Toys, calculators, calipers.",
  }, true),
  cell("lr41", "LR41", "Батарейка LR41 (AG3)", "LR41 (AG3) battery", 7.9, 3.6, "button", {
    ru: "Щелочная 1,5 В; аналоги AG3, 392. Градусники, игрушки, лазерные указки.",
    en: "A 1.5 V alkaline button cell; equivalents AG3, 392. Thermometers, toys, laser pointers.",
  }),
  cell("lr1130", "LR1130", "Батарейка LR1130 (AG10)", "LR1130 (AG10) battery", 11.6, 3.1, "button", {
    ru: "Щелочная 1,5 В; аналоги AG10, 389/390. Часы, калькуляторы.",
    en: "A 1.5 V alkaline button cell; equivalents AG10, 389/390. Watches and calculators.",
  }),
  cell("sr626sw", "SR626SW", "Батарейка SR626SW (377)", "SR626SW (377) battery", 6.8, 2.6, "button", {
    ru: "Серебряно-цинковая 1,55 В для наручных часов; аналоги 377, AG4.",
    en: "A 1.55 V silver oxide watch cell; equivalents 377, AG4.",
  }),
];

/* ───────────── connectors ───────────── */

const plug = (slug: string, ru: string, en: string, chip: L10n, w: number, h: number, shape: Shape, n: L10n, extra: Partial<ObjDef> = {}): ObjDef => ({
  slug,
  cat: "connectors",
  group: shape === "jack" ? "audio" : shape === "plug-hdmi" ? "video" : "usb",
  name: { ru, en },
  chip,
  w,
  h,
  shape,
  note: n,
  ...extra,
});

const CONNECTORS: ObjDef[] = [
  plug("usb-c", "Штекер USB-C", "USB-C plug", same("USB-C"), 8.25, 2.4, "plug-usb-c", {
    ru: "Симметричный разъём: вставляется любой стороной. Гнездо в устройстве — около 8,4 × 2,6 мм.",
    en: "A reversible connector that fits either way up. The device socket is about 8.4 × 2.6 mm.",
  }, { std: "USB Type-C (USB-IF)", popular: true }),
  plug("usb-a", "Штекер USB-A", "USB-A plug", same("USB-A"), 12, 4.5, "plug-usb-a", {
    ru: "Классический прямоугольный USB: зарядки, флешки, клавиатуры и мыши.",
    en: "The classic rectangular USB: chargers, flash drives, keyboards and mice.",
  }, { std: "USB 2.0 / 3.x (USB-IF)" }),
  plug("micro-usb", "Штекер micro-USB", "Micro-USB plug", same("micro-USB"), 6.85, 1.8, "plug-micro-usb", {
    ru: "Трапециевидный разъём Micro-B: Android-смартфоны до ~2018 года, наушники, повербанки.",
    en: "The trapezoid Micro-B connector: Android phones until about 2018, headphones and power banks.",
  }, { std: "USB 2.0 Micro-B (USB-IF)" }),
  plug("lightning", "Штекер Lightning", "Lightning plug", same("Lightning"), 7.7, 1.5, "plug-lightning", {
    ru: "Разъём Apple для iPhone 5–iPhone 14, AirPods и аксессуаров; тоже вставляется любой стороной.",
    en: "Apple's connector for iPhone 5 to iPhone 14, AirPods and accessories; it is reversible too.",
  }),
  plug("hdmi", "Штекер HDMI", "HDMI plug (Type A)", same("HDMI"), 13.9, 4.45, "plug-hdmi", {
    ru: "Полноразмерный HDMI (тип A): телевизоры, мониторы, приставки, ноутбуки.",
    en: "Full-size HDMI (Type A): TVs, monitors, consoles and laptops.",
  }),
  plug("mini-hdmi", "Штекер mini-HDMI", "Mini HDMI plug (Type C)", same("mini-HDMI"), 10.42, 2.42, "plug-hdmi", {
    ru: "HDMI тип C: фотоаппараты, видеокамеры, некоторые планшеты.",
    en: "HDMI Type C: cameras, camcorders and some tablets.",
  }),
  plug("micro-hdmi", "Штекер micro-HDMI", "Micro HDMI plug (Type D)", same("micro-HDMI"), 5.83, 2.2, "plug-hdmi", {
    ru: "HDMI тип D: Raspberry Pi 4 и 5, экшн-камеры, компактные фотоаппараты.",
    en: "HDMI Type D: Raspberry Pi 4 and 5, action cameras and compact cameras.",
  }),
  plug("jack-3-5mm", "Штекер 3,5 мм (мини-джек)", "3.5 mm headphone plug", { ru: "Мини-джек 3,5 мм", en: "3.5 mm jack" }, 3.5, 3.5, "jack", {
    ru: "Стандартный аудиоразъём наушников и колонок; показан торец штекера диаметром 3,5 мм.",
    en: "The standard headphone and speaker connector; the drawing shows the 3.5 mm plug end-on.",
  }, { popular: true }),
  plug("jack-2-5mm", "Штекер 2,5 мм", "2.5 mm plug", { ru: "Джек 2,5 мм", en: "2.5 mm jack" }, 2.5, 2.5, "jack", {
    ru: "Уменьшенный аудиоразъём: гарнитуры для раций и старых телефонов; показан торец диаметром 2,5 мм.",
    en: "A smaller audio connector for radio headsets and older phones; shown end-on, 2.5 mm across.",
  }),
  plug("jack-6-35mm", "Штекер 6,35 мм (джек)", "6.35 mm (¼″) jack plug", { ru: "Джек 6,35 мм", en: "6.35 mm jack" }, 6.35, 6.35, "jack", {
    ru: "Большой джек ¼ дюйма: гитары, синтезаторы, студийные наушники; показан торец штекера.",
    en: "The large quarter-inch jack: guitars, synths and studio headphones; shown end-on.",
  }),
];

/* ───────────── iPhone ───────────── */

const APPLE: L10n = { ru: "Технические характеристики Apple", en: "Apple technical specifications" };
const SAMSUNG: L10n = { ru: "Технические характеристики Samsung", en: "Samsung specifications" };
const GOOGLE: L10n = { ru: "Технические характеристики Google", en: "Google specifications" };

const iphone = (slug: string, model: string, w: number, h: number, d: number, diag: number, year: number | undefined, group: string, notch: ClientObj["notch"], extra: Partial<ObjDef> = {}): ObjDef => ({
  slug,
  cat: "iphone",
  group,
  name: same(model),
  w,
  h,
  d,
  diag,
  year,
  shape: "phone",
  notch,
  src: APPLE,
  ...extra,
});

const IPHONES: ObjDef[] = [
  iphone("iphone-8", "iPhone 8", 67.3, 138.4, 7.3, 4.7, 2017, "home", undefined, { home: true }),
  iphone("iphone-8-plus", "iPhone 8 Plus", 78.1, 158.4, 7.5, 5.5, 2017, "home", undefined, { home: true }),
  iphone("iphone-se", "iPhone SE (2020, 2022)", 67.3, 138.4, 7.3, 4.7, undefined, "home", undefined, {
    home: true,
    chip: same("iPhone SE"),
    short: same("iPhone SE 2/3"),
    note: { ru: "Второе (2020) и третье (2022) поколения iPhone SE — в корпусе iPhone 8.", en: "The 2nd (2020) and 3rd (2022) generation iPhone SE use the iPhone 8 body." },
  }),
  iphone("iphone-x", "iPhone X", 70.9, 143.6, 7.7, 5.8, 2017, "x", "notch", { note: { ru: "Размер корпуса совпадает с iPhone XS (2018).", en: "Same body size as the iPhone XS (2018)." } }),
  iphone("iphone-xr", "iPhone XR", 75.7, 150.9, 8.3, 6.1, 2018, "x", "notch"),
  iphone("iphone-xs-max", "iPhone XS Max", 77.4, 157.5, 7.7, 6.5, 2018, "x", "notch"),
  iphone("iphone-11", "iPhone 11", 75.7, 150.9, 8.3, 6.1, 2019, "11", "notch", { popular: true }),
  iphone("iphone-11-pro", "iPhone 11 Pro", 71.4, 144, 8.1, 5.8, 2019, "11", "notch"),
  iphone("iphone-11-pro-max", "iPhone 11 Pro Max", 77.8, 158, 8.1, 6.5, 2019, "11", "notch"),
  iphone("iphone-12-mini", "iPhone 12 mini", 64.2, 131.5, 7.4, 5.4, 2020, "12", "notch"),
  iphone("iphone-12", "iPhone 12", 71.5, 146.7, 7.4, 6.1, 2020, "12", "notch", {
    note: {
      ru: "Корпус того же размера, что у iPhone 12 Pro, поэтому чехлы подходят от обеих моделей. iPhone 12 легче — 164 г: алюминиевая рамка и две камеры.",
      en: "The body is the same size as the iPhone 12 Pro, so cases fit both. The iPhone 12 is lighter at 164 g, with an aluminium frame and two cameras.",
    },
  }),
  iphone("iphone-12-pro", "iPhone 12 Pro", 71.5, 146.7, 7.4, 6.1, 2020, "12", "notch", {
    note: {
      ru: "Габариты те же, что у iPhone 12, и чехлы у них общие. iPhone 12 Pro тяжелее — 189 г: у него рамка из нержавеющей стали, три камеры и сканер LiDAR.",
      en: "Same dimensions as the iPhone 12, and the two share cases. The 12 Pro is heavier at 189 g: stainless steel frame, three cameras and a LiDAR scanner.",
    },
  }),
  iphone("iphone-12-pro-max", "iPhone 12 Pro Max", 78.1, 160.8, 7.4, 6.7, 2020, "12", "notch"),
  iphone("iphone-13-mini", "iPhone 13 mini", 64.2, 131.5, 7.65, 5.4, 2021, "13", "notch"),
  iphone("iphone-13", "iPhone 13", 71.5, 146.7, 7.65, 6.1, 2021, "13", "notch", {
    popular: true,
    note: {
      ru: "Размеры как у iPhone 13 Pro, но чехлы у них разные: камеры iPhone 13 стоят по диагонали и занимают меньше места. Вес 173 г, рамка алюминиевая.",
      en: "Same dimensions as the iPhone 13 Pro, but the cases differ: the iPhone 13's cameras sit diagonally in a smaller block. It weighs 173 g with an aluminium frame.",
    },
  }),
  iphone("iphone-13-pro", "iPhone 13 Pro", 71.5, 146.7, 7.65, 6.1, 2021, "13", "notch", {
    note: {
      ru: "Габариты как у iPhone 13, но блок из трёх камер намного крупнее — чехол от iPhone 13 не подойдёт. Вес 204 г, рамка из нержавеющей стали.",
      en: "Same dimensions as the iPhone 13, but the three-camera block is much larger, so an iPhone 13 case won't fit. It weighs 204 g and has a stainless steel frame.",
    },
  }),
  iphone("iphone-13-pro-max", "iPhone 13 Pro Max", 78.1, 160.8, 7.65, 6.7, 2021, "13", "notch"),
  iphone("iphone-14", "iPhone 14", 71.5, 146.7, 7.8, 6.1, 2022, "14", "notch"),
  iphone("iphone-14-plus", "iPhone 14 Plus", 78.1, 160.8, 7.8, 6.7, 2022, "14", "notch"),
  iphone("iphone-14-pro", "iPhone 14 Pro", 71.5, 147.5, 7.85, 6.1, 2022, "14", "island"),
  iphone("iphone-14-pro-max", "iPhone 14 Pro Max", 77.6, 160.7, 7.85, 6.7, 2022, "14", "island"),
  iphone("iphone-15", "iPhone 15", 71.6, 147.6, 7.8, 6.1, 2023, "15", "island", { popular: true }),
  iphone("iphone-15-plus", "iPhone 15 Plus", 77.8, 160.9, 7.8, 6.7, 2023, "15", "island"),
  iphone("iphone-15-pro", "iPhone 15 Pro", 70.6, 146.6, 8.25, 6.1, 2023, "15", "island"),
  iphone("iphone-15-pro-max", "iPhone 15 Pro Max", 76.7, 159.9, 8.25, 6.7, 2023, "15", "island"),
  iphone("iphone-16", "iPhone 16", 71.6, 147.6, 7.8, 6.1, 2024, "16", "island", { popular: true }),
  iphone("iphone-16-plus", "iPhone 16 Plus", 77.8, 160.9, 7.8, 6.7, 2024, "16", "island"),
  iphone("iphone-16-pro", "iPhone 16 Pro", 71.5, 149.6, 8.25, 6.3, 2024, "16", "island"),
  iphone("iphone-16-pro-max", "iPhone 16 Pro Max", 77.6, 163, 8.25, 6.9, 2024, "16", "island", { popular: true }),
  iphone("iphone-16e", "iPhone 16e", 71.5, 146.7, 7.8, 6.1, 2025, "16", "notch"),
  iphone("iphone-17", "iPhone 17", 71.5, 149.6, 7.95, 6.3, 2025, "17", "island", { popular: true }),
  iphone("iphone-air", "iPhone Air", 74.7, 156.2, 5.64, 6.5, 2025, "17", "island", {
    note: { ru: "Самый тонкий iPhone: 5,64 мм.", en: "The thinnest iPhone ever: 5.64 mm." },
  }),
  iphone("iphone-17-pro", "iPhone 17 Pro", 71.9, 150, 8.75, 6.3, 2025, "17", "island"),
  iphone("iphone-17-pro-max", "iPhone 17 Pro Max", 78, 163.4, 8.75, 6.9, 2025, "17", "island", { popular: true }),
];

/* ───────────── Android phones ───────────── */

const galaxy = (slug: string, model: string, w: number, h: number, d: number, diag: number, year: number, group: string, extra: Partial<ObjDef> = {}): ObjDef => ({
  slug,
  cat: "android",
  group,
  name: same(`Samsung ${model}`),
  short: same(model),
  chip: same(model),
  w,
  h,
  d,
  diag,
  year,
  shape: "phone",
  notch: "hole",
  src: SAMSUNG,
  ...extra,
});

const pixel = (slug: string, model: string, w: number, h: number, d: number, diag: number, year: number, group: string, extra: Partial<ObjDef> = {}): ObjDef => ({
  slug,
  cat: "android",
  group,
  name: same(`Google ${model}`),
  short: same(model),
  chip: same(model),
  w,
  h,
  d,
  diag,
  year,
  shape: "phone",
  notch: "hole",
  src: GOOGLE,
  ...extra,
});

const ANDROID: ObjDef[] = [
  galaxy("galaxy-s21", "Galaxy S21", 71.2, 151.7, 7.9, 6.2, 2021, "s21"),
  galaxy("galaxy-s21-plus", "Galaxy S21+", 75.6, 161.5, 7.8, 6.7, 2021, "s21"),
  galaxy("galaxy-s21-ultra", "Galaxy S21 Ultra", 75.6, 165.1, 8.9, 6.8, 2021, "s21"),
  galaxy("galaxy-s21-fe", "Galaxy S21 FE", 74.5, 155.7, 7.9, 6.4, 2022, "s21"),
  galaxy("galaxy-s22", "Galaxy S22", 70.6, 146, 7.6, 6.1, 2022, "s22"),
  galaxy("galaxy-s22-plus", "Galaxy S22+", 75.8, 157.4, 7.6, 6.6, 2022, "s22"),
  galaxy("galaxy-s22-ultra", "Galaxy S22 Ultra", 77.9, 163.3, 8.9, 6.8, 2022, "s22"),
  galaxy("galaxy-s23", "Galaxy S23", 70.9, 146.3, 7.6, 6.1, 2023, "s23", { popular: true }),
  galaxy("galaxy-s23-plus", "Galaxy S23+", 76.2, 157.8, 7.6, 6.6, 2023, "s23"),
  galaxy("galaxy-s23-ultra", "Galaxy S23 Ultra", 78.1, 163.4, 8.9, 6.8, 2023, "s23"),
  galaxy("galaxy-s23-fe", "Galaxy S23 FE", 76.5, 158, 8.2, 6.4, 2023, "s23"),
  galaxy("galaxy-s24", "Galaxy S24", 70.6, 147, 7.6, 6.2, 2024, "s24", { popular: true }),
  galaxy("galaxy-s24-plus", "Galaxy S24+", 75.9, 158.5, 7.7, 6.7, 2024, "s24"),
  galaxy("galaxy-s24-ultra", "Galaxy S24 Ultra", 79, 162.3, 8.6, 6.8, 2024, "s24", { popular: true }),
  galaxy("galaxy-s24-fe", "Galaxy S24 FE", 77.3, 162, 8, 6.7, 2024, "s24"),
  galaxy("galaxy-s25", "Galaxy S25", 70.5, 146.9, 7.2, 6.2, 2025, "s25", { popular: true }),
  galaxy("galaxy-s25-plus", "Galaxy S25+", 75.8, 158.4, 7.3, 6.7, 2025, "s25"),
  galaxy("galaxy-s25-ultra", "Galaxy S25 Ultra", 77.6, 162.8, 8.2, 6.9, 2025, "s25", { popular: true }),
  galaxy("galaxy-s25-edge", "Galaxy S25 Edge", 75.6, 158.2, 5.8, 6.7, 2025, "s25", {
    note: { ru: "Самый тонкий смартфон линейки Galaxy S — 5,8 мм.", en: "The thinnest Galaxy S phone at 5.8 mm." },
  }),
  galaxy("galaxy-a14", "Galaxy A14", 78, 167.7, 9.1, 6.6, 2023, "a"),
  galaxy("galaxy-a15", "Galaxy A15", 76.8, 160.1, 8.4, 6.5, 2023, "a"),
  galaxy("galaxy-a16", "Galaxy A16", 77.9, 164.4, 7.9, 6.7, 2024, "a"),
  galaxy("galaxy-a25", "Galaxy A25", 76.5, 161, 8.3, 6.5, 2023, "a"),
  galaxy("galaxy-a34", "Galaxy A34", 78.1, 161.3, 8.2, 6.6, 2023, "a"),
  galaxy("galaxy-a35", "Galaxy A35", 78, 161.7, 8.2, 6.6, 2024, "a"),
  galaxy("galaxy-a36", "Galaxy A36", 78.2, 162.9, 7.4, 6.7, 2025, "a"),
  galaxy("galaxy-a54", "Galaxy A54", 76.7, 158.2, 8.2, 6.4, 2023, "a", { popular: true }),
  galaxy("galaxy-a55", "Galaxy A55", 77.4, 161.1, 8.2, 6.6, 2024, "a"),
  galaxy("galaxy-a56", "Galaxy A56", 77.5, 162.2, 7.4, 6.7, 2025, "a"),
  pixel("pixel-7", "Pixel 7", 73.2, 155.6, 8.7, 6.3, 2022, "pixel"),
  pixel("pixel-7-pro", "Pixel 7 Pro", 76.6, 162.9, 8.9, 6.7, 2022, "pixel"),
  pixel("pixel-7a", "Pixel 7a", 72.9, 152, 9, 6.1, 2023, "pixel-a"),
  pixel("pixel-8", "Pixel 8", 70.8, 150.5, 8.9, 6.2, 2023, "pixel"),
  pixel("pixel-8-pro", "Pixel 8 Pro", 76.5, 162.6, 8.8, 6.7, 2023, "pixel"),
  pixel("pixel-8a", "Pixel 8a", 72.7, 152.1, 8.9, 6.1, 2024, "pixel-a"),
  pixel("pixel-9", "Pixel 9", 72, 152.8, 8.5, 6.3, 2024, "pixel", {
    note: {
      ru: "Корпус такой же, как у Pixel 9 Pro, но сзади две камеры вместо трёх, фронтальная — 10,5 Мп, экран Actua с частотой 60–120 Гц и 12 ГБ оперативной памяти. Вес 198 г.",
      en: "Same body as the Pixel 9 Pro, but with two rear cameras instead of three, a 10.5 MP selfie camera, a 60–120 Hz Actua display and 12 GB of RAM. It weighs 198 g.",
    },
  }),
  pixel("pixel-9-pro", "Pixel 9 Pro", 72, 152.8, 8.5, 6.3, 2024, "pixel", {
    note: {
      ru: "Габариты как у Pixel 9, но три камеры сзади, включая телеобъектив с 5-кратным зумом, фронтальная камера 42 Мп, экран Super Actua LTPO 1–120 Гц и 16 ГБ оперативной памяти. Вес 199 г.",
      en: "Same dimensions as the Pixel 9, but three rear cameras including a 5× telephoto, a 42 MP selfie camera, a 1–120 Hz Super Actua LTPO display and 16 GB of RAM. It weighs 199 g.",
    },
  }),
  pixel("pixel-9-pro-xl", "Pixel 9 Pro XL", 76.6, 162.8, 8.5, 6.8, 2024, "pixel"),
  pixel("pixel-9a", "Pixel 9a", 73.3, 154.7, 8.9, 6.3, 2025, "pixel-a"),
];

/* ───────────── tablets, watches, gadgets ───────────── */

const ipad = (slug: string, ru: string, en: string, w: number, h: number, d: number, diag: number, year: number | undefined, home = false): ObjDef => ({
  slug,
  cat: "gadgets",
  group: "ipad",
  name: { ru, en },
  short: { ru: ru.replace(/ \(.*\)$/, ""), en: en.replace(/ \(.*\)$/, "") },
  w,
  h,
  d,
  diag,
  year,
  shape: "tablet",
  home,
  src: APPLE,
});

const aw = (slug: string, size: number, series: L10n, w: number, h: number, d: number): ObjDef => ({
  slug,
  cat: "gadgets",
  group: "watch",
  name: { ru: `Apple Watch ${size} мм (${series.ru})`, en: `Apple Watch ${size} mm (${series.en})` },
  short: { ru: `Apple Watch ${size} мм`, en: `Apple Watch ${size} mm` },
  w,
  h,
  d,
  shape: "watch",
  src: APPLE,
  note: {
    ru: "Размеры корпуса без ремешка и колёсика Digital Crown.",
    en: "Case size without the band and the Digital Crown.",
  },
});

const gw = (slug: string, model: string, size: number, w: number, h: number, d: number, extra?: L10n): ObjDef => ({
  slug,
  cat: "gadgets",
  group: "watch",
  name: { ru: `Samsung ${model} ${size} мм`, en: `Samsung ${model} ${size} mm` },
  short: { ru: `${model} ${size} мм`, en: `${model} ${size} mm` },
  w,
  h,
  d,
  shape: "watch-round",
  src: SAMSUNG,
  note: { ru: `Размеры корпуса без ремешка.${extra ? ` ${extra.ru}` : ""}`, en: `Case size without the band.${extra ? ` ${extra.en}` : ""}` },
});

const console_ = (slug: string, model: string, w: number, h: number, d: number, side: number, n: L10n, extra: Partial<ObjDef> = {}): ObjDef => ({
  slug,
  cat: "gadgets",
  group: "console",
  name: same(model),
  w,
  h,
  d,
  side,
  shape: "console",
  note: n,
  ...extra,
});

const GADGETS: ObjDef[] = [
  ipad("ipad-9", "iPad 10,2″ (9-го поколения)", "iPad 10.2″ (9th generation)", 174.1, 250.6, 7.5, 10.2, 2021, true),
  ipad("ipad-10", "iPad 10,9″ (10-го поколения)", "iPad 10.9″ (10th generation)", 179.5, 248.6, 7, 10.9, 2022),
  ipad("ipad-a16", "iPad 11″ (A16)", "iPad 11″ (A16)", 179.5, 248.6, 7, 11, 2025),
  { ...ipad("ipad-mini", "iPad mini 8,3″ (6-го поколения, A17 Pro)", "iPad mini 8.3″ (6th gen, A17 Pro)", 134.8, 195.4, 6.3, 8.3, undefined), popular: true },
  ipad("ipad-air-11", "iPad Air 11″ (M2, M3)", "iPad Air 11″ (M2, M3)", 178.5, 247.6, 6.1, 11, undefined),
  ipad("ipad-air-13", "iPad Air 13″ (M2, M3)", "iPad Air 13″ (M2, M3)", 214.9, 280.6, 6.1, 13, undefined),
  { ...ipad("ipad-pro-11-m4", "iPad Pro 11″ (M4)", "iPad Pro 11″ (M4)", 177.5, 249.7, 5.3, 11, 2024), popular: true },
  ipad("ipad-pro-13-m4", "iPad Pro 13″ (M4)", "iPad Pro 13″ (M4)", 215.5, 281.6, 5.1, 13, 2024),
  ipad("ipad-pro-11", "iPad Pro 11″ (M1, M2)", "iPad Pro 11″ (M1, M2)", 178.5, 247.6, 5.9, 11, undefined),
  ipad("ipad-pro-12-9", "iPad Pro 12,9″ (M1, M2)", "iPad Pro 12.9″ (M1, M2)", 214.9, 280.6, 6.4, 12.9, undefined),
  {
    slug: "galaxy-tab-s9",
    cat: "gadgets",
    group: "tablet",
    name: same("Samsung Galaxy Tab S9"),
    short: same("Galaxy Tab S9"),
    w: 165.8,
    h: 254.3,
    d: 5.9,
    diag: 11,
    year: 2023,
    shape: "tablet",
    src: SAMSUNG,
  },
  {
    slug: "kindle-paperwhite",
    cat: "gadgets",
    group: "tablet",
    name: { ru: "Kindle Paperwhite (11-го поколения)", en: "Kindle Paperwhite (11th generation)" },
    short: same("Kindle Paperwhite"),
    w: 125,
    h: 174,
    d: 8.1,
    diag: 6.8,
    year: 2021,
    shape: "tablet",
    src: { ru: "Технические характеристики Amazon", en: "Amazon specifications" },
  },
  {
    slug: "kindle",
    cat: "gadgets",
    group: "tablet",
    name: same("Kindle (2022)"),
    w: 108.6,
    h: 157.8,
    d: 8,
    diag: 6,
    year: 2022,
    shape: "tablet",
    src: { ru: "Технические характеристики Amazon", en: "Amazon specifications" },
  },
  aw("apple-watch-40mm", 40, { ru: "Series 4–6, SE", en: "Series 4–6, SE" }, 34, 40, 10.7),
  aw("apple-watch-44mm", 44, { ru: "Series 4–6, SE", en: "Series 4–6, SE" }, 38, 44, 10.7),
  aw("apple-watch-41mm", 41, { ru: "Series 7–9", en: "Series 7–9" }, 35, 41, 10.7),
  aw("apple-watch-45mm", 45, { ru: "Series 7–9", en: "Series 7–9" }, 38, 45, 10.7),
  { ...aw("apple-watch-42mm", 42, { ru: "Series 10, 11", en: "Series 10, 11" }, 36, 42, 9.7), popular: true },
  aw("apple-watch-46mm", 46, { ru: "Series 10, 11", en: "Series 10, 11" }, 39, 46, 9.7),
  { ...aw("apple-watch-ultra", 49, { ru: "Ultra, Ultra 2", en: "Ultra, Ultra 2" }, 44, 49, 14.4), slug: "apple-watch-ultra", short: same("Apple Watch Ultra"), chip: same("Apple Watch Ultra") },
  gw("galaxy-watch7-40mm", "Galaxy Watch7", 40, 40.4, 40.4, 9.7, {
    ru: "Экран 1,3″ (432 × 432 пикселя), аккумулятор 300 мА·ч, вес 28,8 г — версия для тонкого запястья.",
    en: "1.3″ screen (432 × 432 pixels), 300 mAh battery, 28.8 g — the size for slimmer wrists.",
  }),
  gw("galaxy-watch7-44mm", "Galaxy Watch7", 44, 44.4, 44.4, 9.7, {
    ru: "Экран 1,5″ (480 × 480 пикселей), аккумулятор 425 мА·ч — примерно на 40% больше, чем у 40 мм, вес 33,8 г.",
    en: "1.5″ screen (480 × 480 pixels), a 425 mAh battery — about 40% more than the 40 mm — and 33.8 g.",
  }),
  gw("galaxy-watch6-40mm", "Galaxy Watch6", 40, 38.8, 40.4, 9),
  gw("galaxy-watch6-44mm", "Galaxy Watch6", 44, 42.8, 44.4, 9),
  {
    slug: "airpods-pro-2-case",
    cat: "gadgets",
    group: "audio",
    name: { ru: "Кейс AirPods Pro 2", en: "AirPods Pro 2 case" },
    w: 60.6,
    h: 45.2,
    d: 21.7,
    r: 12,
    shape: "earbuds",
    src: APPLE,
  },
  {
    slug: "airpods-4-case",
    cat: "gadgets",
    group: "audio",
    name: { ru: "Кейс AirPods 4", en: "AirPods 4 case" },
    w: 50.1,
    h: 46.2,
    d: 21.2,
    r: 14,
    shape: "earbuds",
    src: APPLE,
  },
  {
    slug: "airpods-3-case",
    cat: "gadgets",
    group: "audio",
    name: { ru: "Кейс AirPods (3-го поколения)", en: "AirPods (3rd generation) case" },
    short: { ru: "Кейс AirPods 3", en: "AirPods 3 case" },
    w: 54.4,
    h: 46.4,
    d: 21.38,
    r: 14,
    shape: "earbuds",
    src: APPLE,
  },
  {
    slug: "airtag",
    cat: "gadgets",
    group: "audio",
    name: same("Apple AirTag"),
    chip: same("AirTag"),
    w: 31.9,
    h: 31.9,
    d: 8,
    shape: "airtag",
    src: APPLE,
    note: { ru: "Работает от батарейки CR2032.", en: "Powered by a CR2032 coin cell." },
  },
  console_("nintendo-switch", "Nintendo Switch", 239, 102, 13.9, 36, { ru: "Оригинальная модель с присоединёнными Joy-Con.", en: "The original model with Joy-Con attached." }, { src: { ru: "Nintendo", en: "Nintendo" } }),
  console_("nintendo-switch-oled", "Nintendo Switch OLED", 242, 102, 13.9, 36, { ru: "С присоединёнными Joy-Con; на 3 мм шире оригинала.", en: "With Joy-Con attached; 3 mm wider than the original." }, { src: { ru: "Nintendo", en: "Nintendo" } }),
  console_("nintendo-switch-lite", "Nintendo Switch Lite", 208, 91.4, 13.9, 43, { ru: "Цельный корпус без съёмных контроллеров.", en: "A one-piece body without detachable controllers." }, { src: { ru: "Nintendo", en: "Nintendo" } }),
  console_("nintendo-switch-2", "Nintendo Switch 2", 272, 116, 13.9, 46, { ru: "С присоединёнными Joy-Con 2; толщина та же, что у первой Switch.", en: "With Joy-Con 2 attached; as thick as the first Switch." }, { src: { ru: "Nintendo", en: "Nintendo" }, popular: true }),
  console_("steam-deck", "Steam Deck", 298, 117, 49, 72, { ru: "Толщина 49 мм указана с учётом выступающих стиков.", en: "The 49 mm depth includes the thumbsticks." }, { src: { ru: "Valve", en: "Valve" } }),
];

/* ───────────── everyday things ───────────── */

const THINGS: ObjDef[] = [
  {
    slug: "lego-brick-2x4",
    cat: "things",
    group: "lego",
    name: { ru: "Кубик LEGO 2×4", en: "LEGO brick 2×4" },
    w: 31.8,
    h: 15.8,
    d: 9.6,
    cols: 4,
    rows: 2,
    shape: "lego",
    note: {
      ru: "Вид сверху. Шаг шипов — 8 мм, диаметр шипа — 4,8 мм, высота кирпича 9,6 мм без шипов (шип — ещё 1,7 мм).",
      en: "Top view. Studs are 8 mm apart and 4.8 mm across; the brick is 9.6 mm tall without studs (studs add 1.7 mm).",
    },
    popular: true,
  },
  {
    slug: "lego-brick-2x2",
    cat: "things",
    group: "lego",
    name: { ru: "Кубик LEGO 2×2", en: "LEGO brick 2×2" },
    w: 15.8,
    h: 15.8,
    d: 9.6,
    cols: 2,
    rows: 2,
    shape: "lego",
    note: { ru: "Вид сверху; 0,2 мм зазора между кирпичами дают шаг ровно 8 мм.", en: "Top view; a 0.2 mm gap between bricks makes the 8 mm pitch exact." },
  },
  {
    slug: "lego-brick-1x1",
    cat: "things",
    group: "lego",
    name: { ru: "Кубик LEGO 1×1", en: "LEGO brick 1×1" },
    w: 7.8,
    h: 7.8,
    d: 9.6,
    cols: 1,
    rows: 1,
    shape: "lego",
    note: { ru: "Вид сверху: базовая единица системы LEGO.", en: "Top view: the basic unit of the LEGO system." },
  },
  {
    slug: "post-it-76x76",
    cat: "things",
    group: "postit",
    name: { ru: "Стикер Post-it 76 × 76 мм", en: "Post-it note 76 × 76 mm" },
    chip: { ru: "Post-it 76×76", en: "Post-it 3×3″" },
    named: true,
    w: 76,
    h: 76,
    shape: "postit",
    note: { ru: "Классический квадратный стикер 3 × 3 дюйма.", en: "The classic 3 × 3 inch square note." },
    popular: true,
  },
  {
    slug: "post-it-38x51",
    cat: "things",
    group: "postit",
    name: { ru: "Стикер Post-it 38 × 51 мм", en: "Post-it note 38 × 51 mm" },
    chip: { ru: "Post-it 38×51", en: "Post-it 1.5×2″" },
    named: true,
    w: 38,
    h: 51,
    shape: "postit",
    note: { ru: "Маленький стикер 1,5 × 2 дюйма для пометок в книгах.", en: "The small 1.5 × 2 inch note for marking pages." },
  },
  {
    slug: "post-it-76x127",
    cat: "things",
    group: "postit",
    name: { ru: "Стикер Post-it 76 × 127 мм", en: "Post-it note 76 × 127 mm" },
    chip: { ru: "Post-it 76×127", en: "Post-it 3×5″" },
    named: true,
    w: 127,
    h: 76,
    shape: "postit",
    note: { ru: "Прямоугольный стикер 3 × 5 дюймов для списков.", en: "The rectangular 3 × 5 inch note for lists." },
  },
  {
    slug: "cd",
    cat: "things",
    group: "media",
    name: { ru: "Компакт-диск (CD, DVD, Blu-ray)", en: "Compact disc (CD, DVD, Blu-ray)" },
    short: { ru: "Компакт-диск CD", en: "Compact disc (CD)" },
    chip: same("CD / DVD"),
    w: 120,
    h: 120,
    d: 1.2,
    hole: 15,
    shape: "disc",
    std: "IEC 60908",
    note: { ru: "Диаметр 120 мм, центральное отверстие 15 мм; у DVD и Blu-ray те же размеры.", en: "120 mm across with a 15 mm centre hole; DVDs and Blu-ray discs share the size." },
  },
  {
    slug: "mini-cd",
    cat: "things",
    group: "media",
    name: { ru: "Мини-диск CD 8 см", en: "Mini CD (8 cm)" },
    chip: same("Mini CD"),
    w: 80,
    h: 80,
    d: 1.2,
    hole: 15,
    shape: "disc",
    note: { ru: "Уменьшенный диск диаметром 80 мм: синглы, драйверы, видеокамеры.", en: "The 80 mm disc for singles, drivers and camcorders." },
  },
  {
    slug: "floppy-disk",
    cat: "things",
    group: "media",
    name: { ru: "Дискета 3,5″", en: "3.5″ floppy disk" },
    w: 90,
    h: 94,
    d: 3.3,
    shape: "floppy",
    note: { ru: "Вмещала 1,44 МБ; осталась иконкой кнопки «Сохранить».", en: "It held 1.44 MB and lives on as the Save icon." },
  },
  {
    slug: "audio-cassette",
    cat: "things",
    group: "media",
    name: { ru: "Аудиокассета", en: "Audio cassette" },
    w: 100.4,
    h: 63.8,
    d: 12,
    shape: "cassette",
    std: "IEC 60094",
    note: { ru: "Компакт-кассета — стандартная аудиокассета.", en: "The standard compact cassette." },
  },
  {
    slug: "rubiks-cube",
    cat: "things",
    group: "toy",
    name: { ru: "Кубик Рубика 3×3", en: "Rubik's Cube 3×3" },
    w: 57,
    h: 57,
    d: 57,
    shape: "cube",
    note: {
      ru: "Размер оригинального кубика Rubik's — 57 мм; скоростные кубики других брендов часто 55–56 мм.",
      en: "The original Rubik's brand cube is 57 mm; speedcubes from other brands are often 55–56 mm.",
    },
  },
  {
    slug: "ping-pong-ball",
    cat: "things",
    group: "ball",
    name: { ru: "Мяч для настольного тенниса", en: "Table tennis ball" },
    w: 40,
    h: 40,
    shape: "ball",
    std: "ITTF",
    note: { ru: "Официальный диаметр — 40 мм, масса 2,7 г.", en: "The official diameter is 40 mm and the mass 2.7 g." },
  },
  {
    slug: "golf-ball",
    cat: "things",
    group: "ball",
    name: { ru: "Мяч для гольфа", en: "Golf ball" },
    w: 42.67,
    h: 42.67,
    shape: "ball",
    std: "R&A / USGA",
    note: { ru: "Минимально допустимый диаметр по правилам — 42,67 мм (1,68 дюйма).", en: "The rules set a minimum diameter of 42.67 mm (1.68 in)." },
  },
  {
    slug: "tennis-ball",
    cat: "things",
    group: "ball",
    name: { ru: "Теннисный мяч", en: "Tennis ball" },
    w: 67,
    h: 67,
    shape: "ball",
    std: "ITF",
    note: {
      ru: "Правила ITF допускают диаметр от 65,4 до 68,6 мм — показан средний, 67 мм.",
      en: "ITF rules allow 65.4 to 68.6 mm — the drawing uses the middle value, 67 mm.",
    },
  },
  {
    slug: "hockey-puck",
    cat: "things",
    group: "ball",
    name: { ru: "Хоккейная шайба", en: "Ice hockey puck" },
    w: 76.2,
    h: 76.2,
    d: 25.4,
    shape: "puck",
    std: "IIHF / NHL",
    note: { ru: "Диаметр 3 дюйма, толщина 1 дюйм; вид сверху.", en: "3 inches across and 1 inch thick; top view." },
  },
  {
    slug: "pool-ball",
    cat: "things",
    group: "ball",
    name: { ru: "Бильярдный шар (пул)", en: "Pool ball" },
    w: 57.15,
    h: 57.15,
    shape: "ball",
    label: "8",
    note: { ru: "2¼ дюйма — стандарт американского пула; шары русского бильярда крупнее — 68 мм.", en: "2¼ inches, the American pool standard; Russian billiards balls are larger at 68 mm." },
  },
  {
    slug: "snooker-ball",
    cat: "things",
    group: "ball",
    name: { ru: "Шар для снукера", en: "Snooker ball" },
    w: 52.5,
    h: 52.5,
    shape: "ball",
    note: { ru: "52,5 мм — меньше, чем шары для пула.", en: "52.5 mm — smaller than pool balls." },
  },
];

export const OBJECTS: ObjDef[] = [...CARDS, ...PHOTOS, ...PAPER, ...COINS, ...BANKNOTES, ...BATTERIES, ...CONNECTORS, ...IPHONES, ...ANDROID, ...GADGETS, ...THINGS];

export const CAT_IDS: CatId[] = ["cards", "photos", "paper", "coins", "banknotes", "batteries", "connectors", "iphone", "android", "gadgets", "things"];

export const byCat = (cat: CatId): ObjDef[] => OBJECTS.filter((o) => o.cat === cat);

export function toClient(o: ObjDef, withCat = false): ClientObj {
  const c: ClientObj = { slug: o.slug, name: o.short ?? o.name, w: o.w, h: o.h, shape: o.shape };
  if (withCat) c.cat = o.cat;
  if (o.d !== undefined) c.d = o.d;
  if (o.label !== undefined) c.label = o.label;
  if (o.r !== undefined) c.r = o.r;
  if (o.home) c.home = true;
  if (o.notch) c.notch = o.notch;
  if (o.cols !== undefined) c.cols = o.cols;
  if (o.rows !== undefined) c.rows = o.rows;
  if (o.hole !== undefined) c.hole = o.hole;
  if (o.side !== undefined) c.side = o.side;
  return c;
}
