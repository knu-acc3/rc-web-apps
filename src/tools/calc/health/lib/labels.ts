import type { Locale } from "@/i18n/config";
import type { BmiClass, FatCategory, WhtrCategory } from "./body";

/** Category names shared by tools (client) and page texts (server). */

export const BMI_LABEL: Record<Locale, Record<BmiClass, string>> = {
  ru: {
    "severe-thin": "Выраженный дефицит массы",
    "moderate-thin": "Умеренный дефицит массы",
    "mild-thin": "Лёгкий дефицит массы",
    normal: "Нормальный вес",
    "pre-obese": "Избыточный вес (предожирение)",
    "obese-1": "Ожирение I степени",
    "obese-2": "Ожирение II степени",
    "obese-3": "Ожирение III степени",
  },
  en: {
    "severe-thin": "Severe thinness",
    "moderate-thin": "Moderate thinness",
    "mild-thin": "Mild thinness",
    normal: "Normal weight",
    "pre-obese": "Overweight (pre-obesity)",
    "obese-1": "Obesity class I",
    "obese-2": "Obesity class II",
    "obese-3": "Obesity class III",
  },
};

export const FAT_LABEL: Record<Locale, Record<FatCategory, string>> = {
  ru: { below: "Ниже необходимого минимума", essential: "Необходимый минимум", athletes: "Спортсмены", fitness: "Хорошая форма", average: "Средний уровень", obese: "Ожирение" },
  en: { below: "Below essential fat", essential: "Essential fat", athletes: "Athletes", fitness: "Fitness", average: "Average", obese: "Obese" },
};

export const WHTR_LABEL: Record<Locale, Record<WhtrCategory, string>> = {
  ru: { low: "Ниже 0,4 — возможно, слишком мало", healthy: "Норма", increased: "Повышенный риск", high: "Высокий риск" },
  en: { low: "Below 0.4 — may be too low", healthy: "Healthy", increased: "Increased health risk", high: "High health risk" },
};
