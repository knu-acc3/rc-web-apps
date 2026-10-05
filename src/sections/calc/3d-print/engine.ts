import {
  DRYER_PROFILES,
  KZ_CITIES,
  MATERIAL_PROFILES,
  NOZZLE_PROFILES,
  PACKAGING_OPTIONS,
  PRINTER_PROFILES,
  TAX_REGIMES,
  type DryerId,
  type MaterialId,
  type NozzleId,
  type PackagingId,
  type PrinterId,
  type SupportsType,
  type TaxRegimeId,
} from "./data";

export interface Print3dInput {
  weightG: number;
  printHours: number;
  quantity?: number;
  platesCount?: number; // Количество столов в проекте
  spoolPriceKg?: number;
  purgeWastePct?: number; // % на отходы (брак, юбки)
  failureRatePct?: number;

  // Поддержки и кайма
  supportsType?: SupportsType;
  customSupportsWeightG?: number;
  hasBrim?: boolean; // Кайма для адгезии (+5 г, +3 мин)

  // Принтер и амортизация
  printerId?: PrinterId;
  printerPurchasePriceKzt?: number; // Цена покупки принтера
  hasAmsCombo?: boolean; // Модуль AMS / CFS
  amsPurchasePriceKzt?: number;
  printerLifespanHours?: number; // Срок окупаемости в часах (по умолчанию 5000)
  customWatts?: number;
  customPrinterDepPerHour?: number;

  // Материал и город
  materialId?: MaterialId;
  citySlug?: string;
  isCommercialTariff?: boolean;
  customTariffKwh?: number;

  // Сушилка
  dryerId?: DryerId;
  dryingHours?: number;

  // Сопло и расходники
  nozzleId?: NozzleId;
  customNozzleWearPerHour?: number; // Ручной ввод износа сопла ₸/ч
  bedConsumableCost?: number;

  // Работа мастера и запуск стола
  setupFeeKzt?: number; // Плата за запуск стола (по умолчанию 0, настраивается)
  prepMinutes?: number;
  postProcessMinutes?: number;
  hourlyRate?: number;

  // 3D-моделирование (CAD / исправление STL)
  modelingHours?: number;
  modelingHourlyRate?: number;

  // Минимальный порог заказа
  minOrderFeeKzt?: number; // Минимальный заказ мастерской (по умолчанию 0 или порог)

  // Упаковка
  packagingId?: PackagingId;
  customPackCost?: number; // Ручной ввод упаковки ₸/шт
  packPerBatch?: boolean;

  // Наценка, модель ценообразования и налоги
  pricingMode?: "cost_plus" | "market_rate";
  marketRatePerGram?: number; // ₸/г по рыночной ставке в РК (по умолчанию 35)
  maintenancePerHour?: number; // Резерв на ремонт и ТО станка (₸/ч)
  markupPct?: number;
  taxRegime?: TaxRegimeId;

  // Многоцветная печать
  isMultiColor?: boolean;
  colorCount?: number;
  colorSwaps?: number;
  purgePerSwapG?: number;
  swapTimeSec?: number;
  multiColorPurgeG?: number; // Прямой вес сброса/башни из слайсера (г)
}

export interface Print3dResult {
  // Quantities
  quantity: number;
  platesCount: number;
  weightG: number;
  supportsWeightG: number;
  brimWeightG: number;
  effectiveWeightG: number;
  printHours: number;
  effectivePrintHours: number;

  // Multi-color specifics
  isMultiColor: boolean;
  colorCount: number;
  colorSwaps: number;
  multiColorPurgeG: number;
  multiColorPurgeCost: number;
  multiColorSwapHours: number;

  // Breakdown costs
  materialCost: number;
  supportsCost: number;
  brimCost: number;
  failureCost: number;
  electricityCost: number;
  printerDepCost: number;
  dryerDepCost: number;
  depreciationCost: number;
  nozzleWearCost: number;
  bedConsumableCost: number;
  wearConsumablesCost: number;
  maintenanceCost: number;
  physicalLaborCost: number;
  setupFeeTotal: number;
  modelingFeeTotal: number;
  laborCost: number;
  packagingCost: number;
  unitNetCost: number;

