import { describe, expect, it } from "vitest";
import {
  alcoholGrams,
  bmi,
  bmiBodyFat,
  bmiClass,
  fatCategory,
  ftInToCm,
  harrisBenedict,
  healthyRange,
  idealWeight,
  lbToKg,
  macroGrams,
  maxHrFox,
  maxHrTanaka,
  mifflin,
  ML_PER_FLOZ,
  navyBodyFat,
  targetHr,
  waterIntake,
  weeklyChange,
  whtrCategory,
  widmark,
} from "@/tools/calc/health/lib/body";

describe("BMI (WHO adult classes)", () => {
  it("computes BMI", () => {
    expect(bmi(70, 175)).toBeCloseTo(22.857, 3); // 70 / 1.75²
    // 5 ft 9 in = 175.26 cm, 154 lb = 69.853 kg → 22.74
    expect(bmi(lbToKg(154), ftInToCm(5, 9))).toBeCloseTo(22.74, 2);
  });

  it("classifies with inclusive lower bounds", () => {
    expect(bmiClass(15.9)).toBe("severe-thin");
    expect(bmiClass(16)).toBe("moderate-thin");
    expect(bmiClass(17)).toBe("mild-thin");
    expect(bmiClass(18.49)).toBe("normal"); // displayed as 18.5
    expect(bmiClass(18.44)).toBe("mild-thin");
    expect(bmiClass(18.5)).toBe("normal");
    expect(bmiClass(24.9)).toBe("normal");
    expect(bmiClass(25)).toBe("pre-obese");
    expect(bmiClass(30)).toBe("obese-1");
    expect(bmiClass(35)).toBe("obese-2");
    expect(bmiClass(40)).toBe("obese-3");
  });

  it("supports Asian cut-offs 23 / 27.5", () => {
    expect(bmiClass(22.9, true)).toBe("normal");
    expect(bmiClass(23, true)).toBe("pre-obese");
    expect(bmiClass(27.5, true)).toBe("obese-1");
  });

  it("healthy weight range for 170 cm = 53.5–72.0 kg", () => {
    const [lo, hi] = healthyRange(170);
    expect(lo).toBeCloseTo(53.465, 3);
    expect(hi).toBeCloseTo(71.961, 3);
  });
});

describe("ideal weight formulas (170 cm = 6.929 in over 5 ft)", () => {
  it("men", () => {
    expect(idealWeight("devine", "male", 170)).toBeCloseTo(65.94, 2);
    expect(idealWeight("robinson", "male", 170)).toBeCloseTo(65.17, 2);
    expect(idealWeight("miller", "male", 170)).toBeCloseTo(65.97, 2);
    expect(idealWeight("hamwi", "male", 170)).toBeCloseTo(66.71, 2);
  });
  it("women", () => {
    expect(idealWeight("devine", "female", 170)).toBeCloseTo(61.44, 2);
    expect(idealWeight("hamwi", "female", 170)).toBeCloseTo(60.74, 2);
  });
  it("5 ft exactly gives the base value", () => {
    expect(idealWeight("devine", "male", 152.4)).toBeCloseTo(50, 10);
  });
});

describe("energy", () => {
  it("Mifflin–St Jeor", () => {
    expect(mifflin("male", 80, 180, 30)).toBe(1780); // 800 + 1125 − 150 + 5
    expect(mifflin("female", 60, 165, 30)).toBeCloseTo(1320.25, 10); // 600 + 1031.25 − 150 − 161
  });
  it("Harris–Benedict (Roza & Shizgal)", () => {
    expect(harrisBenedict("male", 80, 180, 30)).toBeCloseTo(1853.632, 3);
  });
  it("500 kcal/day ≈ 0.45 kg a week", () => {
    expect(weeklyChange(-500)).toBeCloseTo(-0.4545, 3);
  });
  it("macros in grams", () => {
    const g = macroGrams(2000, { protein: 25, fat: 30, carbs: 45 });
    expect(g.protein).toBe(125);
    expect(g.fat).toBeCloseTo(66.667, 3);
    expect(g.carbs).toBe(225);
  });
});

describe("body fat and waist-to-height", () => {
  it("US Navy method (man 180 cm, waist 85, neck 38 → ≈16.1 %)", () => {
    // 495 / (1.0324 − 0.19077·log10(47) + 0.15456·log10(180)) − 450 = 16.11
    expect(navyBodyFat("male", 180, 85, 38)!).toBeCloseTo(16.11, 1);
    expect(navyBodyFat("male", 180, 30, 38)).toBeNull();
    const f = navyBodyFat("female", 165, 75, 33, 98)!;
    expect(f).toBeGreaterThan(25);
    expect(f).toBeLessThan(35);
  });
  it("Deurenberg BMI estimate", () => {
    expect(bmiBodyFat("male", 25, 40)).toBeCloseTo(1.2 * 25 + 0.23 * 40 - 10.8 - 5.4, 10);
  });
  it("ACE categories", () => {
    expect(fatCategory("male", 16)).toBe("fitness");
    expect(fatCategory("female", 16)).toBe("athletes");
    expect(fatCategory("male", 1)).toBe("below");
    expect(fatCategory("female", 33)).toBe("obese");
  });
  it("waist-to-height", () => {
    expect(whtrCategory(80 / 170)).toBe("healthy"); // 0.47
    expect(whtrCategory(0.5)).toBe("increased");
    expect(whtrCategory(0.6)).toBe("high");
    expect(whtrCategory(0.39)).toBe("low");
  });
});

describe("water, heart rate, alcohol", () => {
  it("water estimate", () => {
    expect(waterIntake(70, 60, "hot").total).toBe(3100); // 2100 + 500 + 500
    expect(1000 / ML_PER_FLOZ).toBeCloseTo(33.814, 3);
  });
  it("max HR and Karvonen", () => {
    expect(maxHrTanaka(30)).toBe(187);
    expect(maxHrFox(30)).toBe(190);
    expect(targetHr(190, 70, 60)).toBe(151); // (190 − 60) × 0.7 + 60
    expect(targetHr(190, 70)).toBe(133);
  });
  it("Widmark: man 80 kg, 500 ml beer 5 %", () => {
    const g = alcoholGrams(500, 5);
    expect(g).toBeCloseTo(19.725, 3);
    const w = widmark(g, 80, "male", 0);
    expect(w.peak).toBeCloseTo(0.3626, 4);
    expect(widmark(g, 80, "male", 1).now).toBeCloseTo(0.2126, 4);
    expect(widmark(g, 80, "male", 10).now).toBe(0);
  });
});
