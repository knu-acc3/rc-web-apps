import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "symbols/grid": () => import("../emoji/shared/GlyphBoard"),
  "symbols/card": () => import("../emoji/shared/GlyphCard"),
  "symbols/unicode": () => import("./UnicodeTable"),
};
