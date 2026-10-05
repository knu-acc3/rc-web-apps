import { describe, expect, it } from "vitest";
import { calculatePrint3d } from "@/sections/calc/3d-print/engine";
import { KZ_CITIES, PRINTER_PROFILES, MATERIAL_PROFILES } from "@/sections/calc/3d-print/data";

describe("3D printing calculator engine", () => {
  it("handles basic single item calculation with default Bambu Lab P1S and PLA in Almaty", () => {
    const res = calculatePrint3d({
      weightG: 100,
      printHours: 4,
      spoolPriceKg: 6500,
      printerId: "p1s",
      materialId: "pla",
      citySlug: "almaty",
      isCommercialTariff: false,
      markupPct: 100,
    });

    // Material: 100g at 6500 KZT/kg = 650 KZT
    expect(res.materialCost).toBeCloseTo(650, 1);
    // Failure rate (5%): 650 * 0.05 = 32.5 KZT
    expect(res.failureCost).toBeCloseTo(32.5, 1);
    // Electricity: P1S with PLA is 105W. 4h * 105W = 0.42 kWh.
    // Almaty residential tariff = 35.50 KZT/kWh.
    // Electricity cost = 0.42 * 35.5 = 14.91 KZT
    expect(res.electricityCost).toBeCloseTo(14.91, 1);
    // Depreciation: P1S is 57 KZT/h * 4h = 228 KZT
    expect(res.printerDepCost).toBeCloseTo(228, 1);
    // Consumables: bed = 20, nozzle = 5 KZT/h * 4h = 20 KZT -> wearConsumablesCost = 40 KZT
    expect(res.wearConsumablesCost).toBeCloseTo(40, 1);
    // Labor: default prep 10m + post 5m = 15m (0.25h) * 2500 KZT/h = 625 KZT
    expect(res.laborCost).toBeCloseTo(625, 1);
    // Packaging: none = 0
    expect(res.packagingCost).toBe(0);

    const expectedNet = res.materialCost + res.failureCost + res.electricityCost + res.depreciationCost + res.wearConsumablesCost + res.laborCost;
    expect(res.unitNetCost).toBeCloseTo(expectedNet, 1);

    // With 100% markup, price is 2x net cost
    expect(res.unitPrice).toBeCloseTo(expectedNet * 2, 1);
    expect(res.unitProfit).toBeCloseTo(expectedNet, 1);
    expect(res.pricePerGram).toBeCloseTo((expectedNet * 2) / 100, 2);
    expect(res.pricePerHour).toBeCloseTo((expectedNet * 2) / 4, 2);
  });

  it("handles commercial electricity tariffs for various Kazakhstan cities", () => {
    const atyrauRes = calculatePrint3d({
      weightG: 50,
      printHours: 2,
      citySlug: "atyrau",
      isCommercialTariff: true,
      printerId: "p1s",
      materialId: "abs",
    });
    // Atyrau commercial tariff is 52.36 KZT/kWh
    expect(atyrauRes.effectiveTariffKwh).toBe(52.36);

    const pavlodarRes = calculatePrint3d({
      weightG: 50,
      printHours: 2,
      citySlug: "pavlodar",
      isCommercialTariff: false,
    });
    // Pavlodar residential tariff is 21.50 KZT/kWh
    expect(pavlodarRes.effectiveTariffKwh).toBe(21.50);
  });

  it("supports manual tariff override", () => {
    const res = calculatePrint3d({
      weightG: 100,
      printHours: 1,
      citySlug: "almaty",
      customTariffKwh: 42.0,
      printerId: "a1",
    });
    expect(res.effectiveTariffKwh).toBe(42.0);
  });

  it("calculates multi-item batch scaling correctly (sharing prep labor and batch packaging)", () => {
    const single = calculatePrint3d({
      weightG: 100,
      printHours: 2,
      quantity: 1,
      prepMinutes: 30,
      postProcessMinutes: 10,
      hourlyRate: 3000,
      packagingId: "kraft_box",
      packPerBatch: true, // 350 KZT shared for whole batch
    });

    const batch10 = calculatePrint3d({
      weightG: 100,
      printHours: 2,
      quantity: 10,
      prepMinutes: 30,
      postProcessMinutes: 10,
      hourlyRate: 3000,
      packagingId: "kraft_box",
      packPerBatch: true,
    });

    // In batch10, prep labor per unit is 30/10 = 3m instead of 30m
    // single labor: (30 + 10) / 60 * 3000 = 2000 KZT
    // batch10 labor: (3 + 10) / 60 * 3000 = 650 KZT
    expect(single.laborCost).toBe(2000);
    expect(batch10.laborCost).toBe(650);

    // Packaging: single = 350, batch10 = 35 KZT per unit
    expect(single.packagingCost).toBe(350);
    expect(batch10.packagingCost).toBe(35);

    // Unit net cost in batch should be lower than single
    expect(batch10.unitNetCost).toBeLessThan(single.unitNetCost);
    expect(batch10.batchNetCost).toBeCloseTo(batch10.unitNetCost * 10, 1);
  });

  it("calculates AMS color purge / waste overhead", () => {
    const noWaste = calculatePrint3d({
      weightG: 100,
      printHours: 3,
      spoolPriceKg: 10000,
      purgeWastePct: 0,
    });

    const withWaste = calculatePrint3d({
      weightG: 100,
      printHours: 3,
      spoolPriceKg: 10000,
      purgeWastePct: 40, // 40% poop / prime tower
    });

    expect(noWaste.materialCost).toBeCloseTo(1000, 2);
    expect(withWaste.materialCost).toBeCloseTo(1400, 2);
  });

  it("applies abrasive nozzle wear for carbon filaments (PA-CF)", () => {
    const brassNormal = calculatePrint3d({
      weightG: 50,
      printHours: 5,
      materialId: "pla",
      nozzleId: "brass",
    });
    // Brass normal = 4 KZT/h * 5 = 20 KZT (+ 20 bed = 40)
    expect(brassNormal.wearConsumablesCost).toBe(40);

    const brassAbrasive = calculatePrint3d({
      weightG: 50,
      printHours: 5,
      materialId: "pacf", // abrasive!
      nozzleId: "brass",
    });
    // Brass abrasive = 80 KZT/h * 5 = 400 KZT (+ 20 bed = 420)
    expect(brassAbrasive.wearConsumablesCost).toBe(420);
  });

  it("computes filament dryer power and depreciation", () => {
    const withDryer = calculatePrint3d({
      weightG: 80,
      printHours: 4,
      dryerId: "standard", // 55W, 9 KZT/h
      dryingHours: 6,
      citySlug: "almaty",
      isCommercialTariff: false, // 35.5 KZT/kWh
    });

    // Dryer dep = 6h * 9 KZT/h = 54 KZT
    expect(withDryer.dryerDepCost).toBe(54);
    // Dryer kWh = 6h * 55W / 1000 = 0.33 kWh
    // Printer kWh = 4h * 105W / 1000 = 0.42 kWh
    // Total kWh = 0.75 kWh
    const expectedElec = 0.75 * 35.5;
    expect(withDryer.electricityCost).toBeCloseTo(expectedElec, 2);
  });

  it("computes Kazakhstan tax regimes (simplified 3%, retail 4%, VAT 12%)", () => {
    const base = calculatePrint3d({
      weightG: 100,
      printHours: 2,
      markupPct: 50,
      taxRegime: "none",
    });

    const simp = calculatePrint3d({
      weightG: 100,
      printHours: 2,
      markupPct: 50,
      taxRegime: "simplified_3",
    });

    const retail = calculatePrint3d({
      weightG: 100,
      printHours: 2,
      markupPct: 50,
      taxRegime: "retail_4",
    });

    const vat = calculatePrint3d({
      weightG: 100,
      printHours: 2,
      markupPct: 50,
      taxRegime: "vat_12",
    });

    // In simplified_3, unitPrice * (1 - 0.03) = unitPriceBeforeTax
    expect(simp.unitPrice * 0.97).toBeCloseTo(base.unitPrice, 1);
    expect(simp.unitTax).toBeCloseTo(simp.unitPrice * 0.03, 1);

    // In retail_4, unitPrice * (1 - 0.04) = unitPriceBeforeTax
    expect(retail.unitPrice * 0.96).toBeCloseTo(base.unitPrice, 1);
    expect(retail.unitTax).toBeCloseTo(retail.unitPrice * 0.04, 1);

    // In vat_12, unitPrice = unitPriceBeforeTax * 1.12
    expect(vat.unitPrice).toBeCloseTo(base.unitPrice * 1.12, 1);
    expect(vat.unitTax).toBeCloseTo(base.unitPrice * 0.12, 1);
  });

  it("handles zero and boundary inputs gracefully without NaN or negative values", () => {
    const zero = calculatePrint3d({
      weightG: 0,
      printHours: 0,
      quantity: 0,
      spoolPriceKg: 0,
      prepMinutes: 0,
      postProcessMinutes: 0,
      hourlyRate: 0,
      markupPct: 0,
    });

    expect(Number.isFinite(zero.unitPrice)).toBe(true);
    expect(Number.isFinite(zero.marginPct)).toBe(true);
    expect(zero.unitPrice).toBeGreaterThanOrEqual(0);
    expect(zero.quantity).toBe(1); // normalized to at least 1
    expect(zero.pricePerGram).toBe(0);
    expect(zero.pricePerHour).toBe(0);
  });

  it("calculates dedicated multi-color printing (AMS / CFS / ACE Pro)", () => {
    const multi = calculatePrint3d({
      weightG: 100,
      printHours: 5,
      isMultiColor: true,
      colorCount: 4,
      colorSwaps: 200,
      purgePerSwapG: 0.35, // 70g wasted on poop + purge tower
      swapTimeSec: 60, // 200 min = 3.333 hours extra machine time
      spoolPriceKg: 8000,
      printerId: "p1s",
    });

    // Model = 100g, Purge = 70g -> effective weight = 170g
    expect(multi.isMultiColor).toBe(true);
    expect(multi.multiColorPurgeG).toBe(70);
    expect(multi.multiColorPurgeCost).toBeCloseTo(0.07 * 8000, 2); // 560 KZT
    expect(multi.effectiveWeightG).toBeCloseTo(170, 2);
    expect(multi.materialCost).toBeCloseTo((170 / 1000) * 8000, 2); // 1360 KZT

    // Machine time: 5h + (200 * 60 / 3600) = 5 + 3.333 = 8.333h
    expect(multi.multiColorSwapHours).toBeCloseTo(3.333, 2);
    expect(multi.effectivePrintHours).toBeCloseTo(8.333, 2);

    // Depreciation should scale with effectivePrintHours: 8.333h * 57 KZT/h = 475 KZT
    expect(multi.printerDepCost).toBeCloseTo(8.333 * 57, 0);
  });

  it("has valid database entries for all 18 Kazakhstan cities and all printers (Bambu, Creality, Anycubic)", () => {
    expect(KZ_CITIES.length).toBe(18);
    for (const city of KZ_CITIES) {
      expect(city.residentialTariff).toBeGreaterThan(0);
      expect(city.commercialTariff).toBeGreaterThan(city.residentialTariff);
      expect(city.name.ru.length).toBeGreaterThan(0);
      expect(city.name.en.length).toBeGreaterThan(0);
    }

    const printers = Object.values(PRINTER_PROFILES);
    expect(printers.length).toBeGreaterThanOrEqual(12);

    // Specific distinct models requested by user
    expect(PRINTER_PROFILES.x1c).toBeDefined();
    expect(PRINTER_PROFILES.p1s).toBeDefined();
    expect(PRINTER_PROFILES.a1).toBeDefined();
    expect(PRINTER_PROFILES.a1_mini).toBeDefined();
    expect(PRINTER_PROFILES.k1).toBeDefined();
    expect(PRINTER_PROFILES.k1_max).toBeDefined();
    expect(PRINTER_PROFILES.k2_plus).toBeDefined();
    expect(PRINTER_PROFILES.ender3).toBeDefined();
    expect(PRINTER_PROFILES.ender5).toBeDefined();
    expect(PRINTER_PROFILES.kobra2).toBeDefined();
    expect(PRINTER_PROFILES.kobra3_combo).toBeDefined();
    expect(PRINTER_PROFILES.neptune4).toBeDefined();
    expect(PRINTER_PROFILES.centauri).toBeDefined();
    expect(PRINTER_PROFILES.q1_pro).toBeDefined();
    expect(PRINTER_PROFILES.plus4).toBeDefined();
    expect(PRINTER_PROFILES.adventurer5m).toBeDefined();
    expect(PRINTER_PROFILES.adventurer4).toBeDefined();
    expect(PRINTER_PROFILES.creator_pro2).toBeDefined();
    expect(PRINTER_PROFILES.ghost6).toBeDefined();
    expect(PRINTER_PROFILES.klp1).toBeDefined();
    expect(PRINTER_PROFILES.custom).toBeDefined();

    // Verify removed brands/clones (prusa, voron, p1p) are absent
    expect((PRINTER_PROFILES as Record<string, unknown>).mk4).toBeUndefined();
    expect((PRINTER_PROFILES as Record<string, unknown>).voron24).toBeUndefined();
    expect((PRINTER_PROFILES as Record<string, unknown>).a2l).toBeUndefined();
    expect((PRINTER_PROFILES as Record<string, unknown>).p1p).toBeUndefined();
    expect(PRINTER_PROFILES.p2s).toBeDefined();

    for (const p of printers) {
      expect(p.depreciationPerHour).toBe(Math.round(p.priceKzt / p.lifespanHours));
      expect(p.defaultPower).toBeGreaterThan(0);
      expect(p.powerByMaterial.pla).toBeGreaterThan(0);
      expect(p.powerByMaterial.petg).toBeGreaterThanOrEqual(p.powerByMaterial.pla);
      expect(p.powerByMaterial.abs).toBeGreaterThanOrEqual(p.powerByMaterial.petg);
      expect(p.powerByMaterial.pacf).toBeGreaterThanOrEqual(p.powerByMaterial.petg);
      expect(p.brand).toBeDefined();
    }

    const materials = Object.values(MATERIAL_PROFILES);
    expect(materials.length).toBeGreaterThanOrEqual(5);
    for (const m of materials) {
      expect(m.defaultPriceKg).toBeGreaterThan(0);
      expect(m.density).toBeGreaterThan(0);
    }
  });

  it("calculates supports and brim correctly", () => {
    // 100g base weight with medium supports (+20%) and brim (+5g)
    const res = calculatePrint3d({
      weightG: 100,
      printHours: 4,
      supportsType: "medium",
      hasBrim: true,
      spoolPriceKg: 6500,
      printerId: "p1s",
      materialId: "pla",
    });

    // Supports: 20g
    expect(res.supportsWeightG).toBe(20);
    // Brim: 5g
    expect(res.brimWeightG).toBe(5);
    // Total net filament: 100 + 20 + 5 = 125g
    expect(res.effectiveWeightG).toBe(125);
    // Filament cost: 125 * 6.5 = 812.5 KZT
    expect(res.materialCost).toBeCloseTo(812.5, 1);
  });

  it("enforces minimum order threshold for small prints (e.g. 10g part)", () => {
    const res = calculatePrint3d({
      weightG: 10,
      printHours: 0.5,
      spoolPriceKg: 6500,
      minOrderFeeKzt: 2000,
      markupPct: 50,
      printerId: "a1_mini",
    });

    // Raw calculated price would be ~300-500 KZT, but minimum order fee is 2000 KZT
    expect(res.isMinOrderApplied).toBe(true);
    expect(res.unitPrice).toBe(2000);
    expect(res.batchPrice).toBe(2000);
  });

  it("calculates setup fee and 3D modeling charges", () => {
    const res = calculatePrint3d({
      weightG: 100,
      printHours: 2,
      platesCount: 3,
      setupFeeKzt: 1000,
      modelingHours: 2,
      modelingHourlyRate: 7500,
      quantity: 5,
    });

    // Setup fee total: 3 plates * 1000 KZT = 3000 KZT
    expect(res.setupFeeTotal).toBe(3000);
    // Modeling fee total: 2h * 7500 = 15000 KZT
    expect(res.modelingFeeTotal).toBe(15000);
  });

  it("calculates custom machine investment including AMS module", () => {
    const res = calculatePrint3d({
      weightG: 100,
      printHours: 10,
      printerPurchasePriceKzt: 350000,
      hasAmsCombo: true,
      amsPurchasePriceKzt: 150000,
      printerLifespanHours: 5000,
    });

    // Total machine: 350 000 + 150 000 = 500 000 KZT.
    // Lifespan: 5000 h -> 100 KZT/h.
    expect(res.printerHourlyDepreciation).toBe(100);
    // 10h * 100 = 1000 KZT
    expect(res.printerDepCost).toBe(1000);
  });
});
