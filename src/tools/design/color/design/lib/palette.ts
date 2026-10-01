import { formatColor, fromOklch, harmony, toGamut, toHex, toOklch, type Color, type Harmony } from "../../lib/color";

export type PaletteMode = Harmony | "random";
export const PALETTE_MODES: readonly PaletteMode[] = ["analogous", "complementary", "triadic", "split-complementary", "tetradic", "square", "monochromatic", "random"];

/** Random source in [0, 1) — injected so the generator stays pure and testable. */
type Rand = () => number;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * A palette of `count` colors built from a harmony: the harmony swatches first (the base color is
 * always the first swatch, unchanged), then lighter/darker OKLCH variants of them.
 */
export function harmonyPalette(base: Color, kind: Harmony, count: number): Color[] {
  const core = harmony({ ...base, alpha: 1 }, kind);
  const out = core.slice(0, count);
  const deltas = [0.18, -0.18, 0.3, -0.3, 0.09, -0.09];
  for (const d of deltas) {
    for (const c of core) {
      if (out.length >= count) return out;
      const o = toOklch(c);
      out.push(toGamut(fromOklch(clamp(o.l + d, 0.12, 0.97), o.c, o.h)));
    }
  }
  return out.slice(0, count);
}

/** A pleasant random palette: evenly spread OKLCH hues with a random offset and moderate chroma. */
export function randomPalette(count: number, rand: Rand): Color[] {
  const h0 = rand() * 360;
  const spread = 20 + rand() * 60;
  const out: Color[] = [];
  for (let i = 0; i < count; i++) {
    const l = 0.35 + rand() * 0.55;
    const c = 0.05 + rand() * 0.14;
    out.push(toGamut(fromOklch(l, c, h0 + i * spread + (rand() - 0.5) * 12)));
  }
  return out;
}

/** Regenerate unlocked swatches only. `locked[i]` true keeps `current[i]`. */
export function regenerate(current: Color[], locked: boolean[], fresh: Color[]): Color[] {
  return current.map((c, i) => (locked[i] ? c : fresh[i] ?? c));
}

export function exportCss(colors: Color[], prefix = "color"): string {
  return `:root {\n${colors.map((c, i) => `  --${prefix}-${i + 1}: ${toHex(c)};`).join("\n")}\n}`;
}

export function exportTailwind4(colors: Color[], prefix = "palette"): string {
  return `@theme {\n${colors.map((c, i) => `  --color-${prefix}-${i + 1}: ${formatColor(c, "oklch")};`).join("\n")}\n}`;
}

export function exportTailwind3(colors: Color[], prefix = "palette"): string {
  const obj = Object.fromEntries(colors.map((c, i) => [String(i + 1), toHex(c)]));
  return `// tailwind.config.js → theme.extend.colors\n${JSON.stringify({ [prefix]: obj }, null, 2)}`;
}

export function exportJson(colors: Color[]): string {
  return JSON.stringify(
    colors.map((c) => ({ hex: toHex(c), rgb: formatColor(c, "rgb"), hsl: formatColor(c, "hsl"), oklch: formatColor(c, "oklch") })),
    null,
    2,
  );
}
