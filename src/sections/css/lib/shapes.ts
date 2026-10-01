import { round } from "./tokens";

/* ───────────── clip-path ───────────── */

export type Point = [number, number];

interface ClipShape {
  slug: string;
  /** Polygon points in % (x, y), or a ready basic-shape function. */
  points?: Point[];
  css?: string;
}

const star = (n: number, inner: number): Point[] => {
  const pts: Point[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? 50 : 50 * inner;
    const a = (Math.PI / n) * i - Math.PI / 2;
    pts.push([Math.round((50 + r * Math.cos(a)) * 10) / 10, Math.round((50 + r * Math.sin(a)) * 10) / 10]);
  }
  return pts;
};
const regular = (n: number, rot = -Math.PI / 2): Point[] =>
  Array.from({ length: n }, (_, i) => {
    const a = rot + (2 * Math.PI * i) / n;
    return [Math.round((50 + 50 * Math.cos(a)) * 10) / 10, Math.round((50 + 50 * Math.sin(a)) * 10) / 10] as Point;
  });

export const CLIP_SHAPES: ClipShape[] = [
  { slug: "triangle", points: [[50, 0], [100, 100], [0, 100]] },
  { slug: "trapezoid", points: [[20, 0], [80, 0], [100, 100], [0, 100]] },
  { slug: "parallelogram", points: [[25, 0], [100, 0], [75, 100], [0, 100]] },
  { slug: "rhombus", points: [[50, 0], [100, 50], [50, 100], [0, 50]] },
  { slug: "pentagon", points: regular(5) },
  { slug: "hexagon", points: [[25, 0], [75, 0], [100, 50], [75, 100], [25, 100], [0, 50]] },
  { slug: "octagon", points: [[30, 0], [70, 0], [100, 30], [100, 70], [70, 100], [30, 100], [0, 70], [0, 30]] },
  { slug: "star", points: star(5, 0.4) },
  { slug: "arrow", points: [[0, 30], [60, 30], [60, 0], [100, 50], [60, 100], [60, 70], [0, 70]] },
  { slug: "chevron", points: [[0, 0], [75, 0], [100, 50], [75, 100], [0, 100], [25, 50]] },
  { slug: "cross", points: [[35, 0], [65, 0], [65, 35], [100, 35], [100, 65], [65, 65], [65, 100], [35, 100], [35, 65], [0, 65], [0, 35], [35, 35]] },
  { slug: "message", points: [[0, 0], [100, 0], [100, 75], [75, 75], [75, 100], [50, 75], [0, 75]] },
  { slug: "circle", css: "circle(50% at 50% 50%)" },
  { slug: "ellipse", css: "ellipse(50% 35% at 50% 50%)" },
  { slug: "inset", css: "inset(10% 10% 10% 10% round 16px)" },
];

export const clipBySlug = new Map(CLIP_SHAPES.map((s) => [s.slug, s]));

export function polygonCss(points: Point[]): string {
  return `polygon(${points.map(([x, y]) => `${round(x, 1)}% ${round(y, 1)}%`).join(", ")})`;
}

export function shapeCss(s: ClipShape): string {
  return s.css ?? polygonCss(s.points ?? []);
}

/* ───────────── CSS triangle ───────────── */

export type TriangleDir = "up" | "down" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

