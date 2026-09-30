import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "encode/codec": () => import("./Codec"),
  "encode/entities": () => import("./EntityTable"),
  "encode/morse": () => import("./MorseTool"),
  "encode/morse-chart": () => import("./MorseChart"),
  "encode/spell": () => import("./SpellTool"),
};
