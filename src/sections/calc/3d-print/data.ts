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

export type PrinterBrand =
  | "bambu"
  | "creality"
  | "anycubic"
  | "elegoo"
  | "prusa"
  | "qidi"
  | "flashforge"
  | "flyingbear"
  | "kingroon"
  | "sovol"
  | "artillery"
  | "twotrees"
  | "snapmaker"
  | "formlabs"
  | "raise3d"
  | "voron"
  | "custom";

export type PrinterId =
  | "x1c"
  | "p1s"
  | "p1p"
  | "a1"
  | "a1_mini"
  | "k1"
  | "k1_max"
  | "k2_plus"
  | "ender3"
  | "ender3_v3_plus"
  | "ender5"
  | "cr10"
  | "cr_m4"
  | "halot_mage"
  | "kobra3_combo"
  | "kobra2"
  | "kobra2_max"
  | "photon_mono"
  | "neptune4"
  | "neptune4_max"
  | "centauri"
  | "mars_saturn"
  | "mk4"
  | "prusa_xl"
  | "prusa_mini"
  | "sl1s"
  | "q1_pro"
  | "plus4"
  | "x_max3"
  | "x_smart3"
  | "adventurer5m"
  | "guider3"
  | "creator4"
  | "ghost6"
  | "reborn2"
  | "klp1"
  | "kp3s_pro"
  | "sovol_sv06"
  | "sovol_sv07"
  | "sovol_sv08"
  | "sidewinder_x4"
  | "sk1"
  | "snapmaker_j1"
  | "form4"
  | "raise3d_pro3"
  | "ultimaker_s5"
  | "voron24"
  | "voron_trident"
  | "voron_v0"
  | "ratrig_vcore"
  | "custom";

export interface PrinterProfile {
  id: PrinterId;
  brand: PrinterBrand;
  name: string;
  shortName: string;
  enclosed: boolean;
  powerByMaterial: Record<string, number>; // Base active wattage
  defaultPower: number; // Watts
  priceKzt: number;
  amsPriceKzt?: number;
  lifespanHours: number;
  depreciationPerHour: number; // KZT / hour
  multiColorCapable: boolean;
  multiColorSystem: string;
}

export type SupportsType = "none" | "light" | "medium" | "heavy" | "custom";

export interface SupportsOption {
  id: SupportsType;
  name: { ru: string; en: string };
  pct: number;
}

export const SUPPORTS_OPTIONS: Record<SupportsType, SupportsOption> = {
  none: { id: "none", name: { ru: "Без поддержек (0%)", en: "No supports (0%)" }, pct: 0 },
  light: { id: "light", name: { ru: "Лёгкие / древовидные (+10%)", en: "Light / Tree (+10%)" }, pct: 10 },
  medium: { id: "medium", name: { ru: "Стандартные (+20%)", en: "Standard (+20%)" }, pct: 20 },
  heavy: { id: "heavy", name: { ru: "Массивные / сложные (+35%)", en: "Dense / Complex (+35%)" }, pct: 35 },
  custom: { id: "custom", name: { ru: "Свой вес в граммах", en: "Custom weight (g)" }, pct: 0 },
};

