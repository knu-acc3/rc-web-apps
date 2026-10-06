"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Layers,
  MapPin,
  Minus,
  Package,
  Plus,
  Printer,
  RotateCcw,
  Scale,
  Settings2,
  Share2,
  Timer,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Input, Select } from "@/ui/field";
import type { ToolProps } from "../../types";
import { fmtMoney } from "../kit/fmt";
import { field, toInput } from "../kit/num";
import { DataTable, Explain, Stack, SubHeading } from "../kit/ui";
import { useQueryState } from "../kit/url-state";
import {
  DRYER_PROFILES,
  KZ_CITIES,
  MATERIAL_PROFILES,
  NOZZLE_PROFILES,
  PRINTER_PROFILES,
  SUPPORTS_OPTIONS,
  TAX_REGIMES,
  type MaterialId,
  type NozzleId,
  type PrinterId,
  type SupportsType,
  type TaxRegimeId,
} from "./data";
import { calculatePrint3d } from "./engine";

const STORAGE_KEY = "rc_calc_3d_state_v6";

function GraphiteSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  className,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  const safeVal = Math.min(max, Math.max(min, value));
  const pct = Math.max(0, Math.min(100, ((safeVal - min) / (max - min)) * 100));

  return (
    <div className={cn("group relative flex w-full items-center py-3.5 select-none", className)}>
      {/* Background track: dark graphite / subtle neutral */}
      <div className="absolute inset-x-0 h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
      {/* Active filled line: deep graphite / dark charcoal */}
      <div
        className="pointer-events-none absolute left-0 h-2.5 rounded-full bg-neutral-900 transition-all dark:bg-neutral-200"
        style={{ width: `${pct}%` }}
      />
      {/* Native range slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeVal}
        onChange={onChange}
        className={cn(
          "relative z-10 h-7 w-full appearance-none bg-transparent cursor-pointer touch-pan-x",
          "focus:outline-hidden",
          "[&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent",
          "[&::-moz-range-track]:bg-transparent",
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:size-7",
          "[&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:bg-neutral-900 dark:[&::-webkit-slider-thumb]:bg-neutral-100",
          "[&::-webkit-slider-thumb]:border-[3px]",
          "[&::-webkit-slider-thumb]:border-neutral-950 dark:[&::-webkit-slider-thumb]:border-white",
          "[&::-webkit-slider-thumb]:shadow-[0_2px_10px_rgba(0,0,0,0.4)]",
          "[&::-webkit-slider-thumb]:transition-transform",
          "[&::-webkit-slider-thumb]:hover:scale-105",
          "[&::-webkit-slider-thumb]:active:scale-95",
          "[&::-moz-range-thumb]:size-7",
          "[&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:bg-neutral-900 dark:[&::-moz-range-thumb]:bg-neutral-100",
          "[&::-moz-range-thumb]:border-[3px]",
          "[&::-moz-range-thumb]:border-neutral-950 dark:[&::-moz-range-thumb]:border-white",
          "[&::-moz-range-thumb]:shadow-[0_2px_10px_rgba(0,0,0,0.4)]",
          "[&::-moz-range-thumb]:transition-transform",
          "[&::-moz-range-thumb]:hover:scale-105",
          "[&::-moz-range-thumb]:active:scale-95",
        )}
      />
    </div>
  );
}

const T = {
  ru: {
    modeSingle: "Стандартная (1 цвет)",
    modeMulti: "Многоцветная (AMS / CFS)",
    printer: "3D-принтер",
    brandCreality: "Creality",
    brandBambu: "Bambu Lab",
    brandAnycubic: "Anycubic",
    brandCustom: "Свой",
    material: "Материал филамента",
    city: "Город (Казахстан)",
    residential: "Бытовой тариф",
    commercial: "Коммерческий / ИП",
    customTariff: "Тариф электроэнергии (₸ / кВт⋅ч)",
    weight: "Вес готовой детали",
    printTime: "Время печати",
    hours: "ч",
    minutes: "мин",
    quantity: "Тираж (шт.)",
    plates: "Столов (запусков)",
    spoolPrice: "Цена пластика за 1 кг",
    recommendedPrice: "Рекомендуемая цена",
    batchPrice: "Сумма за всю партию",
    netCost: "Себестоимость",
    profit: "Прибыль",
    margin: "маржа",
    unitNetCost: "Себестоимость 1 шт.",
    batchNetCost: "Себестоимость партии",
    pricePerGram: "Цена за 1 грамм",
    pricePerHour: "Цена за 1 час печати",
    materialCost: "Пластик детали",
    supportsCost: "Поддержки",
    brimCost: "Кайма (Brim)",
    multiPurgeCost: "Сброс нити (AMS / CFS)",
    elecCost: "Электроэнергия",
    depCost: "Амортизация принтера",
    wearCost: "Износ сопла и стола",
    setupCost: "Запуск стола",
    modelingCost: "3D-моделирование",
    laborCost: "Работа мастера",
    packCost: "Упаковка",
    taxCost: "Налог",
    advanced: "Расширенные параметры (амортизация, сопло, запуск, моделирование, налог)",
    supportsTitle: "Поддержки и кайма",
    supportsHint: "Дополнительный расход пластика",
    brimCheck: "Кайма (Brim) для надёжной адгезии (+5 г, +3 мин)",
    customSupportsWeight: "Вес поддержек из слайсера (г):",
    depTitle: "Амортизация и модуль AMS",
    printerPrice: "Цена покупки принтера (₸):",
    amsPrice: "Модуль AMS / CFS (₸):",
    includeAmsDep: "Учитывать модуль AMS в амортизации",
    lifespan: "Ресурс окупаемости (часов):",
    workshopTerms: "Условия мастерской и доп. услуги",
    minOrderFee: "Минимальный заказ мастерской (₸):",
    setupFee: "Плата за запуск стола (₸):",
    modelingTitle: "3D-моделирование / исправление файлов",
    modelingHours: "Часов моделирования:",
    modelingRate: "Ставка (₸ / час):",
    minOrderBadge: "Применён минимальный чек заказа",
    dryer: "Сушилка филамента",
    dryingHours: "Время сушки",
    nozzle: "Тип сопла",
    nozzleCustomRate: "Своя ставка износа:",
    prepTime: "Подготовка и слайсинг",
    prepHint: "Делится на весь тираж",
    postTime: "Постобработка",
    hourlyRate: "Ставка мастера",
    packaging: "Упаковка",
    packCustomCost: "Своя цена упаковки:",
    packPerBatch: "Одна упаковка на весь тираж",
    markup: "Наценка мастерской",
    taxRegime: "Налоговый режим РК",
    breakdownTitle: "Детализация сметы",
    printerPowerTable: "Базовые характеристики принтеров",
    cityTariffsTable: "Тарифы на электроэнергию по городам Казахстана (2025/2026)",
    colPrinter: "Принтер",
    colBrand: "Бренд",
    colPla: "PLA (базовое)",
    colPetg: "PETG",
    colAbs: "ABS / ASA",
    colDep: "Амортизация",
    colMultiSys: "Смена цвета",
    colCity: "Город",
    colResTariff: "Бытовой тариф",
    colCommTariff: "Коммерческий",
    colUtility: "Энергокомпания",
    howToTitle: "Формула и особенности расчёта в Казахстане",
    colorCount: "Количество цветов",
    colorSwaps: "Число смен цвета (tool changes)",
    colorSwapsHint: "Из слайсера (Bambu Studio / OrcaSlicer / Creality Print)",
    purgePerSwap: "Сброс на 1 смену",
    purgeHint: "Башня очистки + слив сопла",
    swapSecs: "Секунд на 1 смену",
    copyQuoteBtn: "Скопировать смету для клиента",
    printerWatts: "Мощность принтера при печати, Вт",
    printerWattsHint: "Потребление стола и сопла во время печати",
    multiTierTariffHint: "💡 При 3-уровневом тарифе (Т1 день / Т2 ночь / Т3 пик) укажите среднюю ставку за фактические часы печати (для ночной печати выберите Т2).",
    pricingMode: "Модель ценообразования",
    pricingByCost: "По наценке на себестоимость",
    pricingByMarket: "По рыночной ставке (₸ / г)",
    marketRateLabel: "Рыночная ставка за 1 грамм",
    marketRateHint: "Стандарт мастерских в Казахстане: 30–50 ₸/г",
    marketBenchmarkTitle: "Рыночная цена в Казахстане",
    marketStatusBelow: "Ниже рынка",
    marketStatusMarket: "В рынке",
    marketStatusAbove: "Выше рынка",
    marketApplyRate: "💡 Применить рыночную ставку (35 ₸/г)",
    maintReserve: "Резерв на ремонт и ТО станка",
    maintReserveHint: "Защитный буфер на ремни, термисторы, экструдер и ремонт при поломках (15–30 ₸/ч)",
    maintCost: "Резерв на ТО и поломки",
    quoteCopied: "Смета скопирована в буфер!",
    linkCopied: "Ссылка скопирована!",
    share: "Поделиться",
    reset: "Сбросить настройки",
    savedHint: "Настройки сохраняются в кеш браузера",
  },
  en: {
    modeSingle: "Single-color",
    modeMulti: "Multi-color (AMS / CFS)",
    printer: "3D Printer",
    brandCreality: "Creality",
    brandBambu: "Bambu Lab",
    brandAnycubic: "Anycubic",
    brandCustom: "Custom",
    material: "Filament material",
    city: "City (Kazakhstan)",
    residential: "Residential",
    commercial: "Commercial / Business",
    customTariff: "Electricity tariff (₸ / kWh)",
    weight: "Finished part weight",
    printTime: "Print time",
    hours: "h",
    minutes: "min",
    quantity: "Batch quantity",
    plates: "Plates (runs)",
    spoolPrice: "Filament price per 1 kg",
    recommendedPrice: "Recommended price",
    batchPrice: "Total batch price",
    netCost: "Net cost",
    profit: "Profit",
    margin: "margin",
    unitNetCost: "Unit net cost",
    batchNetCost: "Batch net cost",
    pricePerGram: "Price per gram",
    pricePerHour: "Price per print hour",
    materialCost: "Part filament",
    supportsCost: "Supports",
    brimCost: "Brim",
    multiPurgeCost: "Purge waste (AMS / CFS)",
    elecCost: "Electricity",
    depCost: "Equipment depreciation",
    wearCost: "Nozzle & bed wear",
    setupCost: "Plate setup fee",
    modelingCost: "3D CAD modeling",
    laborCost: "Labor",
    packCost: "Packaging",
    taxCost: "Tax",
    advanced: "Advanced settings (depreciation, nozzle, setup, CAD, taxes)",
    supportsTitle: "Supports & Brim",
    supportsHint: "Additional filament usage",
    brimCheck: "Brim for bed adhesion (+5g, +3 min)",
    customSupportsWeight: "Slicer support weight (g):",
    depTitle: "Depreciation & AMS module",
    printerPrice: "Machine purchase price (₸):",
    amsPrice: "AMS / CFS unit price (₸):",
    includeAmsDep: "Include AMS module in machine depreciation",
    lifespan: "Payback lifespan (hours):",
    workshopTerms: "Workshop policies & Extras",
    minOrderFee: "Minimum order threshold (₸):",
    setupFee: "Plate launch / prep fee (₸):",
    modelingTitle: "3D Modeling / STL fixing",
    modelingHours: "Modeling hours:",
    modelingRate: "Rate (₸ / hour):",
    minOrderBadge: "Minimum order threshold applied",
    dryer: "Filament dryer",
    dryingHours: "Drying time",
    nozzle: "Nozzle type",
    nozzleCustomRate: "Custom wear rate:",
    prepTime: "Prep & slicing",
    prepHint: "Shared across batch",
    postTime: "Post-processing",
    hourlyRate: "Labor rate",
    packaging: "Packaging",
    packCustomCost: "Custom package price:",
    packPerBatch: "Single package for batch",
    markup: "Markup",
    taxRegime: "Kazakhstan tax regime",
    breakdownTitle: "Cost breakdown",
    printerPowerTable: "Printer profiles and power ratings",
    cityTariffsTable: "Electricity tariffs by Kazakhstan cities (2025/2026)",
    colPrinter: "Printer",
    colBrand: "Brand",
    colPla: "PLA (base)",
    colPetg: "PETG",
    colAbs: "ABS / ASA",
    colDep: "Depreciation",
    colMultiSys: "Color system",
    colCity: "City",
    colResTariff: "Residential",
    colCommTariff: "Commercial",
    colUtility: "Utility",
    howToTitle: "Costing formula in Kazakhstan",
    colorCount: "Number of colors",
    colorSwaps: "Tool changes",
    colorSwapsHint: "From slicer (Bambu Studio / OrcaSlicer)",
    purgePerSwap: "Purge per tool change",
    purgeHint: "Prime tower + poop chute",
    swapSecs: "Seconds per tool change",
    copyQuoteBtn: "Copy client quotation",
    printerWatts: "Printer power draw, W",
    printerWattsHint: "Operating power draw during printing",
    multiTierTariffHint: "💡 For multi-rate tariffs (T1 day / T2 night / T3 peak), enter the weighted average rate for your printing schedule (e.g. night T2 rate).",
    pricingMode: "Pricing model",
    pricingByCost: "Cost-plus markup",
    pricingByMarket: "Market rate (₸ / g)",
    marketRateLabel: "Market rate per gram",
    marketRateHint: "Kazakhstan workshop standard: 30–50 KZT/g",
    marketBenchmarkTitle: "Kazakhstan Market Reference",
    marketStatusBelow: "Below market",
    marketStatusMarket: "Market rate",
    marketStatusAbove: "Above market",
    marketApplyRate: "💡 Apply standard market rate (35 KZT/g)",
    maintReserve: "Machine maintenance & repair buffer",
    maintReserveHint: "Safety buffer for spare parts (belts, sensors, hotends) and repairs (15–30 KZT/h)",
    maintCost: "Maintenance & repairs",
    quoteCopied: "Quote copied to clipboard!",
    linkCopied: "Link copied!",
    share: "Share",
    reset: "Reset settings",
    savedHint: "Settings saved to browser storage",
  },
} as const;

export interface Print3dProps {
  city?: string;
  printer?: PrinterId;
  material?: MaterialId;
  weight?: number;
  hours?: number;
}

export default function Print3dCalc({
  locale,
  city = "almaty",
  printer = "p1s",
  material = "pla",
  weight = 100,
  hours = 4,
}: ToolProps<Print3dProps>) {
  const t = T[locale];
  const id = useId();

  const [copiedQuote, setCopiedQuote] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const priceCardRef = useRef<HTMLDivElement>(null);
  const [isPriceCardVisible, setIsPriceCardVisible] = useState(false);
  const brandScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = priceCardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPriceCardVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollBrands = (direction: -1 | 1) => {
    if (brandScrollRef.current) {
      brandScrollRef.current.scrollBy({ left: direction * 240, behavior: "smooth" });
    }
  };

  const q = useQueryState(
    {
      mc: "0", // 0 = single color, 1 = multi color
      brand: "all",
      w: toInput(locale, weight),
      th: toInput(locale, Math.floor(hours)),
      tm: toInput(locale, Math.round((hours % 1) * 60)),
      q: "1",
      plates: "1",
      sp: toInput(locale, 7500),
      pr: printer,
      mat: material,
      city: city,
      comm: "0",
      tar: "",
      pwatts: "",
      pm: "market",
      mrate: "35",
      maint: "20",
      sup: "none",
      supw: "20",
      brim: "0",
      pprice: "",
      ams: "1",
      amsprice: "",
      life: "5000",
      cc: "4",
      cs: "250",
      csw: toInput(locale, 0.35),
      sws: "60",
      waste: "0",
      fail: "5",
      dry: "none",
      dryt: "4",
      noz: "hardened",
      nozrate: "",
      prep: "10",
      post: "5",
      rate: toInput(locale, 2500),
      setup: "500",
      minfee: "2000",
      modh: "0",
      modrate: "5000",
      pack: "none",
      packcost: "",
      packb: "1",
      mark: "40",
      tax: "none",
    },
    {
      enums: {
        pm: ["cost", "market"],
        mc: ["0", "1"],
        brand: ["all", "bambu", "creality", "prusa", "anycubic", "elegoo", "qidi", "flashforge", "flyingbear", "kingroon", "voron", "custom"],
        pr: Object.keys(PRINTER_PROFILES),
        mat: Object.keys(MATERIAL_PROFILES),
        city: KZ_CITIES.map((c) => c.slug),
        comm: ["0", "1"],
        sup: Object.keys(SUPPORTS_OPTIONS),
        brim: ["0", "1"],
        ams: ["0", "1"],
        dry: Object.keys(DRYER_PROFILES),
        noz: Object.keys(NOZZLE_PROFILES),
        tax: Object.keys(TAX_REGIMES),
      },
    },
  );

  // Sync state with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(q.v));
    } catch {
      /* ignore */
    }
  }, [q.v]);

  // Load from localStorage on client mount if URL has no specific queries
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && typeof window !== "undefined" && window.location.search.length <= 1) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          q.set(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    q.set({
      mc: "0",
      brand: "all",
      w: toInput(locale, 100),
      th: "4",
      tm: "0",
      q: "1",
      plates: "1",
      sp: toInput(locale, 7500),
      pr: "p1s",
      mat: "pla",
      city: "almaty",
      comm: "0",
      tar: "",
      pwatts: "",
      pm: "market",
      mrate: "35",
      maint: "20",
      sup: "none",
      supw: "20",
      brim: "0",
      pprice: "",
      ams: "1",
      amsprice: "",
      life: "5000",
      cc: "4",
      cs: "250",
      csw: toInput(locale, 0.35),
      sws: "60",
      waste: "0",
      fail: "5",
      dry: "none",
      dryt: "4",
      noz: "hardened",
      nozrate: "",
      prep: "10",
      post: "5",
      rate: toInput(locale, 2500),
      setup: "500",
      minfee: "2000",
      modh: "0",
      modrate: "5000",
      pack: "none",
      packcost: "",
      packb: "1",
      mark: "40",
      tax: "none",
    });
  };

  const selectedPrinter = PRINTER_PROFILES[q.v.pr as PrinterId] ?? PRINTER_PROFILES.p1s;
  const selectedMaterial = MATERIAL_PROFILES[q.v.mat as MaterialId] ?? MATERIAL_PROFILES.pla;
  const selectedCity = KZ_CITIES.find((c) => c.slug === q.v.city) ?? KZ_CITIES[0];
  const isCommercial = q.v.comm === "1";
  const selectedNozzle = NOZZLE_PROFILES[q.v.noz as NozzleId] ?? NOZZLE_PROFILES.hardened;

  const defaultTariff = isCommercial ? selectedCity.commercialTariff : selectedCity.residentialTariff;
  const currentTariffText = q.v.tar ? q.v.tar : toInput(locale, defaultTariff);
  const defaultPrinterWatts = selectedPrinter.powerByMaterial[selectedMaterial.id] ?? selectedPrinter.defaultPower;
  const currentWattsText = q.v.pwatts ? q.v.pwatts : String(defaultPrinterWatts);

  // Parse numeric fields
  const W = field(locale, q.v.w, { min: 0, max: 100_000 });
  const TH = field(locale, q.v.th, { min: 0, max: 1000 });
  const TM = field(locale, q.v.tm, { min: 0, max: 59 });
  const Q = field(locale, q.v.q, { min: 1, max: 50_000, int: true });
  const SP = field(locale, q.v.sp, { min: 0, max: 500_000 });
  const TAR = field(locale, currentTariffText, { min: 0, max: 500 });
  const PWATTS = field(locale, currentWattsText, { min: 10, max: 3000 });
  const MRATE = field(locale, q.v.mrate, { min: 1, max: 200 });
  const MAINT = field(locale, q.v.maint, { min: 0, max: 1000 });
  const SUPW = field(locale, q.v.supw, { min: 0, max: 50_000 });

  const PPRICE = field(locale, q.v.pprice, { min: 0, max: 10_000_000 });
  const AMSPRICE = field(locale, q.v.amsprice, { min: 0, max: 5_000_000 });
  const LIFE = field(locale, q.v.life, { min: 100, max: 50_000, int: true });

  const FAIL = field(locale, q.v.fail, { min: 0, max: 100 });
  const PREP = field(locale, q.v.prep, { min: 0, max: 300 });
  const POST = field(locale, q.v.post, { min: 0, max: 300 });
  const RATE = field(locale, q.v.rate, { min: 0, max: 50_000 });

  const SETUP = field(locale, q.v.setup, { min: 0, max: 50_000 });
  const MINFEE = field(locale, q.v.minfee, { min: 0, max: 100_000 });
  const MODH = field(locale, q.v.modh, { min: 0, max: 100 });
  const MODRATE = field(locale, q.v.modrate, { min: 0, max: 50_000 });

  const NOZRATE = field(locale, q.v.nozrate, { min: 0, max: 1000 });
  const MARK = field(locale, q.v.mark, { min: 0, max: 1000 });

  const totalDecimalHours = (TH.value ?? 0) + (TM.value ?? 0) / 60;

  // Run calculation engine
  const calc = calculatePrint3d({
    weightG: W.value ?? 100,
    printHours: totalDecimalHours,
    quantity: Q.value ?? 1,
    platesCount: 1,
    spoolPriceKg: SP.value ?? 7500,
    supportsType: (q.v.sup as SupportsType) || "none",
    customSupportsWeightG: SUPW.value ?? undefined,
    hasBrim: q.v.brim === "1",
    printerId: selectedPrinter.id,
    printerPurchasePriceKzt: PPRICE.value ?? undefined,
    hasAmsCombo: q.v.ams === "1",
    amsPurchasePriceKzt: AMSPRICE.value ?? undefined,
    printerLifespanHours: LIFE.value ?? 5000,
    customWatts: q.v.pwatts ? (PWATTS.value ?? undefined) : undefined,
    materialId: selectedMaterial.id,
    citySlug: selectedCity.slug,
    isCommercialTariff: isCommercial,
    customTariffKwh: q.v.tar ? (TAR.value ?? undefined) : undefined,
    nozzleId: selectedNozzle.id,
    customNozzleWearPerHour: NOZRATE.value ?? undefined,
    maintenancePerHour: MAINT.value ?? 20,
    prepMinutes: PREP.value ?? 10,
    postProcessMinutes: POST.value ?? 5,
    hourlyRate: RATE.value ?? 2500,
    setupFeeKzt: SETUP.value ?? 500,
    minOrderFeeKzt: MINFEE.value ?? 2000,
    modelingHours: MODH.value ?? 0,
    modelingHourlyRate: MODRATE.value ?? 5000,
    packagingId: "none",
    pricingMode: q.v.pm === "market" ? "market_rate" : "cost_plus",
    marketRatePerGram: MRATE.value ?? 35,
    markupPct: MARK.value ?? 40,
    taxRegime: q.v.tax as TaxRegimeId,
    isMultiColor: false,
    colorCount: 1,
    multiColorPurgeG: 0,
    purgeWastePct: 0,
    failureRatePct: FAIL.value ?? 5,
  });

  const isBatch = calc.quantity > 1;

  // Copy just the final price with tenge
  const handleCopyPrice = () => {
    const formattedPrice = fmtMoney(locale, isBatch ? calc.batchPrice : calc.unitPrice, "KZT", 0);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(formattedPrice);
      setCopiedQuote(true);
      setTimeout(() => setCopiedQuote(false), 2000);
    }
  };

  const handleShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(q.shareUrl());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <Stack className="relative">
      {/* ── Main Layout: Modern Fintech/Logistics 2-Column Grid ── */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-8">
        {/* ═════════ LEFT COLUMN: Tactile Monochrome Input Cards ═════════ */}
        <div className="flex flex-col gap-5">
          {/* 1. Printer Selector Card */}
          <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  <Printer className="size-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {t.printer}
                </span>
              </div>
            </div>

            {/* Brand Switcher Header + Carousel with Navigation Arrows */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {locale === "ru" ? "Бренд принтера" : "Printer Brand"}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollBrands(-1)}
                    aria-label="Previous brands"
                    className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 shadow-xs hover:bg-neutral-100 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollBrands(1)}
                    aria-label="Next brands"
                    className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 shadow-xs hover:bg-neutral-100 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Brand Switcher Carousel (Tactile, large, mobile-friendly) */}
              <div
                ref={brandScrollRef}
                className="flex items-center gap-2 overflow-x-auto pb-1 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {(
                  [
                    { id: "bambu", label: "Bambu Lab" },
                    { id: "creality", label: "Creality" },
                    { id: "anycubic", label: "Anycubic" },
                    { id: "elegoo", label: "Elegoo" },
                    { id: "qidi", label: "QIDI" },
                    { id: "flashforge", label: "Flashforge" },
                    { id: "flyingbear", label: "Flying Bear" },
                    { id: "kingroon", label: "Kingroon" },
                    { id: "artillery", label: "Artillery" },
                    { id: "twotrees", label: "Two Trees" },
                    { id: "snapmaker", label: "Snapmaker" },
                    { id: "raise3d", label: "Raise3D" },
                    { id: "custom", label: locale === "ru" ? "Свой" : "Custom" },
                  ] as const
                ).map((b) => {
                  const currentBrand = PRINTER_PROFILES[q.v.pr as PrinterId]?.brand ?? (q.v.brand === "all" ? "bambu" : q.v.brand);
                  const isActive = currentBrand === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        const firstOfBrand = Object.values(PRINTER_PROFILES).find((p) => p.brand === b.id);
                        q.set({ brand: b.id, pr: firstOfBrand ? firstOfBrand.id : q.v.pr, pwatts: "" });
                      }}
                      className={cn(
                        "h-11 shrink-0 rounded-xl px-4 text-sm font-bold transition whitespace-nowrap active:scale-95 border",
                        isActive
                          ? "bg-neutral-950 text-white border-neutral-950 shadow-sm dark:bg-white dark:text-neutral-950 dark:border-white"
                          : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-700",
                      )}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Printer Dropdown & Specs bar */}
            <div className="flex flex-col gap-2 pt-1">
              <label htmlFor={`${id}-printer`} className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {locale === "ru" ? "Модель принтера" : "Printer Model"}
              </label>
              <Select
                id={`${id}-printer`}
                value={q.v.pr}
                size="lg"
                selectClassName="font-bold text-base cursor-pointer"
                onChange={(e) => {
                  const target = PRINTER_PROFILES[e.target.value as PrinterId];
                  q.set({ pr: e.target.value, brand: target ? target.brand : q.v.brand, pwatts: "" });
                }}
              >
                {Object.values(PRINTER_PROFILES)
                  .filter((p) => {
                    const currentBrand = PRINTER_PROFILES[q.v.pr as PrinterId]?.brand ?? (q.v.brand === "all" ? "bambu" : q.v.brand);
                    return p.brand === currentBrand;
                  })
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </Select>
            </div>
          </div>

          {/* 3. Material & Kazakhstan Location Card */}
          <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  <Layers className="size-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {t.material}
                </span>
              </div>
            </div>

            {/* Material Pills (Large, tactile, easy to tap on mobile) */}
            <div className="flex flex-wrap gap-2">
              {Object.values(MATERIAL_PROFILES).map((m) => {
                const isSelected = m.id === selectedMaterial.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      const defaultRate = m.id === "pacf" ? "60" : m.id === "tpu" ? "50" : m.id === "abs" ? "40" : "35";
                      q.set({
                        mat: m.id,
                        sp: toInput(locale, m.defaultPriceKg),
                        pwatts: "",
                        mrate: defaultRate,
                      });
                    }}
                    className={cn(
                      "h-11 flex items-center gap-2 rounded-xl px-4 text-sm font-bold transition active:scale-95 border",
                      isSelected
                        ? "bg-neutral-950 text-white border-neutral-950 shadow-sm dark:bg-white dark:text-neutral-950 dark:border-white"
                        : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-700",
                    )}
                  >
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Spool Price Direct Input */}
            <div className="flex items-center justify-between pt-1">
              <label htmlFor={`${id}-sp`} className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {t.spoolPrice}
              </label>
              <div className="relative w-44">
                <Input
                  id={`${id}-sp`}
                  value={q.v.sp}
                  onChange={(e) => q.set({ sp: e.target.value })}
                  inputMode="numeric"
                  className="h-12 rounded-xl pr-8 text-right text-base font-bold tabular-nums border-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-white"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
                  ₸
                </span>
              </div>
            </div>

            <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

            {/* City & Electricity Tariff in Kazakhstan */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-neutral-600 dark:text-neutral-400" />
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{t.city}</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select
                  id={`${id}-city`}
                  value={q.v.city}
                  size="lg"
                  selectClassName="font-bold text-sm cursor-pointer"
                  onChange={(e) => q.set({ city: e.target.value, tar: "" })}
                >
                  {KZ_CITIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name[locale]} ({c.residentialTariff.toFixed(1)} ₸/кВт⋅ч)
                    </option>
                  ))}
                </Select>

                {/* Tariff Type Toggle */}
                <div className="flex h-12 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
                  <button
                    type="button"
                    onClick={() => q.set({ comm: "0", tar: "" })}
                    className={cn(
                      "flex-1 rounded-lg text-xs font-bold transition flex items-center justify-center",
                      !isCommercial
                        ? "bg-white text-neutral-950 shadow-xs dark:bg-neutral-900 dark:text-white"
                        : "text-neutral-600 dark:text-neutral-400",
                    )}
                  >
                    {t.residential}
                  </button>
                  <button
                    type="button"
                    onClick={() => q.set({ comm: "1", tar: "" })}
                    className={cn(
                      "flex-1 rounded-lg text-xs font-bold transition flex items-center justify-center",
                      isCommercial
                        ? "bg-white text-neutral-950 shadow-xs dark:bg-neutral-900 dark:text-white"
                        : "text-neutral-600 dark:text-neutral-400",
                    )}
                  >
                    {t.commercial}
                  </button>
                </div>
              </div>

              {/* Exact Electricity Tariff Input */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  {t.customTariff} (по счётчику):
                </span>
                <div className="relative w-36">
                  <Input
                    value={currentTariffText}
                    onChange={(e) => q.set({ tar: e.target.value })}
                    inputMode="decimal"
                    placeholder={defaultTariff.toFixed(2)}
                    className="h-11 rounded-xl pr-14 text-right font-bold tabular-nums text-sm border-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-white"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                    ₸/кВт⋅ч
                  </span>
                </div>
              </div>

              {/* Multi-rate tariff hint */}
              <div className="rounded-xl bg-neutral-50 p-2.5 text-[11px] text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-700/50">
                {t.multiTierTariffHint}
              </div>

              {/* Printer Power Consumption Direct Input */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {t.printerWatts}:
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {t.printerWattsHint} ({selectedPrinter.shortName}: {defaultPrinterWatts} {locale === "ru" ? "Вт" : "W"})
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="relative w-36">
                    <Input
                      value={currentWattsText}
                      onChange={(e) => q.set({ pwatts: e.target.value })}
                      inputMode="numeric"
                      placeholder={String(defaultPrinterWatts)}
                      className="h-11 rounded-xl pr-10 text-right font-bold tabular-nums text-sm border-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-white"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      {locale === "ru" ? "Вт" : "W"}
                    </span>
                  </div>
                  {q.v.pwatts && q.v.pwatts !== String(defaultPrinterWatts) && (
                    <button
                      type="button"
                      onClick={() => q.set({ pwatts: "" })}
                      className="text-[10px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
                    >
                      {locale === "ru" ? `Сбросить (${defaultPrinterWatts} Вт)` : `Reset (${defaultPrinterWatts} W)`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Print Specifications: Weight, Time, Supports */}
          <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                <Scale className="size-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {locale === "ru" ? "Параметры печати" : "Print Specifications"}
              </span>
            </div>

            {/* Part Weight */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor={`${id}-w`} className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  {t.weight}
                </label>
                <div className="relative w-36">
                  <Input
                    id={`${id}-w`}
                    value={q.v.w}
                    onChange={(e) => q.set({ w: e.target.value })}
                    inputMode="decimal"
                    className="h-12 rounded-xl pr-8 text-right text-base font-bold tabular-nums border-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-white"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
                    г
                  </span>
                </div>
              </div>

              <GraphiteSlider
                min={5}
                max={5000}
                step={5}
                value={Math.min(5000, Math.max(5, W.value ?? 100))}
                onChange={(e) => q.set({ w: e.target.value })}
              />
            </div>

            {/* Print Time Inputs & Slider */}
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{t.printTime}</span>
                <div className="flex items-center gap-2">
                  <div className="relative w-24">
                    <Input
                      id={`${id}-th`}
                      value={q.v.th}
                      onChange={(e) => q.set({ th: e.target.value })}
                      inputMode="numeric"
                      className="h-12 rounded-xl pr-7 text-right text-base font-bold tabular-nums border-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-white"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      {t.hours}
                    </span>
                  </div>
                  <div className="relative w-24">
                    <Input
                      id={`${id}-tm`}
                      value={q.v.tm}
                      onChange={(e) => q.set({ tm: e.target.value })}
                      inputMode="numeric"
                      className="h-12 rounded-xl pr-8 text-right text-base font-bold tabular-nums border-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-white"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      {t.minutes}
                    </span>
                  </div>
                </div>
              </div>

              <GraphiteSlider
                min={0.5}
                max={48}
                step={0.5}
                value={Math.min(48, Math.max(0.5, (TH.value ?? 4) + (TM.value ?? 0) / 60))}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const h = Math.floor(val);
                  const m = Math.round((val - h) * 60);
                  q.set({ th: String(h), tm: String(m) });
                }}
              />
            </div>

            {/* Supports & Brim Settings */}
            <div className="flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-4 dark:border-neutral-800/80 dark:bg-neutral-800/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {t.supportsTitle}
                </span>
                <span className="text-xs font-semibold text-neutral-500">
                  {SUPPORTS_OPTIONS[q.v.sup as SupportsType]?.name[locale] ?? "Без поддержек"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(SUPPORTS_OPTIONS).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => q.set({ sup: opt.id })}
                    className={cn(
                      "h-10 rounded-xl px-3.5 text-xs font-bold transition active:scale-95 border",
                      q.v.sup === opt.id
                        ? "bg-neutral-950 text-white border-neutral-950 dark:bg-white dark:text-neutral-950 dark:border-white"
                        : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-700",
                    )}
                  >
                    {opt.name[locale]}
                  </button>
                ))}
              </div>
              {q.v.sup === "custom" && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{t.customSupportsWeight}</span>
                  <div className="relative w-32">
                    <Input
                      value={q.v.supw}
                      onChange={(e) => q.set({ supw: e.target.value })}
                      inputMode="decimal"
                      className="h-11 rounded-xl pr-7 text-right text-sm font-bold tabular-nums border-2 border-neutral-300 dark:border-neutral-700"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      г
                    </span>
                  </div>
                </div>
              )}

              {/* Brim Checkbox */}
              <label className="flex cursor-pointer items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                <div className="flex flex-col">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    {t.brimCheck}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {calc.brimWeightG > 0 ? `+${calc.brimWeightG} г к весу детали` : "Без каймы"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={q.v.brim === "1"}
                  onChange={(e) => q.set({ brim: e.target.checked ? "1" : "0" })}
                  className="size-5 rounded-md accent-neutral-950 dark:accent-neutral-100 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* 5. Batch & Profit Margin */}
          <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  <Package className="size-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {locale === "ru" ? "Тираж и прибыль" : "Batch & Margin"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {calc.quantity > 1 && (
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-900 dark:bg-neutral-800 dark:text-white">
                    {calc.quantity} шт.
                  </span>
                )}
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  {q.v.pm === "market"
                    ? `${MRATE.value ?? 35} ₸/г по рынку`
                    : `+${MARK.value ?? 40}% наценка`}
                </span>
              </div>
            </div>

            {/* Quantity Stepper (Generous touch size: 48px buttons) */}
            <div className="flex items-center justify-between rounded-2xl bg-neutral-50/80 p-4 dark:bg-neutral-800/40">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{t.quantity}</span>
                <span className="text-xs text-neutral-400">
                  {locale === "ru" ? "Количество деталей в заказе" : "Number of items in the batch"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => q.set({ q: String(Math.max(1, (Q.value ?? 1) - 1)) })}
                  aria-label="Decrease quantity"
                  className="flex size-12 items-center justify-center rounded-xl border-2 border-neutral-300 bg-white text-neutral-900 shadow-xs hover:bg-neutral-100 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white cursor-pointer"
                >
                  <Minus className="size-4.5" />
                </button>
                <Input
                  value={q.v.q}
                  onChange={(e) => q.set({ q: e.target.value })}
                  inputMode="numeric"
                  className="h-12 w-20 rounded-xl border-2 border-neutral-300 text-center font-black text-lg tabular-nums dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-white"
                />
                <button
                  type="button"
                  onClick={() => q.set({ q: String((Q.value ?? 1) + 1) })}
                  aria-label="Increase quantity"
                  className="flex size-12 items-center justify-center rounded-xl border-2 border-neutral-300 bg-white text-neutral-900 shadow-xs hover:bg-neutral-100 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white cursor-pointer"
                >
                  <Plus className="size-4.5" />
                </button>
              </div>
            </div>

            {/* Pricing Model Switcher */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {t.pricingMode}
              </span>
              <div className="flex h-12 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
                <button
                  type="button"
                  onClick={() => q.set({ pm: "cost" })}
                  className={cn(
                    "flex-1 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer",
                    q.v.pm !== "market"
                      ? "bg-white text-neutral-950 shadow-xs dark:bg-neutral-900 dark:text-white"
                      : "text-neutral-600 dark:text-neutral-400",
                  )}
                >
                  {t.pricingByCost}
                </button>
                <button
                  type="button"
                  onClick={() => q.set({ pm: "market" })}
                  className={cn(
                    "flex-1 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer",
                    q.v.pm === "market"
                      ? "bg-white text-neutral-950 shadow-xs dark:bg-neutral-900 dark:text-white"
                      : "text-neutral-600 dark:text-neutral-400",
                  )}
                >
                  {t.pricingByMarket}
                </button>
              </div>
            </div>

            {q.v.pm === "market" ? (
              /* Market Rate per Gram Section */
              <div className="flex flex-col gap-3 rounded-2xl bg-neutral-50/80 p-4 dark:bg-neutral-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      {t.marketRateLabel}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {t.marketRateHint}
                    </span>
                  </div>
                  <div className="relative w-32">
                    <Input
                      value={q.v.mrate}
                      onChange={(e) => q.set({ mrate: e.target.value })}
                      inputMode="numeric"
                      className="h-11 rounded-xl pr-12 text-right font-bold text-sm tabular-nums border-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-white"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      ₸ / г
                    </span>
                  </div>
                </div>

                <GraphiteSlider
                  min={20}
                  max={70}
                  step={1}
                  value={Math.min(70, Math.max(20, MRATE.value ?? 35))}
                  onChange={(e) => q.set({ mrate: e.target.value })}
                />

                {/* Quick preset chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { rate: 30, label: "30 ₸/г" },
                    { rate: 35, label: "35 ₸/г (стандарт)" },
                    { rate: 40, label: "40 ₸/г" },
                    { rate: 50, label: "50 ₸/г (инженерный)" },
                  ].map((chip) => (
                    <button
                      key={chip.rate}
                      type="button"
                      onClick={() => q.set({ mrate: String(chip.rate) })}
                      className={cn(
                        "h-8 rounded-lg px-2.5 text-xs font-bold transition active:scale-95 border cursor-pointer",
                        (MRATE.value ?? 35) === chip.rate
                          ? "bg-neutral-950 text-white border-neutral-950 dark:bg-white dark:text-neutral-950 dark:border-white"
                          : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-neutral-700",
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Interactive Profit Markup Slider */
              <div className="flex flex-col gap-3 rounded-2xl bg-neutral-50/80 p-4 dark:bg-neutral-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      {locale === "ru" ? "Наценка / желаемая прибыль" : "Profit Markup"}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {locale === "ru" ? "По умолчанию 40% (стандарт в КЗ)" : "Default 40%"}
                    </span>
                  </div>
                  <div className="relative w-28">
                    <Input
                      value={q.v.mark}
                      onChange={(e) => q.set({ mark: e.target.value })}
                      inputMode="numeric"
                      className="h-11 rounded-xl pr-7 text-right font-bold text-sm tabular-nums border-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-white"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      %
                    </span>
                  </div>
                </div>

                <GraphiteSlider
                  min={0}
                  max={200}
                  step={5}
                  value={Math.min(200, Math.max(0, MARK.value ?? 40))}
                  onChange={(e) => q.set({ mark: e.target.value })}
                />

                <div className="flex justify-between text-xs text-neutral-400 font-medium">
                  <span>0% (себестоимость)</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">40% (норма)</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              </div>
            )}
          </div>

          {/* 7. Advanced Settings Accordion */}
          <div className="flex flex-col rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex items-center justify-between gap-2 text-left"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  <Settings2 className="size-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                  {t.advanced}
                </span>
              </div>
              <ChevronDown className={cn("size-4 text-neutral-500 transition-transform", isAdvancedOpen && "rotate-180")} />
            </button>

            {isAdvancedOpen && (
              <div className="flex flex-col gap-5 pt-5">
                {/* Machine Depreciation & AMS Customization */}
                <div className="flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-4 dark:border-neutral-800/80 dark:bg-neutral-800/40">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{t.depTitle}</span>
                      <span className="text-[11px] text-neutral-500">
                        {selectedPrinter.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-neutral-900 dark:text-white">
                      {calc.printerHourlyDepreciation.toFixed(0)} ₸ / час
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                        {t.printerPrice}
                      </label>
                      <Input
                        value={q.v.pprice}
                        placeholder={String(selectedPrinter.priceKzt)}
                        onChange={(e) => q.set({ pprice: e.target.value })}
                        inputMode="numeric"
                        className="mt-1 h-9 rounded-xl font-bold tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                        {t.lifespan}
                      </label>
                      <Input
                        value={q.v.life}
                        onChange={(e) => q.set({ life: e.target.value })}
                        inputMode="numeric"
                        className="mt-1 h-9 rounded-xl font-bold tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-2 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                          {t.maintReserve}
                        </label>
                        <span className="text-[10px] text-neutral-400">₸ / час</span>
                      </div>
                      <Input
                        value={q.v.maint}
                        placeholder="20"
                        onChange={(e) => q.set({ maint: e.target.value })}
                        inputMode="numeric"
                        className="mt-1 h-9 rounded-xl font-bold tabular-nums"
                      />
                      <span className="text-[10px] text-neutral-400">{t.maintReserveHint}</span>
                    </div>
                  </div>
                </div>

                {/* Workshop Terms: Min Order Fee, Setup Fee, 3D CAD Modeling */}
                <div className="flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-4 dark:border-neutral-800/80 dark:bg-neutral-800/40">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    {t.workshopTerms}
                  </span>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                        {t.minOrderFee}
                      </label>
                      <Input
                        value={q.v.minfee}
                        onChange={(e) => q.set({ minfee: e.target.value })}
                        inputMode="numeric"
                        placeholder="2000"
                        className="mt-1 h-9 rounded-xl font-bold tabular-nums"
                      />
                      <span className="text-[10px] text-neutral-400">Итоговая сумма не будет ниже порога</span>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                        {t.setupFee}
                      </label>
                      <Input
                        value={q.v.setup}
                        onChange={(e) => q.set({ setup: e.target.value })}
                        inputMode="numeric"
                        placeholder="500"
                        className="mt-1 h-9 rounded-xl font-bold tabular-nums"
                      />
                      <span className="text-[10px] text-neutral-400">За каждый стол (калибровка, старт)</span>
                    </div>
                  </div>

                  {/* 3D Modeling Section */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        {t.modelingTitle}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {calc.modelingFeeTotal > 0 ? `+${fmtMoney(locale, calc.modelingFeeTotal)}` : "Не требуется"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">{t.modelingHours}</label>
                        <Input
                          value={q.v.modh}
                          onChange={(e) => q.set({ modh: e.target.value })}
                          inputMode="decimal"
                          placeholder="0"
                          className="mt-1 h-9 rounded-xl font-bold tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">{t.modelingRate}</label>
                        <Input
                          value={q.v.modrate}
                          onChange={(e) => q.set({ modrate: e.target.value })}
                          inputMode="numeric"
                          placeholder="5000"
                          className="mt-1 h-9 rounded-xl font-bold tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nozzle: Preset + Custom wear rate */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{t.nozzle}</label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-neutral-500">{t.nozzleCustomRate}</span>
                      <div className="relative w-20">
                        <Input
                          value={q.v.nozrate}
                          placeholder={String(selectedMaterial.abrasive ? selectedNozzle.wearPerHourAbrasive : selectedNozzle.wearPerHour)}
                          onChange={(e) => q.set({ nozrate: e.target.value })}
                          inputMode="numeric"
                          className="h-8 rounded-lg pr-5 text-right font-bold text-xs tabular-nums"
                        />
                        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">₸</span>
                      </div>
                    </div>
                  </div>
                  <Select
                    value={q.v.noz}
                    selectClassName="font-medium cursor-pointer"
                    onChange={(e) => q.set({ noz: e.target.value })}
                  >
                    {Object.values(NOZZLE_PROFILES).map((nz) => (
                      <option key={nz.id} value={nz.id}>
                        {nz.name[locale]} ({nz.wearPerHour} ₸/ч)
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Labor Rates */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{t.postTime}</label>
                    <Input
                      value={q.v.post}
                      onChange={(e) => q.set({ post: e.target.value })}
                      inputMode="numeric"
                      className="h-10 rounded-xl font-bold tabular-nums"
                    />
                    <span className="text-[10px] text-neutral-400">мин на деталь</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{t.hourlyRate}</label>
                    <Input
                      value={q.v.rate}
                      onChange={(e) => q.set({ rate: e.target.value })}
                      inputMode="numeric"
                      className="h-10 rounded-xl font-bold tabular-nums"
                    />
                    <span className="text-[10px] text-neutral-400">₸ / час</span>
                  </div>
                </div>

                {/* Tax Regime */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{t.taxRegime}</label>
                  <Select
                    value={q.v.tax}
                    selectClassName="font-medium cursor-pointer"
                    onChange={(e) => q.set({ tax: e.target.value })}
                  >
                    {Object.values(TAX_REGIMES).map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.name[locale]}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Reset Button */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400">{t.savedHint}</span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>{t.reset}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═════════ RIGHT COLUMN: Obsidian Hero Card & Cost Structure ═════════ */}
        <div className="flex flex-col gap-5">
          {/* Obsidian Hero Card */}
          <div ref={priceCardRef} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-6 text-white shadow-xl dark:border dark:border-neutral-800 sm:p-7">
            {/* Background Texture Accents */}
            <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-white/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 size-48 rounded-full bg-white/5 blur-3xl" />

            <div className="relative flex flex-col gap-6">
              {/* Header inside Hero */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  {isBatch ? t.batchPrice : t.recommendedPrice}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShareLink}
                    aria-label={t.share}
                    className="flex size-8 items-center justify-center rounded-full bg-neutral-800/80 text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
                  >
                    {copiedLink ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    aria-label={t.reset}
                    className="flex size-8 items-center justify-center rounded-full bg-neutral-800/80 text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Price Headline */}
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-4xl font-black tracking-tight text-white sm:text-5xl">
                    {fmtMoney(locale, isBatch ? calc.batchPrice : calc.unitPrice, "KZT", 0)}
                  </span>
                  {isBatch && (
                    <span className="text-sm font-semibold text-neutral-400">
                      ({fmtMoney(locale, calc.unitPrice, "KZT", 0)} / шт.)
                    </span>
                  )}
                </div>

                {/* Minimum Order Threshold Notice */}
                {calc.isMinOrderApplied && (
                  <div className="mt-1 flex items-center gap-1.5 rounded-full bg-neutral-800 px-3 py-1 text-xs font-bold text-amber-300 w-fit">
                    <span>⚠️ {t.minOrderBadge} ({fmtMoney(locale, calc.minOrderFeeKzt)})</span>
                  </div>
                )}
              </div>

              {/* Kazakhstan Market Reference Benchmark */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xs flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {t.marketBenchmarkTitle}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase",
                      calc.marketComparison === "below"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : calc.marketComparison === "market"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30",
                    )}
                  >
                    {calc.marketComparison === "below"
                      ? t.marketStatusBelow
                      : calc.marketComparison === "market"
                      ? t.marketStatusMarket
                      : t.marketStatusAbove}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-base font-bold text-neutral-200">
                    {fmtMoney(locale, calc.marketRefMin, "KZT", 0)} – {fmtMoney(locale, calc.marketRefMax, "KZT", 0)}
                  </span>
                  <span className="text-xs text-neutral-400">
                    ({calc.marketRefMinRate}–{calc.marketRefMaxRate} ₸ / г)
                  </span>
                </div>
                {calc.marketComparison === "below" && q.v.pm !== "market" && (
                  <button
                    type="button"
                    onClick={() => q.set({ pm: "market", mrate: String(calc.marketRefMinRate) })}
                    className="mt-1 text-left text-xs font-semibold text-amber-300 hover:text-amber-200 underline decoration-amber-400/50 underline-offset-2 transition cursor-pointer"
                  >
                    {locale === "ru"
                      ? `💡 Применить рыночную ставку (${calc.marketRefMinRate} ₸/г)`
                      : `💡 Apply market rate (${calc.marketRefMinRate} KZT/g)`}
                  </button>
                )}
              </div>

              {/* Net Cost & Profit Pills */}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-white/5 p-3.5 backdrop-blur-xs">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-neutral-400">{t.netCost}</span>
                  <span className="font-mono text-base font-bold text-neutral-200">
                    {fmtMoney(locale, isBatch ? calc.batchNetCost : calc.unitNetCost, "KZT", 0)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-neutral-400">{t.profit}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-base font-bold text-white">
                      +{fmtMoney(locale, isBatch ? calc.batchProfit : calc.unitProfit, "KZT", 0)}
                    </span>
                    <span className="text-xs font-bold text-neutral-400">
                      ({calc.marginPct.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Unit Metrics Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800 pt-3 text-xs text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <Scale className="size-3.5" />
                  <span>
                    {calc.pricePerGram.toFixed(1)} ₸ / г
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Timer className="size-3.5" />
                  <span>
                    {calc.pricePerHour.toFixed(0)} ₸ / ч
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="size-3.5" />
                  <span>
                    {(calc.batchElectricityKwh).toFixed(2)} кВт⋅ч
                  </span>
                </div>
              </div>

              {/* Primary Action Button: Copy Price (копируется просто цена с TENGE) */}
              <button
                type="button"
                onClick={handleCopyPrice}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white py-4 text-base font-black text-neutral-950 transition active:scale-98 hover:bg-neutral-100 shadow-md cursor-pointer border border-neutral-950 dark:border-white"
              >
                {copiedQuote ? <Check className="size-5 text-emerald-600" /> : <Copy className="size-5" />}
                <span>
                  {copiedQuote
                    ? (locale === "ru" ? "Скопировано!" : "Copied!")
                    : `${locale === "ru" ? "Скопировать" : "Copy"} ${fmtMoney(locale, isBatch ? calc.batchPrice : calc.unitPrice, "KZT", 0)}`}
                </span>
              </button>
            </div>
          </div>

          {/* ── Cost Structure Card (Vertical Capsule Bars matching reference screenshot) ── */}
          {(() => {
            const plasticCost = calc.materialCost + calc.failureCost;
            const lightCost = calc.electricityCost;
            const machineCost = calc.depreciationCost + calc.wearConsumablesCost + calc.maintenanceCost;
            const laborCost = calc.physicalLaborCost + (calc.setupFeeTotal / calc.quantity) + (calc.modelingFeeTotal / calc.quantity) + calc.packagingCost;
            const marginCost = calc.unitProfit + calc.unitTax;

            const safeTotal = calc.unitPrice > 0 ? calc.unitPrice : 1;
            const rawPlastic = (plasticCost / safeTotal) * 100;
            const rawLight = (lightCost / safeTotal) * 100;
            const rawMachine = (machineCost / safeTotal) * 100;
            const rawLabor = (laborCost / safeTotal) * 100;

            const pPlastic = Math.round(rawPlastic);
            const pLight = Math.round(rawLight);
            const pMachine = Math.round(rawMachine);
            const pLabor = Math.round(rawLabor);
            const pMargin = Math.max(0, 100 - (pPlastic + pLight + pMachine + pLabor));

            const pillars = [
              {
                id: "plastic",
                name: locale === "ru" ? "Пластик" : "Plastic",
                pct: pPlastic,
                cost: isBatch ? plasticCost * calc.quantity : plasticCost,
              },
              {
                id: "light",
                name: locale === "ru" ? "Свет" : "Power",
                pct: pLight,
                cost: isBatch ? lightCost * calc.quantity : lightCost,
              },
              {
                id: "machine",
                name: locale === "ru" ? "Станок" : "Machine",
                pct: pMachine,
                cost: isBatch ? machineCost * calc.quantity : machineCost,
              },
              {
                id: "labor",
                name: locale === "ru" ? "Работа" : "Labor",
                pct: pLabor,
                cost: isBatch ? laborCost * calc.quantity : laborCost,
              },
              {
                id: "margin",
                name: locale === "ru" ? "Маржа" : "Margin",
                pct: pMargin,
                cost: isBatch ? marginCost * calc.quantity : marginCost,
              },
            ];

            return (
              <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
                {/* Header: Icon + Title + 100% Pill */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                      <BarChart3 className="size-4.5" />
                    </div>
                    <span className="text-base font-bold text-neutral-950 dark:text-white">
                      {locale === "ru" ? "Структура расходов" : "Cost Breakdown"}
                    </span>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-3.5 py-1 text-xs font-bold text-neutral-900 dark:bg-neutral-800 dark:text-white">
                    100%
                  </span>
                </div>

                {/* 5 Vertical Capsule Bars matching the reference visual */}
                <div className="grid grid-cols-5 items-end gap-2 pt-6 pb-2 sm:gap-4">
                  {pillars.map((p) => {
                    const minH = 18;
                    const maxH = 86;
                    const barHeight = Math.max(
                      minH,
                      Math.min(maxH, Math.round(minH + (p.pct / 100) * (maxH - minH) * 1.5))
                    );

                    return (
                      <div key={p.id} className="flex flex-col items-center justify-end gap-2.5">
                        {/* Percentage on top */}
                        <span className="text-xs font-bold tabular-nums text-neutral-900 dark:text-white sm:text-sm">
                          {p.pct}%
                        </span>

                        {/* Solid Rounded Capsule */}
                        <div
                          style={{ height: `${barHeight}px` }}
                          className="w-10 sm:w-12 rounded-full bg-neutral-950 transition-all duration-300 dark:bg-white"
                          title={`${p.name}: ${p.pct}% (${fmtMoney(locale, p.cost)})`}
                        />

                        {/* Label on bottom */}
                        <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-center tracking-tight truncate w-full">
                          {p.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Breakdown Rows (Clean typography, no dots) */}
                <div className="flex flex-col gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {locale === "ru" ? "Пластик" : "Material"} ({calc.effectiveWeightG.toFixed(0)} г)
                    </span>
                    <span className="font-mono font-bold text-neutral-950 dark:text-white">
                      {fmtMoney(locale, isBatch ? plasticCost * calc.quantity : plasticCost)}
                    </span>
                  </div>

                  {calc.supportsCost > 0 && (
                    <div className="flex items-center justify-between text-xs pl-3 text-neutral-500">
                      <span>↳ {t.supportsCost} ({calc.supportsWeightG.toFixed(0)} г)</span>
                      <span className="font-mono font-medium">
                        {fmtMoney(locale, isBatch ? calc.supportsCost * calc.quantity : calc.supportsCost)}
                      </span>
                    </div>
                  )}

                  {calc.brimCost > 0 && (
                    <div className="flex items-center justify-between text-xs pl-3 text-neutral-500">
                      <span>↳ {t.brimCost} ({calc.brimWeightG} г)</span>
                      <span className="font-mono font-medium">
                        {fmtMoney(locale, isBatch ? calc.brimCost * calc.quantity : calc.brimCost)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {locale === "ru" ? "Свет" : "Power"} ({calc.effectiveTariffKwh.toFixed(1)} ₸/кВт⋅ч)
                    </span>
                    <span className="font-mono font-bold text-neutral-950 dark:text-white">
                      {fmtMoney(locale, isBatch ? lightCost * calc.quantity : lightCost)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {locale === "ru" ? "Станок (амортизация + сопло)" : "Machine"}
                    </span>
                    <span className="font-mono font-bold text-neutral-950 dark:text-white">
                      {fmtMoney(locale, isBatch ? machineCost * calc.quantity : machineCost)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {locale === "ru" ? "Работа мастера" : "Labor"}
                    </span>
                    <span className="font-mono font-bold text-neutral-950 dark:text-white">
                      {fmtMoney(locale, isBatch ? laborCost * calc.quantity : laborCost)}
                    </span>
                  </div>

                  {calc.unitTax > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {t.taxCost}
                      </span>
                      <span className="font-mono font-bold text-neutral-950 dark:text-white">
                        {fmtMoney(locale, isBatch ? calc.batchTax : calc.unitTax)}
                      </span>
                    </div>
                  )}

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                  <div className="flex items-center justify-between text-xs font-bold text-neutral-950 dark:text-white">
                    <span>{locale === "ru" ? "Маржа (чистая прибыль)" : "Margin (net profit)"} ({calc.marginPct.toFixed(0)}%)</span>
                    <span className="font-mono">
                      +{fmtMoney(locale, isBatch ? calc.batchProfit : calc.unitProfit)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Reference Data Tables ── */}
      <SubHeading>{t.cityTariffsTable}</SubHeading>
      <DataTable
        caption={t.cityTariffsTable}
        head={[t.colCity, t.colResTariff, t.colCommTariff, t.colUtility]}
        rows={KZ_CITIES.map((c) => [
          c.name[locale],
          `${c.residentialTariff.toFixed(2)} ₸`,
          `${c.commercialTariff.toFixed(2)} ₸`,
          c.utility,
        ])}
      />

      <SubHeading>{t.printerPowerTable}</SubHeading>
      <DataTable
        caption={t.printerPowerTable}
        head={[t.colPrinter, t.colBrand, t.colPla, t.colPetg, t.colAbs, t.colDep]}
        rows={Object.values(PRINTER_PROFILES).map((p) => [
          p.name,
          p.brand.toUpperCase(),
          `${p.powerByMaterial.pla} Вт`,
          `${p.powerByMaterial.petg} Вт`,
          `${p.powerByMaterial.abs} Вт`,
          `${p.depreciationPerHour} ₸/ч`,
        ])}
      />

      <Explain locale={locale} title={t.howToTitle}>
        <p>
          Калькулятор рассчитывает полную коммерческую себестоимость изделия на 3D-принтере, разделяя расходы на
          прямые сырьевые (филамент, поддержки, кайма, продувка сопла), постоянные технологические (электроэнергия и амортизация оборудования) и сервисные (работа оператора, подготовка файла, моделирование, налог).
        </p>
        <p>
          Формула амортизации: <code>(Цена покупки принтера + Модуль AMS) ÷ Срок службы (часов) × Время печати</code>. Это позволяет точно оценить окупаемость парка оборудования без завышения себестоимости.
        </p>
        <p>
          Для предотвращения работы в убыток на мелких деталях (10–20 г) предусмотрен настраиваемый <strong>порог минимального заказа</strong> мастерской и <strong>плата за запуск стола</strong>.
        </p>
      </Explain>

      {/* ── Floating Profit Bar (Sticky Island on mobile/desktop until user reaches Recommended Price Card) ── */}
      <div
        className={cn(
          "fixed bottom-4 inset-x-3 z-40 mx-auto max-w-lg transition-all duration-300 pointer-events-none sm:bottom-6",
          !isPriceCardVisible
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-12 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-700/80 bg-neutral-950/95 p-3.5 shadow-2xl backdrop-blur-md text-white sm:px-5 sm:py-4">
          {/* Left: Price and Net Profit */}
          <div
            onClick={() => priceCardRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="flex min-w-0 cursor-pointer flex-col"
            title={locale === "ru" ? "Нажмите, чтобы перейти к сметe" : "Click to view full breakdown"}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-lg font-black tracking-tight sm:text-xl text-white">
                {fmtMoney(locale, isBatch ? calc.batchPrice : calc.unitPrice, "KZT", 0)}
              </span>
              {isBatch && (
                <span className="text-xs font-semibold text-neutral-400">
                  ({calc.quantity} шт.)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-400">{t.profit}:</span>
              <span className="font-bold text-white">
                +{fmtMoney(locale, isBatch ? calc.batchProfit : calc.unitProfit, "KZT", 0)}
              </span>
              <span className="rounded-full bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-neutral-300">
                {calc.marginPct.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => priceCardRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="hidden sm:flex items-center gap-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 px-3 py-2 text-xs font-bold text-neutral-200 transition active:scale-95 border border-neutral-700 cursor-pointer"
            >
              <span>{locale === "ru" ? "К сметe" : "View"}</span>
              <ChevronDown className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCopyPrice}
              className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 px-3.5 py-2.5 text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
            >
              {copiedQuote ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              <span>
                {copiedQuote
                  ? (locale === "ru" ? "Скопировано!" : "Copied!")
                  : (locale === "ru" ? "Скопировать" : "Copy")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Stack>
  );
}
