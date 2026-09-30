import { formatColor, num, parseColor, toRgb255, type Color, type ColorFormat } from "./color";

/** Formats offered by the converter pages ("rgba" = rgb() that always carries alpha). */
export type ConvFormat = "hex" | "rgb" | "rgba" | "hsl" | "hsv" | "hwb" | "cmyk" | "lab" | "oklch";

export const CONV_LABEL: Record<ConvFormat, string> = {
  hex: "HEX",
  rgb: "RGB",
  rgba: "RGBA",
  hsl: "HSL",
  hsv: "HSV",
  hwb: "HWB",
  cmyk: "CMYK",
  lab: "Lab",
  oklch: "OKLCH",
};

/** Curated converter pairs with real search demand; each gets its own page /color/{a}-to-{b}. */
export const PAIRS: readonly (readonly [ConvFormat, ConvFormat])[] = [
  ["hex", "rgb"],
  ["rgb", "hex"],
  ["hex", "hsl"],
  ["hsl", "hex"],
  ["rgb", "hsl"],
  ["hsl", "rgb"],
  ["hex", "rgba"],
  ["rgba", "hex"],
  ["hex", "cmyk"],
  ["cmyk", "hex"],
  ["rgb", "cmyk"],
  ["cmyk", "rgb"],
  ["hex", "oklch"],
  ["oklch", "hex"],
  ["hex", "hsv"],
  ["hsv", "rgb"],
  ["rgb", "hsv"],
  ["hex", "lab"],
  ["hex", "hwb"],
  ["rgb", "oklch"],
];

export const pairSlug = (a: ConvFormat, b: ConvFormat) => `${a}-to-${b}`;

/** How a bare list of numbers is read for the given input format. */
export function bareHint(f: ConvFormat): ColorFormat {
  return f === "rgba" ? "rgb" : f;
}

export function parseAs(input: string, f: ConvFormat): Color | null {
  return parseColor(input, bareHint(f));
}

export function formatAs(c: Color, f: ConvFormat): string {
  if (f === "rgba") {
    const [r, g, b] = toRgb255(c);
    return `rgba(${r}, ${g}, ${b}, ${num(Math.min(1, Math.max(0, c.alpha)), 3)})`;
  }
  return formatColor(c, f);
}
