"use client";

import { useEffect, useId, useState } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  Layers,
  MapPin,
  Minus,
  Package,
  Palette,
  Plus,
  Printer,
  RotateCcw,
  Scale,
  Settings2,
  Share2,
  Timer,
  Zap,
} from "lucide-react";
import { BRAND } from "@/config/brand";
import { cn } from "@/lib/cn";
import { Input, Select, Slider } from "@/ui/field";
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

const STORAGE_KEY = "rc_calc_3d_state_v4";

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

  // Parse numeric fields
  const W = field(locale, q.v.w, { min: 0, max: 100_000 });
  const TH = field(locale, q.v.th, { min: 0, max: 1000 });
  const TM = field(locale, q.v.tm, { min: 0, max: 59 });
  const Q = field(locale, q.v.q, { min: 1, max: 50_000, int: true });
  const SP = field(locale, q.v.sp, { min: 0, max: 500_000 });
  const TAR = field(locale, currentTariffText, { min: 0, max: 500 });
  const SUPW = field(locale, q.v.supw, { min: 0, max: 50_000 });

  const PPRICE = field(locale, q.v.pprice, { min: 0, max: 10_000_000 });
  const AMSPRICE = field(locale, q.v.amsprice, { min: 0, max: 5_000_000 });
  const LIFE = field(locale, q.v.life, { min: 100, max: 50_000, int: true });

  const CC = field(locale, q.v.cc, { min: 2, max: 16, int: true });

  const WASTE = field(locale, q.v.waste, { min: 0, max: 5000 });
  const FAIL = field(locale, q.v.fail, { min: 0, max: 100 });
  const PREP = field(locale, q.v.prep, { min: 0, max: 300 });
  const POST = field(locale, q.v.post, { min: 0, max: 300 });
  const RATE = field(locale, q.v.rate, { min: 0, max: 50_000 });

  const SETUP = field(locale, q.v.setup, { min: 0, max: 50_000 });
  const MINFEE = field(locale, q.v.minfee, { min: 0, max: 100_000 });
  const MODH = field(locale, q.v.modh, { min: 0, max: 100 });
  const MODRATE = field(locale, q.v.modrate, { min: 0, max: 50_000 });

  const NOZRATE = field(locale, q.v.nozrate, { min: 0, max: 1000 });
  const PACKCOST = field(locale, q.v.packcost, { min: 0, max: 10_000 });
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
    materialId: selectedMaterial.id,
    citySlug: selectedCity.slug,
    isCommercialTariff: isCommercial,
    customTariffKwh: q.v.tar ? (TAR.value ?? undefined) : undefined,
    nozzleId: selectedNozzle.id,
    customNozzleWearPerHour: NOZRATE.value ?? undefined,
    prepMinutes: PREP.value ?? 10,
    postProcessMinutes: POST.value ?? 5,
    hourlyRate: RATE.value ?? 2500,
    setupFeeKzt: SETUP.value ?? 500,
    minOrderFeeKzt: MINFEE.value ?? 2000,
    modelingHours: MODH.value ?? 0,
    modelingHourlyRate: MODRATE.value ?? 5000,
    packagingId: "none",
    markupPct: MARK.value ?? 40,
    taxRegime: q.v.tax as TaxRegimeId,
    isMultiColor: false,
    colorCount: 1,
    multiColorPurgeG: 0,
    purgeWastePct: 0,
    failureRatePct: FAIL.value ?? 5,
  });

  const isBatch = calc.quantity > 1;

  // Format client quotation for messengers
  const handleCopyQuote = () => {
    const tg = (val: number) => fmtMoney(locale, val, "KZT", 0);
    const text = [
      `📋 Смета 3D-печати (${selectedCity.name.ru})`,
      "----------------------------------------",
      `• Деталь: ${calc.weightG} г · ${calc.printHours.toFixed(1)} ч`,
      calc.supportsWeightG > 0 ? `• Поддержки: +${calc.supportsWeightG.toFixed(0)} г` : "",
      calc.brimWeightG > 0 ? `• Кайма (Brim): +${calc.brimWeightG} г` : "",
      `• Филамент: ${selectedMaterial.name} (${calc.effectiveWeightG.toFixed(0)} г всего)`,
      `• Принтер: ${selectedPrinter.name}`,
      `• Количество: ${calc.quantity} шт.`,
      "----------------------------------------",
      `• Пластик: ${tg(calc.materialCost)}`,
      `• Электроэнергия: ${tg(calc.electricityCost)} (${calc.effectiveTariffKwh.toFixed(1)} ₸/кВт⋅ч)`,
      `• Амортизация: ${tg(calc.depreciationCost)}`,
      `• Расходники и сопло: ${tg(calc.wearConsumablesCost)}`,
      calc.setupFeeTotal > 0 ? `• Запуск стола: ${tg(calc.setupFeeTotal)}` : "",
      calc.modelingFeeTotal > 0 ? `• 3D-моделирование: ${tg(calc.modelingFeeTotal)}` : "",
      `• Работа мастера: ${tg(calc.physicalLaborCost)}`,
      calc.packagingCost > 0 ? `• Упаковка: ${tg(calc.packagingCost * calc.quantity)}` : "",
      calc.unitTax > 0 ? `• Налог: ${tg(calc.batchTax)}` : "",
      "----------------------------------------",
      `${t.netCost}: ${tg(isBatch ? calc.batchNetCost : calc.unitNetCost)}`,
      `⭐ ${isBatch ? t.batchPrice : t.recommendedPrice}: ${tg(isBatch ? calc.batchPrice : calc.unitPrice)}`,
      calc.isMinOrderApplied ? `(Применён минимальный заказ: ${tg(calc.minOrderFeeKzt)})` : "",
      `💰 ${t.profit}: +${tg(isBatch ? calc.batchProfit : calc.unitProfit)} (${calc.marginPct.toFixed(0)}% ${t.margin})`,
      "----------------------------------------",
      `Расчёт выполнен на ${BRAND.domain}`,
    ]
      .filter(Boolean)
      .join("\n");

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
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
          <div className="flex flex-col gap-4 rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  <Printer className="size-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {t.printer}
                </span>
              </div>
            </div>

            {/* Brand Switcher Pills (Horizontal scrollable bar, no ugly wrapping/clipping) */}
            <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden dark:bg-neutral-800/60">
              {(
                [
                  { id: "bambu", label: "Bambu" },
                  { id: "creality", label: "Creality" },
                  { id: "anycubic", label: "Anycubic" },
                  { id: "elegoo", label: "Elegoo" },
                  { id: "qidi", label: "QIDI" },
                  { id: "flashforge", label: "Flashforge" },
                  { id: "custom", label: locale === "ru" ? "Свой" : "Custom" },
                ] as const
              ).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    const firstOfBrand = Object.values(PRINTER_PROFILES).find((p) => p.brand === b.id);
                    q.set({ brand: b.id, pr: firstOfBrand ? firstOfBrand.id : q.v.pr });
                  }}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap",
                    q.v.brand === b.id
                      ? "bg-neutral-950 text-white shadow-xs dark:bg-white dark:text-neutral-950"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white",
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* Printer Dropdown */}
            <div className="flex flex-col gap-1.5">
              <Select
                id={`${id}-printer`}
                value={q.v.pr}
                onChange={(e) => {
                  const target = PRINTER_PROFILES[e.target.value as PrinterId];
                  q.set({ pr: e.target.value, brand: target ? target.brand : q.v.brand });
                }}
                className="h-11 rounded-2xl border-neutral-300 font-bold dark:border-neutral-700"
              >
                {q.v.brand === "all" ? (
                  <>
                    <optgroup label="Bambu Lab">
                      {Object.values(PRINTER_PROFILES)
                        .filter((p) => p.brand === "bambu")
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Creality">
                      {Object.values(PRINTER_PROFILES)
                        .filter((p) => p.brand === "creality")
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Anycubic">
                      {Object.values(PRINTER_PROFILES)
                        .filter((p) => p.brand === "anycubic")
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Elegoo">
                      {Object.values(PRINTER_PROFILES)
                        .filter((p) => p.brand === "elegoo")
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="QIDI Tech">
                      {Object.values(PRINTER_PROFILES)
                        .filter((p) => p.brand === "qidi")
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Flashforge">
                      {Object.values(PRINTER_PROFILES)
                        .filter((p) => p.brand === "flashforge")
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Flying Bear / Kingroon">
                      {Object.values(PRINTER_PROFILES)
                        .filter((p) => ["flyingbear", "kingroon"].includes(p.brand))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Artillery / Two Trees">
                      {Object.values(PRINTER_PROFILES)
                        .filter((p) => ["artillery", "twotrees"].includes(p.brand))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Snapmaker / Промышленные (Raise3D / UltiMaker)">
                      {Object.values(PRINTER_PROFILES)
                        .filter((p) => ["snapmaker", "raise3d"].includes(p.brand))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Свой принтер / Другой">
                      {Object.values(PRINTER_PROFILES)
                        .filter((p) => p.brand === "custom")
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </optgroup>
                  </>
                ) : (
                  Object.values(PRINTER_PROFILES)
                    .filter((p) => p.brand === q.v.brand)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                )}
              </Select>
            </div>
          </div>

          {/* 3. Material & Kazakhstan Location Card */}
          <div className="flex flex-col gap-4 rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  <Layers className="size-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {t.material}
                </span>
              </div>
            </div>

            {/* Material Pills */}
            <div className="flex flex-wrap gap-1.5">
              {Object.values(MATERIAL_PROFILES).map((m) => {
                const isSelected = m.id === selectedMaterial.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      q.set({
                        mat: m.id,
                        sp: toInput(locale, m.defaultPriceKg),
                      });
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95",
                      isSelected
                        ? "bg-neutral-950 text-white shadow-xs dark:bg-white dark:text-neutral-950"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300",
                    )}
                  >
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Spool Price Direct Input */}
            <div className="flex items-center justify-between pt-1">
              <label htmlFor={`${id}-sp`} className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {t.spoolPrice}
              </label>
              <div className="relative w-36">
                <Input
                  id={`${id}-sp`}
                  value={q.v.sp}
                  onChange={(e) => q.set({ sp: e.target.value })}
                  inputMode="numeric"
                  className="h-10 rounded-xl pr-7 text-right font-bold tabular-nums"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                  ₸
                </span>
              </div>
            </div>

            <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

            {/* City & Electricity Tariff in Kazakhstan */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{t.city}</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <Select
                  id={`${id}-city`}
                  value={q.v.city}
                  onChange={(e) => q.set({ city: e.target.value, tar: "" })}
                  className="h-10 rounded-xl font-bold"
                >
                  {KZ_CITIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name[locale]} ({c.residentialTariff.toFixed(1)} ₸/кВт⋅ч)
                    </option>
                  ))}
                </Select>

                {/* Tariff Type Toggle */}
                <div className="flex rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
                  <button
                    type="button"
                    onClick={() => q.set({ comm: "0", tar: "" })}
                    className={cn(
                      "flex-1 rounded-lg py-1 text-xs font-bold transition",
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
                      "flex-1 rounded-lg py-1 text-xs font-bold transition",
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
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t.customTariff} (по счётчику):
                </span>
                <div className="relative w-32">
                  <Input
                    value={currentTariffText}
                    onChange={(e) => q.set({ tar: e.target.value })}
                    inputMode="decimal"
                    placeholder={defaultTariff.toFixed(2)}
                    className="h-9 rounded-xl pr-14 text-right font-bold tabular-nums text-xs"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-neutral-400">
                    ₸/кВт⋅ч
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Print Specifications: Weight, Time, Supports */}
          <div className="flex flex-col gap-4 rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                <Scale className="size-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {locale === "ru" ? "Параметры печати" : "Print Specifications"}
              </span>
            </div>

            {/* Part Weight */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor={`${id}-w`} className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  {t.weight}
                </label>
                <div className="relative w-32">
                  <Input
                    id={`${id}-w`}
                    value={q.v.w}
                    onChange={(e) => q.set({ w: e.target.value })}
                    inputMode="decimal"
                    className="h-10 rounded-xl pr-7 text-right font-bold tabular-nums"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                    г
                  </span>
                </div>
              </div>

              <Slider
                min={5}
                max={5000}
                step={5}
                value={Math.min(5000, Math.max(5, W.value ?? 100))}
                onChange={(e) => q.set({ w: e.target.value })}
              />
            </div>

            {/* Print Time Inputs & Slider */}
            <div className="flex flex-col gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{t.printTime}</span>
                <div className="flex items-center gap-1.5">
                  <div className="relative w-20">
                    <Input
                      id={`${id}-th`}
                      value={q.v.th}
                      onChange={(e) => q.set({ th: e.target.value })}
                      inputMode="numeric"
                      className="h-9 rounded-xl pr-6 text-right font-bold tabular-nums text-xs"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      {t.hours}
                    </span>
                  </div>
                  <div className="relative w-20">
                    <Input
                      id={`${id}-tm`}
                      value={q.v.tm}
                      onChange={(e) => q.set({ tm: e.target.value })}
                      inputMode="numeric"
                      className="h-9 rounded-xl pr-8 text-right font-bold tabular-nums text-xs"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      {t.minutes}
                    </span>
                  </div>
                </div>
              </div>

              <Slider
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
              <div className="flex flex-wrap gap-1.5">
                {Object.values(SUPPORTS_OPTIONS).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => q.set({ sup: opt.id })}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95",
                      q.v.sup === opt.id
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                        : "bg-white text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300",
                    )}
                  >
                    {opt.name[locale]}
                  </button>
                ))}
              </div>
              {q.v.sup === "custom" && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">{t.customSupportsWeight}</span>
                  <div className="relative w-28">
                    <Input
                      value={q.v.supw}
                      onChange={(e) => q.set({ supw: e.target.value })}
                      inputMode="decimal"
                      className="h-9 rounded-xl pr-7 text-right font-bold tabular-nums"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      г
                    </span>
                  </div>
                </div>
              )}

              {/* Brim Checkbox */}
              <label className="flex cursor-pointer items-center justify-between pt-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                <div className="flex flex-col">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
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
                  className="size-4.5 rounded-sm accent-neutral-900 dark:accent-neutral-100"
                />
              </label>
            </div>
          </div>

          {/* 5. Batch & Profit Margin */}
          <div className="flex flex-col gap-4 rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  <Package className="size-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {locale === "ru" ? "Тираж и прибыль" : "Batch & Margin"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {calc.quantity > 1 && (
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-900 dark:bg-neutral-800 dark:text-white">
                    {calc.quantity} шт.
                  </span>
                )}
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  +{MARK.value ?? 40}% наценка
                </span>
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center justify-between rounded-2xl bg-neutral-50/80 p-3.5 dark:bg-neutral-800/40">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{t.quantity}</span>
                <span className="text-[11px] text-neutral-400">
                  {locale === "ru" ? "Сколько одинаковых деталей нужно напечатать" : "Number of items in the batch"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => q.set({ q: String(Math.max(1, (Q.value ?? 1) - 1)) })}
                  className="flex size-8 items-center justify-center rounded-lg bg-white text-neutral-800 shadow-xs hover:bg-neutral-100 active:scale-95 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  <Minus className="size-3.5" />
                </button>
                <Input
                  value={q.v.q}
                  onChange={(e) => q.set({ q: e.target.value })}
                  inputMode="numeric"
                  className="h-8 w-16 rounded-lg text-center font-bold tabular-nums text-xs"
                />
                <button
                  type="button"
                  onClick={() => q.set({ q: String((Q.value ?? 1) + 1) })}
                  className="flex size-8 items-center justify-center rounded-lg bg-white text-neutral-800 shadow-xs hover:bg-neutral-100 active:scale-95 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Profit Markup Slider */}
            <div className="flex flex-col gap-2.5 rounded-2xl bg-neutral-50/80 p-3.5 dark:bg-neutral-800/40">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    {locale === "ru" ? "Наценка / желаемая прибыль" : "Profit Markup"}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {locale === "ru" ? "По умолчанию 40% (стандарт в КЗ)" : "Default 40%"}
                  </span>
                </div>
                <div className="relative w-24">
                  <Input
                    value={q.v.mark}
                    onChange={(e) => q.set({ mark: e.target.value })}
                    inputMode="numeric"
                    className="h-8 rounded-lg pr-6 text-right font-bold text-xs tabular-nums"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                    %
                  </span>
                </div>
              </div>

              <Slider
                min={0}
                max={200}
                step={5}
                value={Math.min(200, Math.max(0, MARK.value ?? 40))}
                onChange={(e) => q.set({ mark: e.target.value })}
              />

              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>0% (в ноль)</span>
                <span className="font-bold text-neutral-700 dark:text-neutral-300">40% (норма)</span>
                <span>100%</span>
                <span>200%</span>
              </div>
            </div>
          </div>

          {/* 7. Advanced Settings Accordion */}
          <div className="flex flex-col rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
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
                    onChange={(e) => q.set({ noz: e.target.value })}
                    className="h-10 rounded-xl font-medium"
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

                {/* Markup & Taxes */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{t.markup}</label>
                    <div className="relative">
                      <Input
                        value={q.v.mark}
                        onChange={(e) => q.set({ mark: e.target.value })}
                        inputMode="numeric"
                        className="h-10 rounded-xl pr-7 font-bold tabular-nums"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                        %
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{t.taxRegime}</label>
                    <Select
                      value={q.v.tax}
                      onChange={(e) => q.set({ tax: e.target.value })}
                      className="h-10 rounded-xl font-medium"
                    >
                      {Object.values(TAX_REGIMES).map((tr) => (
                        <option key={tr.id} value={tr.id}>
                          {tr.name[locale]}
                        </option>
                      ))}
                    </Select>
                  </div>
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

        {/* ═════════ RIGHT COLUMN: Obsidian Hero Card & Transparent Breakdown ═════════ */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-6">
          {/* Obsidian Hero Card */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-6 text-white shadow-xl dark:border dark:border-neutral-800 sm:p-7">
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

              {/* Net Cost & Profit Pills */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/5 p-3.5 backdrop-blur-xs">
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

              {/* Primary Action Button: Copy Quote */}
              <button
                type="button"
                onClick={handleCopyQuote}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-neutral-950 transition active:scale-98 hover:bg-neutral-100 shadow-lg"
              >
                {copiedQuote ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                <span>{copiedQuote ? t.quoteCopied : t.copyQuoteBtn}</span>
              </button>
            </div>
          </div>

          {/* Chunky States Distribution Chart */}
          <div className="flex flex-col gap-4 rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-neutral-900 dark:text-white" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                  {t.breakdownTitle}
                </span>
              </div>
              <span className="text-xs font-bold text-neutral-500">100%</span>
            </div>

            {/* Chunky Multi-Segment Bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                style={{ width: `${Math.max(2, calc.shares.material)}%` }}
                className="bg-neutral-950 transition-all dark:bg-white"
                title={`${t.materialCost}: ${calc.shares.material.toFixed(0)}%`}
              />
              <div
                style={{ width: `${Math.max(2, calc.shares.electricity)}%` }}
                className="bg-neutral-700 transition-all dark:bg-neutral-300"
                title={`${t.elecCost}: ${calc.shares.electricity.toFixed(0)}%`}
              />
              <div
                style={{ width: `${Math.max(2, calc.shares.depreciation)}%` }}
                className="bg-neutral-500 transition-all dark:bg-neutral-500"
                title={`${t.depCost}: ${calc.shares.depreciation.toFixed(0)}%`}
              />
              <div
                style={{ width: `${Math.max(2, calc.shares.labor)}%` }}
                className="bg-neutral-400 transition-all dark:bg-neutral-600"
                title={`${t.laborCost}: ${calc.shares.labor.toFixed(0)}%`}
              />
              <div
                style={{ width: `${Math.max(2, calc.shares.profit)}%` }}
                className="bg-neutral-300 transition-all dark:bg-neutral-700"
                title={`${t.profit}: ${calc.shares.profit.toFixed(0)}%`}
              />
            </div>

            {/* Line-by-Line Breakdown Rows */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className="size-2 rounded-full bg-neutral-950 dark:bg-white" />
                  <span>{t.materialCost} ({calc.effectiveWeightG.toFixed(0)} г)</span>
                </div>
                <span className="font-mono font-bold text-neutral-950 dark:text-white">
                  {fmtMoney(locale, isBatch ? calc.materialCost * calc.quantity : calc.materialCost)}
                </span>
              </div>

              {calc.supportsCost > 0 && (
                <div className="flex items-center justify-between text-xs pl-4 text-neutral-500">
                  <span>↳ {t.supportsCost} ({calc.supportsWeightG.toFixed(0)} г)</span>
                  <span className="font-mono font-medium">
                    {fmtMoney(locale, isBatch ? calc.supportsCost * calc.quantity : calc.supportsCost)}
                  </span>
                </div>
              )}

              {calc.brimCost > 0 && (
                <div className="flex items-center justify-between text-xs pl-4 text-neutral-500">
                  <span>↳ {t.brimCost} ({calc.brimWeightG} г)</span>
                  <span className="font-mono font-medium">
                    {fmtMoney(locale, isBatch ? calc.brimCost * calc.quantity : calc.brimCost)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className="size-2 rounded-full bg-neutral-700 dark:bg-neutral-300" />
                  <span>{t.elecCost} ({calc.effectiveTariffKwh.toFixed(1)} ₸/кВт⋅ч)</span>
                </div>
                <span className="font-mono font-bold text-neutral-950 dark:text-white">
                  {fmtMoney(locale, isBatch ? calc.electricityCost * calc.quantity : calc.electricityCost)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className="size-2 rounded-full bg-neutral-500 dark:bg-neutral-500" />
                  <span>{t.depCost} ({calc.printerHourlyDepreciation.toFixed(0)} ₸/ч)</span>
                </div>
                <span className="font-mono font-bold text-neutral-950 dark:text-white">
                  {fmtMoney(locale, isBatch ? calc.depreciationCost * calc.quantity : calc.depreciationCost)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className="size-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                  <span>{t.wearCost}</span>
                </div>
                <span className="font-mono font-bold text-neutral-950 dark:text-white">
                  {fmtMoney(locale, isBatch ? calc.wearConsumablesCost * calc.quantity : calc.wearConsumablesCost)}
                </span>
              </div>

              {calc.setupFeeTotal > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                    <span className="size-2 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                    <span>{t.setupCost}</span>
                  </div>
                  <span className="font-mono font-bold text-neutral-950 dark:text-white">
                    {fmtMoney(locale, calc.setupFeeTotal)}
                  </span>
                </div>
              )}

              {calc.modelingFeeTotal > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                    <span className="size-2 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                    <span>{t.modelingCost}</span>
                  </div>
                  <span className="font-mono font-bold text-neutral-950 dark:text-white">
                    {fmtMoney(locale, calc.modelingFeeTotal)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className="size-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                  <span>{t.laborCost}</span>
                </div>
                <span className="font-mono font-bold text-neutral-950 dark:text-white">
                  {fmtMoney(locale, isBatch ? calc.physicalLaborCost * calc.quantity : calc.physicalLaborCost)}
                </span>
              </div>

              {calc.unitTax > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                    <span className="size-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                    <span>{t.taxCost}</span>
                  </div>
                  <span className="font-mono font-bold text-neutral-950 dark:text-white">
                    {fmtMoney(locale, isBatch ? calc.batchTax : calc.unitTax)}
                  </span>
                </div>
              )}

              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

              <div className="flex items-center justify-between text-xs font-bold text-neutral-950 dark:text-white">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                  <span>{t.profit}</span>
                </div>
                <span className="font-mono">
                  +{fmtMoney(locale, isBatch ? calc.batchProfit : calc.unitProfit)}
                </span>
              </div>
            </div>
          </div>
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
    </Stack>
  );
}
