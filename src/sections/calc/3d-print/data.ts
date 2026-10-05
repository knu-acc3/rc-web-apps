export interface KzCity {
  slug: string;
  name: { ru: string; en: string };
  region: { ru: string; en: string };
  residentialTariff: number; // KZT per kWh
  commercialTariff: number; // KZT per kWh
  utility: string;
}

export const KZ_CITIES: readonly KzCity[] = [
  {
    slug: "almaty",
    name: { ru: "Алматы", en: "Almaty" },
    region: { ru: "г. Алматы", en: "Almaty City" },
    residentialTariff: 35.5,
    commercialTariff: 45.59,
    utility: "АлматыЭнергоСбыт",
  },
  {
    slug: "astana",
    name: { ru: "Астана", en: "Astana" },
    region: { ru: "г. Астана", en: "Astana City" },
    residentialTariff: 32.8,
    commercialTariff: 38.14,
    utility: "Астанаэнергосбыт",
  },
  {
    slug: "shymkent",
    name: { ru: "Шымкент", en: "Shymkent" },
    region: { ru: "г. Шымкент", en: "Shymkent City" },
    residentialTariff: 31.2,
    commercialTariff: 36.77,
    utility: "Энергопоток",
  },
  {
    slug: "karaganda",
    name: { ru: "Караганда", en: "Karaganda" },
    region: { ru: "Карагандинская обл.", en: "Karaganda Region" },
    residentialTariff: 26.4,
    commercialTariff: 38.87,
    utility: "КарагандаЖарык",
  },
  {
    slug: "atyrau",
    name: { ru: "Атырау", en: "Atyrau" },
    region: { ru: "Атырауская обл.", en: "Atyrau Region" },
    residentialTariff: 28.44,
    commercialTariff: 52.36,
    utility: "Атырау Энергосату",
  },
  {
    slug: "pavlodar",
    name: { ru: "Павлодар", en: "Pavlodar" },
    region: { ru: "Павлодарская обл.", en: "Pavlodar Region" },
    residentialTariff: 21.5,
    commercialTariff: 28.4,
    utility: "Павлодарэнергосбыт",
  },
  {
    slug: "aktobe",
    name: { ru: "Актобе", en: "Aktobe" },
    region: { ru: "Актюбинская обл.", en: "Aktobe Region" },
    residentialTariff: 24.2,
    commercialTariff: 31.6,
    utility: "Актобеэнергоснаб",
  },
  {
    slug: "ust-kamenogorsk",
    name: { ru: "Усть-Каменогорск", en: "Ust-Kamenogorsk" },
    region: { ru: "Восточно-Казахстанская обл.", en: "East Kazakhstan Region" },
    residentialTariff: 19.8,
    commercialTariff: 27.9,
    utility: "Шыгысэнерготрейд",
  },
  {
    slug: "semey",
    name: { ru: "Семей", en: "Semey" },
    region: { ru: "Абайская обл.", en: "Abai Region" },
    residentialTariff: 21.4,
    commercialTariff: 29.1,
    utility: "Шыгысэнерготрейд",
  },
  {
    slug: "kostanay",
    name: { ru: "Костанай", en: "Kostanay" },
    region: { ru: "Костанайская обл.", en: "Kostanay Region" },
    residentialTariff: 33.2,
    commercialTariff: 38.51,
    utility: "ЭПК-forfait",
  },
  {
    slug: "aktau",
    name: { ru: "Актау", en: "Aktau" },
    region: { ru: "Мангистауская обл.", en: "Mangystau Region" },
    residentialTariff: 26.5,
    commercialTariff: 34.2,
    utility: "Мангистау Жарык",
  },
  {
    slug: "uralsk",
    name: { ru: "Уральск", en: "Uralsk" },
    region: { ru: "Западно-Казахстанская обл.", en: "West Kazakhstan Region" },
    residentialTariff: 25.8,
    commercialTariff: 33.4,
    utility: "Батыс Энергоресурсы",
  },
  {
    slug: "taraz",
    name: { ru: "Тараз", en: "Taraz" },
    region: { ru: "Жамбылская обл.", en: "Zhambyl Region" },
    residentialTariff: 27.6,
    commercialTariff: 35.2,
    utility: "Жамбыл Жарык Сауда",
  },
  {
    slug: "kyzylorda",
    name: { ru: "Кызылорда", en: "Kyzylorda" },
    region: { ru: "Кызылординская обл.", en: "Kyzylorda Region" },
    residentialTariff: 25.1,
    commercialTariff: 32.8,
    utility: "Кызылордаэнергоцентр",
  },
  {
    slug: "petropavlovsk",
    name: { ru: "Петропавловск", en: "Petropavlovsk" },
    region: { ru: "Северо-Казахстанская обл.", en: "North Kazakhstan Region" },
    residentialTariff: 23.4,
    commercialTariff: 30.5,
    utility: "Севказэнергосбыт",
  },
  {
    slug: "temirtau",
    name: { ru: "Темиртау", en: "Temirtau" },
    region: { ru: "Карагандинская обл.", en: "Karaganda Region" },
    residentialTariff: 22.8,
    commercialTariff: 32.1,
    utility: "Окжетпес-Т",
  },
  {
    slug: "turkistan",
    name: { ru: "Туркестан", en: "Turkistan" },
    region: { ru: "Туркестанская обл.", en: "Turkistan Region" },
    residentialTariff: 29.5,
    commercialTariff: 37.1,
    utility: "Энергопоток",
  },
  {
    slug: "kokshetau",
    name: { ru: "Кокшетау", en: "Kokshetau" },
    region: { ru: "Акмолинская обл.", en: "Akmola Region" },
    residentialTariff: 28.2,
    commercialTariff: 36.4,
    utility: "Кокшетау Энерго",
  },
] as const;