/** Classic zero-size element with borders. */
export function triangleBorderCss(dir: TriangleDir, w: number, h: number, color: string): string {
  const t = "solid transparent";
  const decl: string[] = ["width: 0;", "height: 0;"];
  const half = (n: number) => round(n / 2, 2);
  switch (dir) {
    case "up":
      decl.push(`border-left: ${half(w)}px ${t};`, `border-right: ${half(w)}px ${t};`, `border-bottom: ${h}px solid ${color};`);
      break;
    case "down":
      decl.push(`border-left: ${half(w)}px ${t};`, `border-right: ${half(w)}px ${t};`, `border-top: ${h}px solid ${color};`);
      break;
    case "left":
      decl.push(`border-top: ${half(h)}px ${t};`, `border-bottom: ${half(h)}px ${t};`, `border-right: ${w}px solid ${color};`);
      break;
    case "right":
      decl.push(`border-top: ${half(h)}px ${t};`, `border-bottom: ${half(h)}px ${t};`, `border-left: ${w}px solid ${color};`);
      break;
    case "top-left":
      decl.push(`border-top: ${h}px solid ${color};`, `border-right: ${w}px ${t};`);
      break;
    case "top-right":
      decl.push(`border-top: ${h}px solid ${color};`, `border-left: ${w}px ${t};`);
      break;
    case "bottom-left":
      decl.push(`border-bottom: ${h}px solid ${color};`, `border-right: ${w}px ${t};`);
      break;
    case "bottom-right":
      decl.push(`border-bottom: ${h}px solid ${color};`, `border-left: ${w}px ${t};`);
      break;
  }
  return `.triangle {\n${decl.map((d) => `  ${d}`).join("\n")}\n}`;
}

const TRI_POLY: Record<TriangleDir, string> = {
  up: "polygon(50% 0, 100% 100%, 0 100%)",
  down: "polygon(0 0, 100% 0, 50% 100%)",
  left: "polygon(100% 0, 100% 100%, 0 50%)",
  right: "polygon(0 0, 100% 50%, 0 100%)",
  "top-left": "polygon(0 0, 100% 0, 0 100%)",
  "top-right": "polygon(0 0, 100% 0, 100% 100%)",
  "bottom-left": "polygon(0 0, 100% 100%, 0 100%)",
  "bottom-right": "polygon(100% 0, 100% 100%, 0 100%)",
};

/** Modern alternative: a normal box clipped to a triangle (can have gradients, shadows via filter). */
export function triangleClipCss(dir: TriangleDir, w: number, h: number, color: string): string {
  return `.triangle {\n  width: ${w}px;\n  height: ${h}px;\n  background: ${color};\n  clip-path: ${TRI_POLY[dir]};\n}`;
}

export const trianglePolygon = (dir: TriangleDir) => TRI_POLY[dir];

/* ───────────── glassmorphism ───────────── */

export interface GlassSettings {
  blur: number;
  /** Background tint color (hex) and its opacity 0…1 */
  tint: string;
  opacity: number;
  saturate: number;
  border: number;
  radius: number;
  shadow: boolean;
}

export const DEFAULT_GLASS: GlassSettings = { blur: 12, tint: "#FFFFFF", opacity: 0.18, saturate: 160, border: 0.3, radius: 16, shadow: true };

function rgbTriplet(hex: string): string {
  const h = hex.replace("#", "");
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return `${n(0)} ${n(2)} ${n(4)}`;
}

export function glassCss(g: GlassSettings): string {
  const rgb = rgbTriplet(g.tint.length === 4 ? `#${[...g.tint.slice(1)].map((c) => c + c).join("")}` : g.tint.slice(0, 7));
  const filter = `blur(${g.blur}px)${g.saturate !== 100 ? ` saturate(${g.saturate}%)` : ""}`;
  const lines = [
    `background: rgb(${rgb} / ${round(g.opacity, 2)});`,
    `-webkit-backdrop-filter: ${filter}; /* Safari before 18 */`,
    `backdrop-filter: ${filter};`,
    ...(g.border > 0 ? [`border: 1px solid rgb(255 255 255 / ${round(g.border, 2)});`] : []),
    ...(g.radius ? [`border-radius: ${g.radius}px;`] : []),
    ...(g.shadow ? ["box-shadow: 0 8px 32px rgb(0 0 0 / 0.18);"] : []),
  ];
  const fallback = Math.min(0.92, g.opacity + 0.6);
  return `.glass {\n${lines.map((l) => `  ${l}`).join("\n")}\n}\n\n/* Browsers without backdrop-filter: a more opaque background keeps text readable */\n@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {\n  .glass {\n    background: rgb(${rgb} / ${round(fallback, 2)});\n  }\n}`;
}