  // Batch totals
  batchNetCost: number;
  batchElectricityKwh: number;
  batchMaterialWeightG: number;

  // Pricing & Profit
  pricingMode: "cost_plus" | "market_rate";
  marketRatePerGram: number;
  unitPriceBeforeTax: number;
  unitTax: number;
  unitPrice: number;
  unitProfit: number;
  batchPrice: number;
  batchTax: number;
  batchProfit: number;
  marginPct: number;

  // Market Reference Benchmark in Kazakhstan
  marketRefMin: number;
  marketRefMax: number;
  marketRefAvg: number;
  marketRefMinRate: number;
  marketRefMaxRate: number;
  marketComparison: "below" | "market" | "above";

  // Minimum Order Check
  isMinOrderApplied: boolean;
  minOrderFeeKzt: number;

  // Unit metrics
  pricePerGram: number;
  pricePerHour: number;

  // Shares for charts
  shares: {
    material: number;
    failure: number;
    electricity: number;
    depreciation: number;
    wear: number;
    maintenance: number;
    labor: number;
    packaging: number;
    tax: number;
    profit: number;
  };

  // Resolved parameters
  effectiveTariffKwh: number;
  printerWatts: number;
  dryerWatts: number;
  cityName: { ru: string; en: string };
  printerName: string;
  materialName: string;
  printerPurchasePriceKzt: number;
  hasAmsCombo: boolean;
  amsPurchasePriceKzt: number;
  printerHourlyDepreciation: number;
  maintenancePerHour: number;
  resolvedNozzleWearPerHour: number;
}

