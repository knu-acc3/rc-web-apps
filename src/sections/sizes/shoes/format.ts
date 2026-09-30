import type { Locale } from "@/i18n/config";
import { nf, nfix } from "../shared";
import { kidsLabel, type ShoeGroup, type ShoeSystem } from "./engine";

export const sz = (l: Locale, v: number) => nf(l, v, 1);

/** Display label of a size value, with C/Y (US kids) and adult markers (UK kids ≥ 14). */
export function shoeLabel(l: Locale, system: ShoeSystem, v: number, g: ShoeGroup): string {
  if (system === "cm") return nfix(l, v, 1);
  if (g !== "kids" || (system !== "uk" && system !== "us")) return sz(l, v);
  const k = kidsLabel(system, v);
  if (system === "us") return `${sz(l, k.n)}${k.scale === "child" ? "C" : "Y"}`;
  return k.scale === "child" ? sz(l, k.n) : `${sz(l, k.n)} ${l === "ru" ? "(взр.)" : "(adult)"}`;
}

export const footRangeText = (l: Locale, r: [number, number]) => `${nfix(l, r[0], 1)}–${nfix(l, r[1], 1)} ${l === "ru" ? "см" : "cm"}`;

export const SYSTEM_LABEL: Record<Locale, Record<ShoeSystem, string>> = {
  ru: { eu: "EU", ru: "RU", uk: "UK", us: "US", cm: "Стопа, см" },
  en: { eu: "EU", ru: "RU", uk: "UK", us: "US", cm: "Foot, cm" },
};

export const GROUP_LABEL: Record<Locale, Record<ShoeGroup, string>> = {
  ru: { men: "Мужская", women: "Женская", kids: "Детская" },
  en: { men: "Men", women: "Women", kids: "Kids" },
};
