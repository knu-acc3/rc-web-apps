import { round } from "./tokens";

export type CssUnit = "px" | "rem" | "em" | "pt" | "vw" | "%";
export const CSS_UNITS: readonly CssUnit[] = ["px", "rem", "em", "pt", "vw", "%"];

export interface UnitContext {
  /** Root font size in px (for rem). */
  root: number;
  /** Parent font size in px (for em and %). */
  parent: number;
  /** Viewport width in px (for vw). */
  viewport: number;
}

const DEFAULT_CONTEXT: UnitContext = { root: 16, parent: 16, viewport: 1440 };

/** How many px one unit is worth. 1pt = 1/72 in = 96/72 px. */
function pxPer(unit: CssUnit, ctx: UnitContext): number {
  switch (unit) {
    case "px":
      return 1;
    case "rem":
      return ctx.root;
    case "em":
      return ctx.parent;
    case "pt":
      return 96 / 72;
    case "vw":
      return ctx.viewport / 100;
    case "%":
      return ctx.parent / 100;
  }
}

export function convertUnit(value: number, from: CssUnit, to: CssUnit, ctx: UnitContext = DEFAULT_CONTEXT): number {
  return (value * pxPer(from, ctx)) / pxPer(to, ctx);
}

export function fmtUnit(value: number, unit: CssUnit, digits = 4): string {
  return `${round(value, digits)}${unit}`;
}

/* ───────────── clamp() for fluid typography ───────────── */

export interface ClampInput {
  minSize: number; // px
  maxSize: number; // px
  minViewport: number; // px
  maxViewport: number; // px
  root: number; // px
}

interface ClampResult {
  css: string;
  /** Slope in vw and intercept in rem of the preferred value. */
  slopeVw: number;
  interceptRem: number;
}

/**
 * clamp(min, intercept + slope·vw, max): linear from minSize at minViewport to maxSize at
 * maxViewport. The intercept uses rem so browser zoom and user font size still apply.
 */
export function fluidClamp(i: ClampInput, digits = 4): ClampResult {
  const slope = (i.maxSize - i.minSize) / (i.maxViewport - i.minViewport);
  const interceptPx = i.minSize - slope * i.minViewport;
  const slopeVw = slope * 100;
  const interceptRem = interceptPx / i.root;
  const lo = Math.min(i.minSize, i.maxSize) / i.root;
  const hi = Math.max(i.minSize, i.maxSize) / i.root;
  const sign = slopeVw < 0 ? "-" : "+";
  const pref = `${round(interceptRem, digits)}rem ${sign} ${round(Math.abs(slopeVw), digits)}vw`;
  return { css: `clamp(${round(lo, digits)}rem, ${pref}, ${round(hi, digits)}rem)`, slopeVw, interceptRem };
}

/** The size (px) the clamp() resolves to at a viewport width. */
export function clampAt(i: ClampInput, viewport: number): number {
  const slope = (i.maxSize - i.minSize) / (i.maxViewport - i.minViewport);
  const v = i.minSize + slope * (viewport - i.minViewport);
  return Math.min(Math.max(v, Math.min(i.minSize, i.maxSize)), Math.max(i.minSize, i.maxSize));
}