export function calculatePrint3d(input: Print3dInput): Print3dResult {
  const qty = Math.max(1, Math.round(input.quantity ?? 1));
  const plates = Math.max(1, Math.round(input.platesCount ?? 1));
  const weight = Math.max(0, input.weightG || 0);
  const printHours = Math.max(0, input.printHours || 0);
  const purgeWastePct = Math.max(0, input.purgeWastePct ?? 0);
  const failureRatePct = Math.max(0, input.failureRatePct ?? 5);

  const printer = PRINTER_PROFILES[input.printerId ?? "p1s"] ?? PRINTER_PROFILES.p1s;
  const material = MATERIAL_PROFILES[input.materialId ?? "pla"] ?? MATERIAL_PROFILES.pla;
  const spoolPriceKg = Math.max(0, input.spoolPriceKg ?? material.defaultPriceKg);

  const city = KZ_CITIES.find((c) => c.slug === input.citySlug) ?? KZ_CITIES[0];
  const isCommercial = !!input.isCommercialTariff;
  const effectiveTariffKwh = input.customTariffKwh !== undefined && input.customTariffKwh >= 0
    ? input.customTariffKwh
    : isCommercial
    ? city.commercialTariff
    : city.residentialTariff;

  const dryer = DRYER_PROFILES[input.dryerId ?? "none"] ?? DRYER_PROFILES.none;
  const dryingHours = Math.max(0, input.dryingHours ?? 0);

  const nozzle = NOZZLE_PROFILES[input.nozzleId ?? "hardened"] ?? NOZZLE_PROFILES.hardened;
  const bedConsumableCost = Math.max(0, input.bedConsumableCost ?? 20);

  // Supports & Brim
  const supportsType = input.supportsType ?? "none";
  let supportsWeightG = 0;
  if (supportsType === "light") supportsWeightG = weight * 0.10;
  else if (supportsType === "medium") supportsWeightG = weight * 0.20;
  else if (supportsType === "heavy") supportsWeightG = weight * 0.35;
  else if (supportsType === "custom") supportsWeightG = Math.max(0, input.customSupportsWeightG ?? 0);

  const hasBrim = !!input.hasBrim;
  const brimWeightG = hasBrim ? 5 : 0;
  const brimTimeHours = hasBrim ? (3 / 60) : 0;

  // Multi-color specifics
  const isMultiColor = !!input.isMultiColor;
  const colorCount = isMultiColor ? Math.max(2, Math.round(input.colorCount ?? 4)) : 1;
  const colorSwaps = isMultiColor ? Math.max(0, Math.round(input.colorSwaps ?? 250)) : 0;
  const purgePerSwapG = isMultiColor ? Math.max(0, input.purgePerSwapG ?? 0.35) : 0;
  const swapTimeSec = isMultiColor ? Math.max(0, input.swapTimeSec ?? 60) : 0;

  const multiColorPurgeG = isMultiColor
    ? (input.multiColorPurgeG !== undefined ? Math.max(0, input.multiColorPurgeG) : (colorSwaps * purgePerSwapG))
    : 0;
  const multiColorSwapHours = isMultiColor ? (colorSwaps * swapTimeSec) / 3600 : 0;

  const effectivePrintHours = printHours + brimTimeHours + multiColorSwapHours;

  // 1. Material
  const netFilamentWeightG = weight + supportsWeightG + brimWeightG + multiColorPurgeG;
  const effectiveWeightG = netFilamentWeightG * (1 + purgeWastePct / 100);
  const materialCost = (effectiveWeightG / 1000) * spoolPriceKg;
  const failureCost = materialCost * (failureRatePct / 100);

  const supportsCost = (supportsWeightG / 1000) * spoolPriceKg;
  const brimCost = (brimWeightG / 1000) * spoolPriceKg;
  const multiColorPurgeCost = (multiColorPurgeG / 1000) * spoolPriceKg;

  // 2. Power & Electricity (Base active wattage without spikes)
  const printerWatts = input.customWatts !== undefined && input.customWatts >= 0
    ? input.customWatts
    : printer.powerByMaterial[material.id] ?? printer.defaultPower;
  const printerKwh = (printerWatts * effectivePrintHours) / 1000;
  const dryerWatts = dryer.watts;
  const dryerKwh = (dryerWatts * dryingHours) / 1000;
  const unitElectricityKwh = printerKwh + dryerKwh;
  const electricityCost = unitElectricityKwh * effectiveTariffKwh;

  // 3. Equipment Depreciation
  const hasAmsCombo = input.hasAmsCombo !== undefined ? input.hasAmsCombo : (isMultiColor && printer.multiColorCapable);
  const printerPurchasePrice = input.printerPurchasePriceKzt !== undefined && input.printerPurchasePriceKzt >= 0
    ? input.printerPurchasePriceKzt
    : printer.priceKzt;
  const amsPurchasePrice = hasAmsCombo
    ? (input.amsPurchasePriceKzt !== undefined && input.amsPurchasePriceKzt >= 0 ? input.amsPurchasePriceKzt : (printer.amsPriceKzt ?? 0))
    : 0;
  const totalMachineInvest = printerPurchasePrice + amsPurchasePrice;
  const lifespanHours = Math.max(500, input.printerLifespanHours || printer.lifespanHours || 5000);
  const printerHourlyDepreciation = input.customPrinterDepPerHour !== undefined && input.customPrinterDepPerHour >= 0
    ? input.customPrinterDepPerHour
    : (input.printerPurchasePriceKzt !== undefined || input.hasAmsCombo !== undefined || input.printerLifespanHours !== undefined)
    ? (totalMachineInvest / lifespanHours)
    : printer.depreciationPerHour;

  const printerDepCost = printerHourlyDepreciation * effectivePrintHours;
  const dryerDepCost = dryer.depreciationPerHour * dryingHours;
  const depreciationCost = printerDepCost + dryerDepCost;

  // 4. Wear & Consumables & Maintenance Buffer (защита от поломок)
  const defaultNozzleRate = material.abrasive ? nozzle.wearPerHourAbrasive : nozzle.wearPerHour;
  const resolvedNozzleWearPerHour = input.customNozzleWearPerHour !== undefined && input.customNozzleWearPerHour >= 0
    ? input.customNozzleWearPerHour
    : defaultNozzleRate;
  const nozzleWearCost = resolvedNozzleWearPerHour * effectivePrintHours;
  const wearConsumablesCost = nozzleWearCost + bedConsumableCost;

  // Резерв на ремонт и ТО станка (ремни, термисторы, экструдер, электроника)
  const maintenancePerHour = Math.max(0, input.maintenancePerHour ?? 0);
  const maintenanceCost = maintenancePerHour * effectivePrintHours;

  // 5. Labor & Setup & Modeling
  const prepMinutes = Math.max(0, input.prepMinutes ?? 10);
  const postProcessMinutes = Math.max(0, input.postProcessMinutes ?? 5);
  const hourlyRate = Math.max(0, input.hourlyRate ?? 2500);

  // Setup fee: per plate, allocated across units
  const setupFeePerPlate = Math.max(0, input.setupFeeKzt ?? 0);
  const setupFeeTotal = setupFeePerPlate * plates;
  const setupFeePerUnit = setupFeeTotal / qty;

  // Modeling fee: total for order, allocated across units
  const modelingHours = Math.max(0, input.modelingHours ?? 0);
  const modelingHourlyRate = Math.max(0, input.modelingHourlyRate ?? 5000);
  const modelingFeeTotal = modelingHours * modelingHourlyRate;
  const modelingFeePerUnit = modelingFeeTotal / qty;

  // Physical labor (file prep + post-processing)
  const physicalLaborMinutesPerUnit = (prepMinutes / qty) + postProcessMinutes;
  const physicalLaborCost = (physicalLaborMinutesPerUnit / 60) * hourlyRate;
  const laborCost = physicalLaborCost + setupFeePerUnit + modelingFeePerUnit;

  // 6. Packaging
  const packOption = PACKAGING_OPTIONS[input.packagingId ?? "none"] ?? PACKAGING_OPTIONS.none;
  const basePackCost = input.customPackCost !== undefined && input.customPackCost >= 0 ? input.customPackCost : packOption.costKzt;
  const packPerBatch = !!input.packPerBatch;
  const packagingCostPerUnit = packPerBatch ? basePackCost / qty : basePackCost;

  // 7. Net Cost (включая сырьё, свет, износ, ТО, работу мастера)
  const unitNetCost =
    materialCost +
    failureCost +
    electricityCost +
    depreciationCost +
    wearConsumablesCost +
    maintenanceCost +
    laborCost +
    packagingCostPerUnit;
  const batchNetCost = unitNetCost * qty;

  // 8. Commercial Pricing & Taxes
  const pricingMode = input.pricingMode ?? "cost_plus";
  const marketRatePerGram = Math.max(1, input.marketRatePerGram ?? 35);
  const markupPct = Math.max(0, input.markupPct ?? 40);
  const taxRegime = TAX_REGIMES[input.taxRegime ?? "none"] ?? TAX_REGIMES.none;

  let unitPriceBeforeTax: number;
  if (pricingMode === "market_rate") {
    // Расчёт по рыночной ставке за грамм (Казахстан: 30–50 ₸/г)
    // Базируется на фактически расходуемом филаменте (деталь + поддержки + кайма + сброс)
    const baseG = netFilamentWeightG > 0 ? netFilamentWeightG : (weight > 0 ? weight : 1);
    const marketUnitBase = baseG * marketRatePerGram + setupFeePerUnit + modelingFeePerUnit;
    // Защита от продажи в ноль или убыток: гарантируем минимальную маржу 15% над себестоимостью
    unitPriceBeforeTax = Math.max(unitNetCost * 1.15, marketUnitBase);
  } else {
    // Наценка на себестоимость
    unitPriceBeforeTax = unitNetCost * (1 + markupPct / 100);
  }

  let rawUnitPrice = unitPriceBeforeTax;
  let unitTax = 0;

  if (taxRegime.id === "simplified_3") {
    rawUnitPrice = unitPriceBeforeTax / (1 - 0.03);
    unitTax = rawUnitPrice * 0.03;
  } else if (taxRegime.id === "retail_4") {
    rawUnitPrice = unitPriceBeforeTax / (1 - 0.04);
    unitTax = rawUnitPrice * 0.04;
  } else if (taxRegime.id === "vat_12") {
    rawUnitPrice = unitPriceBeforeTax * 1.12;
    unitTax = unitPriceBeforeTax * 0.12;
  }

  const rawBatchPrice = rawUnitPrice * qty;
  const minOrderFeeKzt = Math.max(0, input.minOrderFeeKzt ?? 0);
  const isMinOrderApplied = minOrderFeeKzt > 0 && rawBatchPrice < minOrderFeeKzt;
  const finalBatchPrice = isMinOrderApplied ? minOrderFeeKzt : rawBatchPrice;
  const finalUnitPrice = finalBatchPrice / qty;
  const batchTax = unitTax * qty;
  const batchProfit = Math.max(0, finalBatchPrice - batchNetCost - batchTax);
  const unitProfit = batchProfit / qty;
  const marginPct = finalBatchPrice > 0 ? (batchProfit / finalBatchPrice) * 100 : 0;

  const pricePerGram = weight > 0 ? finalUnitPrice / weight : 0;
  const pricePerHour = effectivePrintHours > 0 ? finalUnitPrice / effectivePrintHours : 0;

  // Рыночный бенчмарк в Казахстане (стандарт 30–45 ₸/г, спецпластики 40–70 ₸/г)
  const minRatePerGram = material.id === "pacf" ? 50 : material.id === "tpu" ? 40 : 30;
  const maxRatePerGram = material.id === "pacf" ? 70 : material.id === "tpu" ? 60 : 45;
  const baseMarketWeight = weight > 0 ? weight : 1;
  const marketRefMin = Math.round(baseMarketWeight * minRatePerGram * qty);
  const marketRefMax = Math.round(baseMarketWeight * maxRatePerGram * qty);
  const marketRefAvg = Math.round(baseMarketWeight * ((minRatePerGram + maxRatePerGram) / 2) * qty);

  let marketComparison: "below" | "market" | "above" = "market";
  if (pricePerGram < minRatePerGram * 0.95) {
    marketComparison = "below";
  } else if (pricePerGram > maxRatePerGram * 1.05) {
    marketComparison = "above";
  }

  // Cost shares
  const safeTotal = finalUnitPrice > 0 ? finalUnitPrice : 1;
  const shares = {
    material: (materialCost / safeTotal) * 100,
    failure: (failureCost / safeTotal) * 100,
    electricity: (electricityCost / safeTotal) * 100,
    depreciation: (depreciationCost / safeTotal) * 100,
    wear: (wearConsumablesCost / safeTotal) * 100,
    maintenance: (maintenanceCost / safeTotal) * 100,
    labor: (laborCost / safeTotal) * 100,
    packaging: (packagingCostPerUnit / safeTotal) * 100,
    tax: (unitTax / safeTotal) * 100,
    profit: (unitProfit / safeTotal) * 100,
  };

  return {
    quantity: qty,
    platesCount: plates,
    weightG: weight,
    supportsWeightG,
    brimWeightG,
    effectiveWeightG,
    printHours,
    effectivePrintHours,
    isMultiColor,
    colorCount,
    colorSwaps,
    multiColorPurgeG,
    multiColorPurgeCost,
    multiColorSwapHours,
    materialCost,
    supportsCost,
    brimCost,
    failureCost,
    electricityCost,
    printerDepCost,
    dryerDepCost,
    depreciationCost,
    nozzleWearCost,
    bedConsumableCost,
    wearConsumablesCost,
    maintenanceCost,
    physicalLaborCost,
    setupFeeTotal,
    modelingFeeTotal,
    laborCost,
    packagingCost: packagingCostPerUnit,
    unitNetCost,
    batchNetCost,
    batchElectricityKwh: unitElectricityKwh * qty,
    batchMaterialWeightG: effectiveWeightG * qty,
    pricingMode,
    marketRatePerGram,
    unitPriceBeforeTax,
    unitTax,
    unitPrice: finalUnitPrice,
    unitProfit,
    batchPrice: finalBatchPrice,
    batchTax,
    batchProfit,
    marginPct,
    marketRefMin,
    marketRefMax,
    marketRefAvg,
    marketRefMinRate: minRatePerGram,
    marketRefMaxRate: maxRatePerGram,
    marketComparison,
    isMinOrderApplied,
    minOrderFeeKzt,
    pricePerGram,
    pricePerHour,
    shares,
    effectiveTariffKwh,
    printerWatts,
    dryerWatts,
    cityName: city.name,
    printerName: printer.shortName,
    materialName: material.name,
    printerPurchasePriceKzt: printerPurchasePrice,
    hasAmsCombo,
    amsPurchasePriceKzt: amsPurchasePrice,
    printerHourlyDepreciation,
    maintenancePerHour,
    resolvedNozzleWearPerHour,
  };
}
