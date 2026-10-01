import { parseColor } from "@/sections/color/lib/color";
import { fmtLength, parseLength, splitTop, type Length } from "./tokens";

export interface ShadowLayer {
  id: number;
  inset: boolean;
  x: Length;
  y: Length;
  blur: Length;
  /** box-shadow only */
  spread: Length;
  /** Any CSS color; "currentcolor" when omitted. */
  color: string;
}

export type ShadowKind = "box" | "text";

interface ParseResult {
  layers: ShadowLayer[];
  error: string | null;
}

const ZERO: Length = { value: 0, unit: "" };

/**
 * Parse a box-shadow or text-shadow value: comma-separated layers (commas inside rgb()/hsl()
 * are ignored), lengths in any unit, `inset` anywhere (box only), a color in any CSS syntax
 * before or after the lengths, or none. Errors name the offending layer.
 */
export function parseShadow(value: string, kind: ShadowKind): ParseResult {
  const v = value.trim().replace(/^(box|text)-shadow\s*:\s*/i, "").replace(/;\s*$/, "").trim();
  if (!v || v.toLowerCase() === "none") return { layers: [], error: null };
  const layers: ShadowLayer[] = [];
  const parts = splitTop(v, ",");
  for (let i = 0; i < parts.length; i++) {
    const tokens = splitTop(parts[i], " ");
    let inset = false;
    let color: string | null = null;
    const lens: Length[] = [];
    // Lengths must be contiguous: once something follows them, no more lengths are allowed.
    let closed = false;
    for (const tok of tokens) {
      if (!tok) continue;
      if (tok.toLowerCase() === "inset") {
        if (kind === "text" || inset) return { layers: [], error: `layer ${i + 1}: inset` };
        inset = true;
        if (lens.length) closed = true;
        continue;
      }
      const len = parseLength(tok);
      if (len) {
        if (closed) return { layers: [], error: `layer ${i + 1}: ${tok}` };
        lens.push(len);
        continue;
      }
      if (color === null && (parseColor(tok) || /^currentcolor$/i.test(tok))) {
        color = tok;
        if (lens.length) closed = true;
        continue;
      }
      return { layers: [], error: `layer ${i + 1}: ${tok}` };
    }
    const max = kind === "box" ? 4 : 3;
    if (lens.length < 2 || lens.length > max) return { layers: [], error: `layer ${i + 1}: ${lens.length}` };
    if (lens[2] && lens[2].value < 0) return { layers: [], error: `layer ${i + 1}: blur < 0` };
    layers.push({
      id: i + 1,
      inset,
      x: lens[0],
      y: lens[1],
      blur: lens[2] ?? ZERO,
      spread: lens[3] ?? ZERO,
      color: color ?? "currentcolor",
    });
  }
  return { layers, error: null };
}

function layerCss(l: ShadowLayer, kind: ShadowKind): string {
  const parts = [fmtLength(l.x), fmtLength(l.y), fmtLength(l.blur)];
  if (kind === "box" && l.spread.value !== 0) parts.push(fmtLength(l.spread));
  const color = l.color.trim() || "currentcolor";
  return `${kind === "box" && l.inset ? "inset " : ""}${parts.join(" ")} ${color}`;
}

/** Value for box-shadow / text-shadow ("none" when empty). */
export function shadowValue(layers: ShadowLayer[], kind: ShadowKind): string {
  if (!layers.length) return "none";
  return layers.map((l) => layerCss(l, kind)).join(", ");
}

export function shadowCss(layers: ShadowLayer[], kind: ShadowKind): string {
  const prop = kind === "box" ? "box-shadow" : "text-shadow";
  if (layers.length <= 1) return `${prop}: ${shadowValue(layers, kind)};`;
  return `${prop}:\n${layers.map((l, i) => `  ${layerCss(l, kind)}${i === layers.length - 1 ? ";" : ","}`).join("\n")}`;
}

