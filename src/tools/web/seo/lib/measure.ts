"use client";

import { useSyncExternalStore } from "react";
import type { Measure } from "./serp";

let ctx: CanvasRenderingContext2D | null = null;

/** Text width in CSS pixels for a CSS font, measured with canvas (browser only). */
export function measurer(font: string): Measure {
  return (text: string) => {
    if (typeof document === "undefined") return text.length * 8;
    ctx ??= document.createElement("canvas").getContext("2d");
    if (!ctx) return text.length * 8;
    ctx.font = font;
    return ctx.measureText(text).width;
  };
}

const noop = () => () => {};

/** false during SSR and hydration, true afterwards — gate canvas measurements with it. */
export function useClient(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
