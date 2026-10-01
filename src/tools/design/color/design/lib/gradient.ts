import { parseColor, toHex } from "../../lib/color";

export type GradientType = "linear" | "radial" | "conic";
export type InterpolationSpace = "" | "srgb-linear" | "oklab" | "oklch";

export interface GradientStop {
  id: number;
  color: string;
  /** Position in %, or null to let the browser distribute it. */
  pos: number | null;
}

export interface GradientState {
  type: GradientType;
  /** Linear: angle in degrees (used when `direction` is empty). */
  angle: number;
  /** Linear: keyword direction such as "to right" (overrides the angle). */
  direction: string;
  /** Radial */
  shape: "circle" | "ellipse";
  size: "closest-side" | "closest-corner" | "farthest-side" | "farthest-corner";
  /** Radial/conic center, % */
  x: number;
  y: number;
  /** Conic start angle */
  from: number;
  space: InterpolationSpace;
  repeating: boolean;
  stops: GradientStop[];
}

export const DIRECTIONS = ["to top", "to top right", "to right", "to bottom right", "to bottom", "to bottom left", "to left", "to top left"] as const;

const r1 = (n: number) => String(Math.round(n * 10) / 10);

/** CSS color of a stop (normalized to HEX; 8 digits when translucent). Invalid colors are skipped. */
function stopCss(s: GradientStop): string | null {
  const c = parseColor(s.color);
  if (!c) return null;
  return s.pos === null ? toHex(c) : `${toHex(c)} ${r1(s.pos)}%`;
}

/** The gradient function, e.g. `linear-gradient(90deg, #FF0000 0%, #0000FF 100%)`. */
export function gradientValue(g: GradientState, withSpace = true): string {
  const stops = g.stops
    .map(stopCss)
    .filter((x): x is string => !!x);
  const space = withSpace && g.space ? `in ${g.space}` : "";
  const parts: string[] = [];
  if (g.type === "linear") {
    const dir = g.direction || `${r1(g.angle)}deg`;
    parts.push([dir, space].filter(Boolean).join(" "));
  } else if (g.type === "radial") {
    const center = g.x === 50 && g.y === 50 ? "" : `at ${r1(g.x)}% ${r1(g.y)}%`;
    const shape = [g.shape === "ellipse" ? "" : "circle", g.size === "farthest-corner" ? "" : g.size].filter(Boolean).join(" ");
    const head = [shape, center, space].filter(Boolean).join(" ");
    if (head) parts.push(head);
  } else {
    const head = [g.from ? `from ${r1(g.from)}deg` : "", g.x === 50 && g.y === 50 ? "" : `at ${r1(g.x)}% ${r1(g.y)}%`, space].filter(Boolean).join(" ");
    if (head) parts.push(head);
  }
  const fn = `${g.repeating ? "repeating-" : ""}${g.type}-gradient`;
  return `${fn}(${[...parts, ...stops].join(", ")})`;
}

/** Full CSS declaration(s). With an interpolation space, a plain fallback line comes first. */
export function gradientCss(g: GradientState): string {
  const main = `background: ${gradientValue(g)};`;
  if (!g.space) return main;
  return `background: ${gradientValue(g, false)}; /* fallback */\n${main}`;
}

export const DEFAULT_GRADIENT: GradientState = {
  type: "linear",
  angle: 90,
  direction: "",
  shape: "circle",
  size: "farthest-corner",
  x: 50,
  y: 50,
  from: 0,
  space: "",
  repeating: false,
  stops: [
    { id: 1, color: "#FF6347", pos: 0 },
    { id: 2, color: "#8A2BE2", pos: 100 },
  ],
};

interface GradientPreset {
  name: { ru: string; en: string };
  state: Partial<GradientState> & { stops: GradientStop[] };
}

const st = (...xs: [string, number][]) => xs.map(([color, pos], i) => ({ id: i + 1, color, pos }));

export const GRADIENT_PRESETS: GradientPreset[] = [
  { name: { ru: "Закат", en: "Sunset" }, state: { type: "linear", angle: 135, stops: st(["#FF7E5F", 0], ["#FEB47B", 100]) } },
  { name: { ru: "Океан", en: "Ocean" }, state: { type: "linear", angle: 120, stops: st(["#2E3192", 0], ["#1BFFFF", 100]) } },
  { name: { ru: "Мята", en: "Mint" }, state: { type: "linear", angle: 90, stops: st(["#43E97B", 0], ["#38F9D7", 100]) } },
  { name: { ru: "Сумерки", en: "Dusk" }, state: { type: "linear", angle: 160, stops: st(["#2C3E50", 0], ["#FD746C", 100]) } },
  { name: { ru: "Персик", en: "Peach" }, state: { type: "linear", angle: 45, stops: st(["#FFECD2", 0], ["#FCB69F", 100]) } },
  { name: { ru: "Радуга", en: "Rainbow" }, state: { type: "linear", angle: 90, space: "oklch", stops: st(["#FF0000", 0], ["#FFD700", 25], ["#00C853", 50], ["#2979FF", 75], ["#AA00FF", 100]) } },
  { name: { ru: "Северное сияние", en: "Aurora" }, state: { type: "linear", angle: 200, space: "oklab", stops: st(["#00C9FF", 0], ["#92FE9D", 50], ["#F9F871", 100]) } },
  { name: { ru: "Прожектор", en: "Spotlight" }, state: { type: "radial", shape: "circle", stops: st(["#FFFFFF", 0], ["#A5B4FC", 40], ["#312E81", 100]) } },
  { name: { ru: "Цветовой круг", en: "Color wheel" }, state: { type: "conic", space: "oklch", stops: st(["#FF0000", 0], ["#FFFF00", 16.7], ["#00FF00", 33.3], ["#00FFFF", 50], ["#0000FF", 66.7], ["#FF00FF", 83.3], ["#FF0000", 100]) } },
  { name: { ru: "Полосы", en: "Stripes" }, state: { type: "linear", angle: 45, repeating: true, stops: st(["#3B82F6", 0], ["#3B82F6", 10], ["#93C5FD", 10], ["#93C5FD", 20]) } },
];
