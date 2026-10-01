import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "symbols/grid": () => import("../shared/GlyphBoard"),
  "symbols/card": () => import("../shared/GlyphCard"),
  "symbols/unicode": () => import("./UnicodeTable"),
};
