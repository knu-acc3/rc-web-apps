/**
 * Shoe size model. Every system is a function of foot length f (cm):
 *   EU (Paris point, 1 point = 2/3 cm):  EU = 1.5 · f + 2        (last ≈ foot + 2 points ≈ 1.33 cm, ISO/TS 19407 guidance)
 *   UK adult (barleycorn, 1/3 inch):      UK = 3 · f/2.54 − 23.5  (last ≈ foot + ½ inch; 3·last − 25)
 *   UK children:                          UKc = 3 · f/2.54 − 10.5 (3·last − 12; after 13½ the adult scale starts at 1)
 *   US men = UK + 1, US women = UK + 2, US kids = UKc + ½ (C), youth sizes (Y) continue after 13½C
 *   RU adult ≈ EU − 1 (common Russian retail charts), RU children = EU
 *   Mondopoint / JP = foot length in cm (0.5 cm steps)
 * Sizes are rounded to half sizes. Brands differ by ±½–1 size — this is a guide, not a fit guarantee.
 */

export type ShoeGroup = "men" | "women" | "kids";
export type ShoeSystem = "eu" | "ru" | "uk" | "us" | "cm";

export const SHOE_SYSTEMS: ShoeSystem[] = ["eu", "ru", "uk", "us", "cm"];

/** Foot-length range (cm) covered by each group. */
export const FOOT_RANGE: Record<ShoeGroup, [number, number]> = {
  men: [22, 32],
  women: [20.5, 28],
  kids: [9.4, 22.4],
};

const half = (n: number) => Number((Math.round(n * 2 + 1e-9) / 2).toFixed(1));

export const euRaw = (f: number) => 1.5 * f + 2;
export const footFromEu = (eu: number) => (eu - 2) / 1.5;

/** Raw UK value: adult scale for adults, child scale for kids. */
export const ukRaw = (f: number, g: ShoeGroup) => (3 * f) / 2.54 - (g === "kids" ? 10.5 : 23.5);
export const footFromUk = (uk: number, g: ShoeGroup) => ((uk + (g === "kids" ? 10.5 : 23.5)) * 2.54) / 3;

const usOffset = (g: ShoeGroup) => (g === "men" ? 1 : g === "women" ? 2 : 0.5);
export const usRaw = (f: number, g: ShoeGroup) => ukRaw(f, g) + usOffset(g);
export const footFromUs = (us: number, g: ShoeGroup) => footFromUk(us - usOffset(g), g);

const ruOffset = (g: ShoeGroup) => (g === "kids" ? 0 : 1);

/** Foot length (cm) for a size value in a system. For kids, UK/US values are on the continuous child scale (see labels). */
export function footFrom(system: ShoeSystem, value: number, g: ShoeGroup): number {
  switch (system) {
    case "eu":
      return footFromEu(value);
    case "ru":
      return footFromEu(value + ruOffset(g));
    case "uk":
      return footFromUk(value, g);
    case "us":
      return footFromUs(value, g);
    case "cm":
      return value;
  }
}

/** Size value (rounded to half sizes) in a system for a foot length. */
export function sizeIn(system: ShoeSystem, f: number, g: ShoeGroup): number {
  switch (system) {
    case "eu":
      return half(euRaw(f));
    case "ru":
      return half(euRaw(f)) - ruOffset(g);
    case "uk":
      return half(ukRaw(f, g));
    case "us":
      return half(usRaw(f, g));
    case "cm":
      return half(f);
  }
}

export interface ShoeSizes {
  foot: number;
  eu: number;
  ru: number;
  uk: number;
  us: number;
  cm: number;
}

export function allSizes(f: number, g: ShoeGroup): ShoeSizes {
  return { foot: f, eu: sizeIn("eu", f, g), ru: sizeIn("ru", f, g), uk: sizeIn("uk", f, g), us: sizeIn("us", f, g), cm: sizeIn("cm", f, g) };
}

/** Kids UK/US values switch from the child scale to adult/youth numbering after 13½. */
export function kidsLabel(system: "uk" | "us", v: number): { n: number; scale: "child" | "adult" } {
  if (v < 13.75) return { n: v, scale: "child" };
  return { n: half(v - 13), scale: "adult" };
}

/** Grid of selectable values for a system inside a group's foot range (half-size steps). */
export function sizeOptions(system: ShoeSystem, g: ShoeGroup): number[] {
  const [lo, hi] = FOOT_RANGE[g];
  const a = sizeIn(system, lo, g);
  const b = sizeIn(system, hi, g);
  const out: number[] = [];
  for (let v = a; v <= b + 1e-9; v = half(v + 0.5)) out.push(v);
  return out;
}

/** Foot-length interval (cm) that maps to a whole EU size. */
export function footRangeForEu(eu: number): [number, number] {
  return [footFromEu(eu - 0.5), footFromEu(eu + 0.5)];
}

export interface ShoeRow extends ShoeSizes {
  /** Foot-length interval (cm) of the row. */
  range: [number, number];
}

/** Chart rows at whole EU sizes. */
export function chartRows(g: ShoeGroup): ShoeRow[] {
  const bounds: Record<ShoeGroup, [number, number]> = { men: [38, 49], women: [34, 43], kids: [16, 35] };
  const [a, b] = bounds[g];
  const rows: ShoeRow[] = [];
  for (let eu = a; eu <= b; eu++) {
    const f = footFromEu(eu);
    rows.push({ ...allSizes(f, g), range: footRangeForEu(eu) });
  }
  return rows;
}

/** Find the chart row for a value in any system (nearest whole EU size). */
export function lookupRow(system: ShoeSystem, value: number, g: ShoeGroup): ShoeRow | null {
  const eu = Math.round(euRaw(footFrom(system, value, g)) + 1e-9);
  return chartRows(g).find((r) => r.eu === eu) ?? null;
}
