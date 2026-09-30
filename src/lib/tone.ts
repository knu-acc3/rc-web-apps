/**
 * Section colour palettes. Every section has a hue; its pages get their own accent (buttons, links, the main
 * result) and a lightly tinted "stage" behind the title and the tool. Colours are built in OKLCH so every hue
 * has the same perceived lightness (and the same contrast), then converted to hex so they work in any browser.
 */

type Rgb = [number, number, number];

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

function oklchToLinear(l: number, c: number, hDeg: number): Rgb {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

/** OKLCH → hex, reducing chroma until the colour fits sRGB. */
export function oklchHex(l: number, c: number, h: number): string {
  let chroma = c;
  let rgb = oklchToLinear(l, chroma, h);
  for (let i = 0; i < 40 && rgb.some((v) => v < -0.0005 || v > 1.0005); i++) {
    chroma *= 0.94;
    rgb = oklchToLinear(l, chroma, h);
  }
  return `#${rgb
    .map((v) => Math.round(Math.min(1, Math.max(0, linearToSrgb(Math.min(1, Math.max(0, v))))) * 255))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Hue of an HSL colour (saturated, mid lightness) expressed on the OKLCH hue circle. */
export function oklchHueOfHsl(hue: number): number {
  const s = 0.75;
  const l = 0.5;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const [r, g, b] = [f(0), f(8), f(4)].map(srgbToLinear);
  const L = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const M = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const S = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const A = 1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S;
  const B = 0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S;
  return ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
}

const cache = new Map<number, Record<string, string>>();

/** CSS custom properties for a section hue (see `.tone` in globals.css). */
export function toneVars(hue: number | undefined): Record<string, string> {
  const key = Math.round(hue ?? 225);
  const hit = cache.get(key);
  if (hit) return hit;
  const h = oklchHueOfHsl(key);
  const vars = {
    "--t-acc": oklchHex(0.51, 0.17, h),
    "--t-acc-h": oklchHex(0.45, 0.17, h),
    "--t-soft": oklchHex(0.96, 0.035, h),
    "--t-stage": oklchHex(0.976, 0.014, h),
    "--t-line": oklchHex(0.915, 0.03, h),
    "--t-acc-d": oklchHex(0.76, 0.13, h),
    "--t-acc-hd": oklchHex(0.82, 0.12, h),
    "--t-soft-d": oklchHex(0.28, 0.05, h),
    "--t-stage-d": oklchHex(0.195, 0.016, h),
    "--t-line-d": oklchHex(0.285, 0.03, h),
  };
  cache.set(key, vars);
  return vars;
}
