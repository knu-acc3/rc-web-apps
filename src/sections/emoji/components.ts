import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "emoji/search": () => import("./EmojiSearch"),
  "emoji/grid": () => import("./shared/GlyphBoard"),
  "emoji/card": () => import("./shared/GlyphCard"),
};
