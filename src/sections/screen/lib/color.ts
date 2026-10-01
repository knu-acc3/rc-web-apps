/* Screen colours: named fills, colour temperature and brightness. Pure, unit-tested. */

export interface ScreenColor {
  id: string;
  hex: string;
  ru: string;
  en: string;
}

/** The colours offered as one-tap chips (and as separate pages: /white-screen, /red-screen…). */
export const SCREEN_COLORS: ScreenColor[] = [
  { id: "white", hex: "#ffffff", ru: "Белый", en: "White" },
  { id: "black", hex: "#000000", ru: "Чёрный", en: "Black" },
  { id: "red", hex: "#ff0000", ru: "Красный", en: "Red" },
  { id: "green", hex: "#00ff00", ru: "Зелёный", en: "Green" },
  { id: "blue", hex: "#0000ff", ru: "Синий", en: "Blue" },
  { id: "yellow", hex: "#ffff00", ru: "Жёлтый", en: "Yellow" },
  { id: "orange", hex: "#ff8000", ru: "Оранжевый", en: "Orange" },
  { id: "pink", hex: "#ff69b4", ru: "Розовый", en: "Pink" },
  { id: "purple", hex: "#8000ff", ru: "Фиолетовый", en: "Purple" },
  { id: "gray", hex: "#808080", ru: "Серый", en: "Gray" },
];

export const colorById = (id: string) => SCREEN_COLORS.find((c) => c.id === id);

export type Rgb = [number, number, number];

const clamp = (v: number, lo = 0, hi = 255) => Math.min(hi, Math.max(lo, v));

export function hexToRgb(hex: string): Rgb {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return [255, 255, 255];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(clamp(v)).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Colour of a black body at `kelvin` (1000–40000 K) as sRGB — Tanner Helland's fit. 6500 K is ~neutral white,
 * 2700 K a warm incandescent bulb, 10000 K a cold bluish light.
 */
export function kelvinToRgb(kelvin: number): Rgb {
  const t = clamp(kelvin, 1000, 40000) / 100;
  let r: number;
  let g: number;
  let b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  return [Math.round(clamp(r)), Math.round(clamp(g)), Math.round(clamp(b))];
}

/** White light at `kelvin`, normalised so that 6500 K (daylight) is pure #ffffff; warmer is orange, cooler bluish. */
export function whiteAt(kelvin: number): Rgb {
  const ref = kelvinToRgb(6500);
  const c = kelvinToRgb(kelvin);
  return [0, 1, 2].map((i) => Math.round(clamp((c[i] * 255) / ref[i]))) as Rgb;
}

/** Scale a colour by brightness 0–1 (what a dimmer would do). */
export function dim([r, g, b]: Rgb, brightness: number): Rgb {
  const k = clamp(brightness, 0, 1);
  return [Math.round(r * k), Math.round(g * k), Math.round(b * k)];
}

/** Relative luminance (WCAG) 0–1: decides whether text over the colour should be dark or light. */
export function luminance([r, g, b]: Rgb): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Flash frequencies above this are a seizure risk for people with photosensitive epilepsy (WCAG 2.3.1). */
export const SAFE_FLASH_HZ = 3;
