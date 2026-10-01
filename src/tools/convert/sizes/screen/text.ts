import type { Locale } from "@/i18n/config";
import { nf } from "../lib/shared";
import { nearestCommonRatio, ratioText, reduceRatio, resolutionName } from "./engine";

/** "16:9", "683:384 ≈ 16:9", "199:139 (≈ 1,43:1)" */
export function ratioLabel(l: Locale, w: number, h: number): string {
  const [a, b] = reduceRatio(w, h);
  const exact = `${a}:${b}`;
  const m = nearestCommonRatio(w, h);
  if (m?.exact) return ratioText(m.oriented, l);
  if (m) return `${exact} ≈ ${ratioText(m.oriented, l)}`;
  return `${exact} (≈ ${nf(l, Math.max(w, h) / Math.min(w, h), 2)}:1)`;
}

/** Short name without the parenthesised alias: "Full HD", "QHD / WQHD". */
export function shortName(w: number, h: number): string | null {
  const n = resolutionName(w, h);
  return n ? n.replace(/\s*\(.*\)$/, "") : null;
}
