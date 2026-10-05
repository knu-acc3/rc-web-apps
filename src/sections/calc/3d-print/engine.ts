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
  type TaxRegimeId,
} from "./data";

export interface Print3dInput {
  weightG: number;
  printHours: number;
  quantity?: number;
  spoolPriceKg?: number;
  purgeWastePct?: number; // extra waste (brim, supports)
  failureRatePct?: number;
  printerId?: PrinterId;
  customWatts?: number;
  customPrinterDepPerHour?: number;
  materialId?: MaterialId;
  citySlug?: string;
  isCommercialTariff?: boolean;
  customTariffKwh?: number;
  dryerId?: DryerId;
  dryingHours?: number;
  nozzleId?: NozzleId;
  bedConsumableCost?: number;
  prepMinutes?: number;
  postProcessMinutes?: number;
  hourlyRate?: number;
  packagingId?: PackagingId;
  customPackCost?: number;
  packPerBatch?: boolean;
  markupPct?: number;
  taxRegime?: TaxRegimeId;

  // Multi-color print options
  isMultiColor?: boolean;
  colorCount?: number;
  colorSwaps?: number; // total filament changes / retractions
  purgePerSwapG?: number; // grams purged per swap (purge tower + poop)
  swapTimeSec?: number; // seconds spent per tool change
}

export interface Print3dResult {
  // Quantities
  quantity: number;
  weightG: number;
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

  // Single unit costs
  materialCost: number;
  failureCost: number;
  electricityCost: number;
  printerDepCost: number;
  dryerDepCost: number;
  depreciationCost: number;
  nozzleWearCost: number;
  bedConsumableCost: number;
  wearConsumablesCost: number;
  laborCost: number;
  packagingCost: number;
  unitNetCost: number;

  // Batch totals
  batchNetCost: number;
  batchElectricityKwh: number;
  batchMaterialWeightG: number;

  // Pricing & Profit
  unitPriceBeforeTax: number;
  unitTax: number;
  unitPrice: number;
  unitProfit: number;
  batchPrice: number;
  batchTax: number;
  batchProfit: number;
  marginPct: number;

  // Unit metrics
  pricePerGram: number;
  pricePerHour: number;

  // Breakdown percentages of total unit price (summing to ~100)
  shares: {
    material: number;
    failure: number;
    electricity: number;
    depreciation: number;
    wear: number;
    labor: number;
    packaging: number;
    tax: number;
    profit: number;
  };

  // Resolved parameters used in calculation
  effectiveTariffKwh: number;
  printerWatts: number;
  dryerWatts: number;
  cityName: { ru: string; en: string };
  printerName: string;
  materialName: string;
}