export const PRINTER_PROFILES: Record<PrinterId, PrinterProfile> = {
  // ── Bambu Lab ──
  x1c: {
    id: "x1c",
    brand: "bambu",
    name: "Bambu Lab X1-Carbon (X1C / X1E)",
    shortName: "X1-Carbon",
    enclosed: true,
    powerByMaterial: { pla: 120, petg: 150, abs: 210, tpu: 120, pacf: 210 },
    defaultPower: 140,
    priceKzt: 550_000,
    amsPriceKzt: 180_000,
    lifespanHours: 7000,
    depreciationPerHour: 78,
    multiColorCapable: true,
    multiColorSystem: "Bambu AMS (до 16 цветов)",
  },
  p1s: {
    id: "p1s",
    brand: "bambu",
    name: "Bambu Lab P1S",
    shortName: "Bambu P1S",
    enclosed: true,
    powerByMaterial: { pla: 105, petg: 135, abs: 190, tpu: 105, pacf: 190 },
    defaultPower: 130,
    priceKzt: 340_000,
    amsPriceKzt: 180_000,
    lifespanHours: 6000,
    depreciationPerHour: 57,
    multiColorCapable: true,
    multiColorSystem: "Bambu AMS (до 16 цветов)",
  },
  p1p: {
    id: "p1p",
    brand: "bambu",
    name: "Bambu Lab P1P (открытый CoreXY)",
    shortName: "Bambu P1P",
    enclosed: false,
    powerByMaterial: { pla: 95, petg: 120, abs: 160, tpu: 95, pacf: 160 },
    defaultPower: 110,
    priceKzt: 280_000,
    amsPriceKzt: 180_000,
    lifespanHours: 5500,
    depreciationPerHour: 51,
    multiColorCapable: true,
    multiColorSystem: "Bambu AMS (до 16 цветов)",
  },
  a1: {
    id: "a1",
    brand: "bambu",
    name: "Bambu Lab A1 (256×256)",
    shortName: "Bambu A1",
    enclosed: false,
    powerByMaterial: { pla: 85, petg: 110, abs: 140, tpu: 85, pacf: 140 },
    defaultPower: 95,
    priceKzt: 210_000,
    amsPriceKzt: 120_000,
    lifespanHours: 4500,
    depreciationPerHour: 47,
    multiColorCapable: true,
    multiColorSystem: "Bambu AMS lite (4 цвета)",
  },
  a1_mini: {
    id: "a1_mini",
    brand: "bambu",
    name: "Bambu Lab A1 mini (180×180)",
    shortName: "A1 mini",
    enclosed: false,
    powerByMaterial: { pla: 55, petg: 75, abs: 90, tpu: 55, pacf: 90 },
    defaultPower: 65,
    priceKzt: 130_000,
    amsPriceKzt: 95_000,
    lifespanHours: 3500,
    depreciationPerHour: 37,
    multiColorCapable: true,
    multiColorSystem: "Bambu AMS lite (4 цвета)",
  },

  // ── Creality ──
  k1: {
    id: "k1",
    brand: "creality",
    name: "Creality K1 / K1C (CoreXY)",
    shortName: "Creality K1",
    enclosed: true,
    powerByMaterial: { pla: 125, petg: 155, abs: 195, tpu: 125, pacf: 195 },
    defaultPower: 140,
    priceKzt: 290_000,
    amsPriceKzt: 160_000,
    lifespanHours: 5000,
    depreciationPerHour: 58,
    multiColorCapable: true,
    multiColorSystem: "Creality CFS (4 цвета)",
  },
  k1_max: {
    id: "k1_max",
    brand: "creality",
    name: "Creality K1 Max (300×300)",
    shortName: "K1 Max",
    enclosed: true,
    powerByMaterial: { pla: 175, petg: 210, abs: 250, tpu: 175, pacf: 250 },
    defaultPower: 190,
    priceKzt: 420_000,
    amsPriceKzt: 160_000,
    lifespanHours: 5500,
    depreciationPerHour: 76,
    multiColorCapable: true,
    multiColorSystem: "Creality CFS (4 цвета)",
  },
  k2_plus: {
    id: "k2_plus",
    brand: "creality",
    name: "Creality K2 Plus (CFS, 350×350)",
    shortName: "K2 Plus",
    enclosed: true,
    powerByMaterial: { pla: 190, petg: 230, abs: 280, tpu: 190, pacf: 280 },
    defaultPower: 220,
    priceKzt: 580_000,
    amsPriceKzt: 180_000,
    lifespanHours: 6000,
    depreciationPerHour: 96,
    multiColorCapable: true,
    multiColorSystem: "Creality CFS (до 16 цветов)",
  },
  ender3: {
    id: "ender3",
    brand: "creality",
    name: "Creality Ender-3 (V2 / V3 / SE / KE)",
    shortName: "Ender-3",
    enclosed: false,
    powerByMaterial: { pla: 100, petg: 120, abs: 160, tpu: 100, pacf: 160 },
    defaultPower: 110,
    priceKzt: 120_000,
    amsPriceKzt: 0,
    lifespanHours: 3000,
    depreciationPerHour: 40,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена (M600)",
  },
  ender3_v3_plus: {
    id: "ender3_v3_plus",
    brand: "creality",
    name: "Creality Ender-3 V3 Plus (300×300)",
    shortName: "Ender-3 V3 Plus",
    enclosed: false,
    powerByMaterial: { pla: 130, petg: 155, abs: 195, tpu: 130, pacf: 195 },
    defaultPower: 145,
    priceKzt: 180_000,
    amsPriceKzt: 0,
    lifespanHours: 4000,
    depreciationPerHour: 45,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  ender5: {
    id: "ender5",
    brand: "creality",
    name: "Creality Ender-5 S1 / Pro",
    shortName: "Ender-5",
    enclosed: false,
    powerByMaterial: { pla: 115, petg: 135, abs: 175, tpu: 115, pacf: 175 },
    defaultPower: 125,
    priceKzt: 190_000,
    amsPriceKzt: 0,
    lifespanHours: 4000,
    depreciationPerHour: 48,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  cr10: {
    id: "cr10",
    brand: "creality",
    name: "Creality CR-10 SE / Smart Pro (300×300)",
    shortName: "CR-10 SE",
    enclosed: false,
    powerByMaterial: { pla: 140, petg: 165, abs: 210, tpu: 140, pacf: 210 },
    defaultPower: 155,
    priceKzt: 230_000,
    amsPriceKzt: 0,
    lifespanHours: 4500,
    depreciationPerHour: 51,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  cr_m4: {
    id: "cr_m4",
    brand: "creality",
    name: "Creality CR-M4 (гигант 450×450)",
    shortName: "CR-M4",
    enclosed: false,
    powerByMaterial: { pla: 350, petg: 420, abs: 550, tpu: 350, pacf: 550 },
    defaultPower: 400,
    priceKzt: 520_000,
    amsPriceKzt: 0,
    lifespanHours: 6000,
    depreciationPerHour: 87,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  halot_mage: {
    id: "halot_mage",
    brand: "creality",
    name: "Creality Halot-Mage (фотополимер 8K)",
    shortName: "Halot-Mage",
    enclosed: true,
    powerByMaterial: { pla: 70, petg: 70, abs: 70, tpu: 70, pacf: 70 },
    defaultPower: 70,
    priceKzt: 180_000,
    amsPriceKzt: 0,
    lifespanHours: 3000,
    depreciationPerHour: 60,
    multiColorCapable: false,
    multiColorSystem: "Фотополимерная смола",
  },

  // ── Anycubic ──
  kobra3_combo: {
    id: "kobra3_combo",
    brand: "anycubic",
    name: "Anycubic Kobra 3 Combo (ACE Pro)",
    shortName: "Kobra 3 Combo",
    enclosed: false,
    powerByMaterial: { pla: 140, petg: 170, abs: 210, tpu: 140, pacf: 210 },
    defaultPower: 150,
    priceKzt: 170_000,
    amsPriceKzt: 110_000,
    lifespanHours: 4500,
    depreciationPerHour: 38,
    multiColorCapable: true,
    multiColorSystem: "Anycubic ACE Pro (4 цвета + сушилка)",
  },
  kobra2: {
    id: "kobra2",
    brand: "anycubic",
    name: "Anycubic Kobra 2 (Neo / Pro / Plus)",
    shortName: "Kobra 2",
    enclosed: false,
    powerByMaterial: { pla: 110, petg: 130, abs: 170, tpu: 110, pacf: 170 },
    defaultPower: 120,
    priceKzt: 140_000,
    amsPriceKzt: 0,
    lifespanHours: 3500,
    depreciationPerHour: 40,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  kobra2_max: {
    id: "kobra2_max",
    brand: "anycubic",
    name: "Anycubic Kobra 2 Max (420×420)",
    shortName: "Kobra 2 Max",
    enclosed: false,
    powerByMaterial: { pla: 280, petg: 340, abs: 420, tpu: 280, pacf: 420 },
    defaultPower: 300,
    priceKzt: 280_000,
    amsPriceKzt: 0,
    lifespanHours: 4500,
    depreciationPerHour: 62,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  photon_mono: {
    id: "photon_mono",
    brand: "anycubic",
    name: "Anycubic Photon Mono (M5 / M7 Pro SLA)",
    shortName: "Photon Mono",
    enclosed: true,
    powerByMaterial: { pla: 80, petg: 80, abs: 80, tpu: 80, pacf: 80 },
    defaultPower: 80,
    priceKzt: 190_000,
    amsPriceKzt: 0,
    lifespanHours: 3500,
    depreciationPerHour: 54,
    multiColorCapable: false,
    multiColorSystem: "Фотополимерная смола",
  },

  // ── Elegoo ──
  neptune4: {
    id: "neptune4",
    brand: "elegoo",
    name: "Elegoo Neptune 4 / 4 Pro",
    shortName: "Neptune 4",
    enclosed: false,
    powerByMaterial: { pla: 115, petg: 140, abs: 180, tpu: 115, pacf: 180 },
    defaultPower: 130,
    priceKzt: 160_000,
    amsPriceKzt: 0,
    lifespanHours: 3500,
    depreciationPerHour: 45,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  neptune4_max: {
    id: "neptune4_max",
    brand: "elegoo",
    name: "Elegoo Neptune 4 Plus / Max (320 / 420 мм)",
    shortName: "Neptune 4 Max",
    enclosed: false,
    powerByMaterial: { pla: 270, petg: 330, abs: 410, tpu: 270, pacf: 410 },
    defaultPower: 300,
    priceKzt: 260_000,
    amsPriceKzt: 0,
    lifespanHours: 4500,
    depreciationPerHour: 58,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  centauri: {
    id: "centauri",
    brand: "elegoo",
    name: "Elegoo Centauri Carbon (CoreXY)",
    shortName: "Centauri Carbon",
    enclosed: true,
    powerByMaterial: { pla: 130, petg: 160, abs: 200, tpu: 130, pacf: 200 },
    defaultPower: 150,
    priceKzt: 280_000,
    amsPriceKzt: 140_000,
    lifespanHours: 5000,
    depreciationPerHour: 56,
    multiColorCapable: true,
    multiColorSystem: "Elegoo Multi-Color",
  },
  mars_saturn: {
    id: "mars_saturn",
    brand: "elegoo",
    name: "Elegoo Saturn 4 Ultra / Mars 5 (12K)",
    shortName: "Saturn 4 Ultra",
    enclosed: true,
    powerByMaterial: { pla: 90, petg: 90, abs: 90, tpu: 90, pacf: 90 },
    defaultPower: 90,
    priceKzt: 230_000,
    amsPriceKzt: 0,
    lifespanHours: 4000,
    depreciationPerHour: 58,
    multiColorCapable: false,
    multiColorSystem: "Фотополимерная смола",
  },

  // ── Prusa Research ──
  mk4: {
    id: "mk4",
    brand: "prusa",
    name: "Original Prusa MK4 / MK3S+",
    shortName: "Prusa MK4",
    enclosed: false,
    powerByMaterial: { pla: 80, petg: 100, abs: 130, tpu: 80, pacf: 130 },
    defaultPower: 90,
    priceKzt: 460_000,
    amsPriceKzt: 160_000,
    lifespanHours: 8000,
    depreciationPerHour: 57,
    multiColorCapable: true,
    multiColorSystem: "Prusa MMU3 (5 цветов)",
  },
  prusa_xl: {
    id: "prusa_xl",
    brand: "prusa",
    name: "Original Prusa XL (Multi-Toolhead 360×360)",
    shortName: "Prusa XL",
    enclosed: false,
    powerByMaterial: { pla: 210, petg: 250, abs: 310, tpu: 210, pacf: 310 },
    defaultPower: 240,
    priceKzt: 1_100_000,
    amsPriceKzt: 0,
    lifespanHours: 9000,
    depreciationPerHour: 122,
    multiColorCapable: true,
    multiColorSystem: "Multi-Toolhead (до 5 экструдеров)",
  },
  prusa_mini: {
    id: "prusa_mini",
    brand: "prusa",
    name: "Original Prusa MINI+ (180×180)",
    shortName: "Prusa MINI+",
    enclosed: false,
    powerByMaterial: { pla: 60, petg: 80, abs: 100, tpu: 60, pacf: 100 },
    defaultPower: 70,
    priceKzt: 240_000,
    amsPriceKzt: 0,
    lifespanHours: 6000,
    depreciationPerHour: 40,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  sl1s: {
    id: "sl1s",
    brand: "prusa",
    name: "Original Prusa SL1S SPEED (SLA)",
    shortName: "Prusa SL1S",
    enclosed: true,
    powerByMaterial: { pla: 100, petg: 100, abs: 100, tpu: 100, pacf: 100 },
    defaultPower: 100,
    priceKzt: 680_000,
    amsPriceKzt: 0,
    lifespanHours: 5000,
    depreciationPerHour: 136,
    multiColorCapable: false,
    multiColorSystem: "Фотополимерная смола",
  },

  // ── QIDI Tech ──
  q1_pro: {
    id: "q1_pro",
    brand: "qidi",
    name: "QIDI Q1 Pro (активная камера 60°C)",
    shortName: "QIDI Q1 Pro",
    enclosed: true,
    powerByMaterial: { pla: 140, petg: 170, abs: 290, tpu: 140, pacf: 320 },
    defaultPower: 280,
    priceKzt: 290_000,
    amsPriceKzt: 0,
    lifespanHours: 5000,
    depreciationPerHour: 58,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  plus4: {
    id: "plus4",
    brand: "qidi",
    name: "QIDI Plus4 / X-Plus 3 (305×305)",
    shortName: "QIDI Plus4",
    enclosed: true,
    powerByMaterial: { pla: 180, petg: 220, abs: 350, tpu: 180, pacf: 380 },
    defaultPower: 350,
    priceKzt: 420_000,
    amsPriceKzt: 0,
    lifespanHours: 6000,
    depreciationPerHour: 70,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  x_max3: {
    id: "x_max3",
    brand: "qidi",
    name: "QIDI X-Max 3 (325×325 промышленный)",
    shortName: "QIDI X-Max 3",
    enclosed: true,
    powerByMaterial: { pla: 210, petg: 260, abs: 420, tpu: 210, pacf: 450 },
    defaultPower: 400,
    priceKzt: 490_000,
    amsPriceKzt: 0,
    lifespanHours: 6500,
    depreciationPerHour: 75,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  x_smart3: {
    id: "x_smart3",
    brand: "qidi",
    name: "QIDI X-Smart 3 (компактный CoreXY)",
    shortName: "QIDI X-Smart 3",
    enclosed: true,
    powerByMaterial: { pla: 110, petg: 130, abs: 170, tpu: 110, pacf: 170 },
    defaultPower: 120,
    priceKzt: 170_000,
    amsPriceKzt: 0,
    lifespanHours: 4000,
    depreciationPerHour: 42,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },

  // ── Flashforge ──
  adventurer5m: {
    id: "adventurer5m",
    brand: "flashforge",
    name: "Flashforge Adventurer 5M / 5M Pro",
    shortName: "Adventurer 5M",
    enclosed: true,
    powerByMaterial: { pla: 125, petg: 150, abs: 190, tpu: 125, pacf: 190 },
    defaultPower: 140,
    priceKzt: 210_000,
    amsPriceKzt: 0,
    lifespanHours: 4500,
    depreciationPerHour: 47,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  guider3: {
    id: "guider3",
    brand: "flashforge",
    name: "Flashforge Guider 3 / 3 Plus (промышленный)",
    shortName: "Guider 3",
    enclosed: true,
    powerByMaterial: { pla: 220, petg: 270, abs: 380, tpu: 220, pacf: 400 },
    defaultPower: 350,
    priceKzt: 850_000,
    amsPriceKzt: 0,
    lifespanHours: 8000,
    depreciationPerHour: 106,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  creator4: {
    id: "creator4",
    brand: "flashforge",
    name: "Flashforge Creator 4 (IDEX два экструдера)",
    shortName: "Creator 4 IDEX",
    enclosed: true,
    powerByMaterial: { pla: 300, petg: 360, abs: 500, tpu: 300, pacf: 550 },
    defaultPower: 450,
    priceKzt: 1_600_000,
    amsPriceKzt: 0,
    lifespanHours: 9000,
    depreciationPerHour: 177,
    multiColorCapable: true,
    multiColorSystem: "IDEX (два независимых сопла)",
  },

  // ── Flying Bear ──
  ghost6: {
    id: "ghost6",
    brand: "flyingbear",
    name: "Flying Bear Ghost 6",
    shortName: "Ghost 6",
    enclosed: false,
    powerByMaterial: { pla: 110, petg: 130, abs: 170, tpu: 110, pacf: 170 },
    defaultPower: 125,
    priceKzt: 160_000,
    amsPriceKzt: 0,
    lifespanHours: 4000,
    depreciationPerHour: 40,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  reborn2: {
    id: "reborn2",
    brand: "flyingbear",
    name: "Flying Bear Reborn 2 (CoreXY 325×325)",
    shortName: "Reborn 2",
    enclosed: true,
    powerByMaterial: { pla: 180, petg: 220, abs: 290, tpu: 180, pacf: 290 },
    defaultPower: 220,
    priceKzt: 280_000,
    amsPriceKzt: 0,
    lifespanHours: 5000,
    depreciationPerHour: 56,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },

  // ── Kingroon ──
  klp1: {
    id: "klp1",
    brand: "kingroon",
    name: "Kingroon KLP1 (CoreXY Klipper)",
    shortName: "Kingroon KLP1",
    enclosed: true,
    powerByMaterial: { pla: 100, petg: 120, abs: 160, tpu: 100, pacf: 160 },
    defaultPower: 110,
    priceKzt: 130_000,
    amsPriceKzt: 0,
    lifespanHours: 3500,
    depreciationPerHour: 37,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  kp3s_pro: {
    id: "kp3s_pro",
    brand: "kingroon",
    name: "Kingroon KP3S Pro / V2",
    shortName: "KP3S Pro",
    enclosed: false,
    powerByMaterial: { pla: 90, petg: 110, abs: 140, tpu: 90, pacf: 140 },
    defaultPower: 100,
    priceKzt: 95_000,
    amsPriceKzt: 0,
    lifespanHours: 3000,
    depreciationPerHour: 32,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },

  // ── Sovol ──
  sovol_sv06: {
    id: "sovol_sv06",
    brand: "sovol",
    name: "Sovol SV06 / SV06 Plus",
    shortName: "Sovol SV06",
    enclosed: false,
    powerByMaterial: { pla: 100, petg: 125, abs: 165, tpu: 100, pacf: 165 },
    defaultPower: 115,
    priceKzt: 150_000,
    amsPriceKzt: 0,
    lifespanHours: 4000,
    depreciationPerHour: 38,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  sovol_sv07: {
    id: "sovol_sv07",
    brand: "sovol",
    name: "Sovol SV07 / SV07 Plus (Klipper)",
    shortName: "Sovol SV07",
    enclosed: false,
    powerByMaterial: { pla: 125, petg: 150, abs: 190, tpu: 125, pacf: 190 },
    defaultPower: 140,
    priceKzt: 175_000,
    amsPriceKzt: 0,
    lifespanHours: 4000,
    depreciationPerHour: 44,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  sovol_sv08: {
    id: "sovol_sv08",
    brand: "sovol",
    name: "Sovol SV08 (Voron клон 350×350)",
    shortName: "Sovol SV08",
    enclosed: false,
    powerByMaterial: { pla: 220, petg: 270, abs: 380, tpu: 220, pacf: 400 },
    defaultPower: 260,
    priceKzt: 340_000,
    amsPriceKzt: 0,
    lifespanHours: 5500,
    depreciationPerHour: 62,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },

  // ── Artillery & Two Trees ──
  sidewinder_x4: {
    id: "sidewinder_x4",
    brand: "artillery",
    name: "Artillery Sidewinder X4 Pro / Plus",
    shortName: "Sidewinder X4",
    enclosed: false,
    powerByMaterial: { pla: 120, petg: 145, abs: 185, tpu: 120, pacf: 185 },
    defaultPower: 135,
    priceKzt: 165_000,
    amsPriceKzt: 0,
    lifespanHours: 3500,
    depreciationPerHour: 47,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  sk1: {
    id: "sk1",
    brand: "twotrees",
    name: "Two Trees SK1 (CoreXY 700 мм/с)",
    shortName: "Two Trees SK1",
    enclosed: false,
    powerByMaterial: { pla: 135, petg: 165, abs: 210, tpu: 135, pacf: 210 },
    defaultPower: 150,
    priceKzt: 210_000,
    amsPriceKzt: 0,
    lifespanHours: 4500,
    depreciationPerHour: 47,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },

  // ── Snapmaker, Formlabs & Industrial ──
  snapmaker_j1: {
    id: "snapmaker_j1",
    brand: "snapmaker",
    name: "Snapmaker J1 / J1s (IDEX два сопла)",
    shortName: "Snapmaker J1",
    enclosed: true,
    powerByMaterial: { pla: 150, petg: 180, abs: 240, tpu: 150, pacf: 260 },
    defaultPower: 180,
    priceKzt: 480_000,
    amsPriceKzt: 0,
    lifespanHours: 6000,
    depreciationPerHour: 80,
    multiColorCapable: true,
    multiColorSystem: "IDEX (два независимых экструдера)",
  },
  form4: {
    id: "form4",
    brand: "formlabs",
    name: "Formlabs Form 4 / Form 3+ (инженерный SLA)",
    shortName: "Formlabs Form 4",
    enclosed: true,
    powerByMaterial: { pla: 150, petg: 150, abs: 150, tpu: 150, pacf: 150 },
    defaultPower: 150,
    priceKzt: 2_400_000,
    amsPriceKzt: 0,
    lifespanHours: 10000,
    depreciationPerHour: 240,
    multiColorCapable: false,
    multiColorSystem: "Инженерная фотополимерная смола",
  },
  raise3d_pro3: {
    id: "raise3d_pro3",
    brand: "raise3d",
    name: "Raise3D Pro3 / E2 (промышленный двойной)",
    shortName: "Raise3D Pro3",
    enclosed: true,
    powerByMaterial: { pla: 280, petg: 340, abs: 480, tpu: 280, pacf: 500 },
    defaultPower: 380,
    priceKzt: 2_900_000,
    amsPriceKzt: 0,
    lifespanHours: 12000,
    depreciationPerHour: 241,
    multiColorCapable: true,
    multiColorSystem: "Dual Extruder (два экструдера)",
  },
  ultimaker_s5: {
    id: "ultimaker_s5",
    brand: "raise3d",
    name: "UltiMaker S5 / S7 (двойной экструдер)",
    shortName: "UltiMaker S5",
    enclosed: true,
    powerByMaterial: { pla: 220, petg: 270, abs: 380, tpu: 220, pacf: 400 },
    defaultPower: 300,
    priceKzt: 3_200_000,
    amsPriceKzt: 0,
    lifespanHours: 12000,
    depreciationPerHour: 266,
    multiColorCapable: true,
    multiColorSystem: "Dual Print Core",
  },

  // ── Voron & RatRig (DIY / Фермы) ──
  voron24: {
    id: "voron24",
    brand: "voron",
    name: "Voron 2.4 (CoreXY Flying Gantry 300/350)",
    shortName: "Voron 2.4",
    enclosed: true,
    powerByMaterial: { pla: 160, petg: 190, abs: 280, tpu: 160, pacf: 300 },
    defaultPower: 250,
    priceKzt: 450_000,
    amsPriceKzt: 150_000,
    lifespanHours: 8000,
    depreciationPerHour: 56,
    multiColorCapable: true,
    multiColorSystem: "ERCF (до 12 цветов)",
  },
  voron_trident: {
    id: "voron_trident",
    brand: "voron",
    name: "Voron Trident (трёхвинтовой CoreXY)",
    shortName: "Voron Trident",
    enclosed: true,
    powerByMaterial: { pla: 150, petg: 180, abs: 270, tpu: 150, pacf: 290 },
    defaultPower: 240,
    priceKzt: 410_000,
    amsPriceKzt: 150_000,
    lifespanHours: 8000,
    depreciationPerHour: 51,
    multiColorCapable: true,
    multiColorSystem: "ERCF (до 12 цветов)",
  },
  voron_v0: {
    id: "voron_v0",
    brand: "voron",
    name: "Voron V0.2 (супербыстрый 120×120)",
    shortName: "Voron V0.2",
    enclosed: true,
    powerByMaterial: { pla: 70, petg: 90, abs: 130, tpu: 70, pacf: 130 },
    defaultPower: 85,
    priceKzt: 180_000,
    amsPriceKzt: 0,
    lifespanHours: 5000,
    depreciationPerHour: 36,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },
  ratrig_vcore: {
    id: "ratrig_vcore",
    brand: "voron",
    name: "RatRig V-Core 3.1 / 4 (Heavy-duty CoreXY)",
    shortName: "RatRig V-Core",
    enclosed: true,
    powerByMaterial: { pla: 220, petg: 270, abs: 400, tpu: 220, pacf: 420 },
    defaultPower: 300,
    priceKzt: 650_000,
    amsPriceKzt: 0,
    lifespanHours: 10000,
    depreciationPerHour: 65,
    multiColorCapable: false,
    multiColorSystem: "Ручная смена",
  },

  // ── Custom ──
  custom: {
    id: "custom",
    brand: "custom",
    name: "Свой принтер (настраиваемый)",
    shortName: "Свой принтер",
    enclosed: false,
    powerByMaterial: { pla: 120, petg: 150, abs: 220, tpu: 120, pacf: 220 },
    defaultPower: 150,
    priceKzt: 250_000,
    amsPriceKzt: 150_000,
    lifespanHours: 5000,
    depreciationPerHour: 50,
    multiColorCapable: true,
    multiColorSystem: "Настраиваемая",
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
    defaultPriceKg: 7500,
    density: 1.24,
    bedTemp: "55–65 °C",
    abrasive: false,
  },
  petg: {
    id: "petg",
    name: "PETG",
    defaultPriceKg: 5500,
    density: 1.27,
    bedTemp: "70–80 °C",
    abrasive: false,
  },
  abs: {
    id: "abs",
    name: "ABS / ASA",
    defaultPriceKg: 6500,
    density: 1.05,
    bedTemp: "90–100 °C",
    abrasive: false,
  },
  tpu: {
    id: "tpu",
    name: "TPU (Flex)",
    defaultPriceKg: 9000,
    density: 1.21,
    bedTemp: "35–50 °C",
    abrasive: false,
  },
  pacf: {
    id: "pacf",
    name: "PA-CF (Carbon)",
    defaultPriceKg: 19000,
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
