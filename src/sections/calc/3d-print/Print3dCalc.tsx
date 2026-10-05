"use client";

import { useId, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  Flame,
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
  Sliders,
  Timer,
  Zap,
} from "lucide-react";
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
  PACKAGING_OPTIONS,
  PRINTER_PROFILES,
  SPOOL_PRICE_PRESETS,
  TAX_REGIMES,
  type DryerId,
  type MaterialId,
  type NozzleId,
  type PackagingId,
  type PrinterId,
  type TaxRegimeId,
} from "./data";
import { calculatePrint3d } from "./engine";

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
    multiPurgeCost: "Сброс нити (AMS / CFS)",
    elecCost: "Электроэнергия",
    depCost: "Амортизация принтера",
    wearCost: "Износ сопла и стола",
    laborCost: "Работа мастера",
    packCost: "Упаковка",
    taxCost: "Налог",
    advanced: "Расширенные параметры (сушилка, сопла, налоги, брак)",
    amsWaste: "Поддержки и кайма (%)",
    failureRisk: "Запас на брак (%)",
    dryer: "Сушилка филамента",
    dryingHours: "Время сушки",
    nozzle: "Тип сопла",
    prepTime: "Подготовка и слайсинг",
    prepHint: "Делится на весь тираж",
    postTime: "Постобработка",
    hourlyRate: "Ставка мастера",
    packaging: "Упаковка",
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
    reset: "Сброс",
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
    multiPurgeCost: "Purge waste (AMS / CFS)",
    elecCost: "Electricity",
    depCost: "Equipment depreciation",
    wearCost: "Nozzle & bed wear",
    laborCost: "Labor",
    packCost: "Packaging",
    taxCost: "Tax",
    advanced: "Advanced settings (dryer, nozzle, labor, taxes, failure)",
    amsWaste: "Supports & brim (%)",
    failureRisk: "Failure buffer (%)",
    dryer: "Filament dryer",
    dryingHours: "Drying time",
    nozzle: "Nozzle type",
    prepTime: "Prep & slicing",
    prepHint: "Shared across batch",
    postTime: "Post-processing",
    hourlyRate: "Labor rate",
    packaging: "Packaging",
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
    colMultiSys: "Color-swap system",
    colCity: "City",
    colResTariff: "Residential",
    colCommTariff: "Commercial",
    colUtility: "Utility company",
    howToTitle: "Calculation formulas & Kazakhstan context",
    colorCount: "Colors count",
    colorSwaps: "Filament swaps (tool changes)",
    colorSwapsHint: "From slicer (Bambu Studio / OrcaSlicer / Creality Print)",
    purgePerSwap: "Purge per swap",
    purgeHint: "Purge tower + nozzle flush poop",
    swapSecs: "Seconds per swap",
    copyQuoteBtn: "Copy quote for client",
    quoteCopied: "Quote copied to clipboard!",
    linkCopied: "Link copied!",
    share: "Share",
    reset: "Reset",
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
  printer = "ender3",
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
      brand: "creality",
      w: toInput(locale, weight),
      th: toInput(locale, Math.floor(hours)),
      tm: toInput(locale, Math.round((hours % 1) * 60)),
      q: "1",
      sp: toInput(locale, 6500),
      pr: printer,
      mat: material,
      city: city,
      comm: "0",
      tar: "",
      cc: "4",
      cs: "250",
      csw: toInput(locale, 0.35),
      sws: "60",
      waste: "0",
      fail: "5",
      dry: "none",
      dryt: "4",
      noz: "hardened",
      prep: "10",
      post: "5",
      rate: toInput(locale, 2500),
      pack: "none",
      packb: "1",
      mark: "100",
      tax: "none",
    },
    {
      enums: {
        mc: ["0", "1"],
        brand: ["creality", "bambu", "anycubic", "custom"],
        pr: Object.keys(PRINTER_PROFILES),
        mat: Object.keys(MATERIAL_PROFILES),
        city: KZ_CITIES.map((c) => c.slug),
        comm: ["0", "1"],
        dry: Object.keys(DRYER_PROFILES),
        noz: Object.keys(NOZZLE_PROFILES),
        pack: Object.keys(PACKAGING_OPTIONS),
        packb: ["0", "1"],
        tax: Object.keys(TAX_REGIMES),
      },
    },
  );

  const isMultiColor = q.v.mc === "1";
  const selectedPrinter = PRINTER_PROFILES[q.v.pr as PrinterId] ?? PRINTER_PROFILES.ender3;
  const selectedMaterial = MATERIAL_PROFILES[q.v.mat as MaterialId] ?? MATERIAL_PROFILES.pla;
  const selectedCity = KZ_CITIES.find((c) => c.slug === q.v.city) ?? KZ_CITIES[0];
  const isCommercial = q.v.comm === "1";

  const defaultTariff = isCommercial ? selectedCity.commercialTariff : selectedCity.residentialTariff;
  const currentTariffText = q.v.tar ? q.v.tar : toInput(locale, defaultTariff);

  // Parse numeric fields
  const W = field(locale, q.v.w, { min: 0, max: 50_000 });
  const TH = field(locale, q.v.th, { min: 0, max: 1000 });
  const TM = field(locale, q.v.tm, { min: 0, max: 59 });
  const Q = field(locale, q.v.q, { min: 1, max: 10_000, int: true });
  const SP = field(locale, q.v.sp, { min: 0, max: 500_000 });
  const TAR = field(locale, currentTariffText, { min: 0, max: 500 });
  const CC = field(locale, q.v.cc, { min: 2, max: 16, int: true });
  const CS = field(locale, q.v.cs, { min: 0, max: 10_000, int: true });
  const CSW = field(locale, q.v.csw, { min: 0.05, max: 5 });
  const SWS = field(locale, q.v.sws, { min: 0, max: 300, int: true });
  const WASTE = field(locale, q.v.waste, { min: 0, max: 500 });
  const FAIL = field(locale, q.v.fail, { min: 0, max: 100 });
  const DRYT = field(locale, q.v.dryt, { min: 0, max: 72 });
  const PREP = field(locale, q.v.prep, { min: 0, max: 600 });
  const POST = field(locale, q.v.post, { min: 0, max: 600 });
  const RATE = field(locale, q.v.rate, { min: 0, max: 100_000 });
  const MARK = field(locale, q.v.mark, { min: 0, max: 2000 });

  const totalPrintHours = (TH.value ?? 0) + (TM.value ?? 0) / 60;

  const result = useMemo(() => {
    return calculatePrint3d({
      weightG: W.value ?? 0,
      printHours: totalPrintHours,
      quantity: Q.value ?? 1,
      spoolPriceKg: SP.value ?? selectedMaterial.defaultPriceKg,
      isMultiColor,
      colorCount: CC.value ?? 4,
      colorSwaps: CS.value ?? 250,
      purgePerSwapG: CSW.value ?? 0.35,
      swapTimeSec: SWS.value ?? 60,
      purgeWastePct: WASTE.value ?? 0,
      failureRatePct: FAIL.value ?? 5,
      printerId: selectedPrinter.id,
      materialId: selectedMaterial.id,
      citySlug: selectedCity.slug,
      isCommercialTariff: isCommercial,
      customTariffKwh: TAR.value ?? defaultTariff,
      dryerId: q.v.dry as DryerId,
      dryingHours: DRYT.value ?? 0,
      nozzleId: q.v.noz as NozzleId,
      prepMinutes: PREP.value ?? 10,
      postProcessMinutes: POST.value ?? 5,
      hourlyRate: RATE.value ?? 2500,
      packagingId: q.v.pack as PackagingId,
      packPerBatch: q.v.packb === "1",
      markupPct: MARK.value ?? 100,
      taxRegime: q.v.tax as TaxRegimeId,
    });
  }, [
    W.value,
    totalPrintHours,
    Q.value,
    SP.value,
    selectedMaterial.defaultPriceKg,
    selectedMaterial.id,
    isMultiColor,
    CC.value,
    CS.value,
    CSW.value,
    SWS.value,
    WASTE.value,
    FAIL.value,
    selectedPrinter.id,
    selectedCity.slug,
    isCommercial,
    TAR.value,
    defaultTariff,
    q.v.dry,
    DRYT.value,
    q.v.noz,
    PREP.value,
    POST.value,
    RATE.value,
    q.v.pack,
    q.v.packb,
    MARK.value,
    q.v.tax,
  ]);

  const tg = (val: number) => fmtMoney(locale, val, "KZT", 0);
  const currentPowerWatts = selectedPrinter.powerByMaterial[selectedMaterial.id] ?? selectedPrinter.defaultPower;
  const brandPrinters = Object.values(PRINTER_PROFILES).filter((p) => p.brand === q.v.brand);
  const isBatch = result.quantity > 1;

  // Copy full customer quotation to clipboard
  const handleCopyQuote = () => {
    const text = [
      `🖨️ ${locale === "ru" ? "Расчёт стоимости 3D-печати" : "3D Printing Cost Estimation"}`,
      `${locale === "ru" ? "Деталь" : "Part"}: ${result.weightG} г · ${locale === "ru" ? "Время" : "Time"}: ${Math.floor(result.effectivePrintHours)} ${t.hours} ${Math.round((result.effectivePrintHours % 1) * 60)} ${t.minutes}`,
      `${locale === "ru" ? "Принтер" : "Printer"}: ${selectedPrinter.name} (${currentPowerWatts} Вт)`,
      `${locale === "ru" ? "Город" : "City"}: ${selectedCity.name[locale]} (${isCommercial ? t.commercial : t.residential}: ${result.effectiveTariffKwh} ₸/кВт⋅ч)`,
      `${locale === "ru" ? "Материал" : "Filament"}: ${selectedMaterial.name} (${tg(SP.value ?? selectedMaterial.defaultPriceKg)}/кг)`,
      isMultiColor ? `🎨 AMS: +${result.multiColorPurgeG.toFixed(0)} г сброса (${result.colorSwaps} смен)` : "",
      "----------------------------------------",
      `• ${t.materialCost}: ${tg(result.materialCost)}`,
      isMultiColor && result.multiColorPurgeG > 0 ? `• ${t.multiPurgeCost}: ${tg(result.multiColorPurgeCost)}` : "",
      `• ${t.elecCost}: ${tg(result.electricityCost)}`,
      `• ${t.depCost}: ${tg(result.depreciationCost)}`,
      `• ${t.wearCost}: ${tg(result.wearConsumablesCost)}`,
      `• ${t.laborCost}: ${tg(result.laborCost)}`,
      result.packagingCost > 0 ? `• ${t.packCost}: ${tg(result.packagingCost)}` : "",
      result.unitTax > 0 ? `• ${t.taxCost}: ${tg(result.unitTax)}` : "",
      "----------------------------------------",
      `${t.netCost}: ${tg(isBatch ? result.batchNetCost : result.unitNetCost)}`,
      `⭐ ${isBatch ? t.batchPrice : t.recommendedPrice}: ${tg(isBatch ? result.batchPrice : result.unitPrice)} ${isBatch ? `(${result.quantity} шт.)` : ""}`,
      `💰 ${t.profit}: +${tg(isBatch ? result.batchProfit : result.unitProfit)} (${result.marginPct.toFixed(0)}% ${t.margin})`,
      "----------------------------------------",
      "ulti-tools.com",
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
      {/* ── Top Header Bar (Clean Monochrome App-Header Style) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-950">
            <Printer className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white sm:text-xl">
              {locale === "ru" ? "3D-печать в Казахстане" : "3D Print Costing (KZ)"}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <MapPin className="size-3.5 text-neutral-700 dark:text-neutral-300" />
              <span>
                {selectedCity.name[locale]} · {selectedCity.utility}
              </span>
            </div>
          </div>
        </div>

        {/* Live Power & Machine Badge (Pure Monochrome) */}
        <div className="flex items-center gap-2 rounded-full border border-neutral-300/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-900 shadow-xs dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
          <span className="size-2 rounded-full bg-neutral-900 dark:bg-white animate-pulse" />
          <span>
            {currentPowerWatts} Вт · {selectedPrinter.depreciationPerHour} ₸/ч
          </span>
        </div>
      </div>

      {/* ── Main Layout: Modern Fintech/Logistics 2-Column Grid ── */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-8">
        {/* ═════════ LEFT COLUMN: Tactile Monochrome Input Cards ═════════ */}
        <div className="flex flex-col gap-5">
          {/* 1. Mode Switcher (Monochrome Rounded Pills) */}
          <div className="flex rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => q.set({ mc: "0" })}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-[0.98]",
                !isMultiColor
                  ? "bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-950"
                  : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
              )}
            >
              <Sliders className="size-3.5" />
              <span>{t.modeSingle}</span>
            </button>
            <button
              type="button"
              onClick={() => q.set({ mc: "1" })}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-[0.98]",
                isMultiColor
                  ? "bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-950"
                  : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
              )}
            >
              <Palette className="size-3.5" />
              <span>{t.modeMulti}</span>
            </button>
          </div>

          {/* 2. Equipment & Brand Card */}
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
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-bold text-neutral-900 dark:bg-neutral-800 dark:text-white">
                {selectedPrinter.bedSize}
              </span>
            </div>

            {/* Brand Selector Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "creality", label: t.brandCreality },
                { id: "bambu", label: t.brandBambu },
                { id: "anycubic", label: t.brandAnycubic },
                { id: "custom", label: t.brandCustom },
              ].map((b) => {
                const isActive = q.v.brand === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      const firstInBrand = Object.values(PRINTER_PROFILES).find((p) => p.brand === b.id);
                      q.set({
                        brand: b.id,
                        pr: firstInBrand ? firstInBrand.id : q.v.pr,
                      });
                    }}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95",
                      isActive
                        ? "bg-neutral-950 text-white shadow-xs dark:bg-white dark:text-neutral-950"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                    )}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>

            {/* Printer Model Dropdown */}
            <div className="flex flex-col gap-1.5">
              <Select
                id={`${id}-pr`}
                value={selectedPrinter.id}
                onChange={(e) => {
                  const pid = e.target.value as PrinterId;
                  const prof = PRINTER_PROFILES[pid];
                  q.set({ pr: pid, brand: prof ? prof.brand : q.v.brand });
                }}
                className="h-12 rounded-2xl border-neutral-200 bg-neutral-50/80 font-semibold text-neutral-950 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                {brandPrinters.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.powerByMaterial[selectedMaterial.id] ?? p.defaultPower} Вт · {p.depreciationPerHour} ₸/ч)
                  </option>
                ))}
              </Select>
              <div className="flex items-center justify-between px-1 text-[11px] text-neutral-500">
                <span>{selectedPrinter.tagline}</span>
                {isMultiColor && (
                  <span className="font-bold text-neutral-950 dark:text-white">
                    {selectedPrinter.multiColorSystem}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Multi-Color Panel (When enabled - Pure Monochrome) */}
          {isMultiColor && (
            <div className="flex flex-col gap-4 rounded-[26px] border border-neutral-300 bg-neutral-50/80 p-5 shadow-xs dark:border-neutral-700 dark:bg-neutral-800/60 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                    <Palette className="size-3.5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white">
                    {locale === "ru" ? "Параметры AMS / CFS" : "Multi-Color Settings"}
                  </span>
                </div>
                <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-neutral-950">
                  +{result.multiColorPurgeG.toFixed(0)} г сброса ({tg(result.multiColorPurgeCost)})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    {t.colorSwaps}
                  </span>
                  <Input
                    id={`${id}-cs`}
                    value={q.v.cs}
                    onChange={(e) => q.set({ cs: e.target.value })}
                    inputMode="numeric"
                    className="h-11 rounded-xl text-center font-bold tabular-nums"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {[30, 80, 250, 600].map((sw) => (
                      <button
                        key={sw}
                        type="button"
                        onClick={() => q.set({ cs: String(sw) })}
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[11px] font-bold transition",
                          CS.value === sw
                            ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                            : "bg-white text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200",
                        )}
                      >
                        {sw}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    {t.purgePerSwap} (г)
                  </span>
                  <Input
                    id={`${id}-csw`}
                    value={q.v.csw}
                    onChange={(e) => q.set({ csw: e.target.value })}
                    inputMode="decimal"
                    className="h-11 rounded-xl text-center font-bold tabular-nums"
                  />
                  <span className="mt-1 text-[11px] text-neutral-500">
                    Башня + слив сопла
                  </span>
                </div>
              </div>

              {/* Color Count Pills */}
              <div className="flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-700">
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{t.colorCount}:</span>
                <div className="flex gap-1.5">
                  {[2, 3, 4, 8].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => q.set({ cc: String(c) })}
                      className={cn(
                        "size-8 rounded-full text-xs font-bold transition active:scale-95",
                        CC.value === c
                          ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                          : "bg-white text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Kazakhstan City & Electricity Tariff Card */}
          <div className="flex flex-col gap-4 rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  <MapPin className="size-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {t.city}
                </span>
              </div>
              <div className="flex rounded-full bg-neutral-100 p-0.5 dark:bg-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    const nextTar = selectedCity.residentialTariff;
                    q.set({ comm: "0", tar: toInput(locale, nextTar) });
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold transition",
                    !isCommercial
                      ? "bg-neutral-950 text-white shadow-xs dark:bg-white dark:text-neutral-950"
                      : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400",
                  )}
                >
                  {t.residential}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextTar = selectedCity.commercialTariff;
                    q.set({ comm: "1", tar: toInput(locale, nextTar) });
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold transition",
                    isCommercial
                      ? "bg-neutral-950 text-white shadow-xs dark:bg-white dark:text-neutral-950"
                      : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400",
                  )}
                >
                  {t.commercial}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                id={`${id}-city`}
                value={selectedCity.slug}
                onChange={(e) => {
                  const slug = e.target.value;
                  const nextCity = KZ_CITIES.find((c) => c.slug === slug) ?? KZ_CITIES[0];
                  const nextDefault = isCommercial ? nextCity.commercialTariff : nextCity.residentialTariff;
                  q.set({ city: slug, tar: toInput(locale, nextDefault) });
                }}
                className="h-12 rounded-2xl border-neutral-200 bg-neutral-50/80 font-semibold dark:border-neutral-700 dark:bg-neutral-800"
              >
                {KZ_CITIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name[locale]} ({c.utility})
                  </option>
                ))}
              </Select>

              <div className="relative">
                <Input
                  id={`${id}-tar`}
                  value={currentTariffText}
                  onChange={(e) => q.set({ tar: e.target.value })}
                  inputMode="decimal"
                  placeholder={toInput(locale, defaultTariff)}
                  className="h-12 rounded-2xl border-neutral-200 bg-neutral-50/80 pr-20 font-bold tabular-nums dark:border-neutral-700 dark:bg-neutral-800"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                  ₸ / кВт⋅ч
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3.5 py-2 text-xs text-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="size-3.5 text-neutral-950 dark:text-white" />
                <span>{selectedCity.utility}</span>
              </span>
              <span className="font-bold tabular-nums text-neutral-950 dark:text-white">
                {((currentPowerWatts * result.effectivePrintHours) / 1000).toFixed(2)} кВт⋅ч ({tg(result.electricityCost)})
              </span>
            </div>
          </div>

          {/* 5. Part & Printing Parameters Card (Weight, Time, Batch) */}
          <div className="flex flex-col gap-5 rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
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
                max={1000}
                step={5}
                value={Math.min(1000, Math.max(5, W.value ?? 100))}
                onChange={(e) => q.set({ w: e.target.value })}
              />

              {/* Intuitive presets with real part hints */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { val: 15, hint: "15 г (Мелочь)" },
                  { val: 50, hint: "50 г (Крепёж)" },
                  { val: 100, hint: "100 г (Деталь)" },
                  { val: 250, hint: "250 г (Корпус)" },
                  { val: 500, hint: "500 г (Большая)" },
                ].map((wp) => (
                  <button
                    key={wp.val}
                    type="button"
                    onClick={() => q.set({ w: String(wp.val) })}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold transition active:scale-95",
                      W.value === wp.val
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300",
                    )}
                  >
                    {wp.hint}
                  </button>
                ))}
              </div>
            </div>

            {/* Print Time */}
            <div className="flex flex-col gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Timer className="size-3.5 text-neutral-500" />
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    {t.printTime}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative w-20">
                    <Input
                      id={`${id}-th`}
                      value={q.v.th}
                      onChange={(e) => q.set({ th: e.target.value })}
                      inputMode="numeric"
                      className="h-10 rounded-xl pr-6 text-center font-bold tabular-nums"
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
                      className="h-10 rounded-xl pr-8 text-center font-bold tabular-nums"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      {t.minutes}
                    </span>
                  </div>
                </div>
              </div>

              <Slider
                min={0.25}
                max={36}
                step={0.25}
                value={Math.min(36, Math.max(0.25, totalPrintHours || 1))}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const h = Math.floor(val);
                  const m = Math.round((val - h) * 60);
                  q.set({ th: String(h), tm: String(m) });
                }}
              />

              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 4, 8, 16].map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => q.set({ th: String(tp), tm: "0" })}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold transition active:scale-95",
                      TH.value === tp && (!TM.value || TM.value === 0)
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300",
                    )}
                  >
                    {tp} ч
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Quantity Stepper */}
            <div className="flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {t.quantity}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={(Q.value ?? 1) <= 1}
                  onClick={() => q.set({ q: String(Math.max(1, (Q.value ?? 1) - 1)) })}
                  className="flex size-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-30 dark:bg-neutral-800 dark:text-white active:scale-90"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center text-base font-extrabold tabular-nums text-neutral-950 dark:text-white">
                  {Q.value ?? 1}
                </span>
                <button
                  type="button"
                  onClick={() => q.set({ q: String((Q.value ?? 1) + 1) })}
                  className="flex size-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 transition hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white active:scale-90"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 6. Filament Material & Spool Price Card */}
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
              <div className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-bold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                <Flame className="size-3 text-neutral-700 dark:text-neutral-300" />
                <span>{selectedMaterial.bedTemp}</span>
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
                      "rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95",
                      isSelected
                        ? "bg-neutral-950 text-white shadow-xs dark:bg-white dark:text-neutral-950"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300",
                    )}
                  >
                    <span>{m.name}</span>
                    {m.abrasive && <span className="ml-1 opacity-70">(CF)</span>}
                  </button>
                );
              })}
            </div>

            {/* Spool Price Input */}
            <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <label htmlFor={`${id}-sp`} className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  {t.spoolPrice}
                </label>
                <div className="relative w-40">
                  <Input
                    id={`${id}-sp`}
                    value={q.v.sp}
                    onChange={(e) => q.set({ sp: e.target.value })}
                    inputMode="decimal"
                    className="h-10 rounded-xl pr-14 text-right font-bold tabular-nums"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                    ₸ / кг
                  </span>
                </div>
              </div>

              {/* Kazakhstan Market Spool Presets */}
              <div className="flex flex-wrap gap-1.5">
                {SPOOL_PRICE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => q.set({ sp: toInput(locale, p.value) })}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95",
                      SP.value === p.value
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-bold"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300",
                    )}
                  >
                    {p.label} ({p.desc.split(" ")[0]})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 7. Collapsible Advanced Settings (Monochrome Accordion) */}
          <div className="rounded-[26px] border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex w-full items-center justify-between p-5 text-left text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  <Settings2 className="size-3.5" />
                </div>
                <span>{t.advanced}</span>
              </div>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  isAdvancedOpen && "rotate-180",
                )}
              />
            </button>

            {isAdvancedOpen && (
              <div className="flex flex-col gap-4 border-t border-neutral-100 p-5 dark:border-neutral-800 sm:p-6">
                {/* Waste and Fail Buffer */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`${id}-waste`} className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.amsWaste}
                    </label>
                    <Input
                      id={`${id}-waste`}
                      value={q.v.waste}
                      onChange={(e) => q.set({ waste: e.target.value })}
                      inputMode="decimal"
                      className="h-10 rounded-xl text-center font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${id}-fail`} className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.failureRisk}
                    </label>
                    <Input
                      id={`${id}-fail`}
                      value={q.v.fail}
                      onChange={(e) => q.set({ fail: e.target.value })}
                      inputMode="decimal"
                      className="h-10 rounded-xl text-center font-bold"
                    />
                  </div>
                </div>

                {/* Dryer & Nozzle */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${id}-dry`} className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.dryer}
                    </label>
                    <Select
                      id={`${id}-dry`}
                      value={q.v.dry}
                      onChange={(e) => q.set({ dry: e.target.value })}
                      className="h-10 rounded-xl text-xs font-medium"
                    >
                      {Object.values(DRYER_PROFILES).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name[locale]}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label htmlFor={`${id}-noz`} className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.nozzle}
                    </label>
                    <Select
                      id={`${id}-noz`}
                      value={q.v.noz}
                      onChange={(e) => q.set({ noz: e.target.value })}
                      className="h-10 rounded-xl text-xs font-medium"
                    >
                      {Object.values(NOZZLE_PROFILES).map((noz) => (
                        <option key={noz.id} value={noz.id}>
                          {noz.name[locale]}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Labor & Packaging */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`${id}-prep`} className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.prepTime} ({t.minutes})
                    </label>
                    <Input
                      id={`${id}-prep`}
                      value={q.v.prep}
                      onChange={(e) => q.set({ prep: e.target.value })}
                      inputMode="numeric"
                      className="h-10 rounded-xl text-center font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${id}-post`} className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.postTime} ({t.minutes})
                    </label>
                    <Input
                      id={`${id}-post`}
                      value={q.v.post}
                      onChange={(e) => q.set({ post: e.target.value })}
                      inputMode="numeric"
                      className="h-10 rounded-xl text-center font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${id}-rate`} className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.hourlyRate}
                    </label>
                    <div className="relative">
                      <Input
                        id={`${id}-rate`}
                        value={q.v.rate}
                        onChange={(e) => q.set({ rate: e.target.value })}
                        inputMode="decimal"
                        className="h-10 rounded-xl pr-14 font-bold tabular-nums"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                        ₸ / ч
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`${id}-pack`} className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.packaging}
                    </label>
                    <Select
                      id={`${id}-pack`}
                      value={q.v.pack}
                      onChange={(e) => q.set({ pack: e.target.value })}
                      className="h-10 rounded-xl text-xs font-medium"
                    >
                      {Object.values(PACKAGING_OPTIONS).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name[locale]} {p.costKzt > 0 ? `(${p.costKzt} ₸)` : ""}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Markup & Tax */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`${id}-mark`} className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.markup} (%)
                    </label>
                    <Input
                      id={`${id}-mark`}
                      value={q.v.mark}
                      onChange={(e) => q.set({ mark: e.target.value })}
                      inputMode="numeric"
                      className="h-10 rounded-xl text-center font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${id}-tax`} className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.taxRegime}
                    </label>
                    <Select
                      id={`${id}-tax`}
                      value={q.v.tax}
                      onChange={(e) => q.set({ tax: e.target.value })}
                      className="h-10 rounded-xl text-xs font-medium"
                    >
                      {Object.values(TAX_REGIMES).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name[locale]}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═════════ RIGHT COLUMN: Hero Card, States Chart & Delivery Details ═════════ */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-20">
          {/* 1. HERO BLACK CARD (Exact Match to Fintech Black Account Card in Image 2) */}
          <div className="relative overflow-hidden rounded-[28px] border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-6 text-white shadow-2xl dark:border-neutral-800 sm:p-7">
            {/* Subtle decorative radial rings */}
            <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full border border-white/5 opacity-40" />

            {/* Top row */}
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {isBatch ? t.batchPrice : t.recommendedPrice}
              </span>
              <button
                type="button"
                onClick={handleCopyQuote}
                className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-neutral-950 shadow-sm transition hover:bg-neutral-100 active:scale-95"
              >
                {copiedQuote ? "✓ " + t.quoteCopied.split(" ")[0] : t.share}
              </button>
            </div>

            {/* Giant Bold Amount */}
            <div className="mt-3 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl text-white relative z-10">
              {tg(isBatch ? result.batchPrice : result.unitPrice)}
            </div>

            {/* Remaining Balance style progress bar (From Image 2) */}
            <div className="mt-4 flex flex-col gap-1.5 relative z-10">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>{t.netCost}: <strong className="text-neutral-200">{tg(isBatch ? result.batchNetCost : result.unitNetCost)}</strong></span>
                <span>{t.profit}: <strong className="text-white">+{tg(isBatch ? result.batchProfit : result.unitProfit)}</strong></span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 flex">
                <div
                  title={`Себестоимость: ${tg(result.unitNetCost)}`}
                  style={{ width: `${Math.max(10, 100 - result.marginPct > 0 ? 100 - result.marginPct : 50)}%` }}
                  className="bg-neutral-500"
                />
                <div
                  title={`Прибыль: ${tg(result.unitProfit)}`}
                  style={{ width: `${Math.max(10, result.marginPct)}%` }}
                  className="bg-white"
                />
              </div>
            </div>

            {/* Metric Chips Row */}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4 relative z-10">
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-neutral-300">
                {result.pricePerGram.toFixed(1)} ₸ / г
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-neutral-300">
                {result.pricePerHour.toFixed(0)} ₸ / ч
              </div>
              {isBatch && (
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-neutral-300">
                  {result.quantity} шт. в партии
                </div>
              )}
            </div>

            {/* Action Pill Buttons inside Black Card */}
            <div className="mt-5 flex items-center gap-2 relative z-10">
              <button
                type="button"
                onClick={handleCopyQuote}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/15 py-3 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-95"
              >
                {copiedQuote ? <Check className="size-4 text-white" /> : <Copy className="size-4" />}
                <span>{copiedQuote ? t.quoteCopied : t.copyQuoteBtn}</span>
              </button>
              <button
                type="button"
                onClick={handleShareLink}
                title={t.share}
                className="flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
              >
                {copiedLink ? <Check className="size-4 text-white" /> : <Share2 className="size-4" />}
              </button>
              <button
                type="button"
                onClick={q.reset}
                title={t.reset}
                className="flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 p-3 text-neutral-400 transition hover:bg-white/20 hover:text-white active:scale-95"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>
          </div>

          {/* 2. STATES / DISTRIBUTION CHART (Chunky Rounded Black Bars from Image 2 Middle Screen) */}
          <div className="flex flex-col gap-4 rounded-[28px] border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  <BarChart3 className="size-4" />
                </div>
                <span className="text-sm font-bold tracking-tight text-neutral-950 dark:text-white">
                  {locale === "ru" ? "Структура расходов" : "Cost Distribution"}
                </span>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-900 dark:bg-neutral-800 dark:text-white">
                100%
              </span>
            </div>

            {/* Chunky Vertical Bar Chart (Matching middle mockup in Image 2) */}
            <div className="flex h-36 items-end justify-between gap-3 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
              {[
                { label: "Пластик", share: result.shares.material },
                { label: "Свет", share: result.shares.electricity },
                { label: "Станок", share: result.shares.depreciation },
                { label: "Работа", share: result.shares.labor },
                { label: "Маржа", share: result.shares.profit },
              ].map((item, idx) => {
                // Ensure a minimum height so tiny shares still show a cute pill
                const hPercent = Math.min(100, Math.max(14, item.share));
                return (
                  <div key={idx} className="flex flex-1 flex-col items-center justify-end gap-2 h-full">
                    <span className="text-[10px] font-bold tabular-nums text-neutral-600 dark:text-neutral-400">
                      {item.share.toFixed(0)}%
                    </span>
                    <div
                      style={{ height: `${hPercent}%` }}
                      className="w-full max-w-[28px] rounded-xl bg-neutral-950 transition-all duration-300 dark:bg-white"
                    />
                    <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 truncate">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. "DELIVERY DETAILS" CARD (Exact Match to Right Screen in Mockup 1 & 2) */}
          <div className="flex flex-col gap-5 rounded-[28px] border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 sm:p-7">
            {/* Header with pill badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                  <Package className="size-4" />
                </div>
                <span className="text-sm font-bold tracking-tight text-neutral-950 dark:text-white">
                  {t.breakdownTitle}
                </span>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-900 dark:bg-neutral-800 dark:text-white">
                {isBatch ? `${result.quantity} шт.` : "1 шт."}
              </span>
            </div>

            {/* Key-Value Breakdown Rows (Pure Monochrome Alignment) */}
            <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
              {/* Material */}
              <div className="flex items-baseline justify-between py-2.5">
                <div>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t.materialCost}</span>
                  <span className="block text-[11px] text-neutral-400">
                    {result.weightG} г · {selectedMaterial.name}
                  </span>
                </div>
                <span className="text-sm font-bold tabular-nums text-neutral-950 dark:text-white">
                  {tg(result.materialCost)}
                </span>
              </div>

              {/* Multi-Color Purge (if active) */}
              {isMultiColor && result.multiColorPurgeG > 0 && (
                <div className="flex items-baseline justify-between py-2.5">
                  <div>
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t.multiPurgeCost}</span>
                    <span className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                      +{result.multiColorPurgeG.toFixed(0)} г сброса ({result.colorSwaps} смен)
                    </span>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-neutral-950 dark:text-white">
                    {tg(result.multiColorPurgeCost)}
                  </span>
                </div>
              )}

              {/* Electricity */}
              <div className="flex items-baseline justify-between py-2.5">
                <div>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t.elecCost}</span>
                  <span className="block text-[11px] text-neutral-400">
                    {((result.printerWatts * result.effectivePrintHours) / 1000).toFixed(2)} кВт⋅ч · {selectedCity.name[locale]}
                  </span>
                </div>
                <span className="text-sm font-bold tabular-nums text-neutral-950 dark:text-white">
                  {tg(result.electricityCost)}
                </span>
              </div>

              {/* Depreciation */}
              <div className="flex items-baseline justify-between py-2.5">
                <div>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t.depCost}</span>
                  <span className="block text-[11px] text-neutral-400">
                    {selectedPrinter.shortName} ({selectedPrinter.depreciationPerHour} ₸/ч)
                  </span>
                </div>
                <span className="text-sm font-bold tabular-nums text-neutral-950 dark:text-white">
                  {tg(result.depreciationCost)}
                </span>
              </div>

              {/* Consumables (Nozzle & Bed) */}
              <div className="flex items-baseline justify-between py-2.5">
                <div>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t.wearCost}</span>
                </div>
                <span className="text-sm font-bold tabular-nums text-neutral-950 dark:text-white">
                  {tg(result.wearConsumablesCost)}
                </span>
              </div>

              {/* Labor */}
              <div className="flex items-baseline justify-between py-2.5">
                <div>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t.laborCost}</span>
                  <span className="block text-[11px] text-neutral-400">
                    {q.v.prep} мин подг. + {q.v.post} мин пост.
                  </span>
                </div>
                <span className="text-sm font-bold tabular-nums text-neutral-950 dark:text-white">
                  {tg(result.laborCost)}
                </span>
              </div>

              {/* Packaging (if any) */}
              {result.packagingCost > 0 && (
                <div className="flex items-baseline justify-between py-2.5">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t.packCost}</span>
                  <span className="text-sm font-bold tabular-nums text-neutral-950 dark:text-white">
                    {tg(result.packagingCost)}
                  </span>
                </div>
              )}

              {/* Tax (if any) */}
              {result.unitTax > 0 && (
                <div className="flex items-baseline justify-between py-2.5">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t.taxCost}</span>
                  <span className="text-sm font-bold tabular-nums text-neutral-950 dark:text-white">
                    {tg(result.unitTax)}
                  </span>
                </div>
              )}
            </div>

            {/* BIG PRIMARY BLACK BUTTON (Matching [ Send $50 ] and [ Track Shipping ] in Mockups) */}
            <button
              type="button"
              onClick={handleCopyQuote}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-neutral-950 py-4 font-bold text-white shadow-md transition hover:bg-black active:scale-[0.99] dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100"
            >
              {copiedQuote ? (
                <>
                  <Check className="size-4" />
                  <span>{t.quoteCopied}</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span>{t.copyQuoteBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating Mobile Bar (Matching Bottom Nav in Mockup) ── */}
      <div className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 lg:hidden">
        <div className="flex items-center justify-between rounded-full border border-neutral-200/90 bg-white/95 p-2 shadow-2xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95">
          <div className="flex items-center gap-2 pl-3">
            <span className="size-2 rounded-full bg-neutral-950 dark:bg-white animate-pulse" />
            <span className="text-xs text-neutral-500 font-medium">Итого:</span>
            <span className="text-sm font-bold tabular-nums text-neutral-950 dark:text-white">
              {tg(isBatch ? result.batchPrice : result.unitPrice)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyQuote}
            className="flex items-center gap-1.5 rounded-full bg-neutral-950 px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 dark:bg-white dark:text-neutral-950"
          >
            {copiedQuote ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            <span>{copiedQuote ? "Готово!" : "Смета"}</span>
          </button>
        </div>
      </div>

      {/* ── Reference Tables & Technical Specifications ── */}
      <section className="mt-8">
        <SubHeading>{t.printerPowerTable}</SubHeading>
        <DataTable
          caption={t.printerPowerTable}
          head={[t.colPrinter, t.colBrand, t.colPla, t.colPetg, t.colAbs, t.colDep, t.colMultiSys]}
          rows={Object.values(PRINTER_PROFILES).map((p) => [
            p.name,
            p.brand === "creality" ? "Creality" : p.brand === "bambu" ? "Bambu Lab" : p.brand === "anycubic" ? "Anycubic" : "Custom",
            `${p.powerByMaterial.pla} Вт`,
            `${p.powerByMaterial.petg} Вт`,
            `${p.powerByMaterial.abs} Вт`,
            `${p.depreciationPerHour} ₸ / ч`,
            p.multiColorSystem,
          ])}
          align={["left", "left", "right", "right", "right", "right", "left"]}
        />
      </section>

      <section>
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
          align={["left", "right", "right", "left"]}
        />
      </section>

      {/* Explanations & Formulas */}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          title={t.howToTitle}
          formula={[
            "Себестоимость = Материал + Отходы смены цвета + Брак + Электроэнергия + Амортизация + Сопло/Стол + Работа + Упаковка",
            "Отходы смены цвета = Число_смен × Сброс_на_смену (г) × Цена_кг / 1000",
            "Электроэнергия = (Мощность_принтера × Эффективные_часы + Мощность_сушилки × Часы) / 1000 × Тариф_города",
            "Амортизация = Ставка_износа_принтера × Эффективные_часы + Ставка_сушилки × Часы",
            "Итоговая цена = Себестоимость × (1 + Наценка %) / Налоговый_коэффициент",
          ]}
          notes={[
            "Базовое потребление: в расчёте используется реальное рабочее энергопотребление стола и хотэнда во время стабильной печати (Ender-3: ~100 Вт, K1/K1C: ~125–130 Вт, K1 Max: ~175 Вт, P1S: ~105 Вт, A1: ~85 Вт), без завышения кратковременными пиками первичного нагрева.",
            "Многоцветная печать (AMS / CFS / ACE Pro): при частой смене цвета отходы на продувку сопла (слив/poop) и чистящую башню могут составлять от 30% до 150% веса самой детали. Калькулятор рассчитывает как вес и стоимость пластика, так и дополнительное время на смены нити.",
            "Тарифы на электроэнергию по городам Казахстана актуализированы на 2025/2026 год с учетом НДС. Поле тарифа всегда открыто для ручной корректировки под вашу конкретную квитанцию.",
            "Тиражирование: стоимость подготовки файла и нарезки слайсера распределяется поровну между всеми деталями тиража, что делает себестоимость единицы при партии значительно ниже единичного заказа.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          title={t.howToTitle}
          formula={[
            "Net Cost = Model Filament + Purge Waste + Failure + Electricity + Depreciation + Nozzle/Bed + Labor + Packaging",
            "Multi-Color Waste = Color_Swaps × Purge_Per_Swap (g) × Price_kg / 1000",
            "Electricity = (Printer_Watts × Effective_Hours + Dryer_Watts × Hours) / 1000 × City_Tariff",
            "Depreciation = Printer_Rate × Effective_Hours + Dryer_Rate × Hours",
            "Selling Price = Net_Cost × (1 + Markup %) / Tax_Factor",
          ]}
          notes={[
            "Base running power consumption: calculations reflect sustained hotend and heatbed draw during printing without initial pre-heat spikes (Ender-3: ~100W, K1/K1C: ~125–130W, K1 Max: ~175W, P1S: ~105W, A1: ~85W).",
            "Multi-color waste (Bambu AMS / Creality CFS / Anycubic ACE Pro): purge towers and nozzle flushes can add 30% to 150% extra filament. The calculator accounts for both discarded filament cost and extra tool-change time.",
            "Kazakhstan electricity tariffs by city are updated for 2025/2026. The tariff field remains fully editable to match your exact utility bill.",
            "Batch scaling: file prep and slicing labor are divided evenly across the entire batch, reducing per-unit cost.",
          ]}
        />
      )}
    </Stack>
  );
}