export type PrinterBrand = "bambu" | "creality" | "anycubic" | "custom";

export type PrinterId =
  | "ender3"
  | "k1"
  | "k1c"
  | "k1_max"
  | "ender5"
  | "p1s"
  | "p2s"
  | "a1"
  | "a1_mini"
  | "a2l"
  | "kobra2"
  | "kobra3_combo"
  | "custom";

export interface PrinterProfile {
  id: PrinterId;
  brand: PrinterBrand;
  name: string;
  shortName: string;
  tagline: string;
  bedSize: string;
  enclosed: boolean;
  powerByMaterial: Record<string, number>; // Base active wattage
  defaultPower: number; // Watts
  priceKzt: number;
  lifespanHours: number;
  depreciationPerHour: number; // KZT / hour
  multiColorCapable: boolean;
  multiColorSystem: string;
}

export const PRINTER_PROFILES: Record<PrinterId, PrinterProfile> = {
  ender3: {
    id: "ender3",
    brand: "creality",
    name: "Creality Ender-3 (V2 / V3)",
    shortName: "Ender-3",
    tagline: "Самый популярный народный принтер",
    bedSize: "220×220 мм",
    enclosed: false,
    powerByMaterial: { pla: 100, petg: 120, abs: 160, tpu: 100, pacf: 160 },
    defaultPower: 110,
    priceKzt: 120_000,
    lifespanHours: 3000,
    depreciationPerHour: 40,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена (M600)",
  },
  k1: {
    id: "k1",
    brand: "creality",
    name: "Creality K1",
    shortName: "Creality K1",
    tagline: "Скоростной CoreXY (600 мм/с)",
    bedSize: "220×220 мм",
    enclosed: true,
    powerByMaterial: { pla: 125, petg: 155, abs: 195, tpu: 125, pacf: 195 },
    defaultPower: 140,
    priceKzt: 260_000,
    lifespanHours: 5000,
    depreciationPerHour: 52,
    multiColorCapable: true,
    multiColorSystem: "Creality CFS (4 цвета)",
  },
  k1c: {
    id: "k1c",
    brand: "creality",
    name: "Creality K1C",
    shortName: "Creality K1C",
    tagline: "CoreXY для карбона (Hardened сопло)",
    bedSize: "220×220 мм",
    enclosed: true,
    powerByMaterial: { pla: 130, petg: 160, abs: 200, tpu: 130, pacf: 200 },
    defaultPower: 145,
    priceKzt: 310_000,
    lifespanHours: 5000,
    depreciationPerHour: 62,
    multiColorCapable: true,
    multiColorSystem: "Creality CFS (4 цвета)",
  },
  k1_max: {
    id: "k1_max",
    brand: "creality",
    name: "Creality K1 Max",
    shortName: "K1 Max",
    tagline: "Большой закрытый CoreXY 300×300",
    bedSize: "300×300 мм",
    enclosed: true,
    powerByMaterial: { pla: 175, petg: 210, abs: 250, tpu: 175, pacf: 250 },
    defaultPower: 190,
    priceKzt: 420_000,
    lifespanHours: 5500,
    depreciationPerHour: 76,
    multiColorCapable: true,
    multiColorSystem: "Creality CFS (4 цвета)",
  },
  ender5: {
    id: "ender5",
    brand: "creality",
    name: "Creality Ender-5 (S1 / Pro)",
    shortName: "Ender-5",
    tagline: "Жесткая кубическая рама",
    bedSize: "220×220 мм",
    enclosed: false,
    powerByMaterial: { pla: 115, petg: 135, abs: 175, tpu: 115, pacf: 175 },
    defaultPower: 125,
    priceKzt: 190_000,
    lifespanHours: 4000,
    depreciationPerHour: 48,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  p1s: {
    id: "p1s",
    brand: "bambu",
    name: "Bambu Lab P1S",
    shortName: "Bambu P1S",
    tagline: "Закрытый CoreXY с поддержкой AMS",
    bedSize: "256×256 мм",
    enclosed: true,
    powerByMaterial: { pla: 105, petg: 135, abs: 190, tpu: 105, pacf: 190 },
    defaultPower: 130,
    priceKzt: 460_000,
    lifespanHours: 6000,
    depreciationPerHour: 77,
    multiColorCapable: true,
    multiColorSystem: "Bambu AMS (до 16 цветов)",
  },
  p2s: {
    id: "p2s",
    brand: "bambu",
    name: "Bambu Lab P2S",
    shortName: "Bambu P2S",
    tagline: "Флагман CoreXY нового поколения",
    bedSize: "256×256 мм",
    enclosed: true,
    powerByMaterial: { pla: 110, petg: 140, abs: 195, tpu: 110, pacf: 195 },
    defaultPower: 135,
    priceKzt: 520_000,
    lifespanHours: 6500,
    depreciationPerHour: 80,
    multiColorCapable: true,
    multiColorSystem: "Bambu AMS (до 16 цветов)",
  },
  a1: {
    id: "a1",
    brand: "bambu",
    name: "Bambu Lab A1",
    shortName: "Bambu A1",
    tagline: "Полноразмерный открытый с AMS lite",
    bedSize: "256×256 мм",
    enclosed: false,
    powerByMaterial: { pla: 85, petg: 110, abs: 140, tpu: 85, pacf: 140 },
    defaultPower: 95,
    priceKzt: 270_000,
    lifespanHours: 4500,
    depreciationPerHour: 60,
    multiColorCapable: true,
    multiColorSystem: "Bambu AMS lite (4 цвета)",
  },
  a1_mini: {
    id: "a1_mini",
    brand: "bambu",
    name: "Bambu Lab A1 mini",
    shortName: "A1 mini",
    tagline: "Компактный тихий для дома",
    bedSize: "180×180 мм",
    enclosed: false,
    powerByMaterial: { pla: 55, petg: 75, abs: 90, tpu: 55, pacf: 90 },
    defaultPower: 65,
    priceKzt: 165_000,
    lifespanHours: 3500,
    depreciationPerHour: 47,
    multiColorCapable: true,
    multiColorSystem: "Bambu AMS lite (4 цвета)",
  },
  a2l: {
    id: "a2l",
    brand: "bambu",
    name: "Bambu Lab A2L",
    shortName: "Bambu A2L",
    tagline: "Увеличенный формат нового поколения",
    bedSize: "320×320 мм",
    enclosed: false,
    powerByMaterial: { pla: 95, petg: 125, abs: 155, tpu: 95, pacf: 155 },
    defaultPower: 110,
    priceKzt: 330_000,
    lifespanHours: 5000,
    depreciationPerHour: 66,
    multiColorCapable: true,
    multiColorSystem: "Bambu AMS",
  },
  kobra2: {
    id: "kobra2",
    brand: "anycubic",
    name: "Anycubic Kobra 2 (Pro / Plus)",
    shortName: "Kobra 2",
    tagline: "Бюджетный скоростной bedslinger",
    bedSize: "220×220 мм",
    enclosed: false,
    powerByMaterial: { pla: 110, petg: 130, abs: 170, tpu: 110, pacf: 170 },
    defaultPower: 120,
    priceKzt: 140_000,
    lifespanHours: 3500,
    depreciationPerHour: 40,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  kobra3_combo: {
    id: "kobra3_combo",
    brand: "anycubic",
    name: "Anycubic Kobra 3 Combo (ACE Pro)",
    shortName: "Kobra 3 Combo",
    tagline: "Многоцветный блок ACE Pro с активной сушкой",
    bedSize: "250×250 мм",
    enclosed: false,
    powerByMaterial: { pla: 140, petg: 170, abs: 210, tpu: 140, pacf: 210 },
    defaultPower: 150,
    priceKzt: 260_000,
    lifespanHours: 4500,
    depreciationPerHour: 58,
    multiColorCapable: true,
    multiColorSystem: "Anycubic ACE Pro (4 цвета + сушилка)",
  },
  custom: {
    id: "custom",
    brand: "custom",
    name: "Свой принтер (настраиваемый)",
    shortName: "Свой принтер",
    tagline: "Пользовательские параметры",
    bedSize: "Любой",
    enclosed: false,
    powerByMaterial: { pla: 120, petg: 150, abs: 220, tpu: 120, pacf: 220 },
    defaultPower: 150,
    priceKzt: 250_000,
    lifespanHours: 5000,
    depreciationPerHour: 50,
    multiColorCapable: true,
    multiColorSystem: "Кастомная система",
  },
};

export type MaterialId = "pla" | "petg" | "abs" | "tpu" | "pacf" | "custom";

export interface MaterialProfile {
  id: MaterialId;
  name: string;
  defaultPriceKg: number; // KZT
  density: number; // g/cm³
  bedTemp: string;
  abrasive: boolean;
}

export const MATERIAL_PROFILES: Record<MaterialId, MaterialProfile> = {
  pla: {
    id: "pla",
    name: "PLA",
    defaultPriceKg: 6500,
    density: 1.24,
    bedTemp: "55–65 °C",
    abrasive: false,
  },
  petg: {
    id: "petg",
    name: "PETG",
    defaultPriceKg: 7000,
    density: 1.27,
    bedTemp: "70–80 °C",
    abrasive: false,
  },
  abs: {
    id: "abs",
    name: "ABS / ASA",
    defaultPriceKg: 8000,
    density: 1.05,
    bedTemp: "90–100 °C",
    abrasive: false,
  },
  tpu: {
    id: "tpu",
    name: "TPU (Flex)",
    defaultPriceKg: 11000,
    density: 1.21,
    bedTemp: "35–50 °C",
    abrasive: false,
  },
  pacf: {
    id: "pacf",
    name: "PA-CF (Carbon)",
    defaultPriceKg: 26000,
    density: 1.18,
    bedTemp: "90–100 °C",
    abrasive: true,
  },
  custom: {
    id: "custom",
    name: "Другой пластик",
    defaultPriceKg: 7000,
    density: 1.25,
    bedTemp: "60 °C",
    abrasive: false,
  },
};

export type DryerId = "none" | "standard" | "quad";

export interface DryerProfile {
  id: DryerId;
  name: { ru: string; en: string };
  watts: number;
  depreciationPerHour: number; // KZT
}

export const DRYER_PROFILES: Record<DryerId, DryerProfile> = {
  none: {
    id: "none",
    name: { ru: "Без сушилки", en: "No dryer" },
    watts: 0,
    depreciationPerHour: 0,
  },
  standard: {
    id: "standard",
    name: { ru: "1 катушка (Sunlu S2 / Space Pi 55 Вт)", en: "1 spool (Sunlu S2 / Space Pi 55W)" },
    watts: 55,
    depreciationPerHour: 9,
  },
  quad: {
    id: "quad",
    name: { ru: "4 катушки (Sunlu S4 120 Вт)", en: "4 spools (Sunlu S4 120W)" },
    watts: 120,
    depreciationPerHour: 16,
  },
};

export type NozzleId = "brass" | "hardened" | "ruby";

export interface NozzleProfile {
  id: NozzleId;
  name: { ru: string; en: string };
  wearPerHour: number; // KZT
  wearPerHourAbrasive: number; // KZT
}

export const NOZZLE_PROFILES: Record<NozzleId, NozzleProfile> = {
  brass: {
    id: "brass",
    name: { ru: "Латунь 0.4 (Brass)", en: "Brass 0.4" },
    wearPerHour: 4,
    wearPerHourAbrasive: 80,
  },
  hardened: {
    id: "hardened",
    name: { ru: "Закаленная сталь (Hardened Steel)", en: "Hardened Steel" },
    wearPerHour: 5,
    wearPerHourAbrasive: 6,
  },
  ruby: {
    id: "ruby",
    name: { ru: "Рубин / Карбид вольфрама", en: "Ruby / Tungsten Carbide" },
    wearPerHour: 7,
    wearPerHourAbrasive: 7,
  },
};

export type PackagingId = "none" | "bag_bubble" | "kraft_box" | "cdek_box" | "custom";

export interface PackagingOption {
  id: PackagingId;
  name: { ru: string; en: string };
  costKzt: number;
}

export const PACKAGING_OPTIONS: Record<PackagingId, PackagingOption> = {
  none: {
    id: "none",
    name: { ru: "Без упаковки", en: "No packaging" },
    costKzt: 0,
  },
  bag_bubble: {
    id: "bag_bubble",
    name: { ru: "Зип-пакет + пупырчатая пленка", en: "Zip bag + bubble wrap" },
    costKzt: 150,
  },
  kraft_box: {
    id: "kraft_box",
    name: { ru: "Крафт-коробка с наполнителем", en: "Kraft box with cushioning" },
    costKzt: 350,
  },
  cdek_box: {
    id: "cdek_box",
    name: { ru: "Усиленный почтовый бокс / СДЭК", en: "Heavy-duty courier box" },
    costKzt: 700,
  },
  custom: {
    id: "custom",
    name: { ru: "Своя упаковка", en: "Custom packaging" },
    costKzt: 200,
  },
};

export type TaxRegimeId = "none" | "simplified_3" | "retail_4" | "vat_12";

export interface TaxRegimeOption {
  id: TaxRegimeId;
  name: { ru: string; en: string };
  rate: number;
}

export const TAX_REGIMES: Record<TaxRegimeId, TaxRegimeOption> = {
  none: {
    id: "none",
    name: { ru: "Физлицо / Без налога", en: "Individual / No tax" },
    rate: 0,
  },
  simplified_3: {
    id: "simplified_3",
    name: { ru: "ИП на упрощенке (3 % СНР)", en: "Simplified IP (3% tax)" },
    rate: 0.03,
  },
  retail_4: {
    id: "retail_4",
    name: { ru: "Розничный налог (4 %)", en: "Retail tax (4%)" },
    rate: 0.04,
  },
  vat_12: {
    id: "vat_12",
    name: { ru: "С НДС (+12 %)", en: "With VAT (+12%)" },
    rate: 0.12,
  },
};

export const SPOOL_PRICE_PRESETS = [
  { label: "3 500 ₸", value: 3500, desc: "Китай (Kingroon/Jayo)" },
  { label: "6 500 ₸", value: 6500, desc: "Стандарт (Sunlu/eSun)" },
  { label: "14 000 ₸", value: 14000, desc: "Премиум (Bambu/Polymaker)" },
  { label: "26 000 ₸", value: 26000, desc: "Инженерный (PA-CF/ASA)" },
] as const;