export function calculatePrint3d(input: Print3dInput): Print3dResult {
  const qty = Math.max(1, Math.round(input.quantity ?? 1));
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

  const prepMinutes = Math.max(0, input.prepMinutes ?? 10);
  const postProcessMinutes = Math.max(0, input.postProcessMinutes ?? 5);
  const hourlyRate = Math.max(0, input.hourlyRate ?? 2500);

  const packOption = PACKAGING_OPTIONS[input.packagingId ?? "none"] ?? PACKAGING_OPTIONS.none;
  const basePackCost = input.customPackCost !== undefined && input.customPackCost >= 0 ? input.customPackCost : packOption.costKzt;
  const packPerBatch = !!input.packPerBatch;
  const packagingCostPerUnit = packPerBatch ? basePackCost / qty : basePackCost;

  const markupPct = Math.max(0, input.markupPct ?? 100);
  const taxRegime = TAX_REGIMES[input.taxRegime ?? "none"] ?? TAX_REGIMES.none;

  const isMultiColor = !!input.isMultiColor;
  const colorCount = isMultiColor ? Math.max(2, Math.round(input.colorCount ?? 4)) : 1;
  const colorSwaps = isMultiColor ? Math.max(0, Math.round(input.colorSwaps ?? 250)) : 0;
  const purgePerSwapG = isMultiColor ? Math.max(0, input.purgePerSwapG ?? 0.35) : 0;
  const swapTimeSec = isMultiColor ? Math.max(0, input.swapTimeSec ?? 60) : 0;

  const multiColorPurgeG = colorSwaps * purgePerSwapG;
  const multiColorSwapHours = (colorSwaps * swapTimeSec) / 3600;
  const multiColorPurgeCost = (multiColorPurgeG / 1000) * spoolPriceKg;

  const effectivePrintHours = printHours + multiColorSwapHours;

  // 1. Material
  const effectiveWeightG = (weight + multiColorPurgeG) * (1 + purgeWastePct / 100);
  const materialCost = (effectiveWeightG / 1000) * spoolPriceKg;
  const failureCost = materialCost * (failureRatePct / 100);

  // 2. Power & Electricity (Base active power without peak spikes)
  const printerWatts = input.customWatts !== undefined && input.customWatts >= 0
    ? input.customWatts
    : printer.powerByMaterial[material.id] ?? printer.defaultPower;
  const printerKwh = (printerWatts * effectivePrintHours) / 1000;
  const dryerWatts = dryer.watts;
  const dryerKwh = (dryerWatts * dryingHours) / 1000;
  const unitElectricityKwh = printerKwh + dryerKwh;
  const electricityCost = unitElectricityKwh * effectiveTariffKwh;

  // 3. Equipment Depreciation
  const printerDepPerHour = input.customPrinterDepPerHour !== undefined && input.customPrinterDepPerHour >= 0
    ? input.customPrinterDepPerHour
    : printer.depreciationPerHour;
  const printerDepCost = printerDepPerHour * effectivePrintHours;
  const dryerDepCost = dryer.depreciationPerHour * dryingHours;
  const depreciationCost = printerDepCost + dryerDepCost;

  // 4. Wear & Consumables
  const nozzleWearPerHour = material.abrasive ? nozzle.wearPerHourAbrasive : nozzle.wearPerHour;
  const nozzleWearCost = nozzleWearPerHour * effectivePrintHours;
  const wearConsumablesCost = nozzleWearCost + bedConsumableCost;

  // 5. Labor
  // File prep is divided across the whole batch, post-processing is per piece
  const laborMinutesPerUnit = (prepMinutes / qty) + postProcessMinutes;
  const laborCost = (laborMinutesPerUnit / 60) * hourlyRate;

  // 6. Net Cost
  const unitNetCost =
    materialCost +
    failureCost +
    electricityCost +
    depreciationCost +
    wearConsumablesCost +
    laborCost +
    packagingCostPerUnit;
  const batchNetCost = unitNetCost * qty;

  // 7. Commercial Pricing & Taxes
  const unitPriceBeforeTax = unitNetCost * (1 + markupPct / 100);

  let unitPrice = unitPriceBeforeTax;
  let unitTax = 0;

  if (taxRegime.id === "simplified_3") {
    // 3% turnover tax (Price = CostWithMarkup / (1 - 0.03))
    unitPrice = unitPriceBeforeTax / (1 - 0.03);
    unitTax = unitPrice * 0.03;
  } else if (taxRegime.id === "retail_4") {
    // 4% retail tax
    unitPrice = unitPriceBeforeTax / (1 - 0.04);
    unitTax = unitPrice * 0.04;
  } else if (taxRegime.id === "vat_12") {
    // 12% VAT added on top
    unitPrice = unitPriceBeforeTax * 1.12;
    unitTax = unitPriceBeforeTax * 0.12;
  }

  const unitProfit = Math.max(0, unitPrice - unitNetCost - unitTax);
  const batchPrice = unitPrice * qty;
  const batchTax = unitTax * qty;
  const batchProfit = unitProfit * qty;
  const marginPct = batchPrice > 0 ? (batchProfit / batchPrice) * 100 : 0;

  const pricePerGram = weight > 0 ? unitPrice / weight : 0;
  const pricePerHour = effectivePrintHours > 0 ? unitPrice / effectivePrintHours : 0;

  // Cost shares
  const safeTotal = unitPrice > 0 ? unitPrice : 1;
  const shares = {
    material: (materialCost / safeTotal) * 100,
    failure: (failureCost / safeTotal) * 100,
    electricity: (electricityCost / safeTotal) * 100,
    depreciation: (depreciationCost / safeTotal) * 100,
    wear: (wearConsumablesCost / safeTotal) * 100,
    labor: (laborCost / safeTotal) * 100,
    packaging: (packagingCostPerUnit / safeTotal) * 100,
    tax: (unitTax / safeTotal) * 100,
    profit: (unitProfit / safeTotal) * 100,
  };

  return {
    quantity: qty,
    weightG: weight,
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
    failureCost,
    electricityCost,
    printerDepCost,
    dryerDepCost,
    depreciationCost,
    nozzleWearCost,
    bedConsumableCost,
    wearConsumablesCost,
    laborCost,
    packagingCost: packagingCostPerUnit,
    unitNetCost,
    batchNetCost,
    batchElectricityKwh: unitElectricityKwh * qty,
    batchMaterialWeightG: effectiveWeightG * qty,
    unitPriceBeforeTax,
    unitTax,
    unitPrice,
    unitProfit,
    batchPrice,
    batchTax,
    batchProfit,
    marginPct,
    pricePerGram,
    pricePerHour,
    shares,
    effectiveTariffKwh,
    printerWatts,
    dryerWatts,
    cityName: city.name,
    printerName: printer.name,
    materialName: material.name,
  };
}
