import { contrastRatio, formatColor, formatRatio, hex, parseColor, readableTextColor, toHex, WHITE, BLACK } from "../lib/color";
import { MATERIAL } from "./data/material";
import { TAILWIND_V3 } from "./data/tailwind-v3";
import { TAILWIND_V4, TAILWIND_V4_VERSION } from "./data/tailwind-v4";
import type { FamilyData, FamilyRow } from "./FamilyPalette";

const TW_STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
export const TW_NEUTRALS = new Set(["slate", "gray", "zinc", "neutral", "stone", "mauve", "olive", "mist", "taupe"]);
/** Families in the order of the Tailwind docs (neutrals last). */
export const TW_FAMILIES = [
  ...Object.keys(TAILWIND_V4).filter((f) => !TW_NEUTRALS.has(f)),
  ...["slate", "gray", "zinc", "neutral", "stone", "mauve", "olive", "mist", "taupe"].filter((f) => f in TAILWIND_V4),
];
export { TAILWIND_V4_VERSION };

export function twRows(family: string): FamilyRow[] {
  return TW_STEPS.map((step, i) => {
    const oklch = TAILWIND_V4[family][i];
    const c = parseColor(oklch)!;
    return { step, oklch, hex: toHex(c), v3: TAILWIND_V3[family]?.[i]?.toUpperCase(), token: `${family}-${step}`, fg: readableTextColor(c) };
  });
}

export function twFamily(family: string): FamilyData {
  return { slug: family, label: family, rows: twRows(family), path: ["tailwind-colors", family] };
}

export function mdRows(slug: string): FamilyRow[] {
  const fam = MATERIAL.find((f) => f.slug === slug)!;
  return Object.entries(fam.shades).map(([step, h]) => {
    const c = hex(h);
    return { step, hex: h.toUpperCase(), token: `${slug}-${step.toLowerCase()}`, fg: readableTextColor(c) };
  });
}

export function mdFamily(slug: string): FamilyData {
  const fam = MATERIAL.find((f) => f.slug === slug)!;
  return { slug, label: fam.name, rows: mdRows(slug), path: ["material-colors", slug] };
}

export const ratioW = (h: string) => `${formatRatio(contrastRatio(WHITE, parseColor(h)!))}:1`;
export const ratioB = (h: string) => `${formatRatio(contrastRatio(BLACK, parseColor(h)!))}:1`;
export const rgbOf = (h: string) => formatColor(parseColor(h)!, "rgb");
